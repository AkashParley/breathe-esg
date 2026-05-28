from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from django.db.models import Count, Sum, Q
from .models import DataSource, IngestionRun, EmissionRow, AuditLog
from .serializers import (
    DataSourceSerializer, IngestionRunSerializer,
    EmissionRowSerializer, AuditLogSerializer
)
from .parsers.sap_parser import parse_sap_file
from .parsers.utility_parser import parse_utility_file
from .parsers.travel_parser import parse_travel_file
import traceback


PARSERS = {
    'sap': parse_sap_file,
    'utility': parse_utility_file,
    'travel': parse_travel_file,
}


class UploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        source_type = request.data.get('source_type')
        file_obj = request.FILES.get('file')

        if not source_type or not file_obj:
            return Response({'error': 'source_type and file are required'}, status=400)

        if source_type not in PARSERS:
            return Response({'error': f'Unknown source_type: {source_type}'}, status=400)

        # Get or create data source for this client
        client = request.user.client
        source, _ = DataSource.objects.get_or_create(
            client=client,
            source_type=source_type,
            defaults={'name': f"{client.name} - {source_type}"}
        )

        run = IngestionRun.objects.create(
            source=source,
            triggered_by=request.user,
            status='processing',
            file_name=file_obj.name,
        )

        try:
            parser = PARSERS[source_type]
            rows, errors = parser(file_obj)

            created = 0
            for row_data in rows:
                # Flag suspicious rows (zero values, missing dates)
                flagged = False
                flag_reason = ''
                if not row_data.get('normalized_value'):
                    flagged = True
                    flag_reason = 'Zero or missing value'
                if row_data.get('co2e_kg', 0) and row_data['co2e_kg'] > 100000:
                    flagged = True
                    flag_reason = 'Unusually high emission value'

                EmissionRow.objects.create(
                    client=client,
                    ingestion_run=run,
                    status='flagged' if flagged else 'pending',
                    flagged_reason=flag_reason,
                    **row_data
                )
                created += 1

            run.status = 'completed'
            run.raw_row_count = len(rows) + len(errors)
            run.success_count = created
            run.error_count = len(errors)
            run.error_log = '\n'.join(errors)
            run.completed_at = timezone.now()
            run.save()

            return Response({
                'run_id': run.id,
                'status': 'completed',
                'success_count': created,
                'error_count': len(errors),
                'errors': errors[:10],
            })

        except Exception as e:
            run.status = 'failed'
            run.error_log = traceback.format_exc()
            run.completed_at = timezone.now()
            run.save()
            return Response({'error': str(e)}, status=500)


class EmissionRowListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = EmissionRow.objects.filter(
            client=request.user.client
        ).select_related('ingestion_run__source', 'reviewed_by').order_by('-created_at')

        # Filters
        scope = request.GET.get('scope')
        status_filter = request.GET.get('status')
        source_type = request.GET.get('source_type')
        category = request.GET.get('category')

        if scope:
            qs = qs.filter(scope=scope)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if source_type:
            qs = qs.filter(ingestion_run__source__source_type=source_type)
        if category:
            qs = qs.filter(category=category)

        serializer = EmissionRowSerializer(qs, many=True)
        return Response(serializer.data)


class EmissionRowDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            row = EmissionRow.objects.get(pk=pk, client=request.user.client)
        except EmissionRow.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        if row.is_locked:
            return Response({'error': 'Row is locked for audit'}, status=403)

        allowed_fields = ['status', 'flagged_reason', 'description']
        changes = []

        for field in allowed_fields:
            if field in request.data:
                old_val = str(getattr(row, field))
                new_val = str(request.data[field])
                if old_val != new_val:
                    changes.append((field, old_val, new_val))
                    setattr(row, field, new_val)

        if 'status' in request.data and request.data['status'] == 'approved':
            row.reviewed_by = request.user
            row.reviewed_at = timezone.now()

        row.save()

        # Write audit log
        for field, old_val, new_val in changes:
            AuditLog.objects.create(
                emission_row=row,
                changed_by=request.user,
                field_name=field,
                old_value=old_val,
                new_value=new_val,
            )

        return Response(EmissionRowSerializer(row).data)


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client = request.user.client
        rows = EmissionRow.objects.filter(client=client)

        stats = {
            'total_rows': rows.count(),
            'pending': rows.filter(status='pending').count(),
            'flagged': rows.filter(status='flagged').count(),
            'approved': rows.filter(status='approved').count(),
            'rejected': rows.filter(status='rejected').count(),
            'total_co2e_kg': rows.filter(status='approved').aggregate(
                t=Sum('co2e_kg'))['t'] or 0,
            'by_scope': {
                scope: rows.filter(scope=scope).aggregate(
                    count=Count('id'), co2e=Sum('co2e_kg')
                )
                for scope in ['scope1', 'scope2', 'scope3']
            },
            'by_source': list(
                rows.values('ingestion_run__source__source_type')
                .annotate(count=Count('id'), co2e=Sum('co2e_kg'))
            ),
        }
        return Response(stats)


class IngestionRunListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        runs = IngestionRun.objects.filter(
            source__client=request.user.client
        ).order_by('-started_at')
        return Response(IngestionRunSerializer(runs, many=True).data)
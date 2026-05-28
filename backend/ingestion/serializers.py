from rest_framework import serializers
from .models import DataSource, IngestionRun, EmissionRow, AuditLog


class DataSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataSource
        fields = '__all__'


class IngestionRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = IngestionRun
        fields = '__all__'


class EmissionRowSerializer(serializers.ModelSerializer):
    reviewed_by_username = serializers.CharField(
        source='reviewed_by.username', read_only=True
    )
    ingestion_run_file = serializers.CharField(
        source='ingestion_run.file_name', read_only=True
    )
    source_type = serializers.CharField(
        source='ingestion_run.source.source_type', read_only=True
    )

    class Meta:
        model = EmissionRow
        fields = '__all__'


class AuditLogSerializer(serializers.ModelSerializer):
    changed_by_username = serializers.CharField(
        source='changed_by.username', read_only=True
    )
    class Meta:
        model = AuditLog
        fields = '__all__'
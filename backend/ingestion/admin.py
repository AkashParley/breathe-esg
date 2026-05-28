from django.contrib import admin
from .models import DataSource, IngestionRun, EmissionRow, AuditLog

@admin.register(EmissionRow)
class EmissionRowAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'scope', 'category', 'status', 'co2e_kg', 'activity_date']
    list_filter = ['scope', 'status', 'category']
    search_fields = ['description', 'location', 'vendor']

admin.site.register(DataSource)
admin.site.register(IngestionRun)
admin.site.register(AuditLog)
from django.db import models
from accounts.models import Client, User


class DataSource(models.Model):
    """Tracks each connected data source per client"""
    SOURCE_TYPES = [
        ('sap', 'SAP Fuel & Procurement'),
        ('utility', 'Utility Electricity'),
        ('travel', 'Corporate Travel'),
    ]
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='sources')
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPES)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.client} - {self.source_type}"


class IngestionRun(models.Model):
    """One per file upload or API pull — full traceability"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    source = models.ForeignKey(DataSource, on_delete=models.CASCADE, related_name='runs')
    triggered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    file_name = models.CharField(max_length=255, blank=True)
    raw_row_count = models.IntegerField(default=0)
    success_count = models.IntegerField(default=0)
    error_count = models.IntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_log = models.TextField(blank=True)

    def __str__(self):
        return f"Run {self.id} - {self.source} - {self.status}"


class EmissionRow(models.Model):
    """
    The core normalized table.
    Every activity record from any source lands here.
    """
    SCOPE_CHOICES = [
        ('scope1', 'Scope 1 - Direct'),
        ('scope2', 'Scope 2 - Electricity'),
        ('scope3', 'Scope 3 - Value Chain'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('flagged', 'Flagged'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    CATEGORY_CHOICES = [
        # Scope 1
        ('fuel_combustion', 'Fuel Combustion'),
        ('procurement', 'Procurement'),
        # Scope 2
        ('electricity', 'Electricity'),
        # Scope 3
        ('flight', 'Flight'),
        ('hotel', 'Hotel Stay'),
        ('ground_transport', 'Ground Transport'),
    ]

    # Tenancy + Source tracking
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='emission_rows')
    ingestion_run = models.ForeignKey(IngestionRun, on_delete=models.CASCADE, related_name='rows')

    # Classification
    scope = models.CharField(max_length=10, choices=SCOPE_CHOICES)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)

    # Activity data (raw, as it came in)
    raw_value = models.FloatField()
    raw_unit = models.CharField(max_length=50)
    raw_data = models.JSONField(default=dict)  # full original row stored here

    # Normalized data (what we compute with)
    normalized_value = models.FloatField(null=True, blank=True)
    normalized_unit = models.CharField(max_length=50, blank=True)

    # Emission factor applied
    emission_factor = models.FloatField(null=True, blank=True)
    emission_factor_source = models.CharField(max_length=255, blank=True)
    co2e_kg = models.FloatField(null=True, blank=True)  # final output

    # Time
    activity_date = models.DateField()
    billing_period_start = models.DateField(null=True, blank=True)
    billing_period_end = models.DateField(null=True, blank=True)

    # Location / metadata
    location = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    vendor = models.CharField(max_length=255, blank=True)

    # Review workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    flagged_reason = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reviewed_rows'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    is_locked = models.BooleanField(default=False)  # locked after audit

    # Audit trail
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.client} | {self.scope} | {self.category} | {self.activity_date}"


class AuditLog(models.Model):
    """Every change ever made to an EmissionRow"""
    emission_row = models.ForeignKey(EmissionRow, on_delete=models.CASCADE, related_name='audit_logs')
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    field_name = models.CharField(max_length=100)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    note = models.TextField(blank=True)

    def __str__(self):
        return f"Log {self.id} - Row {self.emission_row_id} - {self.field_name}"
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import Client, User
from ingestion.models import DataSource, IngestionRun, EmissionRow
from datetime import date

# Create client
client, _ = Client.objects.get_or_create(name='Acme Corp', slug='acme-corp')

# Attach admin to client
user = User.objects.get(username='admin')
user.client = client
user.save()

# Create data sources
sap_source, _ = DataSource.objects.get_or_create(client=client, source_type='sap', defaults={'name': 'Acme SAP'})
util_source, _ = DataSource.objects.get_or_create(client=client, source_type='utility', defaults={'name': 'Acme Utility'})
travel_source, _ = DataSource.objects.get_or_create(client=client, source_type='travel', defaults={'name': 'Acme Travel'})

# Create ingestion runs
sap_run = IngestionRun.objects.create(source=sap_source, triggered_by=user, status='completed', file_name='sap_export_q1.csv', success_count=3)
util_run = IngestionRun.objects.create(source=util_source, triggered_by=user, status='completed', file_name='utility_jan_mar.csv', success_count=3)
travel_run = IngestionRun.objects.create(source=travel_source, triggered_by=user, status='completed', file_name='concur_q1.csv', success_count=4)

# SAP rows - Scope 1
EmissionRow.objects.create(client=client, ingestion_run=sap_run, scope='scope1', category='fuel_combustion',
    raw_value=5000, raw_unit='L', normalized_value=5000, normalized_unit='L',
    emission_factor=2.68, emission_factor_source='IPCC 2006', co2e_kg=13400,
    activity_date=date(2024,1,15), location='Plant-IN01', vendor='HP Petro', status='pending',
    raw_data={'WERKS':'IN01','MATNR':'DIESEL','MENGE':5000,'MEINS':'L','BLDAT':'20240115'})

EmissionRow.objects.create(client=client, ingestion_run=sap_run, scope='scope1', category='fuel_combustion',
    raw_value=3200, raw_unit='L', normalized_value=3200, normalized_unit='L',
    emission_factor=2.68, emission_factor_source='IPCC 2006', co2e_kg=8576,
    activity_date=date(2024,2,10), location='Plant-IN02', vendor='BPCL', status='flagged',
    flagged_reason='Unusually high consumption for plant size',
    raw_data={'WERKS':'IN02','MATNR':'HSD','MENGE':3200,'MEINS':'L','BLDAT':'20240210'})

EmissionRow.objects.create(client=client, ingestion_run=sap_run, scope='scope1', category='procurement',
    raw_value=1500, raw_unit='KG', normalized_value=1800, normalized_unit='L',
    emission_factor=None, emission_factor_source='', co2e_kg=None,
    activity_date=date(2024,3,5), location='Plant-IN01', vendor='Chemical Co', status='pending',
    raw_data={'WERKS':'IN01','MATNR':'SOLVENT','MENGE':1500,'MEINS':'KG','BLDAT':'20240305'})

# Utility rows - Scope 2
EmissionRow.objects.create(client=client, ingestion_run=util_run, scope='scope2', category='electricity',
    raw_value=45000, raw_unit='kWh', normalized_value=45000, normalized_unit='kWh',
    emission_factor=0.233, emission_factor_source='DEFRA 2023', co2e_kg=10485,
    activity_date=date(2024,1,1), billing_period_start=date(2024,1,1), billing_period_end=date(2024,1,31),
    location='HQ Mumbai | Meter: MTR-001', status='approved',
    raw_data={'meter_id':'MTR-001','consumption':45000,'unit':'kWh','start_date':'2024-01-01','end_date':'2024-01-31'})

EmissionRow.objects.create(client=client, ingestion_run=util_run, scope='scope2', category='electricity',
    raw_value=51000, raw_unit='kWh', normalized_value=51000, normalized_unit='kWh',
    emission_factor=0.233, emission_factor_source='DEFRA 2023', co2e_kg=11883,
    activity_date=date(2024,2,1), billing_period_start=date(2024,2,1), billing_period_end=date(2024,2,29),
    location='HQ Mumbai | Meter: MTR-001', status='pending',
    raw_data={'meter_id':'MTR-001','consumption':51000,'unit':'kWh','start_date':'2024-02-01','end_date':'2024-02-29'})

EmissionRow.objects.create(client=client, ingestion_run=util_run, scope='scope2', category='electricity',
    raw_value=120, raw_unit='MWh', normalized_value=120000, normalized_unit='kWh',
    emission_factor=0.233, emission_factor_source='DEFRA 2023', co2e_kg=27960,
    activity_date=date(2024,3,1), billing_period_start=date(2024,3,1), billing_period_end=date(2024,3,31),
    location='Factory Pune | Meter: MTR-002', status='flagged',
    flagged_reason='Unit was MWh - converted to kWh, please verify',
    raw_data={'meter_id':'MTR-002','consumption':120,'unit':'MWh','start_date':'2024-03-01','end_date':'2024-03-31'})

# Travel rows - Scope 3
EmissionRow.objects.create(client=client, ingestion_run=travel_run, scope='scope3', category='flight',
    raw_value=6700, raw_unit='km', normalized_value=6700, normalized_unit='km',
    emission_factor=0.195, emission_factor_source='DEFRA 2023', co2e_kg=1306.5,
    activity_date=date(2024,1,20), description='DEL → LHR | Rahul Sharma', status='approved',
    raw_data={'expense_type':'flight','origin':'DEL','destination':'LHR','date':'2024-01-20','employee':'Rahul Sharma'})

EmissionRow.objects.create(client=client, ingestion_run=travel_run, scope='scope3', category='flight',
    raw_value=1150, raw_unit='km', normalized_value=1150, normalized_unit='km',
    emission_factor=0.255, emission_factor_source='DEFRA 2023', co2e_kg=293.25,
    activity_date=date(2024,2,5), description='BOM → BLR | Priya Patel', status='pending',
    raw_data={'expense_type':'flight','origin':'BOM','destination':'BLR','date':'2024-02-05','employee':'Priya Patel'})

EmissionRow.objects.create(client=client, ingestion_run=travel_run, scope='scope3', category='hotel',
    raw_value=3, raw_unit='nights', normalized_value=3, normalized_unit='nights',
    emission_factor=31.2, emission_factor_source='DEFRA 2023', co2e_kg=93.6,
    activity_date=date(2024,1,20), location='London', description='Hotel | Rahul Sharma', status='approved',
    raw_data={'expense_type':'hotel','nights':3,'location':'London','date':'2024-01-20','employee':'Rahul Sharma'})

EmissionRow.objects.create(client=client, ingestion_run=travel_run, scope='scope3', category='ground_transport',
    raw_value=45, raw_unit='km', normalized_value=45, normalized_unit='km',
    emission_factor=0.149, emission_factor_source='DEFRA 2023', co2e_kg=6.705,
    activity_date=date(2024,2,6), description='taxi | Priya Patel', status='pending',
    raw_data={'expense_type':'taxi','distance_km':45,'date':'2024-02-06','employee':'Priya Patel'})

print("✅ Seed data created successfully!")
print(f"   Client: Acme Corp")
print(f"   Emission rows: {EmissionRow.objects.count()}")
print(f"   Login: admin / admin123")
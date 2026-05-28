# Data Model — Breathe ESG

## Core Design Decisions

### Multi-tenancy
Every table that holds client data has a `client` FK to the `Client` model.
Queries are always scoped: `EmissionRow.objects.filter(client=request.user.client)`.
Users belong to exactly one client. No row is ever visible across tenants.

### Tables

#### `Client`
One row per enterprise customer. The tenancy anchor.
- `id`, `name`, `slug`, `created_at`

#### `User` (extends AbstractUser)
Analyst accounts. Each user is tied to one `Client`.
- `client` FK → Client
- `is_analyst` boolean

#### `DataSource`
Tracks each source system per client.
- `client` FK, `source_type` (sap | utility | travel), `name`
- Allows one client to have multiple SAP systems or utility meters

#### `IngestionRun`
One row per file upload or API pull. Full traceability.
- `source` FK, `triggered_by` FK, `status`, `file_name`
- `raw_row_count`, `success_count`, `error_count`, `error_log`
- `started_at`, `completed_at`

#### `Emission — The Core Table
Every normalized activity record from any source.

**Tenancy + Source tracking**
- `client` FK — direct tenant scope
- `ingestion_run` FK — which upload produced this row

**Classification**
- `scope`: scope1 | scope2 | scope3 (GHG Protocol)
- `category`: fuel_combustion | procurement | electricity | flight | hotel | ground_transport

**Raw data (immutable, as ingested)**
- `raw_value`, `raw_unit` — exactly as received
- `raw_data` JSONField — full original row stored for audit

**Normalized data (computed)**
- `normalized_value`, `normalized_unit` — converted to SI (L, kWh, km)
- `emission_factor`, `emission_factor_source` — e.g. DEFRA 2023
- `co2e_kg` — final computed output

**Time**
- `activity_date` — the date of the activity
- `billing_period_start`, `billing_period_end` — for utility data

**Review workflow**
- `status`: pending | flagged | approved | rejected
- `flagged_reason` — auto-set on ingest or manually by analyst
- `reviewed_by` FK, `reviewed_at` — w when
- `is_locked` — true after audit export, prevents further edits

#### `AuditLog`
Every change to every EmissionRow, forever.
- `emission_row` FK, `changed_by` FK, `changed_at`
- `field_name`, `old_value`, `new_value`, `note`

## Scope Classification
- **Scope 1**: Direct emissions — fuel combustion, on-site procurement
- **Scope 2**: Indirect — purchased electricity
- **Scope 3**: Value chain — business travel (flights, hotels, ground)

## Unit Normalization
All values normalized to SI on ingest:
- Fuel: → Litres (GAL × 3.785, KG ÷ 0.832)
- Electricity: → kWh (MWh × 1000, GWh × 1,000,000)
- Distance: → km (miles × 1.609)

## Emission Factors
- Fuel (diesel): 2.68 kg CO₂e/L — IPCC 2006 Table 2.2
- Electricity: 0.233 kg CO₂e/kWh — DEFRA 2023 (UK grid average)
- Flights short (<3700km): 0.255 kg CO₂e/km — DEFRA 2023
- Flights long (>3700km): 0.195 kg CO₂e/km — DEFRA 2023
- Hotel: 31.2 kg CO₂e/night — DEFRA 2023
- Taxi: 0.149 kg CO₂e/km — DEFRA 2023

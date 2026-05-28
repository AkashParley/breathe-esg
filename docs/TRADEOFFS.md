# Tradeoffs — Three Things Deliberately Not Built

## 1. Real-time API pulls (vs file upload)
**Not built**: Scheduled pulls from live SAP OData, utility APIs, or Concur OAuth.
**Why not**: Each would require per-client credential management, OAuth flows,
and per-utility API integration work. For a prototype evaluating data model and
normalization logic, file upload demonstrates the same pipeline with less
infrastructure complexity.
**What it costs**: Analysts must manually export and upload. No automated ingestion.
**How to add**: Celery + django-celery-beat for scheduled tasks, per-source
credential model, OAuth token refresh logic.

## 2. Multi-user approval workflow (maker-checker)
**Not built**: A two-level approval flow where an analyst flags rows and a manager
signs off before audit lock.
**Why not**: The data model supports it (reviewed_by, is_locked) but the UI
workflow adds significant complexity — notifications, role-based permissions,
approval chains. Out of e for a 4-day prototype.
**What it costs**: Any analyst can approve any row. No separation of duties.
**How to add**: Add `manager_approved_by`, `manager_approved_at` fields.
Add MANAGER role to User. Lock rows only after both approvals.

## 3. Emission factor management UI
**Not built**: An interface to update emission factors per region, per year,
per source type.
**Why not**: Emission factors are currently hardcoded in parsers (DEFRA 2023).
Building a factor management UI with versioning, effective dates, and source
citations is a significant feature.
**What it costs**: When DEFRA releases 2024 factors, a developer must update code.
Historical rows computed with old factors are not recomputable from the UI.
**How to add**: EmissionFactor model with (category, region, year, value, source,
effective_from, effective_to). Parser looks up the correct factor at ingest time.

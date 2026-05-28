# Decision Log — Breathe ESG

## SAP Format: IDoc Flat File (CSV)
**Chose**: SAP flat file CSV export (IDoc-style)
**Why**: The most universally available SAP export. Every SAP installation
supports flat file export via SM35/LSMW. OData/BAPI require middleware
configuration most clients won't have set up. IDocs are what SAP ops teams
actually send over email or SFTP.
**What I handled**: MB51 material document export — fuel and procurement lines.
Plant codes (WERKS), material numbers (MATNR), quantities (MENGE/MEINS), dates (BLDAT).
**What I ignored**: BAPI calls, OData services, multi-currency WRBTR normalization,
cost center hierarchies, batch splits.
**Would ask PM**: Do clients have SAP Basis access to configure SFTP push, or are
they emailing exports manually? This changes whether we build a push endpoint or a pull.

## Utility Format: Green Button CSV
**Chose**: Green Button / utility portal CSV export
**Why**: Green Button is the US/EU standard for utility data ex. Most major
utilities (PG&E, National Grid, BESCOM) support it. PDF parsing is fragile and
expensive. API access requires per-utility OAuth integrations we can't generalise.
CSV export is realistic — facilities teams do this monthly.
**What I handled**: kWh/MWh consumption, billing periods, meter IDs, location/site.
**What I ignored**: Reactive power (kVAR), time-of-use tariff bands, demand charges,
power factor corrections.
**Would ask PM**: Are clients on renewable tariffs? If so, Scope 2 market-based
vs location-based accounting changes the emission factor entirely.

## Travel Format: Concur CSV Export
**Chose**: Concur expense report CSV export
**Why**: Concur is the dominant corporate travel platform. Their CSV export is
well-documented and what finance teams actually download for reconciliation.
Navan's API requires OAuth which adds integration complexity for a prototype.
The CSV shape is realistic — expense_type, origin/destination airport codes,
employee name, date.
**What I ignored**: Concur O API, hotel chain emission factors, cabin class
(business vs economy has 3x emission factor difference), layover routing.

## Distance Calculation: Haversine from IATA codes
**Chose**: Calculate great-circle distance from airport coordinates when
distance_km is not provided in the export.
**Why**: Concur exports often have origin/destination codes but no distance.
Haversine is standard for flight distance estimation. We embed a lookup table
of major IATA airports.
**Limitation**: No routing correction (flights aren't straight lines), no
radiative forcing multiplier (controversial in GHG accounting).

## Authentication: JWT via SimpleJWT
**Chose**: JWT tokens, 8hr access / 1day refresh
**Why**: Stateless, works cleanly with React SPA. Django session auth requires
CSRF handling complexity. SimpleJWT is the DRF standard.

## Deployment: Render
**Chose**: Render for Django API + static frontend
**Why**: Free tier, Postgres included, auto-deploy from GitHub, no credit card
required for basic usage.

## What I'd ask the PM
1. Are clients on renewable electricity tariffs? Changes Scope 2 methodology.
2. Is SAP push (SFTP) available or are we receiving manual exports?
3. Do we need multi-user per client (analyst + manager approval flow)?
4. What reporting standard? GHG Protocol, ISO 14064, or client-specific?
5. Do auditors need a read-only portal or just a signed-off export?

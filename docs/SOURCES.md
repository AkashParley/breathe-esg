# Source Research — Breathe ESG

## 1. SAP — Fuel & Procurement

**Format researched**: SAP MB51 material document list, exported as flat file CSV.
Also reviewed IDoc MATMAS05 structure and MM60 consumption reports.

**What I learned**:
- SAP exports come in German or English depending on system language settings.
  Column headers like WERKS (plant), MATNR (material number), MENGE (quantity),
  MEINS (unit of measure), BLDAT (document date) are standard.
- Dates are in YYYYMMDD format in most exports, but DD.MM.YYYY in some regional configs.
- Units are SAP internal codes: L (litres), KG (kilograms), GAL (US gallons), M3 (cubic metres).
- Plant codes are meaningless without a plant master lookup table.
- Fuel materials are identified by material number prefix or description — no standard taxonomy.

**Sample data rationale**:
- Used German column headers (WERKS, MATNR, etc) to reflect real SAP exports
- Mixed units (L and GAL) to test normalization
- Included a non-fuel ement row (SOLVENT) to test category detection
- Used realistic Indian plant codes (IN01, IN02) and vendor codes

**What would break in production**:
- Clients with custom material number schemas — fuel detection by material name fails
- Multi-currency amounts (WRBTR) — we ignore cost, but it's in the export
- Large exports (100k+ rows) — pandas read_csv into memory won't scale
- SAP systems with non-standard date formats not in our parser

---

## 2. Utility — Electricity

**Format researched**: Green Button XML/CSV standard (NAESB REQ.21),
also reviewed BESCOM (Bangalore) and Tata Power portal export formats.

**What I learned**:
- Green Button is the US/EU standard, adopted by most major utilities.
- Exports contain: meter ID, interval start/end, consumption value, unit of measure.
- Billing periods don't align with calendar months — a January bill might cover
  Dec 28 to Jan 27. This creates Scope 2 reporting period misalignment.
- Units vary: kWh (most common), MWh (industrial), kVARh (reactive, not relevant).
- Iity portals (BESCOM, MSEDCL) export in similar CSV formats but
  with different column names and INR tariff structures.

**Sample data rationale**:
- Mixed kWh and MWh to test unit normalization
- Included a 29-day February billing period (2024 was a leap year)
- Used two meters (HQ and Factory) to show multi-meter support
- Flagged the MWh row as suspicious (unit conversion needed verification)

**What would break in production**:
- PDF bill parsing (many Indian utilities only provide PDF)
- Time-of-use tariff data (peak/off-peak split) — we aggregate to total consumption
- Market-based Scope 2 accounting (renewable energy certificates change the factor)
- Utilities that don't export Green Button format

---

## 3. Corporate Travel — Concur/Navan

**Format researched**: Concur Expense Report CSV export, Navan travel report export.
Also reviewed ICAO carbon calculator methodology and DEFRA travel emission factors.

**What I learned**:
- Concur exports have: expense_type, transaction_date, employee_name,erchant_name, amount, and for travel: origin/destination (airport codes),
  travel_class, distance_km (sometimes).
- Distance is often absent — only airport codes are provided.
- Hotel exports include: check-in date, nights, city, hotel chain.
- Ground transport: taxi/rideshare receipts rarely include distance.
- DEFRA 2023 provides per-km emission factors by mode and flight length.
- Radiative forcing index (RFI) of 1.9x for flights is debated and not included
  in DEFRA's headline figures — we follow DEFRA.

**Sample data rationale**:
- Mixed flight lengths (short BOM-BLR, long DEL-LHR) to test factor selection
- Included hotel and taxi rows to test all three travel categories
- Left distance_km blank for flights to test haversine calculation from IATA codes
- Used realistic Indian corporate traveler routes

**What would break in production**:
- Airport codes not in our IATA lookup table (we have ~11 airports)
- Navan API format differs from Concur — different column names
- Business vs economy classness is ~3x higher factor) — we don't capture class
- Rideshare receipts (Uber, Ola) don't include distance — only fare amount

import pandas as pd
from datetime import datetime

# Green Button / utility portal CSV export
# Standard columns from most US/EU utility portals

UNIT_TO_KWH = {
    'KWH': 1.0, 'kWh': 1.0,
    'MWH': 1000.0, 'MWh': 1000.0,
    'GWH': 1000000.0,
    'KVAR': 1.0,  # treat as kWh approximation
}

def parse_utility_file(file_obj):
    import io
    content = file_obj.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode('utf-8')), sep=None, engine='python')
    except Exception:
        df = pd.read_csv(io.StringIO(content.decode('latin-1')), sep=None, engine='python')

    df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]

    rows = []
    errors = []

    for idx, row in df.iterrows():
        try:
            # Flexible column name matching
            value = float(row.get('consumption', row.get('usage', row.get('kwh', 0))))
            unit = str(row.get('unit', row.get('uom', 'kWh'))).strip()
            normalized = value * UNIT_TO_KWH.get(unit.upper(), 1.0)

            period_start = parse_date(str(row.get('start_date', row.get('billing_start', ''))))
            period_end = parse_date(str(row.get('end_date', row.get('billing_end', ''))))
            activity_date = period_start

            meter_id = str(row.get('meter_id', row.get('meter', '')))
            location = str(row.get('location', row.get('site', row.get('facility', ''))))

            rows.append({
                'scope': 'scope2',
                'category': 'electricity',
                'raw_value': value,
                'raw_unit': unit,
                'normalized_value': normalized,
                'normalized_unit': 'kWh',
                'activity_date': activity_date,
                'billing_period_start': period_start,
                'billing_period_end': period_end,
                'location': f"{location} | Meter: {meter_id}".strip(' |'),
                'description': str(row.get('tariff', row.get('rate_code', ''))),
                'raw_data': row.to_dict(),
                'emission_factor': 0.233,  # UK grid average kg CO2e/kWh
                'emission_factor_source': 'DEFRA 2023',
                'co2e_kg': normalized * 0.233,
            })
        except Exception as e:
            errors.append(f"Row {idx}: {str(e)}")

    return rows, errors


def parse_date(date_str):
    date_str = str(date_str).strip()
    for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y', '%b %d %Y', '%B %d %Y'):
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return datetime.today().date()
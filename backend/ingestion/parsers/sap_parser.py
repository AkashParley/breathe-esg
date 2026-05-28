import pandas as pd
from datetime import datetime
import re

# SAP flat file export — IDoc-style CSV
# German headers mapped to English, inconsistent units normalized
SAP_COLUMN_MAP = {
    'WERKS': 'plant_code',
    'MATNR': 'material_number',
    'MENGE': 'quantity',
    'MEINS': 'unit',
    'BLDAT': 'document_date',
    'BKTXT': 'description',
    'LIFNR': 'vendor_code',
    'WRBTR': 'amount',
    # English variants too
    'plant': 'plant_code',
    'material': 'material_number',
    'quantity': 'quantity',
    'unit': 'unit',
    'date': 'document_date',
}

FUEL_MATERIALS = ['DIESEL', 'PETROL', 'BENZIN', 'LPG', 'CNG', 'FUEL', 'HSD', 'MS']

UNIT_TO_LITERS = {
    'L': 1.0, 'LTR': 1.0, 'LITER': 1.0,
    'GAL': 3.78541, 'GALLON': 3.78541,
    'KG': 1.2,   # approximate for diesel
    'M3': 1000.0,
}

def parse_sap_file(file_obj):
    import io
    content = file_obj.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode('utf-8')), sep=None, engine='python')
    except Exception:
        df = pd.read_csv(io.StringIO(content.decode('latin-1')), sep=None, engine='python')

    # Normalize column names
    df.columns = [SAP_COLUMN_MAP.get(col.strip().upper(), col.strip().lower())
                  for col in df.columns]

    rows = []
    errors = []

    for idx, row in df.iterrows():
        try:
            quantity = float(str(row.get('quantity', 0)).replace(',', '.'))
            unit = str(row.get('unit', 'L')).strip().upper()
            normalized = quantity * UNIT_TO_LITERS.get(unit, 1.0)
            material = str(row.get('material_number', '')).upper()
            is_fuel = any(f in material for f in FUEL_MATERIALS)

            date_raw = str(row.get('document_date', ''))
            activity_date = parse_date(date_raw)

            rows.append({
                'scope': 'scope1',
                'category': 'fuel_combustion' if is_fuel else 'procurement',
                'raw_value': quantity,
                'raw_unit': unit,
                'normalized_value': normalized,
                'normalized_unit': 'L',
                'activity_date': activity_date,
                'location': str(row.get('plant_code', '')),
                'vendor': str(row.get('vendor_code', '')),
                'description': str(row.get('description', '')),
                'raw_data': row.to_dict(),
                'emission_factor': 2.68 if is_fuel else None,
                'emission_factor_source': 'IPCC 2006 Table 2.2' if is_fuel else '',
                'co2e_kg': normalized * 2.68 if is_fuel else None,
            })
        except Exception as e:
            errors.append(f"Row {idx}: {str(e)}")

    return rows, errors


def parse_date(date_str):
    """Handle SAP date formats: YYYYMMDD, DD.MM.YYYY, MM/DD/YYYY"""
    date_str = date_str.strip()
    for fmt in ('%Y%m%d', '%d.%m.%Y', '%m/%d/%Y', '%Y-%m-%d'):
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return datetime.today().date()
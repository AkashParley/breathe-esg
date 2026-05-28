import pandas as pd
from datetime import datetime

# Concur/Navan CSV export format
# Handles flights (airport codes → distance), hotels, ground transport

# IATA airport coordinates for distance calculation (subset)
AIRPORT_COORDS = {
    'DEL': (28.5665, 77.1031), 'BOM': (19.0896, 72.8656),
    'BLR': (13.1986, 77.7066), 'MAA': (12.9941, 80.1709),
    'LHR': (51.4775, -0.4614), 'JFK': (40.6413, -73.7781),
    'CDG': (49.0097, 2.5479),  'DXB': (25.2532, 55.3657),
    'SIN': (1.3644, 103.9915), 'HKG': (22.3080, 113.9185),
    'SFO': (37.6213, -122.379),'ORD': (41.9742, -87.9073),
}

EMISSION_FACTORS = {
    'flight_short': 0.255,    # <3hr kg CO2e/km/passenger
    'flight_long': 0.195,     # >3hr kg CO2e/km/passenger
    'hotel': 31.2,            # kg CO2e/night (DEFRA 2023)
    'taxi': 0.149,            # kg CO2e/km
    'train': 0.041,           # kg CO2e/km
    'rental_car': 0.192,      # kg CO2e/km
}

def haversine_km(coord1, coord2):
    import math
    lat1, lon1 = map(math.radians, coord1)
    lat2, lon2 = map(math.radians, coord2)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    return 6371 * 2 * math.asin(math.sqrt(a))

def parse_travel_file(file_obj):
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
            expense_type = str(row.get('expense_type', row.get('type', 'flight'))).lower()
            activity_date = parse_date(str(row.get('date', row.get('travel_date', ''))))
            traveler = str(row.get('employee', row.get('traveler', '')))

            if 'flight' in expense_type or 'air' in expense_type:
                origin = str(row.get('origin', row.get('from', ''))).upper().strip()
                destination = str(row.get('destination', row.get('to', ''))).upper().strip()
                distance_km = float(row.get('distance_km', 0))

                if distance_km == 0 and origin in AIRPORT_COORDS and destination in AIRPORT_COORDS:
                    distance_km = haversine_km(AIRPORT_COORDS[origin], AIRPORT_COORDS[destination])

                factor_key = 'flight_long' if distance_km > 3700 else 'flight_short'
                ef = EMISSION_FACTORS[factor_key]

                rows.append({
                    'scope': 'scope3',
                    'category': 'flight',
                    'raw_value': distance_km,
                    'raw_unit': 'km',
                    'normalized_value': distance_km,
                    'normalized_unit': 'km',
                    'activity_date': activity_date,
                    'description': f"{origin} → {destination} | {traveler}",
                    'raw_data': row.to_dict(),
                    'emission_factor': ef,
                    'emission_factor_source': 'DEFRA 2023',
                    'co2e_kg': distance_km * ef,
                })

            elif 'hotel' in expense_type or 'accommodation' in expense_type:
                nights = float(row.get('nights', row.get('quantity', 1)))
                rows.append({
                    'scope': 'scope3',
                    'category': 'hotel',
                    'raw_value': nights,
                    'raw_unit': 'nights',
                    'normalized_value': nights,
                    'normalized_unit': 'nights',
                    'activity_date': activity_date,
                    'location': str(row.get('location', row.get('city', ''))),
                    'description': f"Hotel | {traveler}",
                    'raw_data': row.to_dict(),
                    'emission_factor': EMISSION_FACTORS['hotel'],
                    'emission_factor_source': 'DEFRA 2023',
                    'co2e_kg': nights * EMISSION_FACTORS['hotel'],
                })

            else:
                distance_km = float(row.get('distance_km', row.get('distance', 0)))
                transport_type = 'taxi' if 'taxi' in expense_type or 'cab' in expense_type else 'train' if 'train' in expense_type or 'rail' in expense_type else 'rental_car'
                ef = EMISSION_FACTORS[transport_type]
                rows.append({
                    'scope': 'scope3',
                    'category': 'ground_transport',
                    'raw_value': distance_km,
                    'raw_unit': 'km',
                    'normalized_value': distance_km,
                    'normalized_unit': 'km',
                    'activity_date': activity_date,
                    'description': f"{transport_type} | {traveler}",
                    'raw_data': row.to_dict(),
                    'emission_factor': ef,
                    'emission_factor_source': 'DEFRA 2023',
                    'co2e_kg': distance_km * ef,
                })

        except Exception as e:
            errors.append(f"Row {idx}: {str(e)}")

    return rows, errors


def parse_date(date_str):
    date_str = str(date_str).strip()
    for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y'):
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return datetime.today().date()
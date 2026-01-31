import os
from .call_logs import parse_call_logs
from .sms import parse_sms
from .location import parse_location_data
from .maps_location import parse_maps_location_data

def generate_timeline(extraction_path):
    """
    Scans extraction path for known DB files, parses them, 
    and returns a flattened, sorted list of events.
    """
    master_timeline = []

    # 1. Parse Call Logs
    contacts_db = os.path.join(extraction_path, 'contacts2.db')
    if os.path.exists(contacts_db):
        print(f"Parsing Call Logs from {contacts_db}...")
        calls = parse_call_logs(contacts_db)
        master_timeline.extend(calls)
    else:
        print("contacts2.db not found.")

    # 2. Parse SMS
    sms_db = os.path.join(extraction_path, 'mmssms.db')
    if os.path.exists(sms_db):
         print(f"Parsing SMS from {sms_db}...")
         messages = parse_sms(sms_db)
         master_timeline.extend(messages)
    else:
        print("mmssms.db not found.")

    # 3. Parse Location Data (EXIF, etc.)
    print("Parsing Location Data...")
    location_events = parse_location_data(extraction_path)
    master_timeline.extend(location_events)

    # 4. Parse Google Maps Location History
    print("Parsing Google Maps Location History...")
    maps_events = parse_maps_location_data(extraction_path)
    master_timeline.extend(maps_events)

    # 5. Sort by timestamp (descending)
    master_timeline.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return master_timeline

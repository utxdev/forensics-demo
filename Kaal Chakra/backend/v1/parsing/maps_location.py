import sqlite3
import os

def parse_maps_location_data(db_path):
    """
    Parses Google Maps destination history database.
    Database: da_destination_history
    Based on working implementation from Inderjaal project.
    
    Returns: List of location events
    """
    location_db = os.path.join(db_path, 'da_destination_history')
    
    if not os.path.exists(location_db):
        print(f"Google Maps location database not found at: {location_db}")
        return []
    
    try:
        conn = sqlite3.connect(location_db)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get list of tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"Found tables in Google Maps DB: {tables}")
        
        # Try different table names
        query = None
        if 'dest_history' in tables:
            query = "SELECT time, dest_lat, dest_lng, dest_title, dest_address FROM dest_history"
        elif 'destination_history' in tables:
            query = "SELECT time, dest_lat, dest_lng, dest_title, dest_address FROM destination_history"
        else:
            print(f"No known location table found. Available tables: {tables}")
            conn.close()
            return []
        
        cursor.execute(query)
        rows = cursor.fetchall()
        
        location_events = []
        for row in rows:
            lat = row['dest_lat'] if 'dest_lat' in row.keys() else None
            lng = row['dest_lng'] if 'dest_lng' in row.keys() else None
            
            # Google Maps often stores coordinates as E6 (multiplied by 10^6)
            # If value is > 90 for lat or > 180 for lng, it's likely E6 format
            if lat and abs(lat) > 90:
                lat = lat / 1e6
            
            if lng and abs(lng) > 180:
                lng = lng / 1e6
            
            timestamp = row['time'] if 'time' in row.keys() else None
            title = row['dest_title'] if 'dest_title' in row.keys() else 'Unknown Location'
            address = row['dest_address'] if 'dest_address' in row.keys() else ''
            
            # Convert timestamp if needed (Google Maps uses milliseconds)
            if timestamp and timestamp < 10000000000:  # If it's in seconds
                timestamp = timestamp * 1000
            
            location_events.append({
                'id': f"maps_loc_{len(location_events)}",
                'timestamp': timestamp if timestamp else 0,
                'eventType': 'location',
                'latitude': lat,
                'longitude': lng,
                'contentPreview': f"Location: {title}",
                'details': {
                    'title': title,
                    'address': address,
                    'source': 'Google Maps Destination History'
                },
                'sourceArtifact': 'da_destination_history'
            })
        
        conn.close()
        print(f"Parsed {len(location_events)} location events from Google Maps")
        return location_events
        
    except Exception as e:
        print(f"Error parsing Google Maps location data: {e}")
        return []

import os
import sqlite3
import hashlib
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

def parse_exif_location(image_path):
    """
    Extract GPS coordinates from image EXIF data.
    Returns: (latitude, longitude, timestamp) or None
    """
    try:
        image = Image.open(image_path)
        exif_data = image._getexif()
        
        if not exif_data:
            return None
        
        gps_info = {}
        for tag, value in exif_data.items():
            tag_name = TAGS.get(tag, tag)
            if tag_name == 'GPSInfo':
                for gps_tag in value:
                    gps_tag_name = GPSTAGS.get(gps_tag, gps_tag)
                    gps_info[gps_tag_name] = value[gps_tag]
        
        if not gps_info:
            return None
        
        # Convert GPS coordinates to decimal degrees
        def convert_to_degrees(value):
            d, m, s = value
            return d + (m / 60.0) + (s / 3600.0)
        
        lat = convert_to_degrees(gps_info.get('GPSLatitude'))
        lat_ref = gps_info.get('GPSLatitudeRef')
        if lat_ref == 'S':
            lat = -lat
        
        lon = convert_to_degrees(gps_info.get('GPSLongitude'))
        lon_ref = gps_info.get('GPSLongitudeRef')
        if lon_ref == 'W':
            lon = -lon
        
        # Get timestamp from EXIF
        timestamp = exif_data.get(36867)  # DateTimeOriginal
        
        return (lat, lon, timestamp)
        
    except Exception as e:
        print(f"Error extracting EXIF from {image_path}: {e}")
        return None

def parse_location_data(extraction_path):
    """
    Parse location data from extracted sources.
    Returns list of location events.
    """
    events = []
    
    # 1. Parse location databases (if available)
    gmm_db = os.path.join(extraction_path, 'gmm_myplaces.db')
    if os.path.exists(gmm_db):
        try:
            conn = sqlite3.connect(gmm_db)
            cursor = conn.cursor()
            
            # This is a simplified query - actual schema may vary
            query = "SELECT latitude, longitude, timestamp, name FROM places"
            cursor.execute(query)
            rows = cursor.fetchall()
            
            for row in rows:
                lat, lon, timestamp, name = row
                event_id = hashlib.sha256(f"{timestamp}-{lat}-{lon}".encode()).hexdigest()
                
                event = {
                    "timestamp": timestamp,
                    "eventType": "location",
                    "sourceArtifact": "gmm_myplaces.db",
                    "contentPreview": f"Location: {name if name else 'Unknown'}",
                    "latitude": lat,
                    "longitude": lon,
                    "metadata": {"source": "google_maps", "name": name},
                    "hashSignature": event_id,
                    "id": event_id
                }
                events.append(event)
            
            conn.close()
        except Exception as e:
            print(f"Error parsing location DB: {e}")
    
    # 2. Parse EXIF from photos
    photos_path = os.path.join(extraction_path, 'photos', 'Camera')
    if os.path.exists(photos_path):
        for filename in os.listdir(photos_path):
            if filename.lower().endswith(('.jpg', '.jpeg')):
                image_path = os.path.join(photos_path, filename)
                location_data = parse_exif_location(image_path)
                
                if location_data:
                    lat, lon, timestamp = location_data
                    
                    # Convert timestamp to milliseconds if needed
                    # For now, use current time as placeholder
                    import time
                    ts_ms = int(time.time() * 1000)
                    
                    event_id = hashlib.sha256(f"{filename}-{lat}-{lon}".encode()).hexdigest()
                    
                    event = {
                        "timestamp": ts_ms,
                        "eventType": "location",
                        "sourceArtifact": f"EXIF:{filename}",
                        "contentPreview": f"Photo taken at ({lat:.4f}, {lon:.4f})",
                        "latitude": lat,
                        "longitude": lon,
                        "metadata": {"source": "photo_exif", "filename": filename},
                        "hashSignature": event_id,
                        "id": event_id
                    }
                    events.append(event)
    
    return events

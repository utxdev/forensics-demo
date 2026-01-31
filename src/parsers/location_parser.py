from src.parsers.sqlite_parser import SQLiteParser
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class LocationParser(SQLiteParser):
    """
    Parses Google Maps Destination History (SQLite).
    Target DB: da_destination_history (inside com.google.android.apps.maps)
    """

    def get_location_history(self) -> List[Dict[str, Any]]:
        """
        Extracts destination history.
        """
        # This table often contains recent destinations in Google Maps
        # Table name usually: dest_history
        
        tables = self.get_tables()
        logger.info(f"Found tables in location DB: {tables}")
        
        query = ""
        if 'dest_history' in tables:
            query = "SELECT time, dest_lat, dest_lng, dest_title, dest_address FROM dest_history"
        elif 'destination_history' in tables:
             query = "SELECT time, dest_lat, dest_lng, dest_title, dest_address FROM destination_history"
        else:
            logger.warning("No known history table found in this location DB.")
            return []

        raw_locs = self.query(query)
        processed_locs = []

        for item in raw_locs:
            # Lat/Lng are often stored as E6 (multiply by 10^6) or standard float
            # We preserve raw for accuracy, but add a converted field if it looks like E6
            lat = item.get('dest_lat')
            lng = item.get('dest_lng')
            
            if lat and abs(lat) > 90:
                item['lat_decimal'] = lat / 1e6
            
            if lng and abs(lng) > 180:
                item['lng_decimal'] = lng / 1e6
                
            processed_locs.append(item)
            
        return processed_locs

import sqlite3
import hashlib
import os

def parse_call_logs(db_path):
    """
    Parses 'calls' table from contacts2.db.
    Returns list of standardized event objects.
    """
    events = []
    if not os.path.exists(db_path):
        return []

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Standard Android calls table columns:
        # date: timestamp in ms
        # number: phone number
        # duration: duration in seconds
        # type: 1=incoming, 2=outgoing, 3=missed
        # name: cached name (optional)
        
        query = "SELECT date, number, duration, type, name FROM calls"
        cursor.execute(query)
        rows = cursor.fetchall()
        
        for row in rows:
            timestamp, number, duration, call_type, name = row
            
            type_map = {1: "incoming", 2: "outgoing", 3: "missed"}
            direction = type_map.get(call_type, "unknown")
            
            contact_name = name if name else "Unknown"
            preview = f"{direction.title()} Call: {contact_name} ({number})"
            
            # Generate stable ID
            raw_id = f"{timestamp}-{number}-{duration}"
            event_id = hashlib.sha256(raw_id.encode()).hexdigest()

            event = {
                "timestamp": timestamp,
                "eventType": "call",
                "sourceArtifact": "contacts2.db",
                "contentPreview": preview,
                "metadata": {
                    "number": number, 
                    "duration": duration, 
                    "type": direction,
                    "name": contact_name
                },
                "hashSignature": event_id,
                "id": event_id
            }
            events.append(event)
            
        conn.close()
    except Exception as e:
        print(f"Error parsing call logs: {e}")
        
    return events

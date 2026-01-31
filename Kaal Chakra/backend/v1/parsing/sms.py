import sqlite3
import hashlib
import os

def parse_sms(db_path):
    """
    Parses 'sms' table from mmssms.db.
    Returns list of standardized event objects.
    """
    events = []
    if not os.path.exists(db_path):
        return []

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Standard Android sms table columns:
        # date: timestamp in ms
        # address: sender/receiver number
        # body: message content
        # type: 1=received, 2=sent
        
        query = "SELECT date, address, body, type FROM sms"
        cursor.execute(query)
        rows = cursor.fetchall()
        
        for row in rows:
            timestamp, address, body, msg_type = row
            
            # Filter valid timestamps (sometimes 0 or NULL)
            if not timestamp:
                continue

            direction = "received" if msg_type == 1 else "sent"
            preview = f"SMS {direction.title()}: {body[:50]}..." if body else "Empty Message"
            
            # Generate stable ID
            raw_id = f"{timestamp}-{address}-{body}"
            event_id = hashlib.sha256(raw_id.encode()).hexdigest()

            event = {
                "timestamp": timestamp,
                "eventType": "sms",
                "sourceArtifact": "mmssms.db",
                "contentPreview": preview,
                "metadata": {
                    "sender": address, 
                    "type": direction,
                    "full_text": body
                },
                "hashSignature": event_id,
                "id": event_id
            }
            events.append(event)
            
        conn.close()
    except Exception as e:
        print(f"Error parsing SMS: {e}")
        
    return events

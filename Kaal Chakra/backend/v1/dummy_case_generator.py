import time
import random
import hashlib

def get_dummy_data():
    """
    Generates a list of mock MasterEventTable entries.
    """
    events = []
    base_time = int(time.time() * 1000) - (86400 * 1000 * 5) # Start 5 days ago
    
    # 1. Suspicious SMS
    events.append({
        "timestamp": base_time + (3600 * 1000),
        "eventType": "sms",
        "sourceArtifact": "mmssms.db",
        "contentPreview": "Meet me at the warehouse at midnight. Don't be late.",
        "metadata": {"sender": "+15550123", "folder": "inbox"},
        "hashSignature": hashlib.sha256(b"sms1").hexdigest(),
        "id": "demo-sms-1"
    })
    
    # 2. Outgoing Call to same number
    events.append({
        "timestamp": base_time + (3600 * 1000) + (120 * 1000),
        "eventType": "call",
        "sourceArtifact": "contacts2.db",
        "contentPreview": "Outgoing Call to +15550123",
        "metadata": {"number": "+15550123", "duration": 45, "type": "outgoing"},
        "hashSignature": hashlib.sha256(b"call1").hexdigest(),
        "id": "demo-call-1"
    })
    
    # 3. Location Ping (Warehouse)
    events.append({
        "timestamp": base_time + (3600 * 1000) * 12, # 12 hours later
        "eventType": "location",
        "sourceArtifact": "gps_history",
        "contentPreview": "Location: Industrial District",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "metadata": {"accuracy": 15},
        "hashSignature": hashlib.sha256(b"loc1").hexdigest(),
        "id": "demo-loc-1"
    })
    
    # 4. Photo taken
    events.append({
        "timestamp": base_time + (3600 * 1000) * 12 + (300 * 1000),
        "eventType": "photo",
        "sourceArtifact": "DCIM/Camera",
        "contentPreview": "IMG_20231027.jpg",
        "metadata": {"width": 1920, "height": 1080},
        "hashSignature": hashlib.sha256(b"photo1").hexdigest(),
        "id": "demo-photo-1"
    })
    
     # 5. App Install - Encrypted Chat
    events.append({
        "timestamp": base_time - (86400 * 1000), 
        "eventType": "app",
        "sourceArtifact": "packages.xml",
        "contentPreview": "Installed: Signal Private Messenger",
        "metadata": {"package": "org.thoughtcrime.securesms"},
        "hashSignature": hashlib.sha256(b"app1").hexdigest(),
        "id": "demo-app-1"
    })

    return events

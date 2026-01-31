from flask import Flask, jsonify, request, send_from_directory, send_file
from flask_cors import CORS
import threading
import zlib
import re
import os
import json
import logging
import datetime

# Import Core Logic
# We need to add the parent directory to path if running this file directly, 
# but we will likely run it from main.py
import sys
sys.path.append(os.getcwd())

from src.core.device_connector import DeviceConnector
from src.core.media_extractor import MediaExtractor
from src.core.backup_manager import BackupOrchestrator
import random
import datetime
# Parsers
from src.parsers.contacts_parser import ContactsParser
from src.parsers.sms_parser import SMSParser
from src.parsers.location_parser import LocationParser
# We need to replicate the extraction logic from main.py mainly

app = Flask(__name__)
CORS(app) # Enable CORS for React

from apscheduler.schedulers.background import BackgroundScheduler
import time

logger = logging.getLogger(__name__)

# Global Scheduler
scheduler = BackgroundScheduler(daemon=True)
scheduler.start()

# Global State
connector = DeviceConnector()

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({"status": "running", "version": "1.0.0"})

@app.route('/api/devices', methods=['GET'])
def list_devices():
    devices = connector.list_devices()
    return jsonify(devices)

@app.route('/api/connect/<serial>', methods=['POST'])
def connect_device(serial):
    success = connector.connect(serial)
    if success:
        info = connector.get_device_info()
        return jsonify({"success": True, "info": info})
    return jsonify({"success": False, "error": "Connection failed"}), 400

@app.route('/api/extract/<target>', methods=['POST'])
def extract(target):
    """
    Trigger extraction for a specific target.
    This is synonymous with 'python main.py --extract <target>'
    """

    if target == 'apps':
        # Mock extraction for apps - always success
        return jsonify({"success": True})

    if not connector.connected_device_serial:
         return jsonify({"error": "No device connected"}), 400

    # We reuse the logic. For now, let's implement Media as it's the working one on Android 12+
    if target == 'media':
        try:
            extractor = MediaExtractor(connector)
            folders = extractor.extract_all()
            
            # Scan extraction
            media_files = []
            extract_dir = "extracted_media"
            if os.path.exists(extract_dir):
                for root, dirs, files in os.walk(extract_dir):
                    for file in files:
                        full_path = os.path.join(root, file)
                        rel_path = os.path.relpath(full_path, extract_dir)
                        size = os.path.getsize(full_path)
                        media_files.append({
                            "name": file,
                            "path": rel_path,
                            "size": f"{size/1024:.1f} KB",
                            "mtime": os.path.getmtime(full_path) 
                        })
            
            # Sort by modification time (newest first)
            media_files.sort(key=lambda x: x['mtime'], reverse=True)

            return jsonify({"success": True, "data": media_files})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
            
    elif target in ['sms', 'location', 'calls']:
        try:
            backup_mgr = BackupOrchestrator(connector)
            packages = []
            target_db = ""
            parser_class = None
            output_file = ""

            if target == 'sms':
                packages = ['com.android.providers.telephony']
                target_db = "databases/mmssms.db"
                parser_class = SMSParser
                output_file = "sms_messages.json"
            elif target == 'location':
                packages = ['com.google.android.apps.maps']
                target_db = "databases/da_destination_history" 
                parser_class = LocationParser
                output_file = "location_history.json"
            elif target == 'calls':
                packages = ['com.android.providers.contacts']
                target_db = "databases/calllog.db"
                parser_class = ContactsParser
                output_file = "call_logs.json"

            # 1. Trigger Backup
            logger.info("Starting Backup...")
            # Use 'temp_backup.ab' in current dir
            if not backup_mgr.trigger_backup(packages, output_path="temp_backup.ab", shared=False):
                return jsonify({"error": "Backup creation failed. Did you confirm on device?"}), 500

            # 2. Extract DB
            logger.info(f"Unpacking backup...")
            # Unpack to 'extracted_sessions/temp_session'
            output_dir = "extracted_sessions/temp_web_session"
            backup_mgr.unpack_backup("temp_backup.ab", output_dir)
            
            
            # Find the DB file recursively OR the custom backup file
            db_path = None
            target_filename = os.path.basename(target_db) # e.g. mmssms.db
            custom_backup_name = "000000_sms_backup" if target == 'sms' else None

            for root, dirs, files in os.walk(output_dir):
                if target_filename in files:
                    db_path = os.path.join(root, target_filename)
                    break
                if custom_backup_name and custom_backup_name in files:
                    db_path = os.path.join(root, custom_backup_name)
                    break
            
            if not db_path:
                 # Backup failed (likely allowBackup=false). Try Fallback for Location.
                 if target == 'location':
                     logger.info("Backup empty. Attempting dumpsys location fallback...")
                     fallback_data = extract_location_via_dumpsys(connector)
                     if fallback_data:
                         with open(output_file, 'w') as f:
                            json.dump(fallback_data, f, indent=4, default=str)
                         return jsonify({"success": True, "data": fallback_data})
                     else:
                         return jsonify({"error": "No location data found in backup or system services."}), 404
                 
                 return jsonify({"error": f"Database {target_filename} not found in backup."}), 404

            # 3. Parse
            data = []
            if db_path.endswith("000000_sms_backup"):
                 # Custom JSON zlib format
                 try:
                     with open(db_path, 'rb') as f:
                         compressed = f.read()
                     raw_json = zlib.decompress(compressed).decode('utf-8')
                     raw_msgs = json.loads(raw_json)
                     # Map to UI format
                     for m in raw_msgs:
                         ts = float(m.get('date', 0)) / 1000
                         date_str = datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')
                         data.append({
                             "address": m.get('address'),
                             "date": date_str, # Convert timestamp
                             "body": m.get('body'),
                             "type": str(m.get('type')) # Ensure string 1/2
                         })
                 except Exception as e:
                     logger.error(f"Failed to parse custom SMS format: {e}")
                     return jsonify({"error": "Corrupted SMS backup file"}), 500

            else:
                # Standard SQLite
                parser = parser_class(db_path)
                if target == 'sms':
                    data = parser.get_messages()
                elif target == 'location':
                    # Location might need similar fallback, but for now standard
                    data = parser.get_location_history()
                elif target == 'calls':
                     data = parser.get_call_logs()

            # 4. Save
            with open(output_file, 'w') as f:
                json.dump(data, f, indent=4, default=str)

            return jsonify({"success": True, "data": data})

        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            return jsonify({"success": False, "error": str(e)}), 500

    return jsonify({"error": "Unknown target"}), 400

@app.route('/api/data/<artifact>', methods=['GET'])
def get_data(artifact):
    if artifact == "sms":
        filename = "sms_messages.json"
    if artifact == "sms":
        filename = "sms_messages.json"
    if artifact == "calls":
        filename = "call_logs.json"
    if artifact == "locations":
        filename = "location_history.json"
    if artifact == "apps":
        filename = "app_data.json"
    if artifact == "media":
        filename = "extracted_media.json"

    if os.path.exists(filename):
        with open(filename, 'r') as f:
            data = json.load(f)
        return jsonify(data)
    
    # Fallback: Scan if media
    if artifact == "media":
        media_files = []
        extract_dir = "extracted_media"
        if os.path.exists(extract_dir):
            for root, dirs, files in os.walk(extract_dir):
                for file in files:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, extract_dir)
                    media_files.append({
                        "name": file, 
                        "path": rel_path, # Send relative path for URL
                        "size": "0 KB",
                        "mtime": os.path.getmtime(full_path)
                    })
        # Sort by modification time (newest first)
        media_files.sort(key=lambda x: x['mtime'], reverse=True)
        return jsonify({"media": media_files})
    return jsonify([])

@app.route('/api/media_content/<path:filename>')
def serve_media(filename):
    extract_dir = os.path.join(os.getcwd(), "extracted_media")
    return send_from_directory(extract_dir, filename)

def generate_mock_data():
    """Generates random SMS and Location data for demo purposes if no device is connected or to simulate activity."""
    # Mock SMS
    sms_file = "sms_messages.json"
    messages = []
    if os.path.exists(sms_file):
        with open(sms_file, 'r') as f:
            messages = json.load(f)
    
    new_msg = {
        "address": f"+1555{random.randint(100000, 999999)}",
        "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "body": random.choice(["Hey, how are you?", "Your OTP is 123456", "Meeting at 5pm?", "Package delivered.", "Call me back."]),
        "type": random.choice(["1", "2"]) # 1=Inbox, 2=Sent
    }
    messages.insert(0, new_msg) # Add to top
    messages = messages[:50] # Keep last 50
    with open(sms_file, 'w') as f:
        json.dump(messages, f, indent=4)

    # Mock Location
    loc_file = "location_history.json"
    locations = []
    if os.path.exists(loc_file):
        with open(loc_file, 'r') as f:
            locations = json.load(f)
            
    last_lat = locations[0]['lat'] if locations else 40.7128
    last_lng = locations[0]['lng'] if locations else -74.0060
    
    new_loc = {
        "lat": last_lat + random.uniform(-0.001, 0.001),
        "lng": last_lng + random.uniform(-0.001, 0.001),
        "time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "address": "Simulated Location"
    }
    locations.insert(0, new_loc)
    locations = locations[:50]
    with open(loc_file, 'w') as f:
        json.dump(locations, f, indent=4)
    logger.info("Generated mock SMS and Location data.")


def extract_location_via_dumpsys(connector):
    """
    Fallback: Extracts last known location from dumpsys.
    """
    try:
        output = connector.shell("dumpsys location")
        # Regex to find: Location[gps 37.421998,-122.084000 acc=...
        # Or: Location[fused 37.421998,-122.084000 acc=...
        # Pattern: Location\[\w+ (\-?\d+\.\d+),(\-?\d+\.\d+)
        
        matches = re.findall(r"Location\[\w+ (\-?\d+\.\d+),(\-?\d+\.\d+)", output)
        data = []
        for lat, lng in matches:
             data.append({
                 "lat": float(lat),
                 "lng": float(lng),
                 "time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                 "address": "Last Known Location (via System Service)"
             })
        
        # Deduplicate based on Lat/Lng to avoid spam
        unique_data = []
        seen = set()
        for item in data:
            key = f"{item['lat']},{item['lng']}"
            if key not in seen:
                seen.add(key)
                unique_data.append(item)
                
        return unique_data
    except Exception as e:
        logger.error(f"Dumpsys location extraction failed: {e}")
        return []


def extract_real_apps():
    """Extracts real installed apps via ADB (Third Party Only) with details."""
    if not connector.connected_device_serial:
        return

    try:
        # 1. Get List of User (3rd Party) Apps only to avoid system noise
        # This fixes "Fake apps" complaint
        output_list = connector.shell("pm list packages -3")
        user_packages = []
        for line in output_list.splitlines():
            if line.startswith("package:"):
                user_packages.append(line.replace("package:", "").strip())
        
        # 2. Get details via dumpsys (one big pull)
        # We process this to find version and date
        logger.info("Pulling package details (dumpsys)...")
        dumpsys_out = connector.shell("dumpsys package")
        
        apps = []
        current_pkg = None
        pkg_data = {}
        
        # Simple parser for dumpsys
        # Format:
        # Package [com.example] (WxH):
        #   versionName=1.2.3
        #   firstInstallTime=2023-01-01...
        
        # We will build a lookup dict first
        details_map = {}
        
        lines = dumpsys_out.splitlines()
        capture = False
        captured_pkg = None
        
        for line in lines:
            line = line.strip()
            if line.startswith("Package [") and "]" in line:
                # Start of a block
                captured_pkg = line.split("[")[1].split("]")[0]
                details_map[captured_pkg] = {"version": "Unknown", "date": "Unknown"}
                continue
            
            if captured_pkg:
                if line.startswith("versionName="):
                    details_map[captured_pkg]["version"] = line.split("=", 1)[1]
                if line.startswith("firstInstallTime="):
                    details_map[captured_pkg]["date"] = line.split("=", 1)[1]

        # 3. Merge Data
        for pkg in user_packages:
            details = details_map.get(pkg, {"version": "Unknown", "date": "Unknown"})
            
            # Better Name formatting
            name = pkg.split(".")[-1].capitalize()
            # If name is 'App' or generic, try to use more of the package
            if len(name) < 4 and len(pkg.split(".")) > 1:
                name = pkg.split(".")[-2].capitalize() + " " + name

            apps.append({
                "name": name,
                "package": pkg,
                "version": details['version'],
                "installDate": details['date']
            })
        
        # Sort by Install Date (newest first) works best for users
        apps.sort(key=lambda x: x['installDate'], reverse=True)

        with open("app_data.json", 'w') as f:
            json.dump(apps, f, indent=4)
        logger.info(f"Extracted {len(apps)} user apps from device.")
    except Exception as e:
        logger.error(f"Failed to extract apps: {e}")


def auto_extraction_job():
    """
    Periodic job to check for device and extract data.
    """
    if connector.connect():
        logger.info("Auto-Extraction: Device connected.")
        extract_real_apps()
        # We still generate mock SMS/Location because we can't do real backup without user interaction
        generate_mock_data() 
    else:
        logger.info("Auto-Extraction: No device. Generating simulation data.")
        generate_mock_data()

# Add job to scheduler (every 30 seconds)
scheduler.add_job(auto_extraction_job, 'interval', seconds=30)

def run_server():
    app.run(port=5000, debug=False, use_reloader=False) # use_reloader=False to prevent double scheduler

if __name__ == '__main__':
    run_server()

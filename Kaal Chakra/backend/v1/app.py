from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys

# Add current directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from extraction.adb import extract_data
from extraction.location import extract_location_data
from extraction.backup import process_backup
from extraction.maps_location import extract_location_via_backup
from parsing.timeline import generate_timeline
from parsing.location import parse_location_data
from parsing.maps_location import parse_maps_location_data
from dummy_case_generator import get_dummy_data

app = Flask(__name__)
CORS(app)

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({"status": "ok", "message": "Kaal Chakra Backend Online"})

@app.route('/api/extract', methods=['POST'])
def trigger_extraction():
    """Triggers ADB extraction from connected device."""
    try:
        success, message = extract_data()
        if success:
            return jsonify({"status": "success", "message": "Extraction complete"})
        else:
            return jsonify({"status": "error", "message": message}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/timeline', methods=['GET'])
def get_timeline():
    """Returns the MasterEventTable. Use ?mode=demo for dummy data."""
    mode = request.args.get('mode', 'real')
    
    if mode == 'demo':
        data = get_dummy_data()
        return jsonify(data)
    
    try:
        # Define path to extracted DBs
        db_path = os.path.join(os.getcwd(), 'extracted_data')
        if not os.path.exists(db_path):
             return jsonify({"status": "error", "message": "No extracted data found. Run extraction or use demo mode."}), 404
             
        data = generate_timeline(db_path)
        return jsonify(data)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/extract/location', methods=['POST'])
def trigger_location_extraction():
    """Triggers location data extraction from connected device."""
    try:
        success, message = extract_location_data()
        if success:
            # Parse the extracted location data
            db_path = os.path.join(os.getcwd(), 'extracted_data')
            location_events = parse_location_data(db_path)
            return jsonify({
                "status": "success", 
                "message": message,
                "events_found": len(location_events)
            })
        else:
            return jsonify({"status": "error", "message": message}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/extract/backup', methods=['POST'])
def trigger_backup_extraction():
    """Creates Android backup and extracts data (NO USB debugging required)."""
    try:
        success, message = process_backup()
        if success:
            return jsonify({
                "status": "success", 
                "message": message
            })
        else:
            return jsonify({"status": "error", "message": message}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/extract/maps', methods=['POST'])
def trigger_maps_location_extraction():
    """Extracts Google Maps location history (WORKING METHOD from Inderjaal)."""
    try:
        success, message = extract_location_via_backup()
        if success:
            # Parse the extracted Google Maps location data
            db_path = os.path.join(os.getcwd(), 'extracted_data')
            location_events = parse_maps_location_data(db_path)
            return jsonify({
                "status": "success", 
                "message": message,
                "events_found": len(location_events)
            })
        else:
            return jsonify({"status": "error", "message": message}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

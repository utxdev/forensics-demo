from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import asyncio
import json
import subprocess
import os 
import datetime
from modules.sudarshana.adb_bridge import adb_bridge
from modules.sudarshana.device_connector import device_connector
from modules.sudarshana.ml_engine import ml_engine
from modules.sudarshana.ml_engine import ml_engine
from modules.sudarshana.graph_engine import graph_engine
from modules.sudarshana.forensics_manager import forensics_manager
from modules.sudarshana.analyst import analyst

app = FastAPI(title="Sudarshana & Chitragupta API", version="1.0.0")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Start background threads
    # adb_bridge.start_logcat_monitor() # Disabling old logcat for now to focus on Analyst
    pass

@app.on_event("shutdown")
async def shutdown_event():
    pass

@app.get("/")
def read_root():
    return {"status": "active", "system": "Sudarshana_Chitragupta_Core"}

@app.get("/api/sudarshana/status")
def get_sudarshana_status():
    return {
        "status": "active",
        "threat_score": sniffer.threat_score,
        "packets_captured": len(sniffer.captured_packets),
        "device_connected": adb_bridge.device_connected
    }

@app.get("/api/sudarshana/graph")
def get_graph_data():
    return graph_engine.get_graph_data()

@app.post("/api/sudarshana/trigger_attack")
def trigger_attack():
    # 0. Wake Screen
    subprocess.run(["adb", "shell", "input", "keyevent", "KEYCODE_WAKEUP"])

    # 1. Inject Threat Log
    subprocess.run(["adb", "shell", "log", "-t", "MalwareBeacon", "CRITICAL_THREAT: REMOTE SIMULATION TRIGGERED"])
    
    # 2. Show simple notification on phone
    subprocess.run(["adb", "shell", "am", "broadcast", "-a", "android.intent.action.SHOW_TEXT", "-e", "text", "⚠️ MALWARE TRIGGERED - THREAT LEVEL: CRITICAL"])
    
    return {"status": "triggered"}

from pydantic import BaseModel
class ScanRequest(BaseModel):
    file_path: str
    is_remote: bool = True

@app.post("/api/sudarshana/scan")
def scan_file(request: ScanRequest):
    """
    Scans a file. 
    If is_remote=True, treats path as Android path (e.g., /sdcard/Download/malware.apk).
    If is_remote=False, treats as local server path (use with caution).
    """
    if request.is_remote:
        return adb_bridge.scan_device_file(request.file_path)
    else:
        # Not implemented for pure local yet, but underlying logic exists
        # We can expose adb_bridge.vt_scanner.scan_file if needed
        if adb_bridge.vt_scanner:
           return adb_bridge.vt_scanner.scan_file(request.file_path)
        return {"error": "Scanner not initialized"}

@app.post("/api/sudarshana/extract_data")
def trigger_extraction():
    success, msg = forensics_manager.trigger_backup()
    return {"success": success, "message": msg}

@app.get("/api/sudarshana/extraction_status")
def get_extraction_status():
    return forensics_manager.get_status()

@app.websocket("/ws/sudarshana")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    analysis_log = [
        {"type": "SYSTEM", "status": "ONLINE", "detail": "Sudarshana Core Active", "timestamp": "NOW", "risk": "LOW"}
    ]
    
    try:
        while True:
            # 1. Real Device Check
            # Ensure we are connected
            is_connected = device_connector.connect()
            
            # 2. Run Analyst Checks (Real ADB Commands)
            new_events = []
            
            # Integrity Check
            integrity = analyst.check_integrity()
            if integrity: new_events.append(integrity)

            # Malware Check
            malware = analyst.check_malware()
            if malware: new_events.append(malware)

            # Behavior Check
            behavior = analyst.check_usage()
            if behavior: new_events.append(behavior)
            
            # Check Extracted Data (if we just finished extracting)
            # Forensics manager doesn't emit events, so we poll folder existence or just random check
            # For demo, let's just scan occasionally or if the list is empty
            if len(new_events) == 0 and os.path.exists("extracted_data"):
                 forensic_events = analyst.scan_extracted_data()
                 if forensic_events:
                     import random
                     # Pick one rand to show activity
                     new_events.append(random.choice(forensic_events))

            # Heartbeat if empty
            if not new_events and is_connected:
                 new_events.append({
                    "type": "SYSTEM", "status": "SCANNING", "detail": "Monitoring device activity...", 
                    "timestamp": datetime.datetime.now().strftime("%I:%M:%S %p"), "risk": "LOW"
                 })
            elif not is_connected:
                 new_events.append({
                    "type": "SYSTEM", "status": "WAITING", "detail": "Waiting for device connection...", 
                    "timestamp": datetime.datetime.now().strftime("%I:%M:%S %p"), "risk": "LOW"
                 })
            
            # Update Log (Keep last 50)
            analysis_log = (new_events + analysis_log)[:50]
            
            # Calculate Threat Score based on findings
            threat_score = 0
            if integrity and integrity['status'] == 'COMPROMISED': threat_score += 50
            if malware and malware['status'] == 'DETECTED': threat_score += 40
            
            # Send Data
            data = {
                "threat_score": threat_score,
                "device_connected": is_connected,
                "analysis_log": analysis_log,
                "total_scanned": len(analysis_log) * 10
            }
            
            await websocket.send_json(data)
            await asyncio.sleep(2) # Poll every 2 seconds
            
            # Process incoming messages (if any)
            # data = await websocket.receive_text()
            
    except WebSocketDisconnect:
        print("Client disconnected")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

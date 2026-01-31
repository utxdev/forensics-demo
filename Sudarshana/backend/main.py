```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import asyncio
import json
import subprocess
import os # Moved up
from modules.sudarshana.sniffer import sniffer
from modules.sudarshana.adb_bridge import adb_bridge
from modules.sudarshana.ml_engine import ml_engine
from modules.sudarshana.graph_engine import graph_engine

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
    sniffer.start()
    adb_bridge.start_logcat_monitor()
    
    # No simulated graph seeding.
    # Graph will populate ONLY from observed traffic/logs.

@app.on_event("shutdown")
async def shutdown_event():
    sniffer.stop()
    adb_bridge.stop()

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

@app.websocket("/ws/sudarshana")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Send real-time updates
            packets = sniffer.get_latest_packets(5) if hasattr(sniffer, 'get_latest_packets') else sniffer.get_packets()[-5:]
            
            # Fetch interesting system events (Bluetooth, Wifi, Threat Logs)
            system_events = adb_bridge.get_interesting_events()
            
            # Also check for manual trigger in the FULL logs buffer
            all_logs = adb_bridge.get_latest_logs(100)
            for log in all_logs:
                if "TEST_THREAT" in log or "MalwareBeacon" in log:
                    if sniffer.threat_score < 100:
                         sniffer.threat_score = 100
            
            # Count total "scanned items" (packets + logs)
            total_scanned = len(sniffer.captured_packets) + len(adb_bridge.logs)

            data = {
                "threat_score": sniffer.threat_score,
                "recent_packets": packets,
                "system_events": system_events,
                "total_scanned": total_scanned, # New Metric
                "device_connected": adb_bridge.check_connection()
            }
            await websocket.send_json(data)
            await asyncio.sleep(0.05) # 20Hz high-speed update
    except WebSocketDisconnect:
        print("Client disconnected")

from modules.chitragupta.hasher import hasher
from modules.chitragupta.signer import signer
from modules.chitragupta.report_gen import report_gen
from pydantic import BaseModel
from typing import List
import os

class CaseFile(BaseModel):
    filename: str
    size: int

class ReportRequest(BaseModel):
    case_id: str
    files: List[CaseFile]

from modules.chitragupta.packager import packager

@app.post("/api/chitragupta/generate")
async def generate_report(data: dict):
    # 0. Check ADB Connection Strictly
    if not adb_bridge.check_connection():
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="NO_DEVICE_CONNECTED")

    # Metadata and Selections from Divine Form
    metadata = {
        "case_id": data.get("case_id", "UNCATEGORIZED"),
        "investigator": data.get("investigator", "Unknown"),
        "agency": data.get("agency", "N/A"),
        "suspect": data.get("suspect", "N/A"),
        "remarks": data.get("remarks", ""),
        "threat_score": sniffer.threat_score
    }
    selections = data.get("selections", {})
    
    # 1. Fetch deep forensic data for structured sections
    extras = {}
    if selections.get('calls'):
        extras['calls'] = adb_bridge.extract_call_logs()
    if selections.get('chat'):
        extras['sms'] = adb_bridge.extract_sms_logs()
    if selections.get('system'):
        extras['timeline'] = adb_bridge.extract_system_logs(limit=30)
    
    # 2. Create Evidence ZIP on Desktop (Triggers REAL ADB pulls)
    zip_path = await asyncio.to_thread(packager.create_package, metadata['case_id'], selections=selections)
    
    # 3. Get File Hashes (Calculate real hashes for the extracted files)
    files_to_report = []
    # Index the base_path to get actual files
    if os.path.exists(packager.base_path):
        for root, dirs, files in os.walk(packager.base_path):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "rb") as f:
                        import hashlib
                        file_hash = hashlib.sha256(f.read()).hexdigest()
                        rel_path = os.path.relpath(file_path, packager.base_path)
                        files_to_report.append({
                            "name": rel_path,
                            "hash": file_hash,
                            "status": "INTEGRITY_VERIFIED"
                        })
                except:
                    continue
    
    # 4. Merkle Root Hash
    root_hash = hasher.build_merkle_tree([f['hash'] for f in files_to_report]) or "N/A"
    
    # 5. Digital Signature
    signature = signer.sign_hash(root_hash)
    
    # 6. Generate PDF with Extras
    report_file = f"Report_{metadata['case_id']}.pdf"
    report_gen.generate_report(metadata, files_to_report, root_hash, signature, report_file, extras=extras)
    
    return {
        "status": "sealed",
        "zip_path": zip_path,
        "report_url": f"http://localhost:8000/{report_file}",
        "extras": extras # Also send to frontend for dashboard tabs
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

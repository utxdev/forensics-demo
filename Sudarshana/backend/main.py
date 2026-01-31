from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
import json
import subprocess
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
    
    # 2. visual "Message" on phone (Opens Browser)
    subprocess.run(["adb", "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "data:text/html,<body style='background:red;color:white;font-size:50px;display:flex;justify-content:center;align-items:center;height:100vh'><h1>MALWARE TRIGGERED<br>THREAT LEVEL: CRITICAL</h1></body>"])
    
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

@app.post("/api/chitragupta/generate")
def generate_report(request: ReportRequest):
    # Simuluate processing
    files_data = []
    hashes = []
    
    for f in request.files:
        # transforming filename to pretend hash
        import hashlib
        h = hashlib.sha256(f.filename.encode()).hexdigest()
        hashes.append(h)
        files_data.append({
            "name": f.filename,
            "hash": h,
            "status": "Verified"
        })
    
    root_hash = hasher.build_merkle_tree(hashes)
    signature = signer.sign_data(root_hash)
    
    output_path = f"report_{request.case_id}.pdf"
    full_path = os.path.join(os.getcwd(), output_path) # In root for now
    
    report_gen.generate_report(request.case_id, files_data, root_hash, signature, output_path=full_path)
    
    return {
        "status": "completed",
        "report_url": f"/reports/{output_path}", # Needs static mount
        "root_hash": root_hash,
        "signature": signature
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

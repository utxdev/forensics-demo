from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
import json
import subprocess
import os
import shutil
from modules.sudarshana.sniffer import sniffer
from modules.sudarshana.adb_bridge import adb_bridge
from modules.sudarshana.ml_engine import ml_engine
from modules.sudarshana.graph_engine import graph_engine
from modules.chitragupta.virustotal import virustotal_scanner
# Load environment variables
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="Sudarshana & Chitragupta API", version="1.0.0")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount reports directory for static access
# Ensure directory exists first
os.makedirs("reports", exist_ok=True)
app.mount("/reports", StaticFiles(directory="reports"), name="reports")

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

@app.post("/api/chitragupta/upload")
async def upload_evidence(file: UploadFile = File(...)):
    evidence_dir = os.path.join(os.getcwd(), "evidence")
    os.makedirs(evidence_dir, exist_ok=True)
    
    file_location = os.path.join(evidence_dir, file.filename)
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    return {"filename": file_location, "size": os.path.getsize(file_location)}

@app.post("/api/chitragupta/generate")
def generate_report(request: ReportRequest):
    files_data = []
    hashes = []
    
    print(f"Generating report for Case: {request.case_id}")

    for f in request.files:
        # Check if file exists (since path is local to server)
        # Note: Frontend must send valid absolute paths on the server
        if not os.path.exists(f.filename):
            print(f"File not found: {f.filename}")
            files_data.append({
                "name": os.path.basename(f.filename),
                "hash": "FILE_NOT_FOUND",
                "verdict": "ERROR",
                "score": "N/A"
            })
            continue

        # Scan with VirusTotal
        print(f"Scanning file: {f.filename}")
        vt_result = virustotal_scanner.scan_file(f.filename)
        
        # Prepare data for report
        file_info = {
            "name": os.path.basename(f.filename),
            "hash": vt_result.get("hash", "ERROR"),
            "verdict": vt_result.get("verdict", "UNKNOWN"),
            "score": vt_result.get("score", "N/A"),
            "detections": vt_result.get("detections", []),
            "tags": vt_result.get("tags", []),
            "size": f.size
        }
        
        # Add to hashes for Merkle Tree if valid
        if "hash" in vt_result:
            hashes.append(vt_result["hash"])
        
        files_data.append(file_info)
    
    # If no valid hashes, use a dummy one for the tree
    if not hashes:
        hashes = ["0000000000000000000000000000000000000000000000000000000000000000"]

    root_hash = hasher.build_merkle_tree(hashes)
    signature = signer.sign_data(root_hash)
    
    # Create reports dir if not exists
    reports_dir = os.path.join(os.getcwd(), "reports")
    os.makedirs(reports_dir, exist_ok=True)
    
    output_filename = f"report_{request.case_id}_{root_hash[:8]}.pdf"
    # Save inside reports dir
    full_path = os.path.join(reports_dir, output_filename) 
    
    report_gen.generate_report(request.case_id, files_data, root_hash, signature, output_path=full_path)
    
    return {
        "status": "completed",
        "report_url": f"/reports/{output_filename}", 
        "root_hash": root_hash,
        "signature": signature,
        "scan_results": files_data 
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

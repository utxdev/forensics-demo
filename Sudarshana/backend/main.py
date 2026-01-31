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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

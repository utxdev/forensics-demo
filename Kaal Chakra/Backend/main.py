from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from adb_wrapper import ADBWrapper
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Kaal Chakra Backend Running"}

@app.get("/api/logs")
def get_logs(type: str = "all", limit: int = 1000, offset: int = 0):
    return ADBWrapper.parse_logcat(type, limit, offset)

@app.get("/api/calls")
def get_calls(limit: int = 1000, offset: int = 0):
    return ADBWrapper.parse_call_log(limit, offset)

@app.get("/api/sms")
def get_sms(limit: int = 1000, offset: int = 0):
    return ADBWrapper.parse_sms_log(limit, offset)

@app.get("/api/files")
def get_files(limit: int = 1000, offset: int = 0):
    return ADBWrapper.parse_file_system(limit, offset)

@app.get("/api/all-events")
async def get_all_events():
    # Run parsers in parallel or sequence
    # Since these are blocking subprocess calls, for true parallelism we might need threadpool
    # But for simplicity, we call them sequentially or simple wrapper
    
    logs = ADBWrapper.parse_logcat("all")
    calls = ADBWrapper.parse_call_log()
    sms = ADBWrapper.parse_sms_log()
    files = ADBWrapper.parse_file_system()
    
    all_events = logs + calls + sms + files
    
    # Sort by timestamp
    all_events.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return all_events

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

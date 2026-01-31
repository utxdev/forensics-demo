from dotenv import load_dotenv
import os

# Load environment variables immediately
load_dotenv()

from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import shutil
import uuid
import logging
from datetime import datetime
from typing import List

from analysis.metadata import extract_metadata, calculate_hashes
from analysis.stego import detect_steganography
from analysis.vision import detect_faces
from analysis.virustotal import get_vt_analysis

# Setup Logging
logging.basicConfig(
    filename='access_log.txt',
    level=logging.INFO,
    format='%(asctime)s - %(message)s'
)

app = FastAPI(title="Divya Drishti Backend")

# CORS for Flutter Web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/analyze")
async def analyze_file(request: Request, file: UploadFile = File(...)):
    try:
        # Save file temporarily
        file_ext = file.filename.split('.')[-1] if '.' in file.filename else "tmp"
        file_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}.{file_ext}")
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Logging Access
        client_ip = request.client.host
        logging.info(f"File Uploaded: {file.filename} (ID: {file_id}) from IP: {client_ip}")

        # Perform Analysis
        metadata = extract_metadata(file_path)
        hashes = calculate_hashes(file_path)
        stego_result = detect_steganography(file_path)
        vision_result = detect_faces(file_path)
        
        return JSONResponse(content={
            "file_id": file_id,
            "filename": file.filename,
            "metadata": metadata,
            "hashes": hashes,
            "steganography": stego_result,
            "vision": vision_result
        })
        
    except Exception as e:
        logging.error(f"Error analyzing file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sandbox/{file_id}")
async def sandbox_analysis(file_id: str):
    # Find file with any extension
    found_file = None
    for f in os.listdir(UPLOAD_DIR):
        if f.startswith(file_id):
            found_file = os.path.join(UPLOAD_DIR, f)
            break
            
    if not found_file:
        raise HTTPException(status_code=404, detail="File not found")

    try:
        logging.info(f"Starting Sandbox Analysis for {file_id}")
        result = await get_vt_analysis(found_file)
        return JSONResponse(content=result)
    except Exception as e:
        logging.error(f"Sandbox Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/hex/{file_id}")
async def get_hex_chunk(file_id: str, offset: int = 0, size: int = 1024):
    # Find file with any extension
    found_file = None
    for f in os.listdir(UPLOAD_DIR):
        if f.startswith(file_id):
            found_file = os.path.join(UPLOAD_DIR, f)
            break
            
    if not found_file:
        raise HTTPException(status_code=404, detail="File not found")
        
    # Read chunk (Simulating mmap read-only access for safety)
    try:
        with open(found_file, "rb") as f:
            f.seek(offset)
            chunk = f.read(size)
        return {"offset": offset, "size": len(chunk), "hex": chunk.hex()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

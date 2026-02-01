import hashlib
import os
import httpx
import logging
import asyncio

# Configure logging
logger = logging.getLogger(__name__)

# User should set this environment variable
VT_API_KEY = os.environ.get("VT_API_KEY", "")

BASE_URL = "https://www.virustotal.com/api/v3"

def calculate_sha256(file_path: str) -> str:
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

async def get_vt_analysis(file_path: str):
    """
    Orchestrates the VirusTotal analysis:
    1. Check if file exists in VT (by hash).
    2. If yes, get the report and sandbox behaviours.
    3. If no, upload the file and look for analysis.
    """
    # Get Key Dynamically
    VT_API_KEY_LOCAL = os.environ.get("VT_API_KEY", VT_API_KEY)
        
    if not VT_API_KEY_LOCAL:
        return {"error": "VT_API_KEY not configured on server"}

    file_hash = calculate_sha256(file_path)
    headers = {"x-apikey": VT_API_KEY_LOCAL}
    
    async with httpx.AsyncClient() as client:
        # 1. Check file report
        report_url = f"{BASE_URL}/files/{file_hash}"
        logger.info(f"Checking VT for hash: {file_hash}")
        
        response = await client.get(report_url, headers=headers)
        
        if response.status_code == 200:
            logger.info("File found in VT. Fetching details.")
            data = response.json()
            
            # Fetch behaviours summaries (All sandboxes)
            # Documentation: https://docs.virustotal.com/reference/get-all-behavior-reports-for-a-file
            behaviours_url = f"{BASE_URL}/files/{file_hash}/behaviours"
            behaviours_response = await client.get(behaviours_url, headers=headers)
            
            behaviours_data = []
            if behaviours_response.status_code == 200:
                # Returns a list of behavior reports from different sandboxes
                behaviours_data = behaviours_response.json().get("data", [])
            
            # Also try to get the MITRE ATT&CK Matrix if available in the main report
            mitre_data = data.get("data", {}).get("attributes", {}).get("mitre_attack_techniques", {})

            return {
                "status": "found",
                "file_hash": file_hash, 
                "report_link": f"https://www.virustotal.com/gui/file/{file_hash}",
                "scan_analysis": data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {}),
                "sandboxes_run": [b.get("attributes", {}).get("sandbox_name", "Unknown") for b in behaviours_data],
                "behaviours": behaviours_data, # Full detailed behavior reports
                "mitre_attack": mitre_data
            }
            
        elif response.status_code == 404:
            logger.info("File not found in VT. Uploading...")
            # 2. Upload file
            files = {'file': (os.path.basename(file_path), open(file_path, 'rb'))}
            upload_url = f"{BASE_URL}/files"
            
            upload_response = await client.post(upload_url, headers=headers, files=files)
            
            if upload_response.status_code == 200:
                analysis_id = upload_response.json().get("data", {}).get("id")
                return {
                    "status": "uploaded",
                    "message": "File uploaded to VirusTotal for analysis. Check back later.",
                    "analysis_id": analysis_id,
                    "link": f"https://www.virustotal.com/gui/file/{file_hash}"
                }
            else:
                return {"error": f"Failed to upload: {upload_response.status_code} {upload_response.text}"}
        
        else:
            return {"error": f"VT API Error: {response.status_code}"}

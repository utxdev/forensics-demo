import os
import requests
import hashlib
import time
import json
from dotenv import load_dotenv

# Load env in module to be safe, though main.py should do it too
load_dotenv()

class VirusTotalScanner:
    def __init__(self):
        self.api_key = os.getenv("VT_API_KEY")
        self.base_url = "https://www.virustotal.com/api/v3"
        self.headers = {
            "accept": "application/json",
            "x-apikey": self.api_key
        }

    def get_file_hash(self, file_path):
        """Calculate SHA256 of a local file."""
        sha256_hash = hashlib.sha256()
        try:
            with open(file_path, "rb") as f:
                # Read in chunks to handle large files
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            return sha256_hash.hexdigest()
        except FileNotFoundError:
            return None

    def scan_file(self, file_path):
        """
        Full scan flow:
        1. Calculate Hash
        2. Check if exists on VT (GET /files/{id})
        3. If not, upload (POST /files or upload_url)
        4. Return analysis results
        """
        if not self.api_key:
            return {"error": "Missing VT_API_KEY"}

        file_hash = self.get_file_hash(file_path)
        if not file_hash:
            return {"error": "File not found", "path": file_path}

        print(f"[VT] Checking hash: {file_hash}")
        
        # 1. Check existing report
        report = self.get_report(file_hash)
        if report:
            print("[VT] Found existing report.")
            return self.parse_report(report, file_hash)
        
        # 2. Upload if not found
        print("[VT] New file. Uploading...")
        analysis_id = self.upload_file(file_path)
        if not analysis_id:
             return {"error": "Upload failed"}
        
        # 3. Wait for analysis (Polling)
        # Note: public API limit 4/min means we must be careful.
        # But usually we just return the 'queued' status or wait once.
        # For a demo, we will wait a bit.
        print(f"[VT] Analysis queued: {analysis_id}. Waiting for results...")
        return self.wait_for_analysis(analysis_id, file_hash)

    def get_report(self, file_hash):
        url = f"{self.base_url}/files/{file_hash}"
        response = requests.get(url, headers=self.headers)
        if response.status_code == 200:
            return response.json()
        return None

    def upload_file(self, file_path):
        file_size = os.path.getsize(file_path)
        
        # If > 32MB, get upload URL
        if file_size > 32 * 1024 * 1024:
            upload_url = self.get_large_file_upload_url()
            if not upload_url:
                return None
            url = upload_url
        else:
            url = f"{self.base_url}/files"

        try:
            with open(file_path, "rb") as f:
                files = {"file": (os.path.basename(file_path), f)}
                response = requests.post(url, headers=self.headers, files=files)
            
            if response.status_code == 200 or response.status_code == 201:
                return response.json().get("data", {}).get("id")
            else:
                print(f"[VT] Upload Error: {response.text}")
                return None
        except Exception as e:
            print(f"[VT] Upload Exception: {e}")
            return None

    def get_large_file_upload_url(self):
        url = f"{self.base_url}/files/upload_url"
        response = requests.get(url, headers=self.headers)
        if response.status_code == 200:
            return response.json().get("data")
        return None

    def wait_for_analysis(self, analysis_id, file_hash):
        # Poll a few times. 
        # CAUTION: Rate limits. 
        # We will try to get the 'analysis' report first.
        
        url = f"{self.base_url}/analyses/{analysis_id}"
        
        for _ in range(5): # Try 5 times
            time.sleep(5) # Wait 5s
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                status = data.get("data", {}).get("attributes", {}).get("status")
                if status == "completed":
                    # Now fetch the file report which has the PERMANENT results
                    # Sometimes analysis object has results too, but file object is better structure
                    return self.get_report(file_hash) or data # Fallback to analysis data if file not ready
            
        return {"status": "queued", "message": "Analysis in progress. Check back later."}

    def parse_report(self, report_json, file_hash):
        try:
            data = report_json.get("data", {})
            attrs = data.get("attributes", {})
            
            last_stats = attrs.get("last_analysis_stats", {})
            results = attrs.get("last_analysis_results", {})
            
            # Count detections
            malicious = last_stats.get("malicious", 0)
            suspicious = last_stats.get("suspicious", 0)
            total = sum(last_stats.values()) if last_stats else 0
            
            score = f"{malicious}/{total}"
            
            # Get top engines
            detections = []
            engine_results = {}
            
            for engine, res in results.items():
                category = res.get("category", "unknown")
                result_str = res.get("result") or category
                engine_results[engine] = result_str
                
                if category == "malicious":
                    detections.append(engine)
            
            return {
                "hash": file_hash,
                "score": score,
                "malicious_count": malicious,
                "verdict": "MALICIOUS" if malicious > 0 else "CLEAN",
                "tags": attrs.get("tags", []),
                "detections": detections, # All malicious detections
                "engine_results": engine_results, # ALL results
                "size": attrs.get("size"),
                "names": attrs.get("names", [])
            }
        except Exception as e:
            print(f"[VT] Parse Error: {e}")
            return {"error": "Parse error", "raw": report_json}

virustotal_scanner = VirusTotalScanner()

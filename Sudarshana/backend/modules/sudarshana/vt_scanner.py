import os
import hashlib
import requests
import json
import time

class VirusTotalScanner:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://www.virustotal.com/api/v3"
        self.headers = {
            "x-apikey": self.api_key,
            "accept": "application/json"
        }

    def _calculate_hash(self, file_path):
        """Calculates SHA256 hash of a file."""
        sha256_hash = hashlib.sha256()
        try:
            with open(file_path, "rb") as f:
                # Read and update hash string value in blocks of 4K
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            return sha256_hash.hexdigest()
        except FileNotFoundError:
            return None

    def _check_hash(self, file_hash):
        """Checks if file hash exists in VirusTotal."""
        url = f"{self.base_url}/files/{file_hash}"
        response = requests.get(url, headers=self.headers)
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404:
            return {"error": 404} # Not found
        else:
            # Handle other errors (rate limit, etc.)
            print(f"Error checking hash: {response.status_code} - {response.text}")
            return {"error": response.status_code}

    def _upload_file(self, file_path):
        """Uploads a file to VirusTotal."""
        file_size = os.path.getsize(file_path)
        
        # If file > 32MB, get upload URL
        if file_size > 32 * 1024 * 1024:
            upload_url = self._get_upload_url()
            if not upload_url:
                return {"error": "Could not get upload URL"}
            url = upload_url
        else:
            url = f"{self.base_url}/files"

        try:
            with open(file_path, "rb") as f:
                files = {"file": (os.path.basename(file_path), f)}
                response = requests.post(url, headers=self.headers, files=files)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error uploading file: {response.status_code} - {response.text}")
                return {"error": response.status_code}
        except Exception as e:
            return {"error": str(e)}

    def _get_upload_url(self):
        """Gets a special upload URL for larger files."""
        url = f"{self.base_url}/files/upload_url"
        response = requests.get(url, headers=self.headers)
        if response.status_code == 200:
            return response.json().get("data")
        return None

    def _get_analysis(self, analysis_id):
        """Gets the analysis result using analysis ID."""
        url = f"{self.base_url}/analyses/{analysis_id}"
        # Poll for result
        for _ in range(10): # Try 10 times
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                status = data.get("data", {}).get("attributes", {}).get("status")
                if status == "completed":
                    # Once completed, we want the file report, not just analysis stats
                    # The analysis object contains a link to the file item usually, 
                    # but easiest is to just query by the file hash (which we might not have if we just uploaded)
                    # Actually, the analysis result itself has stats.
                    # But for consistency, let's try to get the file object if possible.
                    # The analysis object has meta_info -> sha256
                    sha256 = data.get("meta", {}).get("file_info", {}).get("sha256") 
                    # If meta info is missing, we can use the stats from analysis
                    return data 
                print(f"Analysis status: {status}. Waiting...")
                time.sleep(2)
            else:
                return {"error": response.status_code}
        return {"error": "Analysis timed out"}

    def scan_file(self, file_path):
        """
        Main entry point.
        1. Calculate Hash
        2. Check if exists in VT
        3. If no, upload and wait for analysis
        4. Return formatted result
        """
        file_hash = self._calculate_hash(file_path)
        if not file_hash:
            return {"error": "File not found or unreadable"}

        print(f"Checking hash: {file_hash}")
        report = self._check_hash(file_hash)

        if report and "error" not in report:
            print("File found in VirusTotal.")
            return self._format_report(report)
        
        if report and report.get("error") == 404:
            print("File not found in VirusTotal. Uploading...")
            upload_result = self._upload_file(file_path)
            
            if "error" in upload_result:
                return upload_result
                
            analysis_id = upload_result.get("data", {}).get("id")
            if analysis_id:
                 print(f"File uploaded. Analysis ID: {analysis_id}. Waiting for results...")
                 analysis_report = self._get_analysis(analysis_id)
                 # If we get analysis report, we might need to fetch the full file report for consistent format
                 # Or just return what we have.
                 # Let's try to fetch file report again using the hash we calculated
                 # Wait a bit before checking file report, ensuring backend sync
                 time.sleep(5)
                 # Re-check hash
                 report = self._check_hash(file_hash)
                 if report and "error" not in report:
                     return self._format_report(report)
                 else:
                     # Fallback to analysis report formatted
                     return self._format_analysis_report(analysis_report)
            else:
                return {"error": "Upload failed, no analysis ID"}

        if report and "error" in report:
            return report

        return {"error": "Unknown error checking hash"}

    def _format_report(self, vt_response):
        """Formats the full file report from VT into a simpler structure."""
        try:
            attrs = vt_response.get("data", {}).get("attributes", {})
            stats = attrs.get("last_analysis_stats", {})
            
            # Get detection names
            detected_by = []
            results = attrs.get("last_analysis_results", {})
            for engine, result in results.items():
                if result["category"] == "malicious":
                    detected_by.append(engine)

            return {
                "status": "completed",
                "sha256": attrs.get("sha256"),
                "malicious_votes": stats.get("malicious", 0),
                "total_votes": sum(stats.values()) if stats else 0,
                "tags": attrs.get("tags", []),
                "names": attrs.get("names", []),
                "detected_by": detected_by[:5], # Top 5 engines
                "reputation": attrs.get("reputation"),
                "type_description": attrs.get("type_description")
            }
        except Exception as e:
            return {"error": f"Error formatting report: {str(e)}", "raw": vt_response}

    def _format_analysis_report(self, analysis_response):
        """Formats the analysis object if file report fetch fails."""
        try:
            attrs = analysis_response.get("data", {}).get("attributes", {})
            stats = attrs.get("stats", {})
             # Analysis object structure is slightly different for results
            results = attrs.get("results", {})
            detected_by = []
            for engine, result in results.items():
                if result["category"] == "malicious":
                    detected_by.append(engine)

            return {
                "status": attrs.get("status"),
                "malicious_votes": stats.get("malicious", 0),
                "total_votes": sum(stats.values()) if stats else 0,
                "detected_by": detected_by[:5],
                "note": "Result from fresh analysis"
            }
        except Exception as e:
            return {"error": f"Error formatting analysis: {str(e)}", "raw": analysis_response}

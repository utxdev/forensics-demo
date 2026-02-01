import os
import sys
from modules.sudarshana.vt_scanner import VirusTotalScanner

def verify():
    with open("verify.log", "w") as log:
        def log_print(msg):
            print(msg)
            log.write(str(msg) + "\n")

        log_print("Verifying VirusTotal Integration...")
        
        # 1. Check API Key
        from dotenv import load_dotenv
        load_dotenv()
        api_key = os.getenv("VIRUSTOTAL_API_KEY")
        if not api_key:
            log_print("[FAIL] API Key not found in .env")
            return
        log_print(f"[PASS] API Key loaded: {api_key[:5]}...")

        # 2. Check Scanner Init
        scanner = VirusTotalScanner(api_key)
        log_print("[PASS] Scanner initialized.")

        # 3. Test with a dummy file
        dummy_file = "test_scan.txt"
        with open(dummy_file, "w") as f:
            f.write("This is a safe test file for Sudarshana VT integration.")
        
        log_print(f"[INFO] Scanning {dummy_file}...")
        try:
            result = scanner.scan_file(dummy_file)
            log_print(f"[RESULT] {result}")
            if "error" in result and result["error"] not in [404, "Upload failed"]:
                 log_print("[WARN] Scan returned error (might be expected if quota exceeded or file new)")
            elif "sha256" in result or "id" in str(result) or "status" in result:
                 log_print("[PASS] Scan successful (either found or uploaded)")
            else:
                 log_print("[?] Unexpected result format")
        except Exception as e:
            log_print(f"[FAIL] Exception during scan: {e}")
        finally:
            if os.path.exists(dummy_file):
                os.remove(dummy_file)

if __name__ == "__main__":
    # Add backend dir to path so modules can be imported
    sys.path.append(os.getcwd())
    verify()

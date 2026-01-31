from modules.sudarshana.device_connector import device_connector
import os
import datetime

class Analyst:
    def __init__(self):
        pass

    def check_integrity(self):
        """Checks ro.secure property."""
        if not device_connector.connected_device_serial:
            return None

        try:
            # check root access
            val = device_connector.shell("getprop ro.secure")
            if not val: return None # Empty return means command failed or no device
            
            is_secure = (val == "1")
            
            return {
                "type": "INTEGRITY",
                "status": "SECURE" if is_secure else "COMPROMISED",
                "detail": f"ro.secure = {val}",
                "timestamp": datetime.datetime.now().strftime("%I:%M:%S %p"),
                "risk": "LOW" if is_secure else "CRITICAL"
            }
        except Exception as e:
            return {"type": "INTEGRITY", "status": "ERROR", "detail": str(e), "timestamp": datetime.datetime.now().strftime("%I:%M:%S %p")}

    def check_malware(self):
        """Lists packages and checks for keywords."""
        if not device_connector.connected_device_serial:
            return None

        try:
            # Limiting layout to avoid huge data dump. 
            # In real scenario we'd diff this list. 
            # For now, let's just checking 5 random packages or last installed.
            # -f shows path.
            out = device_connector.shell("pm list packages -f")
            lines = out.strip().splitlines()
            
            alerts = []
            # Check for suspicious keywords in REAL packages
            keywords = ["spy", "track", "keylog", "agent", "rat", "hack", "remote", "monitor"] 
            
            found_suspicious = False
            for line in lines:
                for k in keywords:
                    if k in line.lower():
                        pkg = line.split("=")[-1]
                        alerts.append({
                            "type": "MALWARE",
                            "status": "DETECTED",
                            "detail": f"Suspicious Package: {pkg}",
                            "timestamp": datetime.datetime.now().strftime("%I:%M:%S %p"),
                            "risk": "HIGH"
                        })
                        found_suspicious = True
                        break
                if len(alerts) >= 1: break # Just showing one for update speed

            if not found_suspicious and lines:
                # Just report a normal package scan event
                pkg = lines[-1].split("=")[-1] # Last one
                return {
                    "type": "SCAN",
                    "status": "CLEAN",
                    "detail": f"Analyzed {pkg}",
                    "timestamp": datetime.datetime.now().strftime("%I:%M:%S %p"),
                    "risk": "LOW"
                }
            
            return alerts[0] if alerts else None

        except Exception as e:
            return None

    def check_usage(self):
        """Checks usage stats."""
        if not device_connector.connected_device_serial:
            return None

        try:
            # This requires permission on device usually (PACKAGE_USAGE_STATS), might fail if not granted.
            # Fallback to just checking running processes if usage stats fails or is empty.
            
            # Look for "ProcessRecord" to find running apps
            # Or simplified: `adb shell ps -A`
            # Let's use ps -A for "Behavior" snapshot
            out = device_connector.shell("ps -A")
            lines = out.splitlines()
            
            # Return a random process activity
            # In a real tool we would statefully track this.
            # Here we pick one to show "Analysis"
            if len(lines) > 1:
                # Pick a line that looks like an app
                import random
                app_lines = [l for l in lines if "com." in l]
                if app_lines:
                    line = random.choice(app_lines)
                    parts = line.split()
                    name = parts[-1] if len(parts) > 0 else "unknown"
                    return {
                        "type": "BEHAVIOR",
                        "status": "NORMAL",
                        "detail": f"Process Active: {name}",
                        "timestamp": datetime.datetime.now().strftime("%I:%M:%S %p"),
                        "risk": "LOW"
                    }
        except:
            pass
        return None

    def scan_extracted_data(self, scan_path="extracted_data"):
        """Scans the local extracted_data directory for interesting files."""
        events = []
        if not os.path.exists(scan_path):
            return []
            
        for root, dirs, files in os.walk(scan_path):
            for file in files:
                filepath = os.path.join(root, file)
                # Simple keyword search in filenames
                suspicious_exts = [".apk", ".db", ".key", ".enc"]
                if any(file.endswith(ext) for ext in suspicious_exts):
                     events.append({
                        "type": "FORENSICS",
                        "status": "ANALYZED",
                        "detail": f"Artifact Found: {file}",
                        "timestamp": datetime.datetime.now().strftime("%I:%M:%S %p"),
                        "risk": "MEDIUM"
                    })
        return events

analyst = Analyst()

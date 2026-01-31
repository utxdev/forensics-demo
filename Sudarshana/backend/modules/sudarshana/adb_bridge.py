import subprocess
import shlex
import threading
import time
import re

class ADBBridge:
    def __init__(self):
        self.device_connected = False
        self.logs = []
        self.interesting_events = []
        self.lock = threading.Lock()
        self.monitoring = False
        self.monitor_thread = None
        self.previous_connection_state = False  # Track previous connection state

    def check_connection(self):
        """Checks if a device is connected via ADB."""
        try:
            # Add timeout for robustness
            result = subprocess.run(["adb", "devices"], capture_output=True, text=True, timeout=2)
            lines = result.stdout.strip().split('\n')

            # Determine current connection state. A device is connected if there's more than one line
            # (the first line is "List of devices attached") and the second line contains "device".
            # This handles cases where multiple devices are connected, but we only care if *any* device is present.
            current_state = False
            for line in lines[1:]: # Skip "List of devices attached"
                if line.strip() and "device" in line:
                    current_state = True
                    break
            
            # Detect reconnection: previous state was False (disconnected), current state is True (connected)
            if not self.previous_connection_state and current_state:
                with self.lock:
                    self.logs.clear()
                    self.interesting_events.clear()
                print("Device reconnected - cleared all previous logs")
            
            self.device_connected = current_state # Update the instance variable
            self.previous_connection_state = current_state # Store current state for next check
            return current_state
        except FileNotFoundError:
            print("ADB not found in path.")
            self.device_connected = False
            return False

    def start_logcat_monitor(self):
        """Starts a background thread to read logcat."""
        if self.monitoring:
            return
        self.monitoring = True
        self.monitor_thread = threading.Thread(target=self._read_logcat, daemon=True)
        self.monitor_thread.start()

    def _read_logcat(self):
        """Internal method to read logcat stream."""
        # clear buffer first
        subprocess.run(["adb", "logcat", "-c"])
        process = subprocess.Popen(
            ["adb", "logcat", "-v", "time"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            errors='replace' # Fix UnicodeDecodeError crash
        )
        
        while self.monitoring:
            line = process.stdout.readline()
            if not line:
                break
            
            # User requested "literally everything".
            # To prevent UI crash, we'll still buffer, but allow ALL non-empty lines through.
            line_str = line.strip()
            if not line_str:
                continue

            with self.lock:
                self.logs.append(line_str)
                if len(self.logs) > 2000:
                    self.logs.pop(0)
                
                # Push EVERYTHING to the feed.
                # The Dashboard will just scroll fast if it's spammy.
                self.interesting_events.append({
                    "timestamp": time.time(),
                    "raw": line_str,
                    "type": "system"
                })
                if len(self.interesting_events) > 500: # Increase buffer
                    self.interesting_events.pop(0)

    def get_interesting_events(self):
        with self.lock:
            # Return larger slice for continuous feel
            return list(self.interesting_events)[-100:]

    def get_latest_logs(self, n=100):
        with self.lock:
            return self.logs[-n:]

    def get_installed_packages(self):
        if not self.check_connection():
            return []
        try:
            result = subprocess.run(["adb", "shell", "pm", "list", "packages"], capture_output=True, text=True)
            packages = [line.replace("package:", "").strip() for line in result.stdout.split('\n') if line]
            return packages
        except:
            return []

    def extract_call_logs(self):
        """Extracts and parses call logs."""
        if not self.check_connection():
            return []
        try:
            # Primary: content query (more structured)
            result = subprocess.run(["adb", "shell", "content", "query", "--uri", "content://call_log/calls", "--projection", "number,date,duration,type"], capture_output=True, text=True, timeout=10)
            if "Row" in result.stdout:
                calls = []
                for line in result.stdout.split('\n'):
                    if "Row" in line:
                        match = re.search(r"number=(.*?), date=(.*?), duration=(.*?), type=(.*)", line)
                        if match:
                            calls.append({
                                "number": match.group(1),
                                "date": match.group(2),
                                "duration": match.group(3),
                                "type": match.group(4)
                            })
                return calls
            
            # Fallback: dumpsys
            result = subprocess.run(["adb", "shell", "dumpsys", "call_log"], capture_output=True, text=True, timeout=5)
            # Basic parsing if needed
            return [{"raw": result.stdout[:500]}] if result.stdout.strip() else []
        except Exception as e:
            print(f"Call extraction error: {e}")
            return []

    def extract_sms_logs(self):
        """Extracts and parses SMS logs."""
        if not self.check_connection():
            return []
        try:
            result = subprocess.run(["adb", "shell", "content", "query", "--uri", "content://sms", "--projection", "address,date,body,type"], capture_output=True, text=True, timeout=10)
            if "Row" in result.stdout:
                messages = []
                for line in result.stdout.split('\n'):
                    if "Row" in line:
                        match = re.search(r"address=(.*?), date=(.*?), body=(.*?), type=(.*)", line)
                        if match:
                            messages.append({
                                "address": match.group(1),
                                "date": match.group(2),
                                "body": match.group(3),
                                "type": match.group(4)
                            })
                return messages
            return []
        except Exception as e:
            print(f"SMS extraction error: {e}")
            return []

    def extract_system_logs(self, limit=100):
        """Extracts security-relevant system events for timeline."""
        if not self.check_connection():
            return []
        try:
            # Get latest logcat with timestamps
            result = subprocess.run(["adb", "logcat", "-d", "-t", str(limit)], capture_output=True, text=True, timeout=5)
            events = []
            for line in result.stdout.split('\n'):
                if not line.strip(): continue
                # Basic classification
                etype = "system"
                if any(x in line.lower() for x in ["auth", "login", "password"]): etype = "user"
                elif any(x in line.lower() for x in ["socket", "connect", "http", "ip"]): etype = "network"
                
                events.append({
                    "timestamp": line[:18].strip(), # Approx timestamp from -v time
                    "description": line[18:].strip(),
                    "type": etype
                })
            return events
        except Exception as e:
             print(f"System extraction error: {e}")
             return []

    def stop(self):
        self.monitoring = False

adb_bridge = ADBBridge()

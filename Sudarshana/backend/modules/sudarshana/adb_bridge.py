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

    def check_connection(self):
        """Checks if a device is connected via ADB."""
        try:
            result = subprocess.run(["adb", "devices"], capture_output=True, text=True)
            output = result.stdout.strip()
            # Look for a device that is not 'List of devices attached'
            lines = output.split('\n')
            for line in lines[1:]:
                if line.strip() and "device" in line:
                    self.device_connected = True
                    return True
            self.device_connected = False
            return False
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

    def stop(self):
        self.monitoring = False

adb_bridge = ADBBridge()

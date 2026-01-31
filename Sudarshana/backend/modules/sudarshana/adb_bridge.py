import subprocess
import shlex
import threading
import time
import re

class ADBBridge:
    def __init__(self):
        self.device_connected = False
        self.logs = []
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
            text=True
        )
        
        while self.monitoring:
            line = process.stdout.readline()
            if not line:
                break
            with self.lock:
                self.logs.append(line.strip())
                if len(self.logs) > 1000: # Keep last 1000 lines
                    self.logs.pop(0)

    def get_latest_logs(self, n=50):
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

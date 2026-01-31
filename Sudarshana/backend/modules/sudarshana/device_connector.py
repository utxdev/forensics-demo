import logging
import subprocess
from typing import List, Optional, Dict
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DeviceConnector:
    """
    Manages connections to Android devices via ADB (Android Debug Bridge).
    Ported from Inderjaal for Sudarshana.
    """

    def __init__(self, adb_path: str = "adb"):
        self.adb_path = adb_path
        self.connected_device_serial = None

    def _run_adb_command(self, args: List[str], timeout: int = 10) -> str:
        """
        Executes an ADB command and returns the output.
        """
        cmd = [self.adb_path] + args
        try:
            # logger.debug(f"Executing: {' '.join(cmd)}")
            # Using timeout to prevent hanging commands
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
            if result.returncode != 0:
                 # logger.error(f"ADB Error {result.returncode}: {result.stderr}")
                 pass
            return result.stdout.strip()
        except subprocess.TimeoutExpired:
            logger.error("ADB Command Timed Out")
            return ""
        except Exception as e:
            logger.error(f"ADB Execution Failed: {e}")
            return ""

    def list_devices(self) -> List[Dict[str, str]]:
        """
        Returns a list of connected devices with their details.
        """
        output = self._run_adb_command(["devices", "-l"])
        devices = []
        lines = output.split('\n')
        for line in lines[1:]:
            parts = line.split()
            if len(parts) >= 2:
                serial = parts[0]
                state = parts[1]
                details = " ".join(parts[2:])
                devices.append({
                    "serial": serial,
                    "state": state,
                    "details": details
                })
        return devices

    def connect(self, serial: Optional[str] = None) -> bool:
        """
        Establishes a connection to a specific device. 
        """
        devices = self.list_devices()
        if not devices:
            self.connected_device_serial = None
            return False

        if serial:
            target = next((d for d in devices if d['serial'] == serial), None)
            if target:
                self.connected_device_serial = serial
                return target['state'] == 'device'
        elif len(devices) >= 1:
            # Auto-connect to first valid device
             for d in devices:
                 if d['state'] == 'device':
                     self.connected_device_serial = d['serial']
                     return True
             # If all unauthorized
             self.connected_device_serial = devices[0]['serial']
             return False
        
        return False

    def shell(self, command: str) -> str:
        """
        Runs a shell command on the connected device.
        """
        if not self.connected_device_serial:
            # Try auto-reconnect
            if not self.connect():
                return ""
        
        return self._run_adb_command(["-s", self.connected_device_serial, "shell", command])

    def get_device_info(self) -> Dict[str, str]:
        if not self.connected_device_serial: return {}
        try:
            return {
                'model': self.shell("getprop ro.product.model"),
                'manufacturer': self.shell("getprop ro.product.manufacturer"),
                'android_version': self.shell("getprop ro.build.version.release")
            }
        except: return {}

device_connector = DeviceConnector()

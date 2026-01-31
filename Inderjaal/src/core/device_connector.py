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
    """

    def __init__(self, adb_path: str = "adb"):
        self.adb_path = adb_path
        self.connected_device_serial = None

    def _run_adb_command(self, args: List[str]) -> str:
        """
        Executes an ADB command and returns the output.
        """
        cmd = [self.adb_path] + args
        try:
            logger.debug(f"Executing: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            logger.error(f"ADB Command Failed: {e.stderr}")
            return ""
        except FileNotFoundError:
            logger.error(f"ADB executable not found at '{self.adb_path}'. Please install Android Platform Tools.")
            raise

    def list_devices(self) -> List[Dict[str, str]]:
        """
        Returns a list of connected devices with their details.
        """
        output = self._run_adb_command(["devices", "-l"])
        devices = []
        lines = output.split('\n')
        # Skip the first line usually "List of devices attached"
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
        If no serial is provided and only one device is connected, it connects to that one.
        """
        devices = self.list_devices()
        if not devices:
            logger.warning("No devices detected.")
            return False

        if serial:
            # Check if specified device is available
            target_device = next((d for d in devices if d['serial'] == serial), None)
            if not target_device:
                logger.error(f"Device with serial {serial} not found.")
                return False
            self.connected_device_serial = serial
        elif len(devices) == 1:
            # Auto-connect to simple single device
            self.connected_device_serial = devices[0]['serial']
        else:
            logger.warning("Multiple devices found. Please specify a serial.")
            return False

        # Verify connection state
        state = self.get_device_state()
        if state == 'device':
            logger.info(f"Successfully connected to {self.connected_device_serial}")
            return True
        elif state == 'unauthorized':
            logger.warning("Device is unauthorized. Please check the screen on the Android device and allow USB debugging.")
            return False
        else:
            logger.warning(f"Device state is '{state}'.")
            return False

    def get_device_state(self) -> str:
        """
        Gets the state of the currently marked 'connected' device.
        """
        if not self.connected_device_serial:
            return "unknown"
        
        devices = self.list_devices()
        for d in devices:
            if d['serial'] == self.connected_device_serial:
                return d['state']
        return "disconnected"

    def get_device_info(self) -> Dict[str, str]:
        """
        Retrieves basic device information (Model, Android Version, etc.)
        """
        if not self.connected_device_serial:
            return {}

        props = {}
        # Get common properties
        try:
            props['model'] = self.shell("getprop ro.product.model")
            props['manufacturer'] = self.shell("getprop ro.product.manufacturer")
            props['android_version'] = self.shell("getprop ro.build.version.release")
            props['sdk_version'] = self.shell("getprop ro.build.version.sdk")
        except Exception as e:
            logger.error(f"Failed to get device info: {e}")

        return props

    def shell(self, command: str) -> str:
        """
        Runs a shell command on the connected device.
        """
        if not self.connected_device_serial:
            raise RuntimeError("No device connected.")
        
        return self._run_adb_command(["-s", self.connected_device_serial, "shell", command])

    def pull_file(self, remote_path: str, local_path: str) -> bool:
        """
        Pulls a file from the device to the local system.
        """
        if not self.connected_device_serial:
            raise RuntimeError("No device connected.")
        
        logger.info(f"Pulling {remote_path} -> {local_path}")
        try:
             self._run_adb_command(["-s", self.connected_device_serial, "pull", remote_path, local_path])
             return True
        except Exception as e:
            logger.error(f"Failed to file pull: {e}")
            return False

if __name__ == "__main__":
    # Simple test
    connector = DeviceConnector()
    print("Devices:", connector.list_devices())

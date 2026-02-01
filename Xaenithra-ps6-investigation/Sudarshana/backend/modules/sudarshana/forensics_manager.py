import os
import subprocess
import zlib
import tarfile
import threading
import time
from modules.sudarshana.device_connector import device_connector

class ForensicsManager:
    def __init__(self):
        self.backup_status = "idle" # idle, waiting_for_device, running, extracting, completed, failed
        self.last_backup_path = None
        self.lock = threading.Lock()

    def trigger_backup(self, output_path="backup.ab"):
        """Triggers ADB backup and handles the flow in a background thread."""
        with self.lock:
            if self.backup_status in ["running", "waiting_for_device", "extracting"]:
                return False, "Backup already in progress"
            self.backup_status = "starting"
        
        thread = threading.Thread(target=self._run_backup_process, args=(output_path,))
        thread.start()
        return True, "Backup process started"

    def _run_backup_process(self, output_path):
        try:
            self._set_status("waiting_for_device")
            
            # Check connection first via DeviceConnector
            if not device_connector.connect():
                 self._set_status("failed", "No device connected")
                 return

            self._set_status("running", "Please accept backup on device...")
            
            # ADB Backup Command
            # Using -all -noapk -noshared for SPEED/DEMO purposes.
            # -shared is too slow for a quick demo.
            cmd = [device_connector.adb_path, "-s", device_connector.connected_device_serial, "backup", "-f", output_path, "-all", "-noapk", "-noshared"]
            
            print(f"Executing: {' '.join(cmd)}")
            
            # Use Popen to allow monitoring
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # Monitor loop
            while process.poll() is None:
                # Check file size
                if os.path.exists(output_path):
                    size = os.path.getsize(output_path) / (1024 * 1024) # MB
                    if size > 0:
                         self._set_status("running", f"Transferring data... ({size:.2f} MB)")
                time.sleep(1)
            
            # Finished
            if process.returncode != 0:
                self._set_status("failed", f"ADB Error: Return code {process.returncode}")
                return

            if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
                self._set_status("failed", "Backup file empty (Did you decline or timeout?)")
                return

            self._set_status("extracting", "Unpacking backup file...")
            extract_dir = "extracted_data"
            self._unpack_backup(output_path, extract_dir)
            
            self._set_status("completed", f"Data extracted to {extract_dir}")
            self.last_backup_path = extract_dir

        except Exception as e:
            print(f"Backup error: {e}")
            self._set_status("failed", str(e))

    def _unpack_backup(self, ab_path, output_dir):
        # Adapted from Inderjaal
        try:
            if os.path.exists(output_dir):
                import shutil
                shutil.rmtree(output_dir)
            os.makedirs(output_dir, exist_ok=True)
            
            with open(ab_path, 'rb') as f:
                # Read header lines like Inderjaal
                # Magic
                # Version
                # Compression
                # Encryption
                magic = f.readline() 
                version = f.readline()
                compression = f.readline()
                encryption = f.readline()

                tar_path = os.path.join(output_dir, "backup.tar")
                decompressor = zlib.decompressobj()
                
                with open(tar_path, 'wb') as tf:
                    while True:
                        chunk = f.read(1024 * 64)
                        if not chunk: break
                        tf.write(decompressor.decompress(chunk))
                    tf.write(decompressor.flush())
            
            # Extract Tar
            if os.path.exists(tar_path):
                 with tarfile.open(tar_path, 'r') as tar:
                    try:
                       tar.extractall(path=output_dir)
                    except Exception as e:
                        print(f"Tar extract warn: {e}") # Ignore some tar errors
                 os.remove(tar_path) # Cleanup tar

        except Exception as e:
            print(f"Unpack error: {e}")
            raise e

    def _set_status(self, status, message=None):
        with self.lock:
            self.backup_status = status
            self.status_message = message if message else status
            print(f"Forensics Status: {status} - {message}")

    def get_status(self):
        with self.lock:
            return {
                "status": self.backup_status,
                "message": getattr(self, "status_message", "")
            }

forensics_manager = ForensicsManager()

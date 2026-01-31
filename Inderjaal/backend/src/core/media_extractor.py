import logging
import os
from typing import List
from src.core.device_connector import DeviceConnector

logger = logging.getLogger(__name__)

class MediaExtractor:
    """
    Handles extraction of media files (Images, Videos) from Android external storage.
    """

    def __init__(self, device_connector: DeviceConnector):
        self.device = device_connector
        # Standard paths for media on Android
        self.target_paths = [
            "/sdcard/DCIM/Camera",
            "/sdcard/Pictures",
            "/sdcard/Download"
        ]

    def extract_all(self, output_dir: str = "extracted_media") -> List[str]:
        """
        Pulls standard media directories from the device.
        Returns a list of local paths where data was saved.
        """
        if not self.device.connected_device_serial:
            logger.error("No device connected for media extraction.")
            return []

        extracted_folders = []
        
        for remote_path in self.target_paths:
            folder_name = os.path.basename(remote_path)
            local_path = os.path.join(output_dir, folder_name)
            
            os.makedirs(output_dir, exist_ok=True)
            
            logger.info(f"Attempting to pull media from: {remote_path}")
            
            # Using adb pull -a to preserve attributes is often good for forensics
            # But standard pull is sufficient for MVP
            
            # We use the device connector's internal mechanism or raw command
            # DeviceConnector.pull_file is for single files usually, but adb pull works on dirs too.
            try:
                # We need to ensure the local parent dir exists, which we did.
                # adb pull /sdcard/DCIM/Camera local/path/Camera
                
                # Careful: 'adb pull /path/to/remote local_dir' creates local_dir/remote_basename
                result = self.device._run_adb_command(["-s", self.device.connected_device_serial, "pull", remote_path, output_dir])
                
                # Check if it actually worked (ADB output usually contains line with "pulled")
                if "pulled" in result or "transferred" in result or "file" in result: # Loose check
                    logger.info(f"Successfully pulled {remote_path}")
                    extracted_folders.append(local_path)
                else:
                    logger.warning(f"Pull might have failed or been empty for {remote_path}. Output: {result}")
                    
            except Exception as e:
                logger.error(f"Failed to pull {remote_path}: {e}")

        return extracted_folders

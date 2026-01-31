import logging
import os
import subprocess
import zlib
import tarfile
from src.core.device_connector import DeviceConnector

logger = logging.getLogger(__name__)

class BackupOrchestrator:
    """
    Manages the creation and extraction of Android Backups (.ab files).
    """

    def __init__(self, device_connector: DeviceConnector):
        self.device = device_connector

    def trigger_backup(self, package_list: list = None, shared: bool = True, output_path: str = "backup.ab") -> bool:
        """
        Triggers an ADB backup command.
        
        Args:
            package_list: List of package names to backup. If None, does -all.
            shared: Whether to include shared storage / SD card. (Defaults to True)
            output_path: Where to save the .ab file.
        """
        if not self.device.connected_device_serial:
            logger.error("No device connected for backup.")
            return False

        cmd = ["backup", "-f", output_path]
        
        # Flags
        # -noapk: Do not backup .apks themselves (saves space)
        # -noshared: Default is usually noshared, we might want shared for media
        cmd.append("-noapk")
        
        if shared:
            cmd.append("-shared")
        else:
            cmd.append("-noshared")

        if package_list:
            cmd.extend(package_list)
        else:
            cmd.append("-all")

        logger.info(f"Triggering backup... Check device screen to confirm. Output: {output_path}")
        try:
            # This blocking call waits for the backup to finish or timeout
            # Note: ADB backup interactions usually require user confirmation on screen
            # We use the device connector's internal _run_adb_command wrapper but we need access to it.
            # Ideally DeviceConnector should expose a method for this, but for now we construct it.
            
            # Since _run_adb_command captures output, it might block until backup is done.
            # On newer ADB versions, this is fine.
            self.device._run_adb_command(["-s", self.device.connected_device_serial] + cmd)
            
            if os.path.exists(output_path):
                logger.info(f"Backup created successfully at {output_path}")
                return True
            else:
                logger.error("Backup command finished but file was not created.")
                return False
                
        except Exception as e:
            logger.error(f"Backup failed: {e}")
            return False

    def unpack_backup(self, ab_path: str, output_dir: str = "extracted_data"):
        """
        Unpacks an Android Backup (.ab) file into a directory.
        Handles the 24-byte header and zlib compression.
        Does NOT support encrypted backups (yet).
        """
        if not os.path.exists(ab_path):
            logger.error(f"Backup file not found: {ab_path}")
            return

        try:
            with open(ab_path, 'rb') as f:
                header = f.read(24)
                magic = header[:9] # ANDROID BACKUP
                
                if magic != b'ANDROID B': # simple check
                    logger.warning(f"File might not be a valid ADB backup (Magic: {magic})")

                # The formatting of the header is:
                # Magic (24 bytes? No, line based usually)
                # Version
                # Compression
                # Encryption
                
                # Let's rewind and use a more robust parsing strategy compatible with 'ab2tar' logic
                f.seek(0)
                
                # Read valid header lines
                magic = f.readline().strip()
                version = f.readline().strip()
                compression = f.readline().strip()
                encryption = f.readline().strip()

                if magic != b"ANDROID BACKUP":
                    raise ValueError("Invalid ADB backup header")
                
                if encryption != b"none":
                    raise ValueError(f"Encrypted backups not supported. Encryption type: {encryption}")

                if compression != b"1":
                     logger.warning("Unknown compression type, attempting zlib anyway.")

                logger.info("Decompressing backup stream...")
                
                # The rest is the zlib stream
                # We need to decompress it. It is a deflate stream.
                
                os.makedirs(output_dir, exist_ok=True)
                
                tar_path = os.path.join(output_dir, "backup.tar")
                
                # Chunked decompression
                decompressor = zlib.decompressobj()
                with open(tar_path, 'wb') as tf:
                    while True:
                        chunk = f.read(1024 * 64)
                        if not chunk:
                            break
                        tf.write(decompressor.decompress(chunk))
                    tf.write(decompressor.flush())
                    
                logger.info(f"Decompressed to {tar_path}. Now extracting TAR...")
                
                with tarfile.open(tar_path, 'r') as tar:
                    tar.extractall(path=output_dir)
                    
                logger.info(f"Extraction complete in {output_dir}")

        except Exception as e:
            logger.error(f"Failed to unpack backup: {e}")


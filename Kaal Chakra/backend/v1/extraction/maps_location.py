import subprocess
import os
import zlib
import tarfile

def extract_location_via_backup():
    """
    Extracts location data using Android Backup of Google Maps app.
    Falls back to direct ADB pull if backup fails (requires root).
    Returns: (bool, str) -> (success, message)
    """
    extraction_path = os.path.join(os.getcwd(), 'extracted_data')
    os.makedirs(extraction_path, exist_ok=True)
    
    backup_file = os.path.join(extraction_path, 'maps_backup.ab')
    
    # Check for ADB connection
    try:
        devices = subprocess.check_output(['adb', 'devices']).decode()
        if 'device\n' not in devices and 'device\r' not in devices:
            return False, "No device connected. Please connect your Android device via USB."
    except Exception as e:
        return False, f"ADB check failed: {str(e)}"
    
    # Method 1: Try backup (works on older Android versions)
    print("Attempting Google Maps backup...")
    cmd = [
        'adb', 'backup',
        '-f', backup_file,
        '-noapk',
        '-noshared',
        'com.google.android.apps.maps'
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        
        if os.path.exists(backup_file) and os.path.getsize(backup_file) > 100:  # More than just header
            print(f"Backup created: {os.path.getsize(backup_file)} bytes")
            success, message = extract_maps_backup(backup_file)
            if success:
                return True, f"Location data extracted via backup. {message}"
        else:
            print("Backup too small or empty. Google Maps may block backups on this device.")
    except Exception as e:
        print(f"Backup method failed: {e}")
    
    # Method 2: Try direct pull (requires root)
    print("Attempting direct database pull (requires root)...")
    return extract_maps_direct_pull()

def extract_maps_direct_pull():
    """
    Directly pulls Google Maps database using ADB (requires root access).
    """
    extraction_path = os.path.join(os.getcwd(), 'extracted_data')
    
    # Possible database locations
    db_paths = [
        "/data/data/com.google.android.apps.maps/databases/da_destination_history",
        "/data/data/com.google.android.apps.maps/databases/gmm_storage.db",
        "/data/data/com.google.android.gms/databases/gmm_myplaces.db"
    ]
    
    found_dbs = []
    
    for remote_path in db_paths:
        db_name = os.path.basename(remote_path)
        local_path = os.path.join(extraction_path, db_name)
        
        try:
            # Try to pull the database
            result = subprocess.run(
                ['adb', 'pull', remote_path, local_path],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
                print(f"Successfully pulled: {db_name}")
                found_dbs.append(db_name)
        except Exception as e:
            print(f"Failed to pull {db_name}: {e}")
    
    if found_dbs:
        return True, f"Location databases pulled successfully: {', '.join(found_dbs)}"
    else:
        return False, "Could not extract location data. Device may not be rooted or Google Maps has no location history. Try using Google Takeout instead."

def extract_maps_backup(backup_file):
    """
    Extracts Google Maps backup file using the robust method from Inderjaal.
    """
    extraction_path = os.path.join(os.getcwd(), 'extracted_data', 'maps_extracted')
    os.makedirs(extraction_path, exist_ok=True)
    
    try:
        with open(backup_file, 'rb') as f:
            # Read header lines
            magic = f.readline().strip()
            version = f.readline().strip()
            compression = f.readline().strip()
            encryption = f.readline().strip()
            
            if magic != b'ANDROID BACKUP':
                return False, f"Invalid backup file format. Got: {magic}"
            
            if encryption != b'none':
                return False, f"Encrypted backups not supported. Encryption: {encryption}"
            
            print(f"Backup version: {version.decode()}, compression: {compression.decode()}, encryption: {encryption.decode()}")
            
            # Chunked decompression (more robust for large files)
            tar_path = os.path.join(extraction_path, 'backup.tar')
            
            if compression == b'1':
                print("Decompressing backup stream...")
                decompressor = zlib.decompressobj()
                with open(tar_path, 'wb') as tf:
                    while True:
                        chunk = f.read(1024 * 64)  # 64KB chunks
                        if not chunk:
                            break
                        tf.write(decompressor.decompress(chunk))
                    tf.write(decompressor.flush())
            else:
                # No compression
                with open(tar_path, 'wb') as tf:
                    tf.write(f.read())
            
            print(f"Extracting TAR archive...")
            with tarfile.open(tar_path, 'r') as tar:
                tar.extractall(path=extraction_path)
            
            # Clean up tar file
            os.remove(tar_path)
            
            # Find the location database
            import glob
            location_dbs = glob.glob(os.path.join(extraction_path, '**/da_destination_history'), recursive=True)
            
            if not location_dbs:
                # Try other database names
                location_dbs = glob.glob(os.path.join(extraction_path, '**/*gmm*.db'), recursive=True)
            
            if location_dbs:
                # Copy to main extraction folder
                import shutil
                dest = os.path.join(os.getcwd(), 'extracted_data', os.path.basename(location_dbs[0]))
                shutil.copy2(location_dbs[0], dest)
                print(f"Found location database at: {location_dbs[0]}")
                return True, f"Location database extracted: {dest}"
            else:
                # List what we found
                all_files = glob.glob(os.path.join(extraction_path, '**/*'), recursive=True)
                if all_files:
                    file_list = '\n'.join([f.replace(extraction_path, '') for f in all_files[:20]])
                    return False, f"Location database not found. Found files:\n{file_list}"
                else:
                    return False, "Backup is empty. Google Maps may not allow backups on this Android version."
            
    except Exception as e:
        return False, f"Extraction failed: {str(e)}"

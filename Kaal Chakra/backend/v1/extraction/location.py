import subprocess
import os
import json

def extract_location_data():
    """
    Extracts location data from Android device.
    Strategy:
    1. Try to pull Google Location databases (requires root/backup)
    2. Fallback: Pull photos and extract EXIF GPS data
    """
    extraction_path = os.path.join(os.getcwd(), 'extracted_data')
    os.makedirs(extraction_path, exist_ok=True)
    
    success_count = 0
    errors = []
    
    # Check for ADB connection
    try:
        devices = subprocess.check_output(['adb', 'devices']).decode()
        if 'device\n' not in devices and 'device\r' not in devices:
            return False, "No device connected or authorized."
    except Exception as e:
        return False, f"ADB check failed: {str(e)}"
    
    # Strategy 1: Try to pull location databases (may fail without root)
    location_dbs = [
        ("/data/data/com.google.android.gms/databases/gmm_myplaces.db", "gmm_myplaces.db"),
        ("/data/data/com.google.android.gms/databases/gmm_storage.db", "gmm_storage.db"),
    ]
    
    for remote_path, local_name in location_dbs:
        local_path = os.path.join(extraction_path, local_name)
        cmd = ['adb', 'pull', remote_path, local_path]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                success_count += 1
        except Exception as e:
            errors.append(f"Failed to pull {local_name}: {str(e)}")
    
    # Strategy 2: Pull photos from DCIM for EXIF extraction
    photos_path = os.path.join(extraction_path, 'photos')
    os.makedirs(photos_path, exist_ok=True)
    
    # List photos on device
    try:
        # Get list of recent photos (last 50)
        list_cmd = ['adb', 'shell', 'ls', '-t', '/sdcard/DCIM/Camera/*.jpg', '|', 'head', '-50']
        result = subprocess.run(list_cmd, capture_output=True, text=True, shell=False)
        
        # Alternative: Just pull the entire DCIM/Camera folder (limited)
        pull_cmd = ['adb', 'pull', '/sdcard/DCIM/Camera/', photos_path]
        result = subprocess.run(pull_cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            success_count += 1
        else:
            errors.append(f"Photo extraction: {result.stderr}")
            
    except Exception as e:
        errors.append(f"Photo extraction failed: {str(e)}")
    
    if success_count > 0:
        return True, f"Location extraction complete. Extracted {success_count} sources."
    else:
        return False, f"Location extraction failed. Errors: {'; '.join(errors)}"

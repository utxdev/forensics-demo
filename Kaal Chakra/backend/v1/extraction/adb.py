import subprocess
import os

def extract_data():
    """
    Pulls contacts2.db and mmssms.db from a connected Android device.
    Returns: (bool, str) -> (success, message)
    """
    extraction_path = os.path.join(os.getcwd(), 'extracted_data')
    os.makedirs(extraction_path, exist_ok=True)
    
    # List of files to attempt to pull
    # Note: These paths may vary by Android version / OEM.
    # We will try standard locations.
    files_to_pull = [
        ("/data/data/com.android.providers.contacts/databases/contacts2.db", "contacts2.db"),
        ("/data/data/com.android.providers.telephony/databases/mmssms.db", "mmssms.db")
    ]
    
    success_count = 0
    errors = []

    # Check for ADB connection
    try:
        devices = subprocess.check_output(['adb', 'devices']).decode()
        if 'device\n' not in devices and 'device\r' not in devices:
             return False, "No device connected or authorized."
    except Exception as e:
        return False, f"ADB check failed: {str(e)}"

    for remote_path, local_name in files_to_pull:
        local_path = os.path.join(extraction_path, local_name)
        cmd = ['adb', 'pull', remote_path, local_path]
        
        try:
            # Requires root or 'adb root' usually for /data/data access
            # Or use 'run-as' trick if possible, but usually for forensics we assume
            # some level of access or backup capability.
            # For this demo, let's assume we can try to pull directly or via a tmp path if root needed
            
            # Simple pull attempt
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                success_count += 1
            else:
                errors.append(f"Failed to pull {local_name}: {result.stderr}")
                
        except Exception as e:
            errors.append(f"Error pulling {local_name}: {str(e)}")

    if success_count > 0:
        return True, f"Successfully extracted {success_count} files."
    else:
        return False, f"Extraction failed. Errors: {'; '.join(errors)}"

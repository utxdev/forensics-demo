import subprocess
import os
import tarfile
import zlib

def create_android_backup():
    """
    Creates an Android backup using 'adb backup' command.
    This does NOT require USB debugging to be enabled.
    Returns: (bool, str) -> (success, message)
    """
    backup_path = os.path.join(os.getcwd(), 'extracted_data')
    os.makedirs(backup_path, exist_ok=True)
    
    backup_file = os.path.join(backup_path, 'backup.ab')
    
    # Check for ADB connection
    try:
        devices = subprocess.check_output(['adb', 'devices']).decode()
        if 'device\n' not in devices and 'device\r' not in devices:
            return False, "No device connected. Please connect your Android device via USB."
    except Exception as e:
        return False, f"ADB check failed: {str(e)}"
    
    # Create backup command
    # -f: output file
    # -noapk: don't backup APK files (faster)
    # Note: Removed -shared to speed up backup (photos handled separately)
    # Package names to backup
    packages = [
        'com.android.providers.contacts',  # Contacts & Call logs
        'com.android.providers.telephony', # SMS/MMS
    ]
    
    cmd = [
        'adb', 'backup',
        '-f', backup_file,
        '-noapk'
    ] + packages
    
    try:
        print(f"Creating Android backup... (User will see prompt on phone)")
        print(f"Command: {' '.join(cmd)}")
        
        # Run backup command with reduced timeout (60 seconds)
        # User will see a prompt on their phone to confirm backup
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        
        if os.path.exists(backup_file) and os.path.getsize(backup_file) > 0:
            return True, f"Backup created successfully: {backup_file}"
        else:
            return False, "Backup creation failed. User may have cancelled the prompt on phone."
            
    except subprocess.TimeoutExpired:
        return False, "Backup timed out. User may not have confirmed the prompt."
    except Exception as e:
        return False, f"Backup failed: {str(e)}"

def extract_backup_file(backup_file):
    """
    Extracts .ab (Android Backup) file to get the databases.
    Android backup format:
    - Line 1: "ANDROID BACKUP"
    - Line 2: Version (e.g., "5")
    - Line 3: Compression (0=none, 1=deflate)
    - Line 4: Encryption (none/AES-256)
    - Rest: Compressed tar archive (zlib if compression=1)
    """
    extraction_path = os.path.join(os.getcwd(), 'extracted_data', 'backup_extracted')
    os.makedirs(extraction_path, exist_ok=True)
    
    try:
        with open(backup_file, 'rb') as f:
            # Read first line to check header
            first_line = f.readline().decode('utf-8').strip()
            
            if first_line != 'ANDROID BACKUP':
                return False, f"Invalid backup file format. Expected 'ANDROID BACKUP', got '{first_line}'"
            
            # Read version, compression, encryption
            version = f.readline().decode('utf-8').strip()
            compression = f.readline().decode('utf-8').strip()
            encryption = f.readline().decode('utf-8').strip()
            
            print(f"Backup version: {version}, compression: {compression}, encryption: {encryption}")
            
            # Read the rest (compressed/uncompressed data)
            data = f.read()
            
            # Decompress if needed
            if compression == '1':
                try:
                    decompressed_data = zlib.decompress(data)
                except Exception as e:
                    return False, f"Decompression failed: {str(e)}"
            else:
                decompressed_data = data
            
            # Write to temporary tar file
            tar_file = os.path.join(extraction_path, 'backup.tar')
            with open(tar_file, 'wb') as tar_f:
                tar_f.write(decompressed_data)
            
            # Extract tar file
            with tarfile.open(tar_file, 'r') as tar:
                tar.extractall(extraction_path)
            
            # Clean up tar file
            os.remove(tar_file)
            
            return True, f"Backup extracted to: {extraction_path}"
            
    except Exception as e:
        return False, f"Extraction failed: {str(e)}"

def process_backup():
    """
    Full backup workflow: create backup, extract it, and prepare for parsing.
    """
    # Step 1: Create backup
    success, message = create_android_backup()
    if not success:
        return False, message
    
    backup_file = os.path.join(os.getcwd(), 'extracted_data', 'backup.ab')
    
    # Step 2: Extract backup
    success, message = extract_backup_file(backup_file)
    if not success:
        return False, message
    
    # Step 3: Locate databases in extracted backup
    extraction_path = os.path.join(os.getcwd(), 'extracted_data', 'backup_extracted')
    
    # Search for database files recursively
    import glob
    extracted_data_path = os.path.join(os.getcwd(), 'extracted_data')
    found_dbs = []
    
    # Look for contacts database
    contacts_files = glob.glob(os.path.join(extraction_path, '**/contacts2.db'), recursive=True)
    if contacts_files:
        import shutil
        shutil.copy2(contacts_files[0], os.path.join(extracted_data_path, 'contacts2.db'))
        found_dbs.append('contacts2.db')
        print(f"Found contacts2.db at: {contacts_files[0]}")
    
    # Look for SMS/MMS database
    sms_files = glob.glob(os.path.join(extraction_path, '**/mmssms.db'), recursive=True)
    if sms_files:
        import shutil
        shutil.copy2(sms_files[0], os.path.join(extracted_data_path, 'mmssms.db'))
        found_dbs.append('mmssms.db')
        print(f"Found mmssms.db at: {sms_files[0]}")
    
    # Also check for backup files (some Android versions use different names)
    sms_backup_files = glob.glob(os.path.join(extraction_path, '**/*sms_backup'), recursive=True)
    mms_backup_files = glob.glob(os.path.join(extraction_path, '**/*mms_backup'), recursive=True)
    
    if sms_backup_files or mms_backup_files:
        print(f"Found SMS/MMS backup files: {len(sms_backup_files)} SMS, {len(mms_backup_files)} MMS")
        found_dbs.append('sms/mms backups')
    
    if found_dbs:
        return True, f"Backup processed successfully. Found: {', '.join(found_dbs)}"
    else:
        # List what we did find
        all_files = glob.glob(os.path.join(extraction_path, '**/*'), recursive=True)
        file_list = '\n'.join([f.replace(extraction_path, '') for f in all_files[:20]])
        return False, f"No standard databases found. Backup may use different format. Found files:\n{file_list}"

import argparse
import sys
import os
import logging
from src.core.device_connector import DeviceConnector

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("InderjaalCLI")

def main():
    parser = argparse.ArgumentParser(description="Inderjaal: Android Foresnic Data Extraction Utility")
    parser.add_argument("--list", action="store_true", help="List connected Android devices")
    parser.add_argument("--connect", type=str, help="Connect to a specific device by Serial")
    parser.add_argument("--info", action="store_true", help="Get information about the connected device")
    parser.add_argument("--extract", type=str, choices=['calls', 'sms', 'location', 'media'], help="Extract specific artifacts (calls, sms, location, media)")
    parser.add_argument("--report", action="store_true", help="Generate HTML report from extracted data")
    parser.add_argument("--gui", action="store_true", help="Launch the Desktop GUI (Web Interface)")
    
    args = parser.parse_args()

    connector = DeviceConnector()

    if args.list:
        devices = connector.list_devices()
        if not devices:
            print("No devices found.")
        else:
            print(f"{'Serial':<20} {'State':<15} {'Details'}")
            print("-" * 60)
            for dev in devices:
                print(f"{dev['serial']:<20} {dev['state']:<15} {dev['details']}")
        return

    # Check for connection
    connected = False
    if args.connect:
        connected = connector.connect(args.connect)
    else:
        # Auto connect if possible
        connected = connector.connect()

    if not connected and not args.gui:
        logger.error("Could not establish connection to any device. Exiting.")
        return
    elif not connected and args.gui:
        logger.warning("No device connected at startup. GUI mode will start in detached state.")

    if args.info:
        info = connector.get_device_info()
        print("\n[ Device Information ]")
        for k, v in info.items():
            print(f"{k.capitalize()}: {v}")
            
    # Extraction Workflow
    from src.core.backup_manager import BackupOrchestrator
    
    if args.extract:
        # 1. Handle Media (Direct Pull)
        if args.extract == 'media':
            from src.core.media_extractor import MediaExtractor
            print("\n[ Starting Media Extraction ]")
            extractor = MediaExtractor(connector)
            folders = extractor.extract_all()
            if folders:
                print(f"\n[SUCCESS] Media extracted to: {folders}")
            else:
                print("\n[INFO] No media extracted or device not connected.")
            return

        # 2. Handle Backup-based Extraction (Calls, SMS, Location)
        from src.core.backup_manager import BackupOrchestrator
        backup_mgr = BackupOrchestrator(connector)
        
        packages = []
        target_db = None
        parser_class = None
        
        if args.extract == 'calls':
            packages = ['com.android.providers.contacts']
            target_db = "databases/calllog.db"
            from src.parsers.contacts_parser import ContactsParser
            parser_class = ContactsParser
            
        elif args.extract == 'sms':
            packages = ['com.android.providers.telephony']
            target_db = "databases/mmssms.db"
            from src.parsers.sms_parser import SMSParser
            parser_class = SMSParser

        elif args.extract == 'location':
            packages = ['com.google.android.apps.maps']
            target_db = "databases/da_destination_history" 
            from src.parsers.location_parser import LocationParser
            parser_class = LocationParser
        
        else:
            logger.error(f"Unknown extraction target: {args.extract}")
            return

        print(f"\n[ Starting Extraction for {args.extract.upper()} ]")
        print("1. Triggering ADB Backup (Please unlock device and confirm backup)...")
        
        backup_file = "temp_backup.ab"
        # shared=False is critical for speed, but might miss some data if apps store DBs on SD card (rare for these apps)
        if backup_mgr.trigger_backup(package_list=packages, shared=False, output_path=backup_file):
            print("2. Unpacking Backup...")
            extract_dir = "extracted_sessions"
            # user might want a fresh start
            import shutil
            if os.path.exists(extract_dir):
                shutil.rmtree(extract_dir)

            backup_mgr.unpack_backup(backup_file, output_dir=extract_dir)
            
            # Find the database file
            found_db = None
            for root, dirs, files in os.walk(extract_dir):
                for file in files:
                    # Loose matching
                    if file == os.path.basename(target_db) or file in ["contacts2.db", "mmssms.db", "gmm_my_places.db"]:
                        found_db = os.path.join(root, file)
                        break
            
            if found_db:
                print(f"3. Parsing Database: {found_db}")
                parser = parser_class(found_db)
                if parser.connect():
                    data = []
                    filename = "extracted_data.json"
                    
                    if args.extract == 'calls':
                        data = parser.get_call_logs()
                        filename = "call_logs.json"
                    elif args.extract == 'sms':
                        data = parser.get_messages()
                        filename = "sms_messages.json"
                    elif args.extract == 'location':
                        data = parser.get_location_history()
                        filename = "location_history.json"
                    
                    import json
                    with open(filename, 'w') as f:
                        json.dump(data, f, indent=4, default=str)
                    print(f"\n[SUCCESS] Extracted {len(data)} items to {filename}")
                    
                    # Hashing
                    from src.utils.hashing import log_integrity
                    log_integrity(filename)
                else:
                    logger.error("Failed to connect to extracted database.")
            else:
                logger.error(f"Target database {target_db} not found in backup extraction.")
                print("[DEBUG] Listing extracted files to help identify the issue:")
                found_any = False
                for root, dirs, files in os.walk(extract_dir):
                    for file in files:
                        print(f" - {os.path.join(root, file)}")
                        found_any = True
                if not found_any:
                    print(" - (Directory is empty. Backup likely failed to get data. This happens on Android 12+ if allowBackup=false)")
        else:
            logger.error("Backup failed or was cancelled.")

    # Reporting
    if args.report:
        from src.reporting.report_generator import ReportGenerator
        print("\n[ Generating Report ]")
        reporter = ReportGenerator()
        report_path = reporter.generate_html_report()
        print(f"[SUCCESS] Report available at: {report_path}")
        from src.utils.hashing import log_integrity
        log_integrity(report_path)

    # GUI Mode
    if args.gui:
        print("\n[ Starting Inderjaal Desktop Backend ]")
        print("API Server running at http://localhost:5000")
        from src.api.server import run_server
        run_server()


if __name__ == "__main__":
    main()

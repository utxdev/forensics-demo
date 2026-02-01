import sys
import os
sys.path.append(os.path.abspath('backend/python_engine'))
# Also add the backend directory itself if needed, or adjust imports
sys.path.append(os.path.abspath('backend'))

try:
    print("Attempting to import ADBBridge...")
    from python_engine.pipeline_wrapper import ADBBridge
    import json
    print("Initializing ADBBridge...")
    bridge = ADBBridge()
    print("Calling get_device_details...")
    details = bridge.get_device_details()
    print(json.dumps(details))
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

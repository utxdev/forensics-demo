import sys
import os
sys.path.append(os.path.abspath('backend/python_engine'))
try:
    from python_engine.pipeline_wrapper import ADBBridge
    import json
    bridge = ADBBridge()
    details = bridge.get_device_details()
    print(json.dumps(details))
except Exception as e:
    print(e)

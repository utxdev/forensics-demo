import os
import sys

print("=========================================")
print("   DIVYA DRISHTI BACKEND DIAGNOSTIC")
print("=========================================")

# 1. Check Python Version
print(f"[CHECK] Python Version: {sys.version.split()[0]}")

# 2. Check Dependencies
print("\n[CHECK] Dependencies:")
required = ['fastapi', 'uvicorn', 'python-multipart', 'httpx', 'python-dotenv']
missing = []
for pkg in required:
    try:
        __import__(pkg.replace('-', '_'))
        print(f"  [OK] {pkg}")
    except ImportError:
        print(f"  [MISSING] {pkg}")
        missing.append(pkg)

if missing:
    print("\n[ERROR] Missing dependencies! Please run:")
    print("pip install -r requirements.txt")
    print("pip install python-dotenv")
    sys.exit(1)

# 3. Check Environment Variables
print("\n[CHECK] Environment Configuration:")
try:
    from dotenv import load_dotenv
    if os.path.exists(".env"):
        print("  [OK] .env file found")
        load_dotenv()
    else:
        print("  [ERROR] .env file NOT found!")
except Exception as e:
    print(f"  [ERROR] Failed to load .env: {e}")

# 4. Check API Key
api_key = os.environ.get("VT_API_KEY")
if api_key:
    masked_key = api_key[:4] + "*" * (len(api_key)-8) + api_key[-4:] if len(api_key) > 8 else "****"
    print(f"  [OK] API Key Loaded: {masked_key}")
else:
    print("  [ERROR] VT_API_KEY is missing or empty!")

# 5. Check Module Imports
print("\n[CHECK] Application Modules:")
try:
    from analysis.virustotal import get_vt_analysis
    print("  [OK] analysis.virustotal imported")
except ImportError as e:
    print(f"  [ERROR] Failed to import analysis modules: {e}")
except SyntaxError as e:
    print(f"  [ERROR] Syntax error in code: {e}")

print("\n=========================================")
if not missing and api_key:
    print("   STATUS: READY TO START")
else:
    print("   STATUS: ISSUES DETECTED")
print("=========================================")

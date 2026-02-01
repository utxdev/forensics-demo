import os
import sys
import platform
import subprocess
import time
import webbrowser
import threading


def get_python_cmd(path):
    """
    Returns the python command to use. 
    Prioritizes venv/bin/python or venv/Scripts/python.
    Falls back to sys.executable.
    """
    venv_path = os.path.join(path, "venv")
    if os.path.exists(venv_path):
        if platform.system() == "Windows":
             py_path = os.path.join(venv_path, "Scripts", "python.exe")
        else:
             py_path = os.path.join(venv_path, "bin", "python")
        
        if os.path.exists(py_path):
            return py_path
            
    return sys.executable

def install_dependencies(path, req_file="requirements.txt"):
    print(f"[INIT] Installing dependencies for {path}...")
    py_cmd = get_python_cmd(path)
    subprocess.run([py_cmd, "-m", "pip", "install", "-r", req_file], cwd=path, check=False)

def install_node_deps(path):
    print(f"[INIT] Installing Node modules for {path}...")
    # operating system specific npm command
    npm_cmd = "npm.cmd" if platform.system() == "Windows" else "npm"
    subprocess.run([npm_cmd, "install"], cwd=path, check=False)

def open_terminal(cmd, title, cwd):
    system = platform.system()
    
    if system == "Windows":
        # Windows: start "Title" cmd /k "command"
        full_cmd = f'start "{title}" cmd /k "cd /d {cwd} && {cmd}"'
        subprocess.run(full_cmd, shell=True)
        
    elif system == "Darwin":
        # macOS: osascript to open Terminal
        apple_script = f'''
        tell application "Terminal"
            do script "cd \\"{cwd}\\" && {cmd}"
            activate
        end tell
        '''
        subprocess.run(["osascript", "-e", apple_script])
        
    elif system == "Linux":
        # Linux: try gnome-terminal, xterm, or konsole
        # This is basic support; sophisticated linux users usually know how to run things.
        try:
            subprocess.run(["gnome-terminal", "--", "bash", "-c", f"cd '{cwd}'; {cmd}; exec bash"])
        except:
            try:
                 subprocess.run(["xterm", "-e", f"cd '{cwd}'; {cmd}; exec bash"])
            except:
                print(f"[WARN] Automatic terminal launch not supported for this Linux distro. Please run manually: in {cwd} run '{cmd}'")

def main():
    print("="*60)
    print("      TRINETRA FORENSIC SUITE - UNIVERSAL LAUNCHER")
    print("="*60)
    
    base_dir = os.getcwd()
    inderjaal_dir = os.path.join(base_dir, "Inderjaal", "backend")
    sudarshana_dir = os.path.join(base_dir, "Sudarshana", "backend")
    frontend_dir = os.path.join(base_dir, "chitragupta", "frontend")

    # 1. Install Dependencies (Blocking)
    print("\n[STEP 1/4] Checking Python Dependencies...")
    install_dependencies(inderjaal_dir)
    install_dependencies(sudarshana_dir)
    
    print("\n[STEP 2/4] Checking Frontend Dependencies...")
    install_node_deps(frontend_dir)
    
    # 2. Launch Services
    print("\n[STEP 3/4] Launching Services...")
    
    # Indrajaal
    py_inderjaal = get_python_cmd(inderjaal_dir)
    print(" [+] Starting Indrajaal (Extraction Engine)...")
    open_terminal(f"{py_inderjaal} main.py --gui", "Trinetra: Indrajaal Core", inderjaal_dir)
    
    # Sudarshana
    py_sudarshana = get_python_cmd(sudarshana_dir)
    print(" [+] Starting Sudarshana (Threat Engine)...")
    open_terminal(f"{py_sudarshana} main.py", "Trinetra: Sudarshana Core", sudarshana_dir)
    
    # Frontend (Use system specific npm)
    npm_run = "npm.cmd run dev" if platform.system() == "Windows" else "npm run dev"
    print(" [+] Starting Chitragupta (Interface)...")
    open_terminal(npm_run, "Trinetra: Interface", frontend_dir)
    
    # 3. Open Browser
    print("\n[STEP 4/4] Opening Dashboard...")
    print("Wait for frontend to compile (approx 5-10s)...")
    time.sleep(8)
    webbrowser.open("http://localhost:8080")
    
    print("\n[SUCCESS] Trinetra is running.")
    print("Press Enter to exit this launcher (services will keep running).")
    input()

if __name__ == "__main__":
    main()

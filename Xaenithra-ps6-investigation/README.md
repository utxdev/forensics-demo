# Trinetra Forensic Suite - Xaenithra Edition

**Trinetra** is a unified, cyber-vedic mobile forensics platform designed for rapid extraction, timeline reconstruction, and automated threat defense.

![Trinetra Hub](https://github.com/utxdev/Xaenithra-ps6-investigation/assets/placeholder.png)

## 🚀 Quick Start (One-Click)

We have included a unified launcher for Windows.

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/utxdev/Xaenithra-ps6-investigation.git
    cd Xaenithra-ps6-investigation
    ```

2.  **Run the System (Universal)**
    ```bash
    python run_trinetra.py
    ```
    *(Works on Windows, macOS, and Linux)*

    *This script will automatically:*
    *   Install all Python & Node dependencies.
    *   Launch all 3 required terminals (Extraction, Threat Engine, UI).
    *   Open your browser to the Dashboard.

    *Note for Windows Users: You can still double-click `start_trinetra.bat` if you prefer.*

---

## 🏗️ Manual Setup

If you prefer to run modules manually:

### 1. Indrajaal (Extraction Core)
```bash
cd Inderjaal/backend
pip install -r requirements.txt
python main.py --gui
```

### 2. Sudarshana (Threat Defense)
```bash
cd Sudarshana/backend
pip install -r requirements.txt
python main.py
```

### 3. Chitragupta (Interface)
```bash
cd chitragupta/frontend
npm install
npm run dev
```

**Access**: [http://localhost:8080](http://localhost:8080)

## 📦 Modules

*   **Indrajaal**: ADB-based artifact extraction (SMS, Calls, Location).
*   **Kaal Chakra**: Timeline visualization and correlation engine.
*   **Sudarshana**: Real-time malware detection powered by VirusTotal.
*   **Chitragupta**: Automated reporting and case file generation.

## ⚠️ Requirements
*   Python 3.10+
*   Node.js 18+
*   ADB (Android Debug Bridge) installed and in PATH.

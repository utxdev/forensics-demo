# TRINETRA - Digital Forensics Investigation Suite

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.8%2B-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)
![Flutter](https://img.shields.io/badge/Flutter-3.10%2B-blue)

**A comprehensive digital forensics investigation suite with real-time threat detection, evidence extraction, and tamper-proof reporting**

[Features](#features) • [Architecture](#architecture) • [Installation](#installation) • [Usage](#usage) • [Documentation](#documentation)

</div>

---

## 🎯 Overview

TRINETRA is an integrated digital forensics platform inspired by ancient Vedic concepts, designed to provide law enforcement, cybersecurity professionals, and digital forensics investigators with a powerful toolkit for Android device analysis, evidence collection, and forensic reporting. The suite combines real-time threat detection, cryptographically-verified evidence extraction, and immersive timeline visualization in a unified interface.

### Key Capabilities

- **Real-time Android device monitoring and threat detection**
- **Secure, tamper-proof evidence extraction and chain-of-custody**
- **Advanced image forensics with steganography detection**
- **Multi-dimensional forensic timeline visualization**
- **Cryptographically signed forensic reports with RSA-4096**

---

## 🛡️ Core Modules

### 1. **Sudarshana** - Real-Time Threat Detection

The "All-Seeing Eye" of the suite provides live monitoring and threat assessment for connected Android devices.

**Features:**
- Real-time network packet capture and analysis
- Live logcat monitoring and anomaly detection
- ML-based threat scoring engine
- Device integrity verification
- Behavioral analysis and usage pattern detection
- Remote attack simulation for penetration testing

**Tech Stack:**
- Backend: Python (FastAPI, Scapy, scikit-learn, YARA)
- Frontend: React + TypeScript (Vite, Framer Motion)
- Real-time: WebSocket communication

**Quick Start:**
```bash
# Backend
cd Sudarshana/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py

# Frontend
cd ../frontend
npm install
npm run dev
```

Access at: `http://localhost:8080`

---

### 2. **Inderjaal** - Forensic Data Extraction

The "Divine Net" captures and extracts critical forensic artifacts from Android devices with full chain-of-custody preservation.

**Features:**
- Call logs extraction with metadata
- SMS/MMS message recovery
- Location history tracking
- Media file extraction (photos, videos)
- ADB backup orchestration
- SHA-256 hash integrity verification
- Automated report generation

**Tech Stack:**
- Backend: Python (ADB, SQLite parsing)
- Frontend: React + TypeScript
- Mobile: Flutter (Android)
- CLI: Python argparse

**Quick Start:**
```bash
# Backend
cd Inderjaal/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python src/api/server.py

# Frontend
cd ../frontend
npm install
npm run dev

# CLI Usage
python main.py --list                    # List connected devices
python main.py --extract calls           # Extract call logs
python main.py --extract sms             # Extract SMS messages
python main.py --extract location        # Extract location history
python main.py --extract media           # Extract media files
python main.py --report                  # Generate HTML report
```

---

### 3. **Divya Drishti** - Image & Media Forensics

The "Divine Vision" provides advanced image analysis and forensic examination capabilities.

**Features:**
- EXIF metadata extraction
- Multi-hash calculation (MD5, SHA-1, SHA-256)
- Steganography detection using LSB analysis
- Face detection and recognition
- VirusTotal integration for malware scanning
- Hex viewer for binary analysis
- Access logging and audit trails

**Tech Stack:**
- Backend: Python (FastAPI, Pillow, OpenCV)
- Frontend: Flutter (Web, Mobile, Desktop)
- Analysis: Pillow, python-magic, VirusTotal API

**Quick Start:**
```bash
# Backend
cd "Divya Drishti/backend"
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Frontend (Web)
cd ../frontend-web
npm install
npm run dev

# Mobile App
cd ../frontend
flutter pub get
flutter run
```

**Configuration:**
Create `.env` file in backend directory:
```env
VIRUSTOTAL_API_KEY=your_api_key_here
```

---

### 4. **Kaal Chakra** - Forensic Timeline Visualization

The "Wheel of Time" provides immersive, multi-dimensional visualization of forensic timelines.

**Features:**
- **Circular View**: Cosmic wheel visualization with radial timeline
- **Linear View**: Traditional horizontal timeline with zoom/pan
- **Heatmap View**: Temporal activity density analysis
- **Map View**: Geographic distribution of events (Leaflet integration)
- Multi-source event correlation (7+ data sources)
- Interactive 3D visualizations (Three.js)
- Event filtering and search capabilities

**Tech Stack:**
- React + TypeScript
- D3.js for data visualization
- Three.js / React Three Fiber for 3D graphics
- Leaflet for mapping
- Zustand for state management
- Framer Motion for animations

**Quick Start:**
```bash
cd "Kaal Chakra"
npm install
npm run dev
```

Access at: `http://localhost:5173`

---

### 5. **Chitragupta** - Forensic Report Generator

The "Divine Scribe" creates tamper-proof, legally-admissible forensic reports with cryptographic verification.

**Features:**
- SHA-256 hash verification for all evidence files
- RSA-4096 digital signatures for legal admissibility
- Merkle tree construction for chain-of-custody
- QR code generation for quick verification
- Professional PDF report generation
- Karma Seal animation (visual tamper-evidence)
- Timestamp verification via NTP

**Tech Stack:**
- Backend: Node.js + Express + TypeScript (node-forge, Multer)
- Frontend: React + TypeScript (jsPDF, QRCode.js)
- Cryptography: RSA-4096, SHA-256, Merkle trees

**Quick Start:**
```bash
# Backend
cd chitragupta/backend
npm install
npx tsc && node dist/server.js

# Frontend
cd ../frontend
npm install
npm run dev
```

Access at: `http://localhost:8080`

**API Endpoints:**
- `POST /api/upload` - Upload and hash forensic files
- `POST /api/generate-report` - Generate signed forensic report
- `GET /health` - Server health check

---

### 6. **APP_UI** - Unified Mobile Dashboard

Cross-platform mobile application providing unified access to all TRINETRA modules.

**Features:**
- Integrated navigation between all modules
- Real-time device status monitoring
- Evidence extraction workflows
- Timeline visualization
- Report generation and sharing
- Material Design with custom theming

**Tech Stack:**
- Flutter (iOS, Android, macOS, Windows, Linux, Web)
- Riverpod for state management
- Flutter Animate for animations
- HTTP client for backend communication

**Quick Start:**
```bash
cd APP_UI
flutter pub get
flutter run  # Will prompt to select target platform
```

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      TRINETRA Suite                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Sudarshana  │  │  Inderjaal   │  │ Divya Drishti│     │
│  │   (Monitor)  │  │  (Extraction)│  │  (Analysis)  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│         ┌──────────────────▼──────────────────┐             │
│         │     Kaal Chakra (Visualization)     │             │
│         └──────────────────┬──────────────────┘             │
│                            │                                │
│         ┌──────────────────▼──────────────────┐             │
│         │   Chitragupta (Report Generator)    │             │
│         └──────────────────┬──────────────────┘             │
│                            │                                │
│         ┌──────────────────▼──────────────────┐             │
│         │      APP_UI (Unified Interface)     │             │
│         └─────────────────────────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Installation

### System Requirements

- **Python**: 3.8 or higher
- **Node.js**: 18 or higher
- **Flutter**: 3.10 or higher
- **ADB (Android Debug Bridge)**: For device connectivity
- **Operating System**: macOS, Linux, or Windows

### Prerequisites

```bash
# Install ADB (Platform-specific)
# macOS
brew install android-platform-tools

# Ubuntu/Debian
sudo apt-get install android-tools-adb

# Windows
# Download from https://developer.android.com/studio/releases/platform-tools
```

### Complete Installation

```bash
# Clone the repository
git clone https://github.com/utxdev/forensics-demo.git
cd forensics-demo

# Install all backend dependencies
cd Sudarshana/backend && pip install -r requirements.txt && cd ../..
cd "Divya Drishti/backend" && pip install -r requirements.txt && cd ../..
cd Inderjaal/backend && pip install -r requirements.txt && cd ../..

# Install all frontend dependencies
cd Sudarshana/frontend && npm install && cd ../..
cd chitragupta/frontend && npm install && cd ../..
cd chitragupta/backend && npm install && cd ../..
cd "Kaal Chakra" && npm install && cd ..
cd Inderjaal/frontend && npm install && cd ../..

# Install Flutter dependencies
cd APP_UI && flutter pub get && cd ..
```

---

## 📖 Usage

### Typical Investigation Workflow

#### 1. **Device Connection & Monitoring**
```bash
# Enable USB debugging on Android device
# Connect device via USB

# Start Sudarshana for real-time monitoring
cd Sudarshana/backend && python main.py &
cd ../frontend && npm run dev
```

#### 2. **Evidence Extraction**
```bash
# Extract call logs
cd Inderjaal
python main.py --extract calls

# Extract SMS messages
python main.py --extract sms

# Extract location history
python main.py --extract location

# Extract media files
python main.py --extract media
```

#### 3. **Image Analysis**
```bash
# Start Divya Drishti backend
cd "Divya Drishti/backend"
python main.py &

# Access web interface for image upload and analysis
```

#### 4. **Timeline Visualization**
```bash
# Start Kaal Chakra
cd "Kaal Chakra"
npm run dev

# View extracted events in multiple visualization modes
```

#### 5. **Report Generation**
```bash
# Start Chitragupta
cd chitragupta/backend && npx tsc && node dist/server.js &
cd ../frontend && npm run dev

# Upload evidence files and generate signed PDF report
```

---

## 🔒 Security & Chain of Custody

TRINETRA implements multiple layers of evidence integrity verification:

1. **SHA-256 Hashing**: All extracted files are immediately hashed
2. **Merkle Tree**: Chain-of-custody verification structure
3. **RSA-4096 Signatures**: Legally-admissible cryptographic signing
4. **Timestamp Verification**: NTP-synchronized timestamps
5. **QR Code Verification**: Quick validation mechanism
6. **Audit Logging**: Complete access logs for all operations

### Verification Process

```bash
# All evidence files include verification metadata
# Example verification file structure:
{
  "filename": "evidence.db",
  "sha256": "abc123...",
  "timestamp": "2026-01-31T23:04:44Z",
  "rsa_signature": "xyz789...",
  "merkle_root": "def456...",
  "chain_of_custody": [...]
}
```

---

## 🧪 Testing

### Unit Tests
```bash
# Python modules
cd Sudarshana/backend && pytest
cd "Divya Drishti/backend" && pytest
cd Inderjaal/backend && pytest

# Node.js modules
cd chitragupta/backend && npm test
cd chitragupta/frontend && npm test

# Flutter
cd APP_UI && flutter test
```

---

## 📝 Documentation

### API Documentation

- **Sudarshana API**: `http://localhost:8000/docs` (FastAPI auto-generated)
- **Divya Drishti API**: `http://localhost:8000/docs`
- **Inderjaal API**: `http://localhost:5000/docs`
- **Chitragupta API**: See `chitragupta/README.md`

### Module-Specific Docs

- [Sudarshana Documentation](./Sudarshana/README.md)
- [Inderjaal Documentation](./Inderjaal/run%20code.md)
- [Divya Drishti Documentation](./Divya%20Drishti/README.md)
- [Kaal Chakra Documentation](./Kaal%20Chakra/README.md)
- [Chitragupta Documentation](./chitragupta/README.md)

---

## 🎨 Demo Scenario

The project includes a complete forensics investigation scenario (see [PITCH.md](./PITCH.md)):

**"The Ghost in the Machine"** - A biotech engineer's device is compromised by an elite data thief. Follow Detective Utkarsh as he uses TRINETRA to:
1. Detect the silent malware beacon using Sudarshana
2. Extract evidence using Inderjaal despite deletion attempts
3. Create a tamper-proof report with Chitragupta
4. Present undeniable evidence in court

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **Python**: Follow PEP 8, use Black formatter
- **TypeScript**: Use ESLint with provided config
- **Flutter/Dart**: Follow official Dart style guide

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## ⚠️ Legal Disclaimer

**IMPORTANT**: This tool is designed for lawful digital forensics investigations only. Users must:

- Obtain proper authorization before accessing any device
- Comply with local, state, and federal laws regarding digital forensics
- Maintain proper chain of custody for all evidence
- Only use these tools for legitimate forensic investigations

The developers assume no liability for misuse of this software.

---

## 🏆 Acknowledgments

- Inspired by ancient Vedic concepts of divine observation and truth preservation
- Built for digital forensics professionals and law enforcement
- Designed with legal admissibility and chain-of-custody as core principles

---

## 📧 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/utxdev/forensics-demo/issues)
- **Security Issues**: Report security vulnerabilities privately to the maintainers

---


---

<div align="center">

**Built with 🔒 for Digital Forensics Professionals**

*"Where ancient wisdom meets modern forensics"*

</div>

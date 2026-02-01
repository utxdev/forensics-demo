# CHITRAGUPTA - Divine Forensic Report Generator

A professional forensic report generation system with cryptographic verification, featuring:

- **SHA-256 Hash Verification**: Real-time cryptographic hashing of evidence files
- **RSA-4096 Digital Signatures**: Legally-admissible cryptographic signing
- **Merkle Tree Construction**: Chain-of-custody verification
- **QR Code Verification**: Quick validation of report authenticity
- **PDF Report Generation**: Professional forensic documentation

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- Shadcn UI
- Framer Motion (animations)
- jsPDF (PDF generation)
- QRCode (verification codes)

### Backend
- Node.js + Express
- TypeScript
- node-forge (RSA cryptography)
- Multer (file uploads)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/utxdev/forensics-demo.git
cd forensics-demo/Chitragupt
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

#### Option 1: Using Run Scripts (Recommended)

1. Make scripts executable:
```bash
chmod +x RUN_BACKEND.command RUN_FRONTEND.command
```

2. Start the backend:
```bash
./RUN_BACKEND.command
```

3. Start the frontend:
```bash
./RUN_FRONTEND.command
```

#### Option 2: Manual Startup

1. Start the backend server (from `backend/` directory):
```bash
npx tsc && node dist/server.js
```

2. Start the frontend dev server (from `frontend/` directory):
```bash
npm run dev
```

3. Open your browser to `http://localhost:8080`

## Features

### File Upload & Hashing
Upload forensic artifacts and receive immediate SHA-256 hash verification from the server.

### Report Generation
Generate comprehensive forensic reports with:
- Executive summary
- File integrity verification
- Timeline visualization
- Cryptographic signatures

### Karma Seal
Each report is sealed with a unique RSA-4096 digital signature, including:
- Timestamp from NTP server
- Public key fingerprint
- QR code for quick verification

### PDF Export
Download professionally formatted PDF reports with embedded signatures and QR codes.

### Forensic Scanner (NEW)
Advanced device file system analysis tool:
- **Recursive Scanning**: Deep file system traversal with configurable depth
- **File Type Filtering**: Filter by images, videos, audio, documents, databases, archives, APKs
- **Hash Calculation**: Optional SHA-256 hashing for all found files
- **Metadata Extraction**: File size, permissions, timestamps
- **Export Capabilities**: JSON and CSV export for analysis
- **Bulk Operations**: Select and extract multiple files

## API Endpoints

- `GET /health` - Server health check
- `POST /api/upload` - Upload and hash forensic files
- `POST /api/generate-report` - Generate signed forensic report
- `GET /api/data-pipeline/handshake` - Device handshake (Stage 1)
- `GET /api/device/files` - List device files
- `POST /api/data-pipeline/pull` - Extract file from device (Stage 2)
- `POST /api/forensic-scan` - Comprehensive device scan (NEW)

## License

MIT

## Author

Chitragupta Forensics Team

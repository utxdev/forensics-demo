import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { CryptoService } from './services/crypto.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Storage Setup
const uploadDir = path.join(__dirname, '../uploads');
const metadataFile = path.join(uploadDir, 'metadata.json');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage(); // Store in memory to hash immediately easily
const upload = multer({ storage });

interface ForensicFile {
    id: string;
    name: string;
    size: number;
    type: string;
    extractedAt: Date;
    currentHash: string;
    originalHash: string;
    verified: boolean;
    metadata: any;
}

// In-memory 'database' for this session
const uploadedFiles = new Map<string, ForensicFile>();

// Persistence functions
function loadMetadata() {
    try {
        if (fs.existsSync(metadataFile)) {
            const data = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));
            Object.entries(data).forEach(([id, file]) => {
                uploadedFiles.set(id, file as ForensicFile);
            });
            console.log(`✓ Loaded ${uploadedFiles.size} files from metadata`);
        }
    } catch (e) {
        console.error('Error loading metadata:', e);
    }
}

function saveMetadata() {
    try {
        const data = Object.fromEntries(uploadedFiles);
        fs.writeFileSync(metadataFile, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error saving metadata:', e);
    }
}

// Load on startup
loadMetadata();

// --- Routes ---

app.get('/health', (req, res) => {
    res.json({ status: 'Divine System Operational', timestamp: new Date() });
});

// Upload Endpoint
app.post('/api/upload', upload.array('files'), (req, res) => {
    try {
        const files = req.files as Express.Multer.File[];
        const processedFiles: ForensicFile[] = [];

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        files.forEach(file => {
            // Calculate REAL hash
            const hash = CryptoService.generateHash(file.buffer);
            const id = crypto.randomUUID();

            const forensicFile: ForensicFile = {
                id,
                name: file.originalname,
                size: file.size,
                type: file.mimetype,
                extractedAt: new Date(),
                currentHash: hash,
                originalHash: hash, // In a real scenario, this might come from a trusted source manifest
                verified: true,
                metadata: {
                    path: 'memory://' + file.originalname,
                    processedBy: 'Chitragupta Backend v1.0'
                }
            };

            uploadedFiles.set(id, forensicFile);
            processedFiles.push(forensicFile);
        });

        saveMetadata(); // Persist to disk
        res.json({ message: 'Artifacts received and hashed', files: processedFiles });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Report Generation Endpoint
app.post('/api/generate-report', async (req, res) => {
    try {
        const { fileIds, caseNumber, examiner } = req.body;

        // Retrieve files
        const selectedFiles: ForensicFile[] = [];
        const hashes: string[] = [];

        for (const id of fileIds) {
            const file = uploadedFiles.get(id);
            if (file) {
                selectedFiles.push(file);
                hashes.push(file.currentHash);
            }
        }

        // If no valid files from provided IDs, use ALL available files
        if (selectedFiles.length === 0 && uploadedFiles.size > 0) {
            console.log(`No valid file IDs provided, using all ${uploadedFiles.size} available files`);
            uploadedFiles.forEach(file => {
                selectedFiles.push(file);
                hashes.push(file.currentHash);
            });
        } else if (selectedFiles.length === 0) {
            console.log(`ERROR: No files in memory. uploadedFiles.size = ${uploadedFiles.size}`);
        }

        if (selectedFiles.length === 0) {
            return res.status(400).json({ error: 'No valid files selected for report' });
        }

        console.log(`Generating report for ${selectedFiles.length} files...`);

        // 1. Calculate Merkle Root
        const merkleRoot = CryptoService.calculateMerkleRoot(hashes);

        // 2. Generate Key Pair (Simulating Examiner's Digital ID)
        console.log('Generating 4096-bit RSA Keys...');
        const keyPair = await CryptoService.generateKeyPair();

        // 3. Create Data to Sign
        const reportData = {
            caseNumber,
            examiner,
            merkleRoot,
            fileCount: selectedFiles.length,
            timestamp: new Date().toISOString()
        };
        const dataString = JSON.stringify(reportData);

        // 4. Sign
        const signature = CryptoService.signData(dataString, keyPair.privateKey);
        const publicKeyFingerprint = 'SHA256:' + CryptoService.generateHash(keyPair.publicKey);

        // 5. Build Response
        const response = {
            reportId: crypto.randomUUID(),
            timestamp: new Date(),
            merkleRoot,
            signature,
            publicKeyFingerprint,
            algorithm: 'RSA-4096',
            ntpServer: 'time.nist.gov (Simulated)',
            verificationUrl: `http://localhost:3000/verify/${signature.slice(0, 10)}`
        };

        res.json(response);

    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ error: 'Failed to generate divine report' });
    }
});

// --- Pipeline ADB Routes ---

// Stage 1: Handshake (Python)
app.get('/api/data-pipeline/handshake', async (req, res) => {
    const { spawn } = await import('child_process');
    // Using a one-off python script to call the wrapper class method
    // We basically need to instantiate ADBBridge and call get_device_details
    const pythonScript = `
import sys
sys.path.append('${path.join(__dirname, '../python_engine')}')
from pipeline_wrapper import ADBBridge
import json

bridge = ADBBridge()
details = bridge.get_device_details()
print(json.dumps(details))
`;

    const pythonProcess = spawn('python3', ['-c', pythonScript]);

    let dataBuffer = '';
    pythonProcess.stdout.on('data', (data) => {
        dataBuffer += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        try {
            // Find the JSON part in stdout (ignore 'Device Handshake Complete' logs)
            const lines = dataBuffer.trim().split('\n');
            const jsonLine = lines[lines.length - 1];
            const details = JSON.parse(jsonLine);
            res.json(details || { connected: false });
        } catch (e) {
            res.status(500).json({ error: 'Handshake failed', raw: dataBuffer });
        }
    });
});

// Helper for listing files (keep using simple ADB shell for speed in browsing)
app.get('/api/device/files', async (req, res) => {
    const path = req.query.path as string || '/sdcard';
    const { exec } = await import('child_process');
    exec(`adb shell ls -p "${path}"`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr || 'ADB command failed' });
        }
        const entries = stdout.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => ({
                name: line,
                path: `${path.replace(/\/$/, '')}/${line}`,
                isDir: line.endsWith('/')
            }));
        res.json({ files: entries });
    });
});


// Stage 2: Extraction & Immediate Hash (Python)
app.post('/api/data-pipeline/pull', async (req, res) => {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: 'No file path provided' });

    const fileName = filePath.split('/').pop();
    const destPath = path.join(uploadDir, fileName);

    const { spawn } = await import('child_process');
    const pythonScript = `
import sys
sys.path.append('${path.join(__dirname, '../python_engine')}')
from pipeline_wrapper import ADBBridge
import json

bridge = ADBBridge()
result = bridge.pull_file_with_hash('${filePath}', '${destPath}')
print(json.dumps(result))
`;

    const pythonProcess = spawn('python3', ['-c', pythonScript]);

    let dataBuffer = '';
    pythonProcess.stdout.on('data', (data) => {
        dataBuffer += data.toString();
    });

    pythonProcess.on('close', (code) => {
        try {
            const lines = dataBuffer.trim().split('\n');
            const jsonLine = lines[lines.length - 1]; // Last line should be our JSON
            const result = JSON.parse(jsonLine);

            if (result.success && result.success !== 'False') { // Python might serialize True/False differently depending on dumps, usually true/false
                // Ingest into memory
                const buffer = fs.readFileSync(destPath);
                const id = crypto.randomUUID();

                const forensicFile: ForensicFile = {
                    id,
                    name: fileName,
                    size: fs.statSync(destPath).size,
                    type: 'application/octet-stream',
                    extractedAt: new Date(),
                    currentHash: result.hash,
                    originalHash: result.hash, // The Stage 2 Immediate Hash
                    verified: true,
                    metadata: {
                        path: 'device://' + filePath,
                        pullLog: result.logs,
                        custodyTimestamp: result.timestamp
                    }
                };
                uploadedFiles.set(id, forensicFile);
                saveMetadata(); // Persist to disk
                res.json({ message: 'Extraction Complete', file: forensicFile, details: result });
            } else {
                res.status(500).json({ error: result.error || 'Pull failed' });
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Pipeline Extraction Logic Failed', raw: dataBuffer });
        }
    });

});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

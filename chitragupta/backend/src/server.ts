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
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Storage Setup
const uploadDir = path.join(__dirname, '../uploads');
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

        if (selectedFiles.length === 0) {
            return res.status(400).json({ error: 'No valid files selected for report' });
        }

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

// --- ADB Routes ---

// Check device status
app.get('/api/device/status', async (req, res) => {
    // We can call generic adb devices command or use a python wrapper
    // For simplicity, let's spawn a quick check or use the python bridge status if we expose it via an API
    // Actually, let's use a simple shell command here for speed, or we could extend the python architecture
    // Since adb_bridge is a python script, we might want to interact with it via child_process or just run adb directly for simple things.
    // Let's run adb directly for status to be fast.
    const { exec } = await import('child_process');
    exec('adb devices', (error, stdout, stderr) => {
        if (error) {
            return res.json({ connected: false, error: stderr });
        }
        const lines = stdout.split('\n');
        let connected = false;
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].includes('device') && lines[i].trim().length > 0) {
                connected = true;
                break;
            }
        }
        res.json({ connected });
    });
});

// List files
app.get('/api/device/files', async (req, res) => {
    const path = req.query.path as string || '/sdcard';
    const { spawn } = await import('child_process');

    // We'll use a one-off python script execution or just adb shell ls
    // Let's try direct adb shell ls for simplicity and speed, parsing it similar to python
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

// Pull and ingest file
app.post('/api/device/pull', async (req, res) => {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: 'No file path provided' });

    const fileName = filePath.split('/').pop();
    const destPath = path.join(uploadDir, fileName);

    const { exec } = await import('child_process');
    exec(`adb pull "${filePath}" "${destPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error('Pull error:', stderr);
            return res.status(500).json({ error: 'Failed to pull file from device', details: stderr });
        }

        // Now ingest it into our forensic system (hash it, etc)
        try {
            const buffer = fs.readFileSync(destPath);
            const hash = CryptoService.generateHash(buffer);
            const id = crypto.randomUUID();

            const stats = fs.statSync(destPath);

            const forensicFile: ForensicFile = {
                id,
                name: fileName,
                size: stats.size,
                type: 'application/octet-stream', // Generic
                extractedAt: new Date(),
                currentHash: hash,
                originalHash: hash, // Assumed "original" as it came from device
                verified: true,
                metadata: {
                    path: 'device://' + filePath,
                    pullLog: stdout
                }
            };

            uploadedFiles.set(id, forensicFile);
            res.json({ message: 'File pulled and secured', file: forensicFile });

        } catch (err) {
            console.error('Ingestion error:', err);
            res.status(500).json({ error: 'Failed to ingest file after pull' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

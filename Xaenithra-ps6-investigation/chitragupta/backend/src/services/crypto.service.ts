import crypto from 'crypto';
import forge from 'node-forge';

export class CryptoService {
    /**
     * Generates a SHA-256 hash of a file buffer or string.
     */
    static generateHash(data: Buffer | string): string {
        const hash = crypto.createHash('sha256');
        hash.update(data);
        return hash.digest('hex');
    }

    /**
     * Generates a new RSA-4096 Key Pair.
     * This is a "heavy" operation, so we do it asynchronously.
     */
    static async generateKeyPair(): Promise<{ privateKey: string; publicKey: string }> {
        return new Promise((resolve, reject) => {
            forge.pki.rsa.generateKeyPair({ bits: 4096, workers: 2 }, (err, keypair) => {
                if (err) return reject(err);
                const privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
                const publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
                resolve({ privateKey, publicKey });
            });
        });
    }

    /**
     * Signs data with a private key.
     */
    static signData(data: string, privateKeyPem: string): string {
        const md = forge.md.sha256.create();
        md.update(data, 'utf8');
        const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
        const signature = privateKey.sign(md);
        return forge.util.encode64(signature);
    }

    /**
     * Calculates a Merkle Root from a list of hashes.
     */
    static calculateMerkleRoot(hashes: string[]): string {
        if (hashes.length === 0) return '';
        if (hashes.length === 1) return hashes[0];

        const newLevel: string[] = [];
        for (let i = 0; i < hashes.length; i += 2) {
            const left = hashes[i];
            const right = i + 1 < hashes.length ? hashes[i + 1] : left; // Duplicate last if odd
            const combined = this.generateHash(left + right);
            newLevel.push(combined);
        }
        return this.calculateMerkleRoot(newLevel);
    }
}

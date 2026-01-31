import React from 'react';
import { motion } from 'framer-motion';
import { HashIcon, TreeIcon, VerifiedIcon } from './icons/DivinityIcons';
import { ForensicFile } from '@/types/forensic';

interface HashVerificationProps {
  files: ForensicFile[];
  merkleRoot?: string;
  isVerifying?: boolean;
}

export const HashVerification: React.FC<HashVerificationProps> = ({
  files,
  merkleRoot,
  isVerifying = false,
}) => {
  const allVerified = files.every(f => f.verified);

  return (
    <div className="space-y-6">
      {/* Merkle Root Display */}
      {merkleRoot && (
        <div className="p-4 bg-muted/50 rounded-lg border border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <TreeIcon className="w-5 h-5 text-primary" />
            <span className="font-display text-sm text-primary">Report Integrity Hash (Merkle Root)</span>
          </div>
          <motion.div
            className="font-mono text-xs bg-card p-3 rounded border border-border break-all"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <code className="text-accent">{merkleRoot}</code>
          </motion.div>
          <div className="flex items-center gap-2 mt-3">
            <VerifiedIcon className={`w-4 h-4 ${allVerified ? 'text-primary' : 'text-destructive'}`} />
            <span className={`text-xs ${allVerified ? 'text-primary' : 'text-destructive'}`}>
              {allVerified ? 'All file hashes verified' : 'Hash verification failed'}
            </span>
          </div>
        </div>
      )}

      {/* File Hash Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/30 px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <HashIcon className="w-4 h-4 text-primary" />
            <span className="font-display text-sm">SHA-256 Hash Chain</span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {files.map((file, index) => (
            <motion.div
              key={file.id}
              className="p-4 hover:bg-muted/20 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-body text-sm text-foreground truncate">
                      {file.name}
                    </span>
                    {file.verified ? (
                      <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                        <VerifiedIcon className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                        Tampered
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20">Original:</span>
                      <code className="text-xs font-mono text-foreground/70 truncate">
                        {file.originalHash.slice(0, 32)}...
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20">Current:</span>
                      <code className={`text-xs font-mono truncate ${file.verified ? 'text-primary' : 'text-destructive'}`}>
                        {file.currentHash.slice(0, 32)}...
                      </code>
                    </div>
                  </div>
                </div>
                
                {isVerifying && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

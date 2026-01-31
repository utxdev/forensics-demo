import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X } from 'lucide-react';
import { ForensicFile } from '@/types/forensic';
import { Button } from '@/components/ui/button';

interface FileUploadZoneProps {
  onFilesAdded: (files: File[]) => void;
  existingFiles: ForensicFile[];
}

// Simulated hash generation (in real app, use crypto.subtle)
const generateHash = async (name: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(name + Date.now());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesAdded,
  existingFiles,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    onFilesAdded(droppedFiles);
  }, [onFilesAdded]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    onFilesAdded(selectedFiles);
    e.target.value = '';
  }, [onFilesAdded]);

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <motion.div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${isDragging
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.01 }}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <motion.div
          animate={{ y: isDragging ? -5 : 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="font-display text-lg mb-2">
            {isDragging ? 'Release to upload artifacts' : 'Drop forensic artifacts here'}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to browse files
          </p>
        </motion.div>

        {/* Decorative corner elements */}
        <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-primary/50" />
        <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-primary/50" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-primary/50" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary/50" />
      </motion.div>

      {/* Uploaded Files List */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>{existingFiles.length} artifact(s) loaded</span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
            {existingFiles.map((file, index) => (
              <motion.div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB • {file.type}
                  </p>
                </div>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${file.verified ? 'bg-primary' : 'bg-destructive'}`} />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

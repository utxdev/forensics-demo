export interface ForensicFile {
  id: string;
  name: string;
  size: number;
  type: string;
  extractedAt: Date;
  originalHash: string;
  currentHash: string;
  verified: boolean;
  metadata: FileMetadata;
}

export interface FileMetadata {
  created?: string;
  modified?: string;
  accessed?: string;
  path?: string;
  permissions?: string;
  owner?: string;
}

export interface HashNode {
  hash: string;
  left?: HashNode;
  right?: HashNode;
  data?: string;
}

export interface MerkleTree {
  root: string;
  nodes: HashNode[];
  leaves: string[];
}

export interface ForensicReport {
  id: string;
  caseNumber: string;
  examiner: string;
  createdAt: Date;
  status: 'generating' | 'complete' | 'verified' | 'signed';
  files: ForensicFile[];
  merkleRoot: string;
  karmaSeal?: KarmaSeal;
  executiveSummary?: string;
  timeline: TimelineEvent[];
}

export interface KarmaSeal {
  signature: string;
  algorithm: string;
  timestamp: Date;
  ntpServer: string;
  publicKeyFingerprint: string;
  verified: boolean;
  qrCodeDataUrl?: string;
}

export interface TimelineEvent {
  timestamp: Date;
  event: string;
  artifact: string;
  category: 'file' | 'network' | 'system' | 'user' | 'application';
  significance: 'low' | 'medium' | 'high' | 'critical';
}

export interface ReportGenerationState {
  phase: 'idle' | 'hashing' | 'analyzing' | 'generating' | 'signing' | 'complete';
  progress: number;
  currentFile?: string;
  message: string;
}

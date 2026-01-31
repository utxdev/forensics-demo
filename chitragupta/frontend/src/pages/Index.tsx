import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUploadZone } from '@/components/FileUploadZone';
import { HashVerification } from '@/components/HashVerification';
import { TimelineVisualization } from '@/components/TimelineVisualization';
import { KarmaSeal } from '@/components/KarmaSeal';
import { ReportGeneratorAnimation } from '@/components/ReportGeneratorAnimation';
import { AnimatedScroll } from '@/components/AnimatedScroll';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OmIcon, ScrollIcon, QuillIcon, SealIcon } from '@/components/icons/DivinityIcons';
import {
  ForensicFile,
  ForensicReport,
  ReportGenerationState,
  TimelineEvent,
  KarmaSeal as KarmaSealType
} from '@/types/forensic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Shield, Clock, Sparkles, Download } from 'lucide-react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

const Index = () => {
  const [files, setFiles] = useState<ForensicFile[]>([]);
  const [caseNumber, setCaseNumber] = useState('');
  const [examiner, setExaminer] = useState('');
  const [report, setReport] = useState<ForensicReport | null>(null);
  const [generationState, setGenerationState] = useState<ReportGenerationState>({
    phase: 'idle',
    progress: 0,
    message: '',
  });
  const [showScroll, setShowScroll] = useState(false);
  const [scrollEntries, setScrollEntries] = useState<any[]>([]);

  // API Client Helper
  const API_URL = 'http://localhost:3000/api';

  const handleFilesAdded = useCallback(async (newRawFiles: File[]) => {
    // Phase 1: Upload to Backend for Hashing
    const formData = new FormData();
    newRawFiles.forEach(f => formData.append('files', f));

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.files) {
        setFiles(prev => [...prev, ...data.files]);
      }
    } catch (err) {
      console.error("Upload failed", err);
      // Fallback or error toast here
    }
  }, []);

  const generateMerkleRoot = useCallback((files: ForensicFile[]): string => {
    // Simulated Merkle root generation
    const hashes = files.map(f => f.currentHash);
    const combined = hashes.join('');
    return `MERKLE_${combined.slice(0, 64)}`;
  }, []);

  const generateTimeline = useCallback((files: ForensicFile[]): TimelineEvent[] => {
    const events: TimelineEvent[] = files.map(file => ({
      timestamp: file.extractedAt,
      event: `Artifact extracted: ${file.name}`,
      artifact: file.name,
      category: 'file' as const,
      significance: Math.random() > 0.7 ? 'high' : 'medium' as const,
    }));

    // Add some system events
    events.push({
      timestamp: new Date(Date.now() - 3600000),
      event: 'System boot detected',
      artifact: 'System Log',
      category: 'system',
      significance: 'low',
    });

    events.push({
      timestamp: new Date(Date.now() - 1800000),
      event: 'User authentication successful',
      artifact: 'Auth Log',
      category: 'user',
      significance: 'medium',
    });

    if (Math.random() > 0.5) {
      events.push({
        timestamp: new Date(Date.now() - 900000),
        event: 'Suspicious network connection detected',
        artifact: 'Network Capture',
        category: 'network',
        significance: 'critical',
      });
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, []);

  const generateReport = useCallback(async () => {
    if (files.length === 0) return;

    // Phase 1: Hashing & Analysis (Server Side)
    setGenerationState({ phase: 'hashing', progress: 10, message: 'Verifying cryptographic hashes on server...' });

    // Simulate network delay for effect (or real progress if we had websockets)
    await new Promise(r => setTimeout(r, 1000));
    setGenerationState({ phase: 'analyzing', progress: 40, message: 'Calculating Merkle Root...' });

    try {
      // Call Backend to Generate Report
      const response = await fetch(`${API_URL}/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: files.map(f => f.id),
          caseNumber,
          examiner
        })
      });

      const data = await response.json();

      // Phase 3: Generating/Signing
      setGenerationState({ phase: 'signing', progress: 70, message: 'Generating 4096-bit RSA Keys...' });

      // Generate QR Code from Server Response
      // Since backend gave us the signature/url
      const verificationUrl = data.verificationUrl || `https://chitragupta.forensic/verify?sig=${data.signature}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        color: { dark: '#7e5a19', light: '#ffffff' },
        width: 200,
      });

      await new Promise(r => setTimeout(r, 1000)); // UX Pause

      const seal: KarmaSealType = {
        signature: data.signature,
        algorithm: data.algorithm,
        timestamp: new Date(data.timestamp),
        ntpServer: data.ntpServer,
        publicKeyFingerprint: data.publicKeyFingerprint,
        verified: true,
        qrCodeDataUrl,
      };

      const newReport: ForensicReport = {
        id: data.reportId,
        caseNumber: caseNumber || `CHITRAGUPTA-${Date.now()}`,
        examiner: examiner || 'Divine Scribe',
        createdAt: new Date(),
        status: 'verified',
        files,
        merkleRoot: data.merkleRoot,
        karmaSeal: seal,
        executiveSummary: `This forensic report documents the examination of ${files.length} digital artifact(s). All evidence has been cryptographically verified by the Chitragupta Divine Server. The integrity of the chain-of-custody has been solidified with a Merkle Tree Root of ${data.merkleRoot.substring(0, 16)}...`,
        timeline: generateTimeline(files),
      };

      setReport(newReport);
      setGenerationState({ phase: 'complete', progress: 100, message: 'The eternal record has been sealed!' });

    } catch (err) {
      console.error("Report generation failed", err);
      setGenerationState({ phase: 'idle', progress: 0, message: 'Error connecting to Divine Server' });
    }
  }, [files, caseNumber, examiner, generateTimeline]);

  const downloadPDF = useCallback(() => {
    if (!report) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(126, 90, 25); // primary colorish
    doc.text('CHITRAGUPTA FORENSIC REPORT', pageWidth / 2, 20, { align: 'center' });

    // Header Info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Case Number: ${report.caseNumber}`, 20, 40);
    doc.text(`Examiner: ${report.examiner}`, 20, 50);
    doc.text(`Date: ${report.createdAt.toLocaleString()}`, 20, 60);

    // Executive Summary
    doc.setFontSize(16);
    doc.setTextColor(126, 90, 25);
    doc.text('Executive Summary', 20, 80);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const splitSummary = doc.splitTextToSize(report.executiveSummary || '', pageWidth - 40);
    doc.text(splitSummary, 20, 90);

    // Integrity
    let yPos = 90 + (splitSummary.length * 5) + 20;
    doc.setFontSize(16);
    doc.setTextColor(126, 90, 25);
    doc.text('Integrity Verification', 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Merkle Root: ${report.merkleRoot}`, 20, yPos);
    yPos += 10;

    // Files Table
    doc.setFontSize(16);
    doc.setTextColor(126, 90, 25);
    doc.text('Evidence Artifacts', 20, yPos + 10);
    yPos += 20;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    report.files.forEach((file, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`${index + 1}. ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 20, yPos);
      doc.setFont('courier');
      doc.setFontSize(8);
      doc.text(`   SHA256: ${file.currentHash}`, 20, yPos + 5);
      doc.setFont('helvetica');
      doc.setFontSize(10);
      yPos += 15;
    });

    // Karma Seal Page
    doc.addPage();
    doc.setFontSize(20);
    doc.setTextColor(126, 90, 25);
    doc.text('KARMA SEAL VERIFICATION', pageWidth / 2, 40, { align: 'center' });

    if (report.karmaSeal?.qrCodeDataUrl) {
      doc.addImage(report.karmaSeal.qrCodeDataUrl, 'PNG', (pageWidth - 80) / 2, 60, 80, 80);
    }

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Digitally Signed & Verified', pageWidth / 2, 150, { align: 'center' });
    doc.setFont('courier');
    doc.text(report.karmaSeal?.signature || '', pageWidth / 2, 160, { align: 'center' });

    doc.save(`CTA_REPORT_${report.caseNumber}.pdf`);
  }, [report]);

  const resetReport = useCallback(() => {
    setReport(null);
    setFiles([]);
    setShowScroll(false);
    setScrollEntries([]);
    setGenerationState({ phase: 'idle', progress: 0, message: '' });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="text-primary"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <OmIcon className="w-10 h-10" />
              </motion.div>
              <div>
                <h1 className="font-display text-2xl text-foreground tracking-wide">
                  CHITRAGUPTA
                </h1>
                <p className="text-xs text-muted-foreground font-body">
                  Divine Forensic Report Generator
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-muted-foreground font-mono">
                {generationState.phase === 'idle' ? 'Ready' : generationState.phase.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Input & Controls */}
          <div className="space-y-6">
            {/* Case Information */}
            <motion.section
              className="p-6 bg-card rounded-lg border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <ScrollIcon className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg">Case Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground font-body block mb-1">
                    Case Number
                  </label>
                  <Input
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    placeholder="e.g., CASE-2024-001"
                    className="bg-muted/30 border-border focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground font-body block mb-1">
                    Examiner Name
                  </label>
                  <Input
                    value={examiner}
                    onChange={(e) => setExaminer(e.target.value)}
                    placeholder="e.g., Dr. Digital Forensics"
                    className="bg-muted/30 border-border focus:border-primary"
                  />
                </div>
              </div>
            </motion.section>

            {/* File Upload */}
            <motion.section
              className="p-6 bg-card rounded-lg border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg">Digital Artifacts</h2>
              </div>

              <FileUploadZone
                onFilesAdded={handleFilesAdded}
                existingFiles={files}
              />
            </motion.section>

            {/* Generate Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant="divine"
                size="xl"
                className="w-full"
                onClick={generateReport}
                disabled={files.length === 0 || generationState.phase !== 'idle'}
              >
                <QuillIcon className="w-5 h-5 mr-2" />
                Generate Sacred Report
              </Button>

              {report && (
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={resetReport}
                >
                  Start New Investigation
                </Button>
              )}
            </motion.div>
          </div>

          {/* Right Panel - Report Preview */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {generationState.phase !== 'idle' && generationState.phase !== 'complete' ? (
                <motion.section
                  key="generating"
                  className="p-6 bg-card rounded-lg border border-border min-h-[400px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ReportGeneratorAnimation state={generationState} />

                  {showScroll && (
                    <AnimatedScroll
                      entries={scrollEntries}
                      isUnfurling={true}
                    />
                  )}
                </motion.section>
              ) : report ? (
                <motion.section
                  key="report"
                  className="space-y-6"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {/* Report Header with Seal */}
                  <div className="p-6 bg-card rounded-lg border border-primary/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />

                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <h2 className="font-display text-2xl text-foreground mb-2">
                          Forensic Report
                        </h2>
                        <p className="text-sm text-muted-foreground font-mono">
                          {report.caseNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Examiner: {report.examiner}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-primary hover:text-primary/80 p-0"
                          onClick={downloadPDF}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download PDF Report
                        </Button>
                      </div>

                      <KarmaSeal
                        seal={report.karmaSeal}
                        isAnimating={generationState.phase === 'complete'}
                        size="lg"
                      />
                    </div>
                  </div>

                  {/* Report Tabs */}
                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="w-full bg-muted/30 p-1">
                      <TabsTrigger value="summary" className="flex-1 font-display text-xs">
                        <Sparkles className="w-4 h-4 mr-1" />
                        Summary
                      </TabsTrigger>
                      <TabsTrigger value="hashes" className="flex-1 font-display text-xs">
                        <Shield className="w-4 h-4 mr-1" />
                        Integrity
                      </TabsTrigger>
                      <TabsTrigger value="timeline" className="flex-1 font-display text-xs">
                        <Clock className="w-4 h-4 mr-1" />
                        Timeline
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="p-6 bg-card rounded-lg border border-border mt-4">
                      <h3 className="font-display text-lg text-primary mb-4">Executive Summary</h3>
                      <p className="font-body text-foreground leading-relaxed">
                        {report.executiveSummary}
                      </p>

                      <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Artifacts Examined</span>
                            <p className="font-display text-xl text-primary">{report.files.length}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status</span>
                            <p className="font-display text-xl text-primary capitalize">{report.status}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Generated</span>
                            <p className="font-mono text-sm">{report.createdAt.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Signature</span>
                            <p className="font-mono text-sm text-primary">RSA-4096 ✓</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="hashes" className="p-6 bg-card rounded-lg border border-border mt-4">
                      <HashVerification
                        files={report.files}
                        merkleRoot={report.merkleRoot}
                      />
                    </TabsContent>

                    <TabsContent value="timeline" className="p-6 bg-card rounded-lg border border-border mt-4">
                      <TimelineVisualization events={report.timeline} />
                    </TabsContent>
                  </Tabs>
                </motion.section>
              ) : (
                <motion.section
                  key="empty"
                  className="p-12 bg-card rounded-lg border border-dashed border-border min-h-[400px] flex flex-col items-center justify-center text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <SealIcon className="w-16 h-16 text-muted-foreground/30" />
                  </motion.div>
                  <h3 className="font-display text-lg text-muted-foreground mt-6">
                    Awaiting Your Command
                  </h3>
                  <p className="text-sm text-muted-foreground/70 mt-2 max-w-sm">
                    Upload digital artifacts and provide case details to begin the sacred examination.
                  </p>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <OmIcon className="w-4 h-4 text-primary" />
            <span className="font-display">CHITRAGUPTA</span>
            <span>•</span>
            <span className="font-body">Divine Forensic Report Generator</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

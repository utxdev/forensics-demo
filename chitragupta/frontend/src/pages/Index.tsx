import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PipelineWizard } from '@/components/PipelineWizard';
import { HashVerification } from '@/components/HashVerification';
import { TimelineVisualization } from '@/components/TimelineVisualization';
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
import { FileText, Shield, Sparkles } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { KarmaSeal } from '@/components/KarmaSeal';
import { toast } from 'sonner';

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

  // API Client Helper - Pipeline Backend Port
  const API_URL = 'http://localhost:3001/api';

  const handleDeviceFilePulled = useCallback((newFile: ForensicFile) => {
    setFiles(prev => [...prev, newFile]);
  }, []);

  const generateReport = async () => {
    if (!caseNumber || !examiner || files.length === 0) return;

    setGenerationState({ phase: 'hashing', progress: 0, message: 'Initiating Divine Verification...' });
    setShowScroll(true);

    try {
      // 1. Simulate Hashing Progress
      for (let i = 0; i <= 100; i += 20) {
        setGenerationState(prev => ({ ...prev, progress: i, message: `Verifying Artifact Integrity... ${i}%` }));
        await new Promise(r => setTimeout(r, 500));
      }

      // 2. Call Backend
      const res = await fetch(`${API_URL}/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: files.map(f => f.id),
          caseNumber,
          examiner
        })
      });

      const data = await res.json();

      // Check if response has error
      if (!res.ok || data.error) {
        console.error('Backend error:', data.error || data);
        setGenerationState({ phase: 'idle', progress: 0, message: 'Error: ' + (data.error || 'Unknown error') });
        toast.error('Report Generation Failed', {
          description: data.details || data.error || 'Unknown error'
        });
        return;
      }

      // Map backend response to ForensicReport format
      const forensicReport: ForensicReport = {
        id: data.reportId || crypto.randomUUID(),
        caseNumber,
        examiner,
        createdAt: new Date(data.timestamp),
        status: 'signed',
        files: files,
        merkleRoot: data.merkleRoot,
        karmaSeal: {
          signature: data.signature,
          algorithm: data.algorithm,
          timestamp: new Date(data.timestamp),
          ntpServer: data.ntpServer,
          publicKeyFingerprint: data.publicKeyFingerprint,
          verified: true
        },
        timeline: []
      };

      setReport(forensicReport);
      setGenerationState({ phase: 'complete', progress: 100, message: 'Report Generated' });

    } catch (err) {
      console.error('Report generation error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setGenerationState({
        phase: 'idle',
        progress: 0,
        message: 'Error: ' + errorMsg
      });
      toast.error('Report Generation Failed', {
        description: errorMsg + '. Check console for details.'
      });
    }
  };

  const downloadPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    doc.text(`Forensic Report: ${report.id}`, 20, 20);
    doc.text(`Case: ${report.caseNumber}`, 20, 30);
    doc.text(`Examiner: ${report.examiner}`, 20, 40);
    doc.text(`Merkle Root: ${report.merkleRoot}`, 20, 50);
    if (report.karmaSeal) {
      doc.text(`Signature: ${report.karmaSeal.signature.substring(0, 50)}...`, 20, 60);
    }
    doc.save(`forensic_report_${report.id}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary/20">

      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-background to-background pointer-events-none" />

      <main className="container mx-auto px-4 py-8 relative z-10">

        {/* Header */}
        <header className="mb-12 text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium"
          >
            <Shield className="w-4 h-4" />
            <span>Secure Forensic Pipeline</span>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Pipeline Project
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            3-Stage Evidence Acquisition System: From Cable to Court.
          </p>
        </header>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">

          {/* Left Column: Input & Pipeline */}
          <div className="lg:col-span-12 space-y-6">

            {/* Case Details */}
            <motion.section
              className="p-6 bg-card rounded-lg border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <QuillIcon className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg">Case Metadata</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Case Number (e.g., CF-2024-001)" value={caseNumber} onChange={e => setCaseNumber(e.target.value)} />
                <Input placeholder="Examiner Name" value={examiner} onChange={e => setExaminer(e.target.value)} />
              </div>
            </motion.section>

            {/* THE PIPELINE WIZARD */}
            <motion.section
              className="p-6 bg-card rounded-lg border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <OmIcon className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg">Data Acquisition Pipeline</h2>
              </div>

              <PipelineWizard onFilePulled={handleDeviceFilePulled} />
            </motion.section>

            {/* Evidence List */}
            {files.length > 0 && (
              <motion.div layout className="p-6 bg-card rounded-lg border border-border">
                <h3 className="font-bold mb-4">Secured Artifacts</h3>
                <div className="space-y-2">
                  {files.map(f => (
                    <div key={f.id} className="flex justify-between items-center bg-muted/30 p-3 rounded">
                      <span>{f.name}</span>
                      <span className="font-mono text-xs text-green-500">{f.currentHash.substring(0, 30)}...</span>
                    </div>
                  ))}
                </div>
                {/* Generate Report Button - Triggers final stage */}
                <div className="mt-4 flex justify-end">
                  <Button onClick={generateReport} disabled={files.length === 0 || !caseNumber || !examiner}>
                    {generationState.phase === 'idle' ? 'Finalize & Sign Chain of Custody' : 'Signing...'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Report View */}
            <AnimatePresence>
              {report && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 bg-card rounded-lg border border-border space-y-6"
                >
                  <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold">Forensic Report Generated</h2>
                    <p className="text-muted-foreground">Report ID: {report.id}</p>

                    {report.karmaSeal && (
                      <div className="flex justify-center my-6">
                        <KarmaSeal seal={report.karmaSeal} size="lg" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-left bg-muted/30 p-4 rounded">
                      <div>
                        <span className="text-xs text-muted-foreground">Case Number</span>
                        <p className="font-semibold">{report.caseNumber}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Examiner</span>
                        <p className="font-semibold">{report.examiner}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Files Analyzed</span>
                        <p className="font-semibold">{report.files.length}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Merkle Root</span>
                        <p className="font-mono text-xs">{report.merkleRoot.substring(0, 16)}...</p>
                      </div>
                    </div>

                    <Button onClick={downloadPDF} size="lg" className="w-full">
                      <FileText className="w-4 h-4 mr-2" />
                      Download PDF Report
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>
      </main>
    </div>
  );
};

export default Index;

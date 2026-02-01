import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Database, ShieldAlert, Clock, Eye, FileText,
  ArrowRight, Lock, Activity, ChevronRight
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const modules = [
    {
      id: 'indrajaal',
      title: 'INDRAJAAL',
      subtitle: 'Extraction Engine',
      desc: 'The Entry Point. Plug in the device and mine raw data like gold.',
      icon: Database,
      color: '#FFD700', // Gold
      route: '/indrajaal',
      active: true
    },
    {
      id: 'sudarshana',
      title: 'SUDARSHANA',
      subtitle: 'Threat Analysis',
      desc: 'The Security Guard. Instantly scans incoming data for malware and threats.',
      icon: ShieldAlert,
      color: '#FF4500', // OrangeRed
      route: '/sudarshana',
      active: true
    },
    {
      id: 'kaalchakra',
      title: 'KAAL CHAKRA',
      subtitle: 'Timeline Visualizer',
      desc: 'The Storyteller. Arranges evidence on a chronological wheel of time.',
      icon: Clock,
      color: '#00D9FF', // Cyan
      route: '/kaal-chakra',
      active: true
    },
    {
      id: 'divyadrishti',
      title: 'DIVYA DRISHTI',
      subtitle: 'Evidence Viewer',
      desc: 'The Vault. Read-only sandbox for inspecting sensitive files safely.',
      icon: Eye,
      color: '#00FF41', // Neon Green
      route: '/divya-drishti',
      active: true
    },
    {
      id: 'chitragupta',
      title: 'CHITRAGUPTA',
      subtitle: 'Report Generator',
      desc: 'The Exit. Packages the entire investigation into a sealed legal report.',
      icon: FileText,
      color: '#A020F0', // Purple
      route: '/chitragupta',
      active: true
    }
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans overflow-x-hidden relative selection:bg-indigo-500/30">

      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#101015_1px,transparent_1px),linear-gradient(to_bottom,#101015_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 pt-20 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-6 tracking-widest">
            <Activity size={12} /> TRINETRA FORENSIC SUITE v2.0
          </div>
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#FF9933] via-white to-[#138808] mb-4 font-display drop-shadow-[0_0_30px_rgba(255,153,51,0.3)]">
            TRINETRA
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-xl font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">
            DIGITAL ASSEMBLY LINE
          </p>
        </motion.div>
      </header>

      {/* The Assembly Line Cards */}
      <main className="relative z-10 container mx-auto px-4 pb-24">
        <div className="max-w-6xl mx-auto flex flex-col gap-8 md:gap-0 md:flex-row items-stretch justify-center relative">

          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-[#FF9933] via-white to-[#138808] opacity-50 -z-10 blur-[1px]" />

          {modules.map((mod, index) => {
            const Icon = mod.icon;
            return (
              <React.Fragment key={mod.id}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-1 relative group"
                >
                  {/* Card */}
                  <div
                    onClick={() => mod.active && navigate(mod.route)}
                    className={`
                                            h-full p-6 mx-2 rounded-xl border border-gray-800 bg-[#0A0A0E] 
                                            relative overflow-hidden transition-all duration-300
                                            ${mod.active
                        ? 'cursor-pointer hover:-translate-y-2 hover:border-gray-600 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]'
                        : 'cursor-not-allowed opacity-60 grayscale-[0.5]'
                      }
                                        `}
                  >
                    {/* Hover Glow */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                      style={{ background: `radial-gradient(circle at center, ${mod.color}15, transparent 70%)` }}
                    />

                    {/* Top Icon Area */}
                    <div className="mb-6 flex justify-between items-start">
                      <div
                        className="p-3 rounded-lg bg-black/50 border border-gray-800 group-hover:border-white/20 transition-colors"
                        style={{ color: mod.color }}
                      >
                        <Icon size={24} />
                      </div>
                      <span className="text-gray-600 text-[10px] font-mono">0{index + 1}</span>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-100 transition-colors">
                        {mod.title}
                      </h3>
                      <p className="text-xs uppercase tracking-wider font-mono opacity-70" style={{ color: mod.color }}>
                        {mod.subtitle}
                      </p>
                      <p className="text-sm text-gray-400 leading-snug mt-4">
                        {mod.desc}
                      </p>
                    </div>

                    {/* Footer Status */}
                    <div className="mt-6 pt-4 border-t border-gray-900 flex items-center justify-between text-xs font-mono">
                      {mod.active ? (
                        <span className="text-green-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> ONLINE
                        </span>
                      ) : (
                        <span className="text-gray-600 flex items-center gap-1">
                          <Lock size={10} /> LOCKED
                        </span>
                      )}
                      {mod.active && <ChevronRight size={14} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />}
                    </div>
                  </div>
                </motion.div>

                {/* Arrow Connector (except last item) */}
                {index < modules.length - 1 && (
                  <div className="hidden md:flex items-center justify-center w-8 -mx-4 relative z-0 opacity-30 text-gray-500">
                    <ArrowRight size={20} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </main>

      <footer className="absolute bottom-6 w-full text-center text-gray-600 text-xs font-mono">
        SECURE FORENSIC PIPELINE &copy; 2025 // AUTHORIZED PERSONNEL ONLY
      </footer>
    </div>
  );
};

export default Index;

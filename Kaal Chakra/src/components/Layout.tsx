import React from 'react';
import { Zap } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="relative w-screen h-screen overflow-hidden text-white flex flex-col">
            {/* Background Cyber Grid */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-[size:50px_50px] bg-cyber-grid" />

            {/* Header */}
            <header className="absolute top-0 left-0 w-full h-16 z-50 flex items-center justify-between px-6 pointer-events-none">
                <div className="flex items-center gap-3 glass-panel px-4 py-2 pointer-events-auto">
                    <div className="w-8 h-8 rounded bg-vedic-gold flex items-center justify-center text-black font-bold font-orbitron">
                        K
                    </div>
                    <div>
                        <h1 className="text-sm font-bold font-orbitron tracking-widest text-vedic-gold text-glow-gold">KAAL-CHAKRA</h1>
                        <div className="text-[9px] text-gray-400 font-mono tracking-widest uppercase">
                            Digital Forensics Suite v1.5
                        </div>
                    </div>
                </div>

                <div className="glass-panel px-4 py-2 flex items-center gap-4 text-xs font-mono text-neon-cyan pointer-events-auto">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span>SYSTEM ONLINE</span>
                    </div>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <div>
                        <Zap size={14} className="inline mr-1" />
                        CORE: STABLE
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full h-full relative z-10">
                {children}
            </main>

            {/* Footer */}
            <footer className="absolute bottom-4 right-6 z-50 pointer-events-none">
                <div className="text-[10px] text-white/20 font-mono text-right">
                    <div>CONFIDENTIAL // EYES ONLY</div>
                    <div>SESSION ID: {Math.random().toString(36).substring(7).toUpperCase()}</div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;

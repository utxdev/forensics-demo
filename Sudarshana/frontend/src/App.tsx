import React from 'react';
import SudarshanaDashboard from './components/Sudarshana/SudarshanaDashboard';
<<<<<<< Updated upstream
=======
// import ChitraguptaDashboard from './components/Chitragupta/ChitraguptaDashboard';
>>>>>>> Stashed changes

import { LayoutDashboard } from 'lucide-react';

function App() {
  return (
    <div className="w-screen h-screen flex overflow-hidden bg-[#050A18] text-white">
      {/* Sidebar navigation */}
      <div className="w-20 lg:w-64 border-r border-white/10 flex flex-col bg-black/40 backdrop-blur-md z-50">
        <div className="h-20 flex items-center justify-center border-b border-white/10">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-red-600 shadow-[0_0_15px_#f59e0b] animate-pulse"></div>
        </div>

        <nav className="flex-1 py-8 space-y-4">
          <button
            className="w-full p-4 flex items-center gap-4 transition-all bg-gradient-to-r from-blue-900/50 to-transparent border-l-4 border-cyan-400"
          >
            <LayoutDashboard size={24} />
            <span className="hidden lg:block font-bold tracking-widest">SUDARSHANA</span>
          </button>
        </nav>

        <div className="p-4 text-xs text-white/20 text-center font-mono hidden lg:block">
          SYS.VER.2026.1<br />CONNECTED
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050A18] to-[#050A18]">
        {/* Grid overlay for cyberpunk feel */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

<<<<<<< Updated upstream
        <SudarshanaDashboard />
=======
        {activeTab === 'sudarshana' ? <SudarshanaDashboard /> : <div className="flex h-full items-center justify-center text-white/50">Chitragupta Module Not Loaded</div>}
>>>>>>> Stashed changes
      </div>
    </div>
  );
}

export default App;

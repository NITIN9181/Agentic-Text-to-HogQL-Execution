import React, { ReactNode, useState } from 'react';
import { ImportModal } from './ImportModal';
import { Upload, Github, ExternalLink, Shield, Database, Activity } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const sessionId = "ad87fb2-p4x"; 

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d12] text-gray-100 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-[#0d0d12]/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <h1 className="text-lg font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
              AGENTIC TEXT-TO-HOGQL EXECUTION LOOP
            </h1>
            <div className="flex items-center gap-4 mt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  Agent: <span className="text-gray-300">NVIDIA GPT-OSS-120B</span>
                </span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                Status: <span className="text-emerald-500">Online</span>
              </span>
              <div className="w-px h-3 bg-white/10" />
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                Session: <span className="text-gray-400 font-mono tracking-normal lowercase">{sessionId}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Upload size={14} />
            Import Data
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-1" />
          
          <div className="flex items-center gap-1">
            <a 
              href="https://github.com/NITIN9181/Agentic-Text-to-HogQL-Execution" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-gray-300 transition-colors"
            >
              <Github size={18} />
            </a>
            <button className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-gray-300 transition-colors">
              <ExternalLink size={18} />
            </button>
          </div>
        </div>
      </header>

      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={() => console.log('Data imported successfully')}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Footer */}
      <footer className="h-10 border-t border-white/5 bg-[#0d0d12] px-6 flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-widest">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-emerald-500/70" />
            <span>Secure Sandboxed Environment</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5 text-gray-600">
            <Database size={12} />
            <span>ClickHouse v23.12 (OLAP)</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-700">Tech Stack:</span>
          <span className="text-gray-400">Python · FastAPI · React · ClickHouse · NVIDIA NIM</span>
        </div>
      </footer>
    </div>
  );
}

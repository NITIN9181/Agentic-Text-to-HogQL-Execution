import { ReactNode, useState } from 'react';
import { ImportModal } from './ImportModal';
import { Upload } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">
              🔍
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                HogQL Agent
              </h1>
              <p className="text-xs text-gray-500 font-medium tracking-wide">
                Natural Language → Product Analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-gray-200"
            >
              <Upload size={16} className="text-indigo-400" />
              Import Data
            </button>
            <div className="h-4 w-px bg-gray-800" />
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </header>

      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onSuccess={() => {
          // You could add a global notification system here if you had one
          console.log('Data imported successfully');
        }}
      />

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 bg-gray-900/30">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <p className="text-center text-xs text-gray-600">
            Powered by{' '}
            <span className="text-gray-400 font-medium">NVIDIA GPT-OSS-120B</span>
            {' • '}
            <span className="text-gray-400 font-medium">ClickHouse</span>
            {' • '}
            <span className="text-gray-400 font-medium">FastAPI</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

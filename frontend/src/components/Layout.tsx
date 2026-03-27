import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
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
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              ● Online
            </span>
          </div>
        </div>
      </header>

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

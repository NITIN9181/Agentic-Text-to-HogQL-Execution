import React from 'react';
import { Code, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface QueryViewerProps {
  query: string;
  iteration?: number;
}

export const QueryViewer: React.FC<QueryViewerProps> = ({ query, iteration = 1 }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!query) {
    return (
      <div className="dashboard-card h-full flex flex-col items-center justify-center opacity-30 gap-3 grayscale">
        <Code size={32} className="text-gray-400" />
        <span className="text-xs font-mono">Final query will appear here...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-card h-full flex flex-col bg-[#111118]">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Code size={14} className="text-indigo-400" />
          Final HogQL Query (v{iteration})
        </h3>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-all flex items-center gap-2"
          title="Copy to clipboard"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/5">
        <pre className="text-[13px] font-mono leading-relaxed group selection:bg-indigo-500/30">
          <code className="text-indigo-200">
            {query.split('\n').map((line, i) => {
              // Very basic syntax highlighting for common SQL keywords
              const highlightedLine = line.replace(
                /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|OFFSET|JOIN|AS|ON|AND|OR|IN|COUNT|SUM|AVG|MAX|MIN|HogQL)\b/gi,
                '<span class="text-indigo-400 font-bold">$1</span>'
              );
              return (
                <div key={i} className="flex gap-4">
                  <span className="text-gray-700 whitespace-pre select-none w-4 text-right">
                    {i + 1}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: highlightedLine }} />
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
};

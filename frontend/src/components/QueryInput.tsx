import { useState, KeyboardEvent } from 'react';
import { Play, Square, Sparkles } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isExecuting: boolean;
  onStop: () => void;
}

const EXAMPLE_QUERIES = [
  '7-day retention for mobile users',
  'Monthly active users trend',
  'Top 10 converted pages',
];

export function QueryInput({ onSubmit, isExecuting, onStop }: QueryInputProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (trimmed && !isExecuting) {
      onSubmit(trimmed);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="dashboard-card bg-[#111118] flex flex-col h-full border-white/5 shadow-2xl shadow-indigo-500/5 transition-all hover:border-white/10">
      <div className="p-4 border-b border-white/5">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <Sparkles size={14} className="text-indigo-400" />
          Describe your analytical query...
        </h3>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-4">
        <div className="relative flex-1 min-h-[140px]">
          <textarea
            id="query-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Calculate the 7-day retention rate for users who triggered 'App Error: 500' sequentially within a 3-hour window..."
            className="w-full h-full p-4 bg-black/40 border border-white/5 rounded-xl text-indigo-100 placeholder-gray-600 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all duration-300 font-medium leading-relaxed"
            disabled={isExecuting}
          />
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex gap-2">
            <button
              id="execute-button"
              onClick={handleSubmit}
              disabled={isExecuting || !query.trim()}
              className={cn(
                "group px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-300",
                isExecuting || !query.trim()
                  ? "bg-gray-800 text-gray-600 cursor-not-allowed border border-white/5"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 active:scale-95 border border-indigo-400/20"
              )}
            >
              {isExecuting ? (
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   Thinking...
                </div>
              ) : (
                <>
                  <Play size={14} fill="currentColor" className="group-hover:translate-x-0.5 transition-transform" />
                  Execute
                </>
              )}
            </button>

            {isExecuting && (
              <button
                id="stop-button"
                onClick={onStop}
                className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest rounded-xl border border-red-500/20 transition-all active:scale-95 flex items-center gap-2"
              >
                <Square size={13} fill="currentColor" />
                Clear
              </button>
            )}
            
            {!isExecuting && query.trim() && (
              <button
                onClick={() => setQuery('')}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 text-xs font-black uppercase tracking-widest rounded-xl border border-white/5 transition-all"
              >
                Clear
              </button>
            )}
          </div>

          <div className="hidden xl:flex items-center gap-1.5 opacity-50">
             {EXAMPLE_QUERIES.map((ex, i) => (
                <button 
                  key={i} 
                  onClick={() => setQuery(ex)}
                  className="w-2 h-2 rounded-full bg-gray-600 hover:bg-indigo-500 hover:scale-125 transition-all"
                  title={ex} 
                />
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

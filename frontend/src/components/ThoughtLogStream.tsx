import React, { useEffect, useRef } from 'react';
import { Terminal, Cpu, Database, AlertCircle, CheckCircle2, Search, Zap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Event {
  type: string;
  timestamp: string;
  [key: string]: any;
}

interface ThoughtLogStreamProps {
  events: Event[];
  isExecuting: boolean;
}

export const ThoughtLogStream: React.FC<ThoughtLogStreamProps> = ({ events, isExecuting }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const renderEvent = (event: Event, index: number) => {
    const time = new Date(event.timestamp).toLocaleTimeString([], { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });

    switch (event.type) {
      case 'iteration_start':
        return (
          <div key={index} className="flex gap-3 text-[11px] font-mono py-1 group">
            <span className="text-gray-600 shrink-0">[{time}]</span>
            <div className="flex items-start gap-2">
              <Cpu size={12} className="mt-0.5 text-indigo-400" />
              <span className="text-gray-300">
                <span className="text-indigo-400 font-bold">*Agent Thinking*</span> Iteration {event.iteration}/{event.max_iterations}...
              </span>
            </div>
          </div>
        );
      
      case 'thought':
        if (!event.content) return null;
        return (
          <div key={index} className="flex gap-3 text-[11px] font-mono py-1 group">
            <span className="text-gray-600 shrink-0">[{time}]</span>
            <div className="flex items-start gap-2 overflow-hidden">
              <Search size={12} className="mt-0.5 text-blue-400" />
              <span className="text-gray-400 leading-normal break-words">
                {event.content}
              </span>
            </div>
          </div>
        );

      case 'tool_call':
        return (
          <div key={index} className="flex gap-3 text-[11px] font-mono py-1 group">
            <span className="text-gray-600 shrink-0">[{time}]</span>
            <div className="flex items-start gap-2">
              <Zap size={12} className="mt-0.5 text-amber-400" />
              <span className="text-gray-300">
                <span className="text-amber-400 font-bold">*Executing*</span> Calling <code className="text-amber-200">{event.tool}</code>...
              </span>
            </div>
          </div>
        );

      case 'tool_result':
        const isError = event.result?.status === 'error';
        return (
          <div key={index} className={cn(
            "flex gap-3 text-[11px] font-mono py-2 px-2 rounded-lg my-1",
            isError ? "bg-red-500/10 border border-red-500/20" : "bg-white/5"
          )}>
            <span className="text-gray-600 shrink-0">[{time}]</span>
            <div className="flex flex-col gap-1 w-full overflow-hidden">
              <div className="flex items-start gap-2">
                {isError ? (
                  <AlertCircle size={12} className="mt-0.5 text-red-400" />
                ) : (
                  <Database size={12} className="mt-0.5 text-emerald-400" />
                )}
                <span className={isError ? "text-red-300" : "text-gray-300"}>
                  {isError ? (
                    <span className="font-bold">**Error Detected** -&gt;</span>
                  ) : (
                    <span className="text-emerald-400 font-bold">Done.</span>
                  )}
                  {" "}
                  {isError ? event.result.message : `Received ${event.result.rows || 0} rows from ${event.tool}.`}
                </span>
              </div>
              {isError && event.result.failed_query && (
                <div className="ml-5 p-1.5 bg-black/40 rounded text-[10px] text-gray-500 break-all border border-white/5">
                  FAILED QUERY: {event.result.failed_query}
                </div>
              )}
            </div>
          </div>
        );

      case 'final_result':
        return (
          <div key={index} className="flex gap-3 text-[11px] font-mono py-2 px-2 rounded-lg my-1 bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-gray-600 shrink-0">[{time}]</span>
            <div className="flex items-start gap-2">
              <CheckCircle2 size={12} className="mt-0.5 text-emerald-400" />
              <span className="text-emerald-300">
                <span className="font-bold">**Success!**</span> Results received. Found {event.rows} rows in {event.iterations} iterations.
              </span>
            </div>
          </div>
        );

      case 'error':
        return (
          <div key={index} className="flex gap-3 text-[11px] font-mono py-2 px-2 rounded-lg my-1 bg-red-500/20 border border-red-500/40">
            <span className="text-gray-600 shrink-0">[{time}]</span>
            <div className="flex items-start gap-2">
              <AlertCircle size={12} className="mt-0.5 text-red-500" />
              <span className="text-red-400 font-bold">SYSTEM ERROR: {event.error}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard-card h-full flex flex-col bg-[#111118]">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Terminal size={14} className="text-indigo-400" />
          Agent Thought Stream - SSE
        </h3>
        <div className="flex items-center gap-2">
          {isExecuting && (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-[10px] text-indigo-400 font-bold animate-pulse">LIVE</span>
            </div>
          )}
          <span className="text-gray-700 text-[10px] font-mono">(( • ))</span>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-0.5 scrollbar-thin scrollbar-thumb-white/5"
      >
        {events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3 grayscale">
            <Terminal size={32} className="text-gray-400" />
            <span className="text-xs font-mono">Awaiting user input...</span>
          </div>
        ) : (
          events.map((event, idx) => renderEvent(event, idx))
        )}
      </div>
    </div>
  );
};

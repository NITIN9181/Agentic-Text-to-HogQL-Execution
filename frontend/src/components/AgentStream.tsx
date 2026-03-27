import { useEffect, useRef } from 'react';
import { AgentEvent } from '../types';
import { EventCard } from './EventCard';

interface AgentStreamProps {
  events: AgentEvent[];
  isExecuting: boolean;
}

export function AgentStream({ events, isExecuting }: AgentStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl shadow-black/20">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-gray-100">Agent Execution</h3>
          {isExecuting && (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs font-medium text-green-400">Live</span>
            </span>
          )}
        </div>
        <span className="text-xs text-gray-600">
          {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Scrollable event stream */}
      <div
        ref={scrollRef}
        className="max-h-[500px] overflow-y-auto p-4 space-y-2"
      >
        {events.map((event, index) => (
          <EventCard key={index} event={event} />
        ))}

        {isExecuting && (
          <div className="flex items-center gap-2 py-2 px-3 text-gray-500 text-sm">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            Processing...
          </div>
        )}
      </div>
    </div>
  );
}

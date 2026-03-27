import {
  AgentEvent,
  IterationStartEvent,
  ThoughtEvent,
  ToolCallEvent,
  ToolResultEvent,
  EmptyResultEvent,
  ErrorEvent,
} from '../types';

interface EventCardProps {
  event: AgentEvent;
}

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

function IterationStartCard({ event }: { event: IterationStartEvent }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex-1 h-px bg-gray-800" />
      <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
        Iteration {event.iteration}/{event.max_iterations}
      </span>
      <div className="flex-1 h-px bg-gray-800" />
    </div>
  );
}

function ThoughtCard({ event }: { event: ThoughtEvent }) {
  return (
    <div className="border-l-4 border-blue-500 bg-blue-500/5 rounded-r-lg p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
          💭 Agent Thinking
        </span>
        <span className="text-[10px] text-gray-600">{formatTime(event.timestamp)}</span>
      </div>
      <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{event.content}</p>
    </div>
  );
}

function ToolCallCard({ event }: { event: ToolCallEvent }) {
  const input = event.input as Record<string, unknown>;

  return (
    <div className="border-l-4 border-purple-500 bg-purple-500/5 rounded-r-lg p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
          🔧 Tool Call: <span className="font-mono">{event.tool}</span>
        </span>
        <span className="text-[10px] text-gray-600">{formatTime(event.timestamp)}</span>
      </div>

      {event.tool === 'execute_hogql' && input.query && (
        <div className="mt-2">
          {input.reasoning && (
            <p className="text-xs text-gray-400 mb-2 italic">{String(input.reasoning)}</p>
          )}
          <pre className="bg-gray-950 rounded-lg p-3 text-xs font-mono text-green-400 overflow-x-auto whitespace-pre-wrap border border-gray-800/50">
            {String(input.query)}
          </pre>
        </div>
      )}

      {event.tool === 'inspect_schema' && input.table_names && (
        <p className="text-sm text-gray-300 mt-1">
          Inspecting: {(input.table_names as string[]).map(t => (
            <code key={t} className="mx-1 px-1.5 py-0.5 bg-gray-800 rounded text-purple-300 text-xs">{t}</code>
          ))}
        </p>
      )}

      {event.tool === 'get_available_tables' && (
        <p className="text-sm text-gray-300 mt-1">Discovering available tables...</p>
      )}
    </div>
  );
}

function ToolResultCard({ event }: { event: ToolResultEvent }) {
  const { result } = event;
  const isSuccess = result.status === 'success';

  return (
    <div className={`border-l-4 ${isSuccess ? 'border-green-500 bg-green-500/5' : 'border-red-500 bg-red-500/5'} rounded-r-lg p-3`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-semibold flex items-center gap-1.5 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
          {isSuccess ? '✅' : '❌'} Result: <span className="font-mono">{event.tool}</span>
        </span>
        <span className="text-[10px] text-gray-600">{formatTime(event.timestamp)}</span>
      </div>

      {isSuccess && event.tool === 'execute_hogql' && (
        <p className="text-sm text-green-300">
          {result.rows} row{result.rows !== 1 ? 's' : ''} returned
          {result.execution_time_ms !== undefined && (
            <span className="text-gray-500"> in {result.execution_time_ms}ms</span>
          )}
        </p>
      )}

      {isSuccess && event.tool === 'inspect_schema' && result.schemas && (
        <div className="mt-1 space-y-1">
          {Object.entries(result.schemas as Record<string, { columns?: { name: string; type: string }[] }>).map(([table, schema]) => (
            <div key={table}>
              <p className="text-xs text-gray-400 font-medium">{table}</p>
              {schema.columns && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {schema.columns.map((col: { name: string; type: string }) => (
                    <span key={col.name} className="px-1.5 py-0.5 text-[10px] bg-gray-800 rounded text-gray-300 font-mono">
                      {col.name}: <span className="text-gray-500">{col.type}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isSuccess && event.tool === 'get_available_tables' && result.tables && (
        <div className="flex flex-wrap gap-2 mt-1">
          {result.tables.map((table: Record<string, unknown>) => (
            <span key={String(table.name)} className="px-2 py-1 text-xs bg-gray-800 rounded-lg text-gray-300 font-mono border border-gray-700/50">
              {String(table.name)}
              {table.total_rows !== undefined && (
                <span className="text-gray-500 ml-1">({String(table.total_rows)} rows)</span>
              )}
            </span>
          ))}
        </div>
      )}

      {!isSuccess && (
        <div className="mt-1 space-y-2">
          <p className="text-sm text-red-300">{result.message}</p>

          {result.suggestions && result.suggestions.length > 0 && (
            <ul className="text-xs text-yellow-300/80 space-y-1 pl-4">
              {result.suggestions.map((suggestion, i) => (
                <li key={i} className="list-disc">{suggestion}</li>
              ))}
            </ul>
          )}

          {result.failed_query && (
            <pre className="bg-gray-950 rounded-lg p-2 text-xs font-mono text-red-400/80 overflow-x-auto border border-red-900/30">
              {result.failed_query}
            </pre>
          )}

          <p className="text-xs text-amber-400/70 flex items-center gap-1">
            ⚠️ Self-Correction: Agent will retry with a corrected query...
          </p>
        </div>
      )}
    </div>
  );
}

function EmptyResultCard({ event }: { event: EmptyResultEvent }) {
  return (
    <div className="border-l-4 border-yellow-500 bg-yellow-500/5 rounded-r-lg p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-yellow-400 flex items-center gap-1.5">
          ⚡ Empty Result
        </span>
        <span className="text-[10px] text-gray-600">{formatTime(event.timestamp)}</span>
      </div>
      <p className="text-sm text-yellow-300/80">{event.message}</p>
    </div>
  );
}

function ErrorCard({ event }: { event: ErrorEvent }) {
  return (
    <div className="border-l-4 border-red-500 bg-red-500/10 rounded-r-lg p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
          🚨 Error (Iteration {event.iteration})
        </span>
        <span className="text-[10px] text-gray-600">{formatTime(event.timestamp)}</span>
      </div>
      <p className="text-sm text-red-300">{event.error}</p>
      {event.recoverable && (
        <p className="text-xs text-amber-400/70 mt-1">Agent will attempt recovery...</p>
      )}
    </div>
  );
}

export function EventCard({ event }: EventCardProps) {
  switch (event.type) {
    case 'iteration_start':
      return <IterationStartCard event={event} />;
    case 'thought':
      return <ThoughtCard event={event} />;
    case 'tool_call':
      return <ToolCallCard event={event} />;
    case 'tool_result':
      return <ToolResultCard event={event} />;
    case 'empty_result':
      return <EmptyResultCard event={event} />;
    case 'error':
      return <ErrorCard event={event} />;
    case 'final_result':
    case 'completed':
    case 'max_iterations_reached':
      return null; // These are handled by parent components
    default:
      return null;
  }
}

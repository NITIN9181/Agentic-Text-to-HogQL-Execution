import { useQueryStream } from './hooks/useQueryStream';
import { Layout } from './components/Layout';
import { QueryInput } from './components/QueryInput';
import { ThoughtLogStream } from './components/ThoughtLogStream';
import { SchemaBrowser } from './components/SchemaBrowser';
import { QueryViewer } from './components/QueryViewer';
import { VisualResults } from './components/VisualResults';

function App() {
  const { events, isExecuting, finalResult, error, lastQuery, lastIteration, execute, stop } = useQueryStream();

  return (
    <Layout>
      <div className="h-[calc(100vh-104px)] w-full p-6 pb-2 grid grid-cols-1 md:grid-cols-4 gap-6 overflow-hidden bg-[#0d0d12]">
        
        {/* Column 1: Input & Schema */}
        <div className="flex flex-col gap-6 h-full min-h-0">
          <div className="shrink-0">
            <QueryInput
              onSubmit={execute}
              isExecuting={isExecuting}
              onStop={stop}
            />
          </div>
          <div className="flex-1 min-h-0">
            <SchemaBrowser />
          </div>
        </div>

        {/* Column 2: Agent Thought Stream (SSE) */}
        <div className="md:col-span-2 h-full min-h-0">
          <ThoughtLogStream 
            events={events} 
            isExecuting={isExecuting} 
          />
        </div>

        {/* Column 3: Final Query & Results */}
        <div className="flex flex-col gap-6 h-full min-h-0">
          <div className="h-64 shrink-0">
            <QueryViewer 
              query={lastQuery || ''} 
              iteration={lastIteration} 
            />
          </div>
          <div className="flex-1 min-h-0">
            <VisualResults 
              result={finalResult || { data: [], columns: [], rows: 0 }} 
            />
          </div>
        </div>

        {/* Global Error Overlay (Optional but good for critical failures) */}
        {error && !finalResult && !isExecuting && (
          <div className="fixed bottom-12 right-6 max-w-sm animate-fade-in z-50">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-md shadow-2xl">
              <h3 className="text-sm font-bold text-red-400 mb-1">Execution Failed</h3>
              <p className="text-[11px] text-red-300/80">{error}</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default App;

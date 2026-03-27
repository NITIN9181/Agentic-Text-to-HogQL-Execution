import { useQueryStream } from './hooks/useQueryStream';
import { Layout } from './components/Layout';
import { QueryInput } from './components/QueryInput';
import { AgentStream } from './components/AgentStream';
import { ResultsTable } from './components/ResultsTable';

function App() {
  const { events, isExecuting, finalResult, error, execute, stop } = useQueryStream();

  return (
    <Layout>
      <div className="space-y-6">
        <QueryInput
          onSubmit={execute}
          isExecuting={isExecuting}
          onStop={stop}
        />

        {events.length > 0 && (
          <AgentStream events={events} isExecuting={isExecuting} />
        )}

        {finalResult && (
          <ResultsTable result={finalResult} />
        )}

        {error && !finalResult && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-400 mb-2">Execution Failed</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default App;

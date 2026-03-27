import { FinalResultEvent } from '../types';

interface ResultsTableProps {
  result: FinalResultEvent;
}

export function ResultsTable({ result }: ResultsTableProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl shadow-black/20">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800/50 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-green-400 flex items-center gap-2">
            ✅ Query Results
          </h3>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>
              {result.iterations} iteration{result.iterations !== 1 ? 's' : ''}
            </span>
            <span>{result.execution_time_ms}ms</span>
            <span className="text-green-400/80 font-medium">
              {result.rows} row{result.rows !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Query display */}
      <div className="px-6 py-4 border-b border-gray-800/30">
        <p className="text-xs text-gray-500 font-medium mb-2">Final HogQL Query</p>
        <pre className="bg-gray-950 rounded-lg p-3 text-xs font-mono text-green-400 overflow-x-auto whitespace-pre-wrap border border-gray-800/50">
          {result.query}
        </pre>

        {result.reasoning && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 font-medium mb-1">Reasoning</p>
            <p className="text-sm text-gray-300">{result.reasoning}</p>
          </div>
        )}
      </div>

      {/* Data table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800/50">
              {result.columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-900/50"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.data.slice(0, 100).map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-gray-800/20 hover:bg-gray-800/30 transition-colors duration-100 even:bg-gray-800/10"
              >
                {result.columns.map((col) => {
                  const value = row[col];
                  const displayValue = value === null || value === undefined
                    ? '—'
                    : String(value);
                  const isNumeric = typeof value === 'number';

                  return (
                    <td
                      key={col}
                      className={`px-4 py-2.5 text-sm font-mono ${
                        isNumeric ? 'text-indigo-300 text-right' : 'text-gray-300'
                      }`}
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Row count */}
      <div className="px-6 py-3 border-t border-gray-800/50 bg-gray-900/50">
        <p className="text-xs text-gray-600">
          Showing {Math.min(result.data.length, 100)} of {result.rows} row{result.rows !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

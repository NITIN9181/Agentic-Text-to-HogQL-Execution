import { useState, KeyboardEvent } from 'react';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isExecuting: boolean;
  onStop: () => void;
}

const EXAMPLE_QUERIES = [
  'Count events by type in the last 7 days',
  'Show daily active users for the past month',
  'Which pages have the most pageviews?',
  'Compare free vs pro user activity',
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-2xl shadow-black/20">
      <h2 className="text-lg font-semibold text-gray-100 mb-1">Ask a Question</h2>
      <p className="text-sm text-gray-500 mb-4">
        Describe what analytics data you&apos;re looking for in natural language
      </p>

      <textarea
        id="query-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="How many pageviews happened in the last 7 days?&#10;Show retention of users who experienced payment errors"
        className="w-full h-28 px-4 py-3 bg-gray-950 border border-gray-700/50 rounded-lg text-gray-100 placeholder-gray-600 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
        disabled={isExecuting}
      />

      <div className="flex items-center gap-3 mt-4">
        <button
          id="execute-button"
          onClick={handleSubmit}
          disabled={isExecuting || !query.trim()}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
        >
          {isExecuting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Executing...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Execute Query
            </>
          )}
        </button>

        {isExecuting && (
          <button
            id="stop-button"
            onClick={onStop}
            className="px-6 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-lg border border-red-500/30 transition-all duration-200 flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            Stop
          </button>
        )}
      </div>

      {/* Example queries */}
      <div className="mt-4 pt-4 border-t border-gray-800/50">
        <p className="text-xs text-gray-600 mb-2 font-medium">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((example) => (
            <button
              key={example}
              onClick={() => setQuery(example)}
              disabled={isExecuting}
              className="px-3 py-1.5 text-xs bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-gray-200 rounded-lg border border-gray-700/30 hover:border-gray-600/50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

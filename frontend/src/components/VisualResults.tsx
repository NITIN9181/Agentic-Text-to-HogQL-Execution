import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3, Table as TableIcon, ChevronDown, Activity } from 'lucide-react';
import { ResultsTable } from './ResultsTable';

interface VisualResultsProps {
  result: {
    data: any[];
    columns: string[];
    rows: number;
  };
}

export const VisualResults: React.FC<VisualResultsProps> = ({ result }) => {
  const chartData = useMemo(() => {
    if (!result.data || result.data.length === 0) return [];
    
    // Attempt to find a date/time column for the X-axis
    const dateCol = result.columns.find(c => 
      c.toLowerCase().includes('date') || 
      c.toLowerCase().includes('time') || 
      c.toLowerCase().includes('day') ||
      c.toLowerCase().includes('month')
    );

    // Filter for numerical columns for the Y-axis
    const numericCols = result.columns.filter(c => {
      const firstVal = result.data[0][c];
      return typeof firstVal === 'number';
    });

    if (numericCols.length === 0) return [];

    return result.data.map(row => {
      const entry: any = { ...row };
      if (dateCol) entry.name = row[dateCol];
      return entry;
    });
  }, [result]);

  const hasChartData = chartData.length > 0;

  if (!result || result.rows === 0) {
    return (
      <div className="dashboard-card h-full flex flex-col items-center justify-center opacity-30 gap-3 grayscale">
        <Activity size={32} className="text-gray-400" />
        <span className="text-xs font-mono">Execution results will appear here...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-card h-full flex flex-col bg-[#111118]">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Activity size={14} className="text-indigo-400" />
          Execution Results
        </h3>
        <button className="p-1 hover:bg-white/5 rounded text-gray-500">
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/5">
        {/* Chart View */}
        {hasChartData && (
          <div className="h-48 w-full border border-white/5 rounded-xl bg-black/20 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3d" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#4b5563" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#4b5563" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#16161e', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '11px'
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                {result.columns.filter(c => typeof result.data[0][c] === 'number').map((col, idx) => (
                  <Line 
                    key={col}
                    type="monotone" 
                    dataKey={col} 
                    stroke={idx === 0 ? '#6366f1' : idx === 1 ? '#8b5cf6' : '#ec4899'} 
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Table View */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest px-1">
            <TableIcon size={12} />
            <span>Raw Data Output</span>
          </div>
          <div className="border border-white/5 rounded-xl overflow-hidden bg-black/10">
            <ResultsTable result={result} />
          </div>
        </div>
      </div>
    </div>
  );
};

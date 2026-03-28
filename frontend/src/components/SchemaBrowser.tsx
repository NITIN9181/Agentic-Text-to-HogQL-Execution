import React, { useEffect, useState } from 'react';
import { Database, Table as TableIcon, Columns, ChevronRight, ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Column {
  name: string;
  type: string;
}

interface TableSchema {
  table_name: string;
  engine: string;
  total_rows: number;
  columns: Column[];
}

export const SchemaBrowser: React.FC = () => {
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/schema/full')
      .then(res => res.json())
      .then(data => {
        setTables(data.tables || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch schema:', err);
        setIsLoading(false);
      });
  }, []);

  const toggleTable = (tableName: string) => {
    const next = new Set(expandedTables);
    if (next.has(tableName)) {
      next.delete(tableName);
    } else {
      next.add(tableName);
    }
    setExpandedTables(next);
  };

  if (isLoading) {
    return (
      <div className="dashboard-card h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Database className="animate-pulse text-indigo-500" size={24} />
          <span className="text-xs text-gray-500 font-medium">Loading Schema...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card h-full flex flex-col">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Database size={14} className="text-indigo-400" />
          Database Schema
        </h3>
        <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
          ClickHouse
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-2 py-1 text-gray-400 text-xs font-semibold">
            <ChevronDown size={14} />
            <Database size={14} />
            <span>Tables</span>
          </div>
          
          <div className="pl-4 space-y-1">
            {tables.map(table => (
              <div key={table.table_name} className="space-y-1">
                <button
                  onClick={() => toggleTable(table.table_name)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors group",
                    expandedTables.has(table.table_name) 
                      ? "bg-white/5 text-white" 
                      : "text-gray-400 hover:bg-white/5 hover:text-gray-300"
                  )}
                >
                  {expandedTables.has(table.table_name) ? (
                    <ChevronDown size={14} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={14} className="text-gray-500 group-hover:text-gray-400" />
                  )}
                  <TableIcon size={14} className="text-indigo-400/70" />
                  <span className="font-medium truncate">{table.table_name}</span>
                </button>
                
                {expandedTables.has(table.table_name) && (
                  <div className="pl-6 space-y-0.5 animate-fade-in">
                    {table.columns.map(col => (
                      <div 
                        key={col.name} 
                        className="flex items-center justify-between gap-2 px-2 py-1 text-[11px] group"
                      >
                        <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-300">
                          <Columns size={12} className="text-gray-600" />
                          <span className="truncate">{col.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-600 font-mono italic">
                          {col.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

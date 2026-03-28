import { FinalResultEvent } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ResultsTableProps {
  result: {
    data: any[];
    columns: string[];
    rows: number;
  };
}

export function ResultsTable({ result }: ResultsTableProps) {
  if (!result || result.rows === 0) return null;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/5 bg-black/20">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              {result.columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.data.slice(0, 50).map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
              >
                {result.columns.map((col) => {
                  const value = row[col];
                  const isNumeric = typeof value === 'number';
                  const displayValue = value === null || value === undefined
                    ? <span className="text-gray-700">—</span>
                    : isNumeric 
                      ? value.toLocaleString()
                      : String(value);

                  return (
                    <td
                      key={col}
                      className={cn(
                        "px-4 py-2 text-[11px] font-mono whitespace-nowrap",
                        isNumeric ? "text-indigo-400 text-right" : "text-gray-400 group-hover:text-gray-300"
                      )}
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
      
      {result.rows > 50 && (
        <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex justify-center">
          <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
            Showing first 50 of {result.rows.toLocaleString()} rows
          </span>
        </div>
      )}
    </div>
  );
}

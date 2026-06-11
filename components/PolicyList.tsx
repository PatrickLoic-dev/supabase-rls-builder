"use client";

import { RLSPolicy } from "@/lib/supabase-manager";

interface PolicyListProps {
  policies: RLSPolicy[];
  loading: boolean;
  selectedTable: string;
  tables: string[];
  onFilterTable: (table: string) => void;
  onRefresh: () => void;
}

const COMMAND_COLORS: Record<string, string> = {
  SELECT: "text-blue-400",
  INSERT: "text-green-400",
  UPDATE: "text-yellow-400",
  DELETE: "text-red-400",
  ALL: "text-purple-400",
};

export function PolicyList({
  policies,
  loading,
  selectedTable,
  tables,
  onFilterTable,
  onRefresh,
}: PolicyListProps) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Existing Policies
        </h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-1.5 transition-colors"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {tables.length > 0 && (
        <select
          value={selectedTable}
          onChange={(e) => onFilterTable(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="">All tables</option>
          {tables.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      )}

      {policies.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-6">
          {loading ? "Loading policies..." : "No policies found"}
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {policies.map((policy) => (
            <div key={policy.id} className="border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold font-mono ${COMMAND_COLORS[policy.command] ?? COMMAND_COLORS.ALL}`}>
                  {policy.command}
                </span>
                <span className="text-sm text-white">{policy.name}</span>
                <span className="text-xs text-gray-500 ml-auto">{policy.table}</span>
              </div>
              <p className="text-xs text-gray-500 font-mono truncate">{policy.definition}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

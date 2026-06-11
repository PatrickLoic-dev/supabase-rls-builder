"use client";

import { GeneratedPolicy } from "@/lib/openai";

const OPERATION_COLORS: Record<string, string> = {
  SELECT: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  INSERT: "bg-green-500/20 text-green-400 border-green-500/30",
  UPDATE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
  ALL: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

interface SqlPreviewProps {
  policies: GeneratedPolicy[];
  applying: boolean;
  appliedResults: { policy: string; success: boolean; error?: string }[];
  enableRLS: boolean;
  onToggleRLS: (v: boolean) => void;
  onApply: () => void;
  onCopyAll: () => void;
}

export function SqlPreview({
  policies,
  applying,
  appliedResults,
  enableRLS,
  onToggleRLS,
  onApply,
  onCopyAll,
}: SqlPreviewProps) {
  if (policies.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center h-64 text-center">
        <div className="text-4xl mb-3">🔐</div>
        <p className="text-gray-500 text-sm">Generated SQL policies will appear here</p>
        <p className="text-gray-600 text-xs mt-1">Describe a rule and click Generate</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Generated Policies ({policies.length})
        </h2>
        <button
          onClick={onCopyAll}
          className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-1.5 transition-colors"
        >
          Copy all SQL
        </button>
      </div>

      <div className="space-y-3">
        {policies.map((policy, i) => (
          <div key={i} className="border border-gray-700 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${OPERATION_COLORS[policy.operation] ?? OPERATION_COLORS.ALL}`}>
                {policy.operation}
              </span>
              <span className="text-sm text-white font-medium">{policy.name}</span>
            </div>
            <pre className="text-xs text-emerald-300 font-mono p-4 overflow-x-auto bg-gray-950 leading-relaxed">
              {policy.sql}
            </pre>
            {policy.explanation && (
              <p className="text-xs text-gray-500 px-4 py-2 bg-gray-900 border-t border-gray-800">
                {policy.explanation}
              </p>
            )}
          </div>
        ))}
      </div>

      {appliedResults.length > 0 && (
        <div className="space-y-1">
          {appliedResults.map((r, i) => (
            <div key={i} className={`text-xs rounded-lg px-3 py-2 flex items-center gap-2 ${r.success ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              <span>{r.success ? "✓" : "✗"}</span>
              <span className="font-mono">{r.policy}</span>
              {r.error && <span className="text-red-500 ml-2">{r.error}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-gray-800">
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={enableRLS}
            onChange={(e) => onToggleRLS(e.target.checked)}
            className="accent-emerald-500"
          />
          Enable RLS on table if not active
        </label>

        <button
          onClick={onApply}
          disabled={applying}
          className="ml-auto bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2 px-5 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          {applying ? (
            <>
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Applying...
            </>
          ) : (
            "Apply to Supabase"
          )}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GeneratedPolicy } from "@/lib/openai";

const OPERATION_STYLES: Record<string, { badge: string; glow: string }> = {
  SELECT: { badge: "bg-blue-500/15 text-blue-400 border-blue-500/25", glow: "shadow-blue-500/10" },
  INSERT: { badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", glow: "shadow-emerald-500/10" },
  UPDATE: { badge: "bg-amber-500/15 text-amber-400 border-amber-500/25", glow: "shadow-amber-500/10" },
  DELETE: { badge: "bg-red-500/15 text-red-400 border-red-500/25", glow: "shadow-red-500/10" },
  ALL: { badge: "bg-purple-500/15 text-purple-400 border-purple-500/25", glow: "shadow-purple-500/10" },
};

function PolicyCard({ policy, index }: { policy: GeneratedPolicy; index: number }) {
  const [copied, setCopied] = useState(false);
  const style = OPERATION_STYLES[policy.operation] ?? OPERATION_STYLES.ALL;

  const copy = () => {
    navigator.clipboard.writeText(policy.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.35,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={`border border-gray-800 rounded-xl overflow-hidden shadow-lg ${style.glow}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-800/50 border-b border-gray-800">
        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border tracking-wider ${style.badge}`}>
          {policy.operation}
        </span>
        <span className="text-sm text-gray-200 font-medium flex-1 truncate">{policy.name}</span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.93 }}
          onClick={copy}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-0.5 rounded-md hover:bg-gray-700/60 cursor-pointer"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="copied"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="text-emerald-400"
              >
                Copied!
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
              >
                Copy
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* SQL */}
      <div className="bg-gray-950/80 overflow-x-auto">
        <pre className="text-xs text-emerald-300/90 font-mono p-4 leading-relaxed">
          {policy.sql}
        </pre>
      </div>

      {/* Explanation */}
      {policy.explanation && (
        <div className="px-4 py-2.5 bg-gray-900/40 border-t border-gray-800/60">
          <p className="text-xs text-gray-500 leading-relaxed">{policy.explanation}</p>
        </div>
      )}
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div
        animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
        transition={{ duration: 1.2, delay: 0.3, ease: "easeInOut" }}
        className="text-4xl mb-4 select-none"
      >
        🔐
      </motion.div>
      <p className="text-gray-500 text-sm">Generated SQL will appear here</p>
      <p className="text-gray-700 text-xs mt-1">Describe a rule and click Generate</p>
    </motion.div>
  );
}

function GeneratingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="border border-gray-800 rounded-xl overflow-hidden"
        >
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-800/50 border-b border-gray-800">
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              className="w-14 h-4 bg-gray-700 rounded-md"
            />
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 + 0.1 }}
              className="w-32 h-4 bg-gray-700/70 rounded-md"
            />
          </div>
          <div className="bg-gray-950/80 p-4 space-y-2">
            {[100, 80, 90, 60].map((w, j) => (
              <motion.div
                key={j}
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: j * 0.1 }}
                className="h-3 bg-gray-800 rounded"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

interface SqlPreviewProps {
  policies: GeneratedPolicy[];
  generating: boolean;
  applying: boolean;
  appliedResults: { policy: string; success: boolean; error?: string }[];
  enableRLS: boolean;
  onToggleRLS: (v: boolean) => void;
  onApply: () => void;
  onCopyAll: () => void;
}

export function SqlPreview({
  policies,
  generating,
  applying,
  appliedResults,
  enableRLS,
  onToggleRLS,
  onApply,
  onCopyAll,
}: SqlPreviewProps) {
  const hasContent = policies.length > 0 || generating;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
      className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-5 space-y-4 shadow-xl"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Generated Policies
          {policies.length > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold"
            >
              {policies.length}
            </motion.span>
          )}
        </span>

        <AnimatePresence>
          {policies.length > 0 && !generating && (
            <motion.button
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCopyAll}
              className="text-xs text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-600 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
            >
              Copy all SQL
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="min-h-48">
        <AnimatePresence mode="wait">
          {generating ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GeneratingSkeleton />
            </motion.div>
          ) : hasContent ? (
            <motion.div key="policies" className="space-y-3">
              {policies.map((policy, i) => (
                <PolicyCard key={`${policy.name}-${i}`} policy={policy} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Apply results */}
      <AnimatePresence>
        {appliedResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5 overflow-hidden"
          >
            {appliedResults.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`text-xs rounded-lg px-3 py-2 flex items-center gap-2 ${
                  r.success
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                <span className="font-bold">{r.success ? "✓" : "✗"}</span>
                <span className="font-mono">{r.policy}</span>
                {r.error && <span className="text-red-500 ml-auto truncate">{r.error}</span>}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <AnimatePresence>
        {policies.length > 0 && !generating && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 pt-3 border-t border-gray-800"
          >
            <label className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-400 cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={enableRLS}
                onChange={(e) => onToggleRLS(e.target.checked)}
                className="accent-emerald-500 w-3.5 h-3.5"
              />
              Enable RLS if not active
            </label>

            <motion.button
              onClick={onApply}
              disabled={applying}
              whileHover={!applying ? { scale: 1.02 } : {}}
              whileTap={!applying ? { scale: 0.97 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="ml-auto bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold py-2 px-5 rounded-xl text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {applying ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full inline-block"
                  />
                  Applying…
                </>
              ) : (
                "Apply to Supabase"
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

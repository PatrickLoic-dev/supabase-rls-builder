"use client";

import { motion, AnimatePresence } from "motion/react";
import { RLSPolicy } from "@/lib/supabase-manager";

interface PolicyListProps {
  policies: RLSPolicy[];
  loading: boolean;
  selectedTable: string;
  tables: string[];
  onFilterTable: (table: string) => void;
  onRefresh: () => void;
}

const COMMAND_STYLES: Record<string, string> = {
  SELECT: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  INSERT: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  UPDATE: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  DELETE: "text-red-400 bg-red-500/10 border-red-500/20",
  ALL: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

function Spinner() {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
      className="w-3.5 h-3.5 border-2 border-gray-600 border-t-gray-300 rounded-full inline-block"
    />
  );
}

export function PolicyList({
  policies,
  loading,
  selectedTable,
  tables,
  onFilterTable,
  onRefresh,
}: PolicyListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
      className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-5 space-y-4 shadow-xl"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Existing Policies
        </span>
        <motion.button
          onClick={onRefresh}
          disabled={loading}
          whileHover={!loading ? { scale: 1.05 } : {}}
          whileTap={!loading ? { scale: 0.95 } : {}}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-600 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-default"
        >
          {loading ? <Spinner /> : null}
          {loading ? "Loading" : "Refresh"}
        </motion.button>
      </div>

      {tables.length > 0 && (
        <select
          value={selectedTable}
          onChange={(e) => onFilterTable(e.target.value)}
          className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 appearance-none"
        >
          <option value="">All tables</option>
          {tables.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      )}

      <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5 scrollbar-thin">
        <AnimatePresence mode="popLayout">
          {loading && policies.length === 0 ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-2"
            >
              {[80, 65, 75].map((w, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                  className="border border-gray-800 rounded-xl p-3 space-y-2"
                >
                  <div className="flex gap-2">
                    <div className="w-12 h-3 bg-gray-700 rounded" />
                    <div className="h-3 bg-gray-700/60 rounded" style={{ width: `${w}%` }} />
                  </div>
                  <div className="w-4/5 h-2.5 bg-gray-800 rounded" />
                </motion.div>
              ))}
            </motion.div>
          ) : policies.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-gray-600 text-xs text-center py-8"
            >
              No policies found — connect first
            </motion.p>
          ) : (
            policies.map((policy, i) => (
              <motion.div
                key={policy.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                className="border border-gray-800 hover:border-gray-700 rounded-xl p-3 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border ${COMMAND_STYLES[policy.command] ?? COMMAND_STYLES.ALL}`}>
                    {policy.command}
                  </span>
                  <span className="text-xs text-gray-200 group-hover:text-white transition-colors truncate">
                    {policy.name}
                  </span>
                  <span className="text-[10px] text-gray-600 ml-auto shrink-0">{policy.table}</span>
                </div>
                <p className="text-[10px] text-gray-600 font-mono truncate">{policy.definition}</p>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

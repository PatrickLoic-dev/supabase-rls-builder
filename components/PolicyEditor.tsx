"use client";

import { motion } from "motion/react";

interface PolicyEditorProps {
  description: string;
  tableName: string;
  tables: string[];
  loading: boolean;
  onChange: (field: "description" | "tableName", value: string) => void;
  onGenerate: () => void;
}

const EXAMPLES = [
  "Users can only see their own records",
  "Admins can read and write everything, users can only read",
  "Users can insert but not update or delete",
  "Only authenticated users can access this table",
  "Users see public records and their own private ones",
];

const inputClass =
  "w-full bg-gray-800/60 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200";

const GeneratingDots = () => (
  <span className="flex items-center gap-1">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-white"
        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </span>
);

export function PolicyEditor({
  description,
  tableName,
  tables,
  loading,
  onChange,
  onGenerate,
}: PolicyEditorProps) {
  const canGenerate = description && tableName && !loading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
      className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-5 space-y-4 shadow-xl"
    >
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
        Describe your rule
      </span>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-400">Table</label>
          {tables.length > 0 ? (
            <select
              value={tableName}
              onChange={(e) => onChange("tableName", e.target.value)}
              className={inputClass + " appearance-none"}
            >
              <option value="">Select a table…</option>
              {tables.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="e.g. profiles, posts, orders…"
              value={tableName}
              onChange={(e) => onChange("tableName", e.target.value)}
              className={inputClass}
            />
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-400">
            Security rule{" "}
            <span className="text-gray-600 font-normal">(plain English)</span>
          </label>
          <textarea
            rows={4}
            placeholder="e.g. Users can only see their own records…"
            value={description}
            onChange={(e) => onChange("description", e.target.value)}
            className={inputClass + " resize-none leading-relaxed"}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-gray-600">Try an example:</p>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex, i) => (
            <motion.button
              key={ex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange("description", ex)}
              className="text-xs bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 hover:text-gray-200 border border-gray-700/60 hover:border-gray-600 rounded-full px-3 py-1 transition-colors cursor-pointer"
            >
              {ex}
            </motion.button>
          ))}
        </div>
      </div>

      <motion.button
        onClick={onGenerate}
        disabled={!canGenerate}
        whileHover={canGenerate ? { scale: 1.02 } : {}}
        whileTap={canGenerate ? { scale: 0.97 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <GeneratingDots />
            <span>Generating…</span>
          </>
        ) : (
          "Generate Policies"
        )}
      </motion.button>
    </motion.div>
  );
}

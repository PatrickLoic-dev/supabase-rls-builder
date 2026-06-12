"use client";

import { motion, AnimatePresence } from "motion/react";

interface ConnectionPanelProps {
  supabaseUrl: string;
  supabaseKey: string;
  openaiKey: string;
  connected: boolean;
  onChange: (field: "supabaseUrl" | "supabaseKey" | "openaiKey", value: string) => void;
  onConnect: () => void;
}

const inputClass =
  "w-full bg-gray-800/60 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200";

function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-400">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}

export function ConnectionPanel({
  supabaseUrl,
  supabaseKey,
  openaiKey,
  connected,
  onChange,
  onConnect,
}: ConnectionPanelProps) {
  const canConnect = supabaseUrl && supabaseKey && openaiKey;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-5 space-y-4 shadow-xl"
    >
      <div className="flex items-center gap-2.5">
        <motion.div
          animate={{
            backgroundColor: connected ? "#34d399" : "#6b7280",
            boxShadow: connected ? "0 0 8px #34d39966" : "none",
          }}
          transition={{ duration: 0.4 }}
          className="w-2 h-2 rounded-full"
        />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Connection
        </span>
        <AnimatePresence>
          {connected && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              className="ml-auto text-xs text-emerald-400 font-medium"
            >
              Connected
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-3">
        <Field
          label="Supabase Project URL"
          type="url"
          placeholder="https://xxxx.supabase.co"
          value={supabaseUrl}
          onChange={(v) => onChange("supabaseUrl", v)}
        />
        <Field
          label="Service Role Key"
          type="password"
          placeholder="eyJhbGciOiJIUzI1NiIs..."
          value={supabaseKey}
          onChange={(v) => onChange("supabaseKey", v)}
        />
        <Field
          label="OpenAI API Key"
          type="password"
          placeholder="sk-..."
          value={openaiKey}
          onChange={(v) => onChange("openaiKey", v)}
        />
      </div>

      <motion.button
        onClick={onConnect}
        disabled={!canConnect}
        whileHover={canConnect ? { scale: 1.02 } : {}}
        whileTap={canConnect ? { scale: 0.97 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        {connected ? "Reconnect" : "Connect"}
      </motion.button>
    </motion.div>
  );
}

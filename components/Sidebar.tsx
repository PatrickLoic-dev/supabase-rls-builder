"use client";

import { motion, AnimatePresence } from "motion/react";
import { RLSPolicy } from "@/lib/supabase-manager";

interface SidebarProps {
  supabaseUrl: string;
  supabaseKey: string;
  openaiKey: string;
  connected: boolean;
  connecting: boolean;
  tables: string[];
  policies: RLSPolicy[];
  selectedTable: string;
  policiesLoading: boolean;
  onFieldChange: (f: "supabaseUrl" | "supabaseKey" | "openaiKey", v: string) => void;
  onConnect: () => void;
  onSelectTable: (t: string) => void;
  onRefresh: () => void;
}

function InputField({
  label, type, placeholder, value, onChange,
}: {
  label: string; type: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-medium tracking-wide uppercase" style={{ color: "var(--text-3)" }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          color: "var(--text-1)",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
      />
    </div>
  );
}

const CMD_COLOR: Record<string, string> = {
  SELECT: "#60a5fa",
  INSERT: "#34d399",
  UPDATE: "#fbbf24",
  DELETE: "#f87171",
  ALL: "#a78bfa",
};

export function Sidebar({
  supabaseUrl, supabaseKey, openaiKey,
  connected, connecting, tables, policies, selectedTable, policiesLoading,
  onFieldChange, onConnect, onSelectTable, onRefresh,
}: SidebarProps) {
  const canConnect = supabaseUrl && supabaseKey && openaiKey;

  return (
    <aside
      className="flex flex-col gap-0 h-full overflow-hidden"
      style={{ borderRight: "1px solid var(--border-soft)" }}
    >
      {/* Brand */}
      <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
          style={{ background: "var(--accent)", color: "#022c22" }}
        >
          RLS
        </div>
        <div>
          <p className="text-sm font-semibold leading-none" style={{ color: "var(--text-1)" }}>RLS Builder</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>Supabase policy generator</p>
        </div>
      </div>

      {/* Connection */}
      <div className="px-4 py-4 space-y-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
            Connection
          </span>
          <AnimatePresence>
            {connected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                className="ml-auto flex items-center gap-1.5"
              >
                <motion.span
                  className="w-1.5 h-1.5 rounded-full pulse-glow"
                  style={{ background: "var(--accent)" }}
                />
                <span className="text-[11px]" style={{ color: "var(--accent)" }}>Live</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <InputField label="Project URL" type="url" placeholder="https://xxxx.supabase.co"
          value={supabaseUrl} onChange={(v) => onFieldChange("supabaseUrl", v)} />
        <InputField label="Service Role Key" type="password" placeholder="eyJ..."
          value={supabaseKey} onChange={(v) => onFieldChange("supabaseKey", v)} />
        <InputField label="OpenAI Key" type="password" placeholder="sk-..."
          value={openaiKey} onChange={(v) => onFieldChange("openaiKey", v)} />

        <motion.button
          onClick={onConnect}
          disabled={!canConnect || connecting}
          whileHover={canConnect && !connecting ? { scale: 1.01 } : {}}
          whileTap={canConnect && !connecting ? { scale: 0.98 } : {}}
          className="w-full py-2 rounded-lg text-sm font-semibold transition-colors duration-150 flex items-center justify-center gap-2"
          style={{
            background: canConnect && !connecting ? "var(--accent)" : "var(--surface-2)",
            color: canConnect && !connecting ? "#022c22" : "var(--text-3)",
            cursor: canConnect && !connecting ? "pointer" : "not-allowed",
          }}
        >
          {connecting ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="w-3.5 h-3.5 border-2 rounded-full inline-block"
                style={{ borderColor: "var(--text-3)", borderTopColor: "var(--text-1)" }}
              />
              Connecting…
            </>
          ) : connected ? "Reconnect" : "Connect"}
        </motion.button>
      </div>

      {/* Tables */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
            Tables {tables.length > 0 && `(${tables.length})`}
          </span>
          {connected && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onRefresh}
              disabled={policiesLoading}
              className="text-[11px] transition-colors"
              style={{ color: "var(--text-3)", cursor: "pointer" }}
            >
              {policiesLoading ? "…" : "↺ Refresh"}
            </motion.button>
          )}
        </div>

        {!connected ? (
          <p className="text-xs py-3" style={{ color: "var(--text-3)" }}>
            Connect to browse tables
          </p>
        ) : policiesLoading && tables.length === 0 ? (
          <div className="space-y-1.5">
            {[70, 50, 65, 45].map((w, i) => (
              <div key={i} className="shimmer h-7 rounded-lg" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : (
          <AnimatePresence>
            {["", ...tables].map((t, i) => (
              <motion.button
                key={t || "__all__"}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onSelectTable(t)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-left transition-all duration-100"
                style={{
                  background: selectedTable === t ? "#10b98115" : "transparent",
                  color: selectedTable === t ? "var(--accent)" : "var(--text-2)",
                  borderLeft: selectedTable === t ? "2px solid var(--accent)" : "2px solid transparent",
                  cursor: "pointer",
                }}
              >
                <span className="text-[11px] font-mono truncate">{t || "All tables"}</span>
                {t && (
                  <span className="ml-auto text-[10px]" style={{ color: "var(--text-3)" }}>
                    {policies.filter((p) => p.table === t).length}
                  </span>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        )}

        {/* Existing policies mini-list */}
        <AnimatePresence>
          {selectedTable && policies.filter((p) => p.table === selectedTable).length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-1 overflow-hidden"
            >
              <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>
                Existing policies
              </p>
              {policies
                .filter((p) => p.table === selectedTable)
                .map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-2 px-2 py-1 rounded-md"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <span
                      className="text-[9px] font-black font-mono px-1 py-0.5 rounded"
                      style={{
                        color: CMD_COLOR[p.command] ?? CMD_COLOR.ALL,
                        background: `${CMD_COLOR[p.command] ?? CMD_COLOR.ALL}18`,
                      }}
                    >
                      {p.command}
                    </span>
                    <span className="text-[11px] truncate" style={{ color: "var(--text-2)" }}>{p.name}</span>
                  </motion.div>
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}

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

const INPUT_BASE: React.CSSProperties = {
  display: "block",
  width: "100%",
  background: "#09090b",
  border: "1px solid #3f3f46",
  borderRadius: 10,
  padding: "8px 12px",
  fontSize: 13,
  color: "#fafafa",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
};

function Field({
  label, type, placeholder, value, onChange,
}: {
  label: string; type: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#71717a", fontFamily: "inherit" }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={INPUT_BASE}
        onFocus={(e) => { e.target.style.borderColor = "#10b981"; e.target.style.boxShadow = "0 0 0 3px #10b98120"; }}
        onBlur={(e) => { e.target.style.borderColor = "#3f3f46"; e.target.style.boxShadow = "none"; }}
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
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        borderRight: "1px solid #27272a",
        background: "#111113",
        fontFamily: "inherit",
      }}
    >
      {/* Brand */}
      <div style={{ padding: "18px 20px", borderBottom: "1px solid #1f1f23", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, background: "#10b981",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 900, color: "#022c22", flexShrink: 0, fontFamily: "inherit",
        }}>
          RLS
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#fafafa", lineHeight: 1, margin: 0, fontFamily: "inherit" }}>RLS Builder</p>
          <p style={{ fontSize: 11, color: "#52525b", marginTop: 3, lineHeight: 1, fontFamily: "inherit" }}>Supabase policy generator</p>
        </div>
      </div>

      {/* Connection section */}
      <div style={{ padding: "16px 16px", borderBottom: "1px solid #1f1f23", flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#52525b", fontFamily: "inherit" }}>
            Connection
          </span>
          <AnimatePresence>
            {connected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}
              >
                <motion.span
                  className="pulse-glow"
                  style={{ display: "block", width: 6, height: 6, borderRadius: "50%", background: "#10b981" }}
                />
                <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600, fontFamily: "inherit" }}>Live</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Field label="Project URL" type="url" placeholder="https://xxxx.supabase.co"
          value={supabaseUrl} onChange={(v) => onFieldChange("supabaseUrl", v)} />
        <Field label="Service Role Key" type="password" placeholder="eyJ..."
          value={supabaseKey} onChange={(v) => onFieldChange("supabaseKey", v)} />
        <Field label="OpenAI Key" type="password" placeholder="sk-..."
          value={openaiKey} onChange={(v) => onFieldChange("openaiKey", v)} />

        <motion.button
          onClick={onConnect}
          disabled={!canConnect || connecting}
          whileHover={canConnect && !connecting ? { scale: 1.01 } : {}}
          whileTap={canConnect && !connecting ? { scale: 0.98 } : {}}
          style={{
            width: "100%",
            padding: "8px 0",
            borderRadius: 10,
            border: "none",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: canConnect && !connecting ? "#10b981" : "#27272a",
            color: canConnect && !connecting ? "#022c22" : "#52525b",
            cursor: canConnect && !connecting ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            transition: "background 0.15s, color 0.15s",
          }}
        >
          {connecting ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                style={{
                  display: "inline-block", width: 13, height: 13, borderRadius: "50%",
                  border: "2px solid #52525b", borderTopColor: "#fafafa",
                }}
              />
              Connecting…
            </>
          ) : connected ? "Reconnect" : "Connect"}
        </motion.button>
      </div>

      {/* Tables */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#52525b", fontFamily: "inherit" }}>
            Tables {tables.length > 0 && `(${tables.length})`}
          </span>
          {connected && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onRefresh}
              disabled={policiesLoading}
              style={{ fontSize: 11, color: "#52525b", cursor: "pointer", background: "none", border: "none", fontFamily: "inherit" }}
            >
              {policiesLoading ? "…" : "↺"}
            </motion.button>
          )}
        </div>

        {!connected ? (
          <p style={{ fontSize: 12, color: "#52525b", fontFamily: "inherit" }}>Connect to browse tables</p>
        ) : policiesLoading && tables.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[70, 50, 62, 45].map((w, i) => (
              <div key={i} className="shimmer" style={{ height: 28, borderRadius: 8, width: `${w}%` }} />
            ))}
          </div>
        ) : (
          <AnimatePresence>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {["", ...tables].map((t, i) => {
                const active = selectedTable === t;
                return (
                  <motion.button
                    key={t || "__all__"}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025 }}
                    onClick={() => onSelectTable(t)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 10px", borderRadius: 8, fontSize: 12,
                      textAlign: "left", cursor: "pointer", border: "none",
                      background: active ? "#10b98115" : "transparent",
                      color: active ? "#10b981" : "#a1a1aa",
                      borderLeft: active ? "2px solid #10b981" : "2px solid transparent",
                      fontFamily: "var(--font-code), monospace",
                      transition: "all 0.1s",
                      width: "100%",
                    }}
                  >
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t || "All tables"}
                    </span>
                    {t && (
                      <span style={{ fontSize: 10, color: "#3f3f46", flexShrink: 0 }}>
                        {policies.filter((p) => p.table === t).length}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Mini policy list */}
        <AnimatePresence>
          {selectedTable && policies.filter((p) => p.table === selectedTable).length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden", marginTop: 12 }}
            >
              <p style={{ fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", color: "#3f3f46", marginBottom: 6, fontFamily: "inherit" }}>
                Existing policies
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {policies.filter((p) => p.table === selectedTable).map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "4px 8px", borderRadius: 6,
                      background: "#18181b",
                    }}
                  >
                    <span style={{
                      fontSize: 9, fontWeight: 900, fontFamily: "var(--font-code), monospace",
                      padding: "2px 4px", borderRadius: 4,
                      color: CMD_COLOR[p.command] ?? CMD_COLOR.ALL,
                      background: `${CMD_COLOR[p.command] ?? CMD_COLOR.ALL}18`,
                    }}>
                      {p.command}
                    </span>
                    <span style={{ fontSize: 11, color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                      {p.name}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}

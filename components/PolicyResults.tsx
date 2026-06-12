"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GeneratedPolicy } from "@/lib/openai";

const OP_STYLE: Record<string, { color: string; bg: string }> = {
  SELECT: { color: "#60a5fa", bg: "#60a5fa18" },
  INSERT: { color: "#34d399", bg: "#34d39918" },
  UPDATE: { color: "#fbbf24", bg: "#fbbf2418" },
  DELETE: { color: "#f87171", bg: "#f8717118" },
  ALL:    { color: "#a78bfa", bg: "#a78bfa18" },
};

const KEYWORD_COLOR = "#c084fc";
const FN_COLOR      = "#34d399";
const STR_COLOR     = "#fbbf24";
const PLAIN_COLOR   = "#d4d4d8";

const KEYWORDS = new Set([
  "CREATE","POLICY","ON","AS","FOR","TO","USING","WITH","CHECK",
  "PERMISSIVE","RESTRICTIVE","ALTER","TABLE","ENABLE","ROW","LEVEL",
  "SECURITY","BEGIN","END","SELECT","INSERT","UPDATE","DELETE","ALL",
  "PUBLIC","AUTHENTICATED",
]);
const FN_PATTERNS = ["auth.uid()","auth.jwt()","auth.role()"];

function SqlLine({ line }: { line: string }) {
  const tokens = line.split(/(\s+|[(),;])/g);
  return (
    <>
      {tokens.map((t, i) => {
        if (KEYWORDS.has(t.trim().toUpperCase())) return <span key={i} style={{ color: KEYWORD_COLOR }}>{t}</span>;
        if (FN_PATTERNS.some((f) => t.includes(f))) return <span key={i} style={{ color: FN_COLOR }}>{t}</span>;
        if (t.startsWith("'") && t.endsWith("'")) return <span key={i} style={{ color: STR_COLOR }}>{t}</span>;
        return <span key={i} style={{ color: PLAIN_COLOR }}>{t}</span>;
      })}
    </>
  );
}

function SqlBlock({ sql }: { sql: string }) {
  const lines = sql.split("\n");
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i}>
              <td style={{
                paddingRight: 16, textAlign: "right", fontSize: 11, lineHeight: "20px",
                color: "#3f3f46", userSelect: "none", width: 32, verticalAlign: "top",
              }}>
                {i + 1}
              </td>
              <td style={{ fontSize: 12, lineHeight: "20px", whiteSpace: "pre", paddingRight: 8 }}>
                <SqlLine line={line} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <motion.button
      onClick={copy}
      whileTap={{ scale: 0.91 }}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: 6, border: "1px solid #3f3f46",
        fontSize: 11, fontWeight: 500, fontFamily: "inherit",
        background: copied ? "#10b98118" : "#18181b",
        color: copied ? "#34d399" : "#71717a",
        cursor: "pointer", transition: "all 0.15s",
      }}
    >
      <AnimatePresence mode="wait">
        {copied
          ? <motion.span key="y" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>✓ Copied</motion.span>
          : <motion.span key="n" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>Copy</motion.span>
        }
      </AnimatePresence>
    </motion.button>
  );
}

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{ border: "1px solid #27272a", borderRadius: 16, overflow: "hidden", background: "#111113" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #1f1f23" }}>
        <div className="shimmer" style={{ height: 20, width: 56, borderRadius: 6 }} />
        <div className="shimmer" style={{ height: 14, width: 160, borderRadius: 4 }} />
        <div className="shimmer" style={{ height: 26, width: 52, borderRadius: 6, marginLeft: "auto" }} />
      </div>
      <div style={{ padding: "16px", background: "#0a0a0d", display: "flex", flexDirection: "column", gap: 6 }}>
        {[100, 82, 91, 68, 77].map((w, i) => (
          <div key={i} className="shimmer" style={{ height: 12, width: `${w}%`, borderRadius: 4 }} />
        ))}
      </div>
      <div style={{ padding: "10px 16px", borderTop: "1px solid #1f1f23" }}>
        <div className="shimmer" style={{ height: 12, width: "70%", borderRadius: 4 }} />
      </div>
    </motion.div>
  );
}

interface PolicyResultsProps {
  policies: GeneratedPolicy[];
  generating: boolean;
  applying: boolean;
  connected: boolean;
  appliedResults: { policy: string; success: boolean; error?: string }[];
  enableRLS: boolean;
  onToggleRLS: (v: boolean) => void;
  onApply: () => void;
  onCopyAll: () => void;
}

export function PolicyResults({
  policies, generating, applying, connected,
  appliedResults, enableRLS, onToggleRLS, onApply, onCopyAll,
}: PolicyResultsProps) {
  const isEmpty = !generating && policies.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#fafafa", fontFamily: "inherit" }}>
            Generated policies
          </span>
          <AnimatePresence>
            {policies.length > 0 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                  padding: "2px 8px", borderRadius: 99,
                  background: "#10b98120", color: "#10b981",
                }}
              >
                {policies.length}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {policies.length > 0 && !generating && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#71717a", cursor: "pointer", fontFamily: "inherit", userSelect: "none" }}>
                <input type="checkbox" checked={enableRLS} onChange={(e) => onToggleRLS(e.target.checked)}
                  style={{ accentColor: "#10b981", width: 12, height: 12 }} />
                Enable RLS
              </label>

              <button
                onClick={onCopyAll}
                style={{
                  fontSize: 12, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                  background: "#18181b", border: "1px solid #3f3f46",
                  color: "#a1a1aa", fontFamily: "inherit", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#fafafa"; e.currentTarget.style.borderColor = "#52525b"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.borderColor = "#3f3f46"; }}
              >
                Copy all
              </button>

              <motion.button
                onClick={onApply}
                disabled={applying || !connected}
                whileHover={!applying && connected ? { scale: 1.02 } : {}}
                whileTap={!applying && connected ? { scale: 0.97 } : {}}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 8, border: "none",
                  background: connected && !applying ? "#10b981" : "#27272a",
                  color: connected && !applying ? "#022c22" : "#52525b",
                  cursor: connected && !applying ? "pointer" : "not-allowed",
                  fontFamily: "inherit", transition: "all 0.15s",
                }}
              >
                {applying ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", border: "2px solid #02533a", borderTopColor: "#022c22" }}
                    />
                    Applying…
                  </>
                ) : !connected ? "Connect first" : "Apply to Supabase"}
              </motion.button>
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
            style={{ overflow: "hidden", borderRadius: 12, border: "1px solid #27272a", background: "#111113", padding: 10, display: "flex", flexDirection: "column", gap: 4 }}
          >
            {appliedResults.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 12, padding: "6px 10px", borderRadius: 8, fontFamily: "inherit",
                  background: r.success ? "#10b98112" : "#f8717112",
                  color: r.success ? "#34d399" : "#f87171",
                }}
              >
                <span style={{ fontWeight: 700 }}>{r.success ? "✓" : "✗"}</span>
                <span style={{ fontFamily: "var(--font-geist-mono), monospace" }}>{r.policy}</span>
                {r.error && <span style={{ marginLeft: "auto", fontSize: 11, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.error}</span>}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards */}
      <AnimatePresence mode="wait">
        {generating ? (
          <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[0, 1].map((i) => <SkeletonCard key={i} delay={i * 0.1} />)}
          </motion.div>

        ) : isEmpty ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              border: "1px dashed #27272a", borderRadius: 16, background: "#111113",
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: "80px 0", textAlign: "center",
            }}
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ fontSize: 36, marginBottom: 14, userSelect: "none" }}
            >
              🔐
            </motion.div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "#a1a1aa", fontFamily: "inherit" }}>
              No policies generated yet
            </p>
            <p style={{ fontSize: 12, color: "#52525b", marginTop: 6, fontFamily: "inherit" }}>
              Describe a rule above and click Generate
            </p>
          </motion.div>

        ) : (
          <motion.div key="results" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {policies.map((policy, i) => {
              const s = OP_STYLE[policy.operation] ?? OP_STYLE.ALL;
              return (
                <motion.div
                  key={`${policy.name}-${i}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  style={{ border: "1px solid #27272a", borderRadius: 16, overflow: "hidden", background: "#111113" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #1f1f23" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 900, letterSpacing: "0.08em",
                      fontFamily: "var(--font-geist-mono), monospace",
                      padding: "3px 8px", borderRadius: 6,
                      color: s.color, background: s.bg,
                    }}>
                      {policy.operation}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#fafafa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontFamily: "inherit" }}>
                      {policy.name}
                    </span>
                    <CopyButton text={policy.sql} />
                  </div>

                  <div style={{ padding: "16px", background: "#070709" }}>
                    <SqlBlock sql={policy.sql} />
                  </div>

                  {policy.explanation && (
                    <div style={{ display: "flex", gap: 8, padding: "10px 16px", borderTop: "1px solid #1f1f23", alignItems: "flex-start" }}>
                      <span style={{ fontSize: 12, color: "#3f3f46", flexShrink: 0, marginTop: 1 }}>ℹ</span>
                      <p style={{ fontSize: 12, lineHeight: 1.6, color: "#52525b", margin: 0, fontFamily: "inherit" }}>
                        {policy.explanation}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

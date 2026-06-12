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

function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied">("idle");
  const copy = () => {
    navigator.clipboard.writeText(text);
    setState("copied");
    setTimeout(() => setState("idle"), 1800);
  };
  return (
    <motion.button
      onClick={copy}
      whileTap={{ scale: 0.92 }}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors"
      style={{
        background: state === "copied" ? "#10b98120" : "var(--surface-2)",
        color: state === "copied" ? "var(--accent)" : "var(--text-3)",
        cursor: "pointer",
        border: "1px solid var(--border)",
      }}
    >
      <AnimatePresence mode="wait">
        {state === "copied" ? (
          <motion.span key="check" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            ✓ Copied
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            Copy
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function SqlToken({ sql }: { sql: string }) {
  const lines = sql.split("\n");
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="group">
              <td
                className="select-none pr-4 text-right text-[11px] leading-5 w-8 align-top"
                style={{ color: "var(--text-3)", userSelect: "none" }}
              >
                {i + 1}
              </td>
              <td className="text-xs leading-5 pr-2 whitespace-pre">
                <SqlLine line={line} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SqlLine({ line }: { line: string }) {
  const keywords = ["CREATE", "POLICY", "ON", "AS", "FOR", "TO", "USING", "WITH", "CHECK", "PERMISSIVE", "RESTRICTIVE", "ALTER", "TABLE", "ENABLE", "ROW", "LEVEL", "SECURITY", "BEGIN", "END", "SELECT", "INSERT", "UPDATE", "DELETE", "ALL"];
  const functions = ["auth.uid()", "auth.jwt()", "auth.role()"];

  let result = line;
  const parts: { text: string; type: "keyword" | "function" | "string" | "plain" }[] = [];

  const tokenize = (s: string) => {
    const tokens = s.split(/(\s+|[(),;])/g);
    return tokens.map((t) => {
      if (keywords.includes(t.trim().toUpperCase())) return { text: t, type: "keyword" as const };
      if (functions.some((f) => t.includes(f))) return { text: t, type: "function" as const };
      if (t.startsWith("'") && t.endsWith("'")) return { text: t, type: "string" as const };
      return { text: t, type: "plain" as const };
    });
  };

  const COLOR = {
    keyword: "#c084fc",
    function: "#34d399",
    string: "#fbbf24",
    plain: "#e2e8f0",
  };

  return (
    <>
      {tokenize(result).map((p, i) => (
        <span key={i} style={{ color: COLOR[p.type] }}>{p.text}</span>
      ))}
    </>
  );
}

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        <div className="shimmer h-5 w-14 rounded-md" />
        <div className="shimmer h-4 w-40 rounded-md" />
        <div className="ml-auto shimmer h-7 w-14 rounded-lg" />
      </div>
      <div className="p-4 space-y-2">
        {[100, 82, 91, 68, 77].map((w, i) => (
          <div key={i} className="shimmer h-3 rounded" style={{ width: `${w}%`, animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
      <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border-soft)" }}>
        <div className="shimmer h-3 w-3/4 rounded" />
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
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
            Generated policies
          </span>
          <AnimatePresence>
            {policies.length > 0 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "#10b98120", color: "var(--accent)" }}
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
              className="flex items-center gap-2"
            >
              <label
                className="flex items-center gap-1.5 text-xs cursor-pointer select-none"
                style={{ color: "var(--text-3)" }}
              >
                <input
                  type="checkbox"
                  checked={enableRLS}
                  onChange={(e) => onToggleRLS(e.target.checked)}
                  className="accent-emerald-500 w-3 h-3"
                />
                Enable RLS
              </label>
              <button
                onClick={onCopyAll}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text-2)",
                  cursor: "pointer",
                }}
              >
                Copy all
              </button>
              <motion.button
                onClick={onApply}
                disabled={applying || !connected}
                whileHover={!applying && connected ? { scale: 1.02 } : {}}
                whileTap={!applying && connected ? { scale: 0.97 } : {}}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{
                  background: connected && !applying ? "var(--accent)" : "var(--surface-2)",
                  color: connected && !applying ? "#022c22" : "var(--text-3)",
                  cursor: connected && !applying ? "pointer" : "not-allowed",
                }}
              >
                {applying ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="w-3 h-3 border-2 rounded-full inline-block"
                      style={{ borderColor: "#ffffff40", borderTopColor: "#022c22" }}
                    />
                    Applying…
                  </>
                ) : !connected ? "Connect first" : "Apply to Supabase"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Applied results */}
      <AnimatePresence>
        {appliedResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl overflow-hidden space-y-1 p-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {appliedResults.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg"
                style={{
                  background: r.success ? "#10b98112" : "#f8717112",
                  color: r.success ? "#34d399" : "#f87171",
                }}
              >
                <span className="font-bold">{r.success ? "✓" : "✗"}</span>
                <span className="font-mono">{r.policy}</span>
                {r.error && <span className="ml-auto text-[10px] truncate max-w-xs">{r.error}</span>}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Policy cards */}
      <AnimatePresence mode="wait">
        {generating ? (
          <motion.div key="skeletons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {[0, 1].map((i) => <SkeletonCard key={i} delay={i * 0.1} />)}
          </motion.div>
        ) : isEmpty ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl flex flex-col items-center justify-center py-20 text-center"
            style={{ border: "1px dashed var(--border)", background: "var(--surface)" }}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-4xl mb-4 select-none"
            >
              🔐
            </motion.div>
            <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
              No policies generated yet
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
              Describe a rule above and click Generate
            </p>
          </motion.div>
        ) : (
          <motion.div key="results" className="space-y-3">
            {policies.map((policy, i) => {
              const style = OP_STYLE[policy.operation] ?? OP_STYLE.ALL;
              return (
                <motion.div
                  key={`${policy.name}-${i}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl overflow-hidden"
                  style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
                >
                  {/* Card header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: "1px solid var(--border-soft)" }}
                  >
                    <span
                      className="text-[10px] font-black font-mono px-2 py-1 rounded-md tracking-wider"
                      style={{ color: style.color, background: style.bg }}
                    >
                      {policy.operation}
                    </span>
                    <span className="text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>
                      {policy.name}
                    </span>
                    <div className="ml-auto">
                      <CopyButton text={policy.sql} />
                    </div>
                  </div>

                  {/* SQL */}
                  <div className="px-4 py-4" style={{ background: "#0a0a0d" }}>
                    <SqlToken sql={policy.sql} />
                  </div>

                  {/* Explanation */}
                  {policy.explanation && (
                    <div
                      className="px-4 py-3 flex items-start gap-2"
                      style={{ borderTop: "1px solid var(--border-soft)" }}
                    >
                      <span className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>ℹ</span>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
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

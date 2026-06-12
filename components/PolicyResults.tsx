"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Check, ShieldOff, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/components/providers";
import { cn } from "@/lib/utils";
import { GeneratedPolicy } from "@/lib/openai";

const OP_VARIANT: Record<string, string> = {
  SELECT: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/50 dark:border-blue-900",
  INSERT: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/50 dark:border-emerald-900",
  UPDATE: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/50 dark:border-amber-900",
  DELETE: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/50 dark:border-red-900",
  ALL:    "text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950/50 dark:border-purple-900",
};

/* ── Syntax highlighter ───────────────────────────────────── */
const KW = new Set(["CREATE","POLICY","ON","AS","FOR","TO","USING","WITH","CHECK",
  "PERMISSIVE","RESTRICTIVE","ALTER","TABLE","ENABLE","ROW","LEVEL","SECURITY",
  "SELECT","INSERT","UPDATE","DELETE","ALL","PUBLIC","AUTHENTICATED"]);
const FNS = ["auth.uid()","auth.jwt()","auth.role()"];

function SqlLine({ line }: { line: string }) {
  return (
    <>
      {line.split(/(\s+|[(),;])/g).map((tok, i) => {
        if (KW.has(tok.trim().toUpperCase()))
          return <span key={i} className="text-[var(--keyword)]">{tok}</span>;
        if (FNS.some((f) => tok.includes(f)))
          return <span key={i} className="text-[var(--fn-color)]">{tok}</span>;
        if (tok.startsWith("'") && tok.endsWith("'"))
          return <span key={i} className="text-[var(--str-color)]">{tok}</span>;
        return <span key={i} className="text-[var(--plain-color)]">{tok}</span>;
      })}
    </>
  );
}

function SqlBlock({ sql }: { sql: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse" style={{ fontFamily: "var(--font-mono)" }}>
        <tbody>
          {sql.split("\n").map((line, i) => (
            <tr key={i}>
              <td className="pr-4 text-right text-[11px] leading-5 w-8 align-top select-none text-muted-foreground/40">
                {i + 1}
              </td>
              <td className="text-xs leading-5 whitespace-pre pr-2">
                <SqlLine line={line} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Copy button ──────────────────────────────────────────── */
function CopyBtn({ text }: { text: string }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <Button variant="ghost" size="sm" onClick={copy} className="h-7 px-2.5 gap-1.5 text-xs">
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span key="y" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-primary">
            <Check className="w-3 h-3" />{t.copied}
          </motion.span>
        ) : (
          <motion.span key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-1.5">
            <Copy className="w-3 h-3" />{t.copy}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}

/* ── Skeleton card ────────────────────────────────────────── */
function SkeletonCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
        <div className="shimmer h-5 w-14 rounded-md" />
        <div className="shimmer h-4 w-40 rounded" />
        <div className="shimmer h-7 w-14 rounded-md ml-auto" />
      </div>
      <div className="bg-[var(--code-bg)] px-4 py-4 space-y-2">
        {[100, 82, 91, 68, 77].map((w, i) => (
          <div key={i} className="shimmer h-3 rounded" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="px-4 py-3 border-t border-border/50">
        <div className="shimmer h-3 w-3/4 rounded" />
      </div>
    </motion.div>
  );
}

/* ── Main component ───────────────────────────────────────── */
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
  const { t } = useT();
  const isEmpty = !generating && policies.length === 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">{t.generatedPolicies}</h2>
          <AnimatePresence>
            {policies.length > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}>
                <Badge variant="secondary" className="text-[11px] px-2 h-5 bg-primary/10 text-primary border-0">
                  {policies.length}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {policies.length > 0 && !generating && (
            <motion.div
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-2"
            >
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                <input type="checkbox" checked={enableRLS} onChange={(e) => onToggleRLS(e.target.checked)}
                  className="accent-primary w-3 h-3" />
                {t.enableRls}
              </label>
              <Button variant="outline" size="sm" className="h-7 px-3 text-xs gap-1.5" onClick={onCopyAll}>
                <Copy className="w-3 h-3" />{t.copyAll}
              </Button>
              <motion.div whileHover={!applying && connected ? { scale: 1.02 } : {}} whileTap={!applying && connected ? { scale: 0.97 } : {}}>
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs gap-1.5"
                  onClick={onApply}
                  disabled={applying || !connected}
                  variant={connected ? "default" : "outline"}
                >
                  {applying ? (
                    <><Loader2 className="w-3 h-3 animate-spin" />{t.applying}</>
                  ) : (
                    <><Zap className="w-3 h-3" />{!connected ? t.connectFirst : t.applyToSupabase}</>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Apply results */}
      <AnimatePresence>
        {appliedResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border border-border bg-card p-3 space-y-1.5"
          >
            {appliedResults.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={cn(
                  "flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-mono",
                  r.success ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400",
                )}
              >
                <span className="font-bold">{r.success ? "✓" : "✗"}</span>
                <span>{r.policy}</span>
                {r.error && <span className="ml-auto text-[10px] truncate max-w-xs opacity-70">{r.error}</span>}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards */}
      <AnimatePresence mode="wait">
        {generating ? (
          <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {[0, 1].map((i) => <SkeletonCard key={i} delay={i * 0.1} />)}
          </motion.div>

        ) : isEmpty ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center py-20 text-center"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="mb-4"
            >
              <ShieldOff className="w-10 h-10 text-muted-foreground/30" />
            </motion.div>
            <p className="text-sm font-medium text-muted-foreground">{t.noPoliciesYet}</p>
            <p className="text-xs text-muted-foreground/60 mt-1.5">{t.noPoliciesHint}</p>
          </motion.div>

        ) : (
          <motion.div key="results" className="space-y-3">
            {policies.map((policy, i) => (
              <motion.div
                key={`${policy.name}-${i}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                  <span className={cn("text-[10px] font-black font-mono px-2 py-1 rounded-md border tracking-wider", OP_VARIANT[policy.operation] ?? OP_VARIANT.ALL)}>
                    {policy.operation}
                  </span>
                  <span className="text-sm font-medium truncate flex-1">{policy.name}</span>
                  <CopyBtn text={policy.sql} />
                </div>

                <div className="bg-[var(--code-bg)] px-5 py-4">
                  <SqlBlock sql={policy.sql} />
                </div>

                {policy.explanation && (
                  <div className="flex items-start gap-2 px-4 py-3 border-t border-border/50 bg-muted/20">
                    <span className="text-muted-foreground/50 mt-0.5 text-xs shrink-0">ℹ</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{policy.explanation}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

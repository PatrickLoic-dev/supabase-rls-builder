"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sidebar } from "@/components/Sidebar";
import { RuleInput } from "@/components/RuleInput";
import { PolicyResults } from "@/components/PolicyResults";
import { ThemeToggle, LanguageSwitcher } from "@/components/TopbarControls";
import { useT } from "@/components/providers";
import { GeneratedPolicy } from "@/lib/openai";
import { RLSPolicy } from "@/lib/supabase-manager";

interface Creds { supabaseUrl: string; supabaseKey: string; openaiKey: string }
type Toast = { id: number; ok: boolean; msg: string };
let toastId = 0;

export default function Home() {
  const { t } = useT();

  const [creds, setCreds] = useState<Creds>({ supabaseUrl: "", supabaseKey: "", openaiKey: "" });
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [policies, setPolicies] = useState<RLSPolicy[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [policiesLoading, setPoliciesLoading] = useState(false);

  const [description, setDescription] = useState("");
  const [tableName, setTableName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedPolicy[]>([]);

  const [applying, setApplying] = useState(false);
  const [appliedResults, setAppliedResults] = useState<{ policy: string; success: boolean; error?: string }[]>([]);
  const [enableRLS, setEnableRLS] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (ok: boolean, msg: string) => {
    const id = ++toastId;
    setToasts((p) => [...p, { id, ok, msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  };

  const supHeaders = useCallback(() => ({
    "x-supabase-url": creds.supabaseUrl,
    "x-supabase-key": creds.supabaseKey,
  }), [creds.supabaseUrl, creds.supabaseKey]);

  const loadPolicies = useCallback(async (table: string) => {
    setPoliciesLoading(true);
    try {
      const q = table ? `?table=${encodeURIComponent(table)}` : "";
      const res = await fetch(`/api/policies${q}`, { headers: supHeaders() });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPolicies(data.policies ?? []);
      setTables(data.tables ?? []);
    } catch (e) {
      toast(false, e instanceof Error ? e.message : "Error");
    } finally {
      setPoliciesLoading(false);
    }
  }, [supHeaders]);

  const handleConnect = async () => {
    setConnecting(true);
    try { await loadPolicies(""); setConnected(true); toast(true, t.connected); }
    catch { toast(false, t.connectionFailed); }
    finally { setConnecting(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true); setGenerated([]); setAppliedResults([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, tableName, openaiKey: creds.openaiKey }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGenerated(data.policies ?? []);
      toast(true, `${data.policies?.length ?? 0} ${t.generated}`);
    } catch (e) { toast(false, e instanceof Error ? e.message : "Error"); }
    finally { setGenerating(false); }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { ...supHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ sqls: generated.map((p) => p.sql), enableRLS, table: tableName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAppliedResults(data.results ?? []);
      const ok = data.results?.filter((r: { success: boolean }) => r.success).length ?? 0;
      toast(true, t.applyPartial(ok, data.results?.length ?? 0));
      await loadPolicies(selectedTable);
    } catch (e) { toast(false, e instanceof Error ? e.message : "Error"); }
    finally { setApplying(false); }
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(generated.map((p) => p.sql).join("\n\n"));
    toast(true, t.copyAllDone);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Sidebar ── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 272, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="flex-shrink-0 overflow-hidden h-full"
          >
            <div className="w-[272px] h-full">
              <Sidebar
                supabaseUrl={creds.supabaseUrl}
                supabaseKey={creds.supabaseKey}
                openaiKey={creds.openaiKey}
                connected={connected}
                connecting={connecting}
                tables={tables}
                policies={policies}
                selectedTable={selectedTable}
                policiesLoading={policiesLoading}
                onFieldChange={(f, v) => setCreds((p) => ({ ...p, [f]: v }))}
                onConnect={handleConnect}
                onSelectTable={(tb) => {
                  setSelectedTable(tb);
                  loadPolicies(tb);
                  if (tb) setTableName(tb);
                }}
                onRefresh={() => loadPolicies(selectedTable)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="flex-shrink-0 flex items-center gap-3 px-4 h-14 border-b border-border bg-card/50 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-lg"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            <AnimatePresence mode="wait" initial={false}>
              {sidebarOpen ? (
                <motion.span key="close" initial={{ opacity: 0, rotate: -10 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 10 }}>
                  <PanelLeftClose className="w-4 h-4" />
                </motion.span>
              ) : (
                <motion.span key="open" initial={{ opacity: 0, rotate: 10 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -10 }}>
                  <PanelLeftOpen className="w-4 h-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </Button>

          <Separator orientation="vertical" className="h-5" />

          <span className="text-sm font-medium text-muted-foreground">{t.workspace}</span>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">{t.poweredBy}</span>
            <Separator orientation="vertical" className="h-5 hidden sm:block" />
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* Scrollable workspace */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-14 space-y-12">

            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="text-center space-y-2"
            >
              <h1 className="text-3xl font-bold tracking-tight">{t.generateTitle}</h1>
              <p className="text-muted-foreground">{t.generateSubtitle}</p>
            </motion.div>

            {/* Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
            >
              <RuleInput
                description={description}
                tableName={tableName}
                tables={tables}
                generating={generating}
                onChange={(f, v) => { if (f === "description") setDescription(v); else setTableName(v); }}
                onGenerate={handleGenerate}
              />
            </motion.div>

            {/* Divider */}
            <AnimatePresence>
              {(generating || generated.length > 0) && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-4"
                >
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {generating ? t.generating : `${generated.length} ${t.policiesReady}`}
                  </span>
                  <Separator className="flex-1" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
            >
              <PolicyResults
                policies={generated}
                generating={generating}
                applying={applying}
                connected={connected}
                appliedResults={appliedResults}
                enableRLS={enableRLS}
                onToggleRLS={setEnableRLS}
                onApply={handleApply}
                onCopyAll={handleCopyAll}
              />
            </motion.div>
          </div>
        </main>
      </div>

      {/* ── Toasts ── */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t2) => (
            <motion.div
              key={t2.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className={[
                "flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm shadow-lg pointer-events-auto",
                "border backdrop-blur-sm",
                t2.ok
                  ? "bg-card border-emerald-200 dark:border-emerald-900 text-foreground"
                  : "bg-card border-red-200 dark:border-red-900 text-foreground",
              ].join(" ")}
            >
              <span className={t2.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                {t2.ok ? "✓" : "✗"}
              </span>
              {t2.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

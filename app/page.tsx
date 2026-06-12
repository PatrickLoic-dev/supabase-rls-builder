"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "@/components/Sidebar";
import { RuleInput } from "@/components/RuleInput";
import { PolicyResults } from "@/components/PolicyResults";
import { GeneratedPolicy } from "@/lib/openai";
import { RLSPolicy } from "@/lib/supabase-manager";

interface Creds { supabaseUrl: string; supabaseKey: string; openaiKey: string; }

type Toast = { id: number; type: "success" | "error"; message: string };

let toastId = 0;

export default function Home() {
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

  const addToast = (type: Toast["type"], message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const supHeaders = useCallback(() => ({
    "x-supabase-url": creds.supabaseUrl,
    "x-supabase-key": creds.supabaseKey,
  }), [creds.supabaseUrl, creds.supabaseKey]);

  const loadPolicies = useCallback(async (table: string) => {
    setPoliciesLoading(true);
    try {
      const params = table ? `?table=${encodeURIComponent(table)}` : "";
      const res = await fetch(`/api/policies${params}`, { headers: supHeaders() });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPolicies(data.policies ?? []);
      setTables(data.tables ?? []);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to load policies");
    } finally {
      setPoliciesLoading(false);
    }
  }, [supHeaders]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await loadPolicies("");
      setConnected(true);
      addToast("success", "Connected to Supabase");
    } catch {
      addToast("error", "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerated([]);
    setAppliedResults([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, tableName, openaiKey: creds.openaiKey }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGenerated(data.policies ?? []);
      addToast("success", `${data.policies?.length ?? 0} policies generated`);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
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
      addToast("success", `${ok} of ${data.results?.length} policies applied`);
      await loadPolicies(selectedTable);
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Apply failed");
    } finally {
      setApplying(false);
    }
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(generated.map((p) => p.sql).join("\n\n"));
    addToast("success", "All SQL copied to clipboard");
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 272, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="flex-shrink-0 overflow-hidden h-full"
            style={{ background: "var(--surface)" }}
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
                onSelectTable={(t) => { setSelectedTable(t); loadPolicies(t); if (t) setTableName(t); }}
                onRefresh={() => loadPolicies(selectedTable)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div
          className="flex-shrink-0 flex items-center gap-3 px-5 py-3"
          style={{ borderBottom: "1px solid var(--border-soft)", background: "var(--surface)" }}
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex flex-col gap-1 p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-3)", cursor: "pointer" }}
          >
            <span className="block w-4 h-0.5 rounded" style={{ background: "currentColor" }} />
            <span className="block w-3 h-0.5 rounded" style={{ background: "currentColor" }} />
            <span className="block w-4 h-0.5 rounded" style={{ background: "currentColor" }} />
          </motion.button>

          <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>Workspace</span>

          <div className="ml-auto flex items-center gap-2 text-xs" style={{ color: "var(--text-3)" }}>
            <span>Powered by</span>
            <span className="font-semibold" style={{ color: "var(--text-2)" }}>GPT-4o</span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">
            {/* Hero section */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center space-y-3"
            >
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-1)" }}>
                Generate RLS Policies
              </h1>
              <p className="text-base" style={{ color: "var(--text-3)" }}>
                Describe your security rule in plain English — get production-ready SQL
              </p>
            </motion.div>

            {/* Rule input */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-4"
                >
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>
                    {generating ? "Generating…" : `${generated.length} policies ready`}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
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
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-5 right-5 space-y-2 z-50 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm shadow-xl pointer-events-auto"
              style={{
                background: "var(--surface-2)",
                border: `1px solid ${toast.type === "success" ? "#10b98133" : "#f8717133"}`,
                color: toast.type === "success" ? "#34d399" : "#f87171",
                backdropFilter: "blur(8px)",
              }}
            >
              <span className="text-base">{toast.type === "success" ? "✓" : "✗"}</span>
              <span style={{ color: "var(--text-1)" }}>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

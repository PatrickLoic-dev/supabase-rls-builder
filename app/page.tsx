"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { ConnectionPanel } from "@/components/ConnectionPanel";
import { PolicyEditor } from "@/components/PolicyEditor";
import { SqlPreview } from "@/components/SqlPreview";
import { PolicyList } from "@/components/PolicyList";
import { GeneratedPolicy } from "@/lib/openai";
import { RLSPolicy } from "@/lib/supabase-manager";

interface Credentials {
  supabaseUrl: string;
  supabaseKey: string;
  openaiKey: string;
}

export default function Home() {
  const [creds, setCreds] = useState<Credentials>({
    supabaseUrl: "",
    supabaseKey: "",
    openaiKey: "",
  });
  const [connected, setConnected] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [existingPolicies, setExistingPolicies] = useState<RLSPolicy[]>([]);
  const [filterTable, setFilterTable] = useState("");
  const [policiesLoading, setPoliciesLoading] = useState(false);

  const [description, setDescription] = useState("");
  const [tableName, setTableName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedPolicies, setGeneratedPolicies] = useState<GeneratedPolicy[]>([]);

  const [applying, setApplying] = useState(false);
  const [appliedResults, setAppliedResults] = useState<{ policy: string; success: boolean; error?: string }[]>([]);
  const [enableRLS, setEnableRLS] = useState(true);

  const buildSupabaseHeaders = useCallback(
    () => ({
      "x-supabase-url": creds.supabaseUrl,
      "x-supabase-key": creds.supabaseKey,
    }),
    [creds.supabaseUrl, creds.supabaseKey]
  );

  const loadPolicies = useCallback(
    async (table: string) => {
      setPoliciesLoading(true);
      try {
        const params = table ? `?table=${encodeURIComponent(table)}` : "";
        const res = await fetch(`/api/policies${params}`, { headers: buildSupabaseHeaders() });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setExistingPolicies(data.policies ?? []);
        setTables(data.tables ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setPoliciesLoading(false);
      }
    },
    [buildSupabaseHeaders]
  );

  const handleConnect = async () => {
    await loadPolicies("");
    setConnected(true);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedPolicies([]);
    setAppliedResults([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, tableName, openaiKey: creds.openaiKey }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGeneratedPolicies(data.policies ?? []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!connected) {
      alert("Connect to a Supabase project first");
      return;
    }
    setApplying(true);
    try {
      const sqls = generatedPolicies.map((p) => p.sql);
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { ...buildSupabaseHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ sqls, enableRLS, table: tableName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAppliedResults(data.results ?? []);
      await loadPolicies(filterTable);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Apply failed");
    } finally {
      setApplying(false);
    }
  };

  const handleCopyAll = () => {
    const sql = generatedPolicies.map((p) => p.sql).join("\n\n");
    navigator.clipboard.writeText(sql);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-blue-500/4 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative border-b border-gray-800/80 px-6 py-4 backdrop-blur-sm bg-gray-950/80 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
            className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-lg shadow-emerald-500/30"
          >
            RLS
          </motion.div>
          <div>
            <h1 className="text-base font-bold text-white">Supabase RLS Builder</h1>
            <p className="text-[11px] text-gray-500">
              Generate Row Level Security policies from natural language
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2 text-xs text-gray-600">
            <span className="hidden sm:inline">Powered by</span>
            <span className="font-semibold text-gray-400">GPT-4o</span>
          </div>
        </div>
      </motion.header>

      {/* Main */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1 — Connection + existing policies */}
        <div className="space-y-5">
          <ConnectionPanel
            supabaseUrl={creds.supabaseUrl}
            supabaseKey={creds.supabaseKey}
            openaiKey={creds.openaiKey}
            connected={connected}
            onChange={(field, value) => setCreds((prev) => ({ ...prev, [field]: value }))}
            onConnect={handleConnect}
          />
          <PolicyList
            policies={existingPolicies}
            loading={policiesLoading}
            selectedTable={filterTable}
            tables={tables}
            onFilterTable={(t) => {
              setFilterTable(t);
              loadPolicies(t);
            }}
            onRefresh={() => loadPolicies(filterTable)}
          />
        </div>

        {/* Column 2 — Editor */}
        <div className="space-y-5">
          <PolicyEditor
            description={description}
            tableName={tableName}
            tables={tables}
            loading={generating}
            onChange={(field, value) => {
              if (field === "description") setDescription(value);
              else setTableName(value);
            }}
            onGenerate={handleGenerate}
          />
        </div>

        {/* Column 3 — Preview */}
        <div className="space-y-5">
          <SqlPreview
            policies={generatedPolicies}
            generating={generating}
            applying={applying}
            appliedResults={appliedResults}
            enableRLS={enableRLS}
            onToggleRLS={setEnableRLS}
            onApply={handleApply}
            onCopyAll={handleCopyAll}
          />
        </div>
      </main>
    </div>
  );
}

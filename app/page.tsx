"use client";

import { useState, useCallback } from "react";
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

  const buildSupabaseHeaders = useCallback(() => ({
    "x-supabase-url": creds.supabaseUrl,
    "x-supabase-key": creds.supabaseKey,
  }), [creds.supabaseUrl, creds.supabaseKey]);

  const loadPolicies = useCallback(async (table: string) => {
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
  }, [buildSupabaseHeaders]);

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
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-sm font-bold">
            RLS
          </div>
          <div>
            <h1 className="text-lg font-bold">Supabase RLS Builder</h1>
            <p className="text-xs text-gray-500">Generate Row Level Security policies from natural language</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
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
            onFilterTable={(t) => { setFilterTable(t); loadPolicies(t); }}
            onRefresh={() => loadPolicies(filterTable)}
          />
        </div>

        <div className="space-y-6">
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

        <div className="space-y-6">
          <SqlPreview
            policies={generatedPolicies}
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

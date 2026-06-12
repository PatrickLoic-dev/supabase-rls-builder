"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface RuleInputProps {
  description: string;
  tableName: string;
  tables: string[];
  generating: boolean;
  onChange: (f: "description" | "tableName", v: string) => void;
  onGenerate: () => void;
}

const SUGGESTIONS = [
  { icon: "👤", text: "Users can only see their own rows" },
  { icon: "🔐", text: "Only admins can delete records" },
  { icon: "📖", text: "Authenticated users can read, only owners can write" },
  { icon: "🌐", text: "Public rows visible to all, private only to owner" },
  { icon: "🔒", text: "Users can insert but never update or delete" },
];

function GenerateIcon({ spinning }: { spinning: boolean }) {
  if (spinning) {
    return (
      <motion.svg
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round"
        className="w-4 h-4"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </motion.svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export function RuleInput({ description, tableName, tables, generating, onChange, onGenerate }: RuleInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canGenerate = description.trim() && tableName && !generating;

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, [description]);

  const handleKey = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canGenerate) onGenerate();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Table selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm flex-shrink-0" style={{ color: "var(--text-3)" }}>Table:</span>
        {tables.length > 0 ? (
          <select
            value={tableName}
            onChange={(e) => onChange("tableName", e.target.value)}
            className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none appearance-none"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: tableName ? "var(--text-1)" : "var(--text-3)",
            }}
          >
            <option value="">Select a table…</option>
            {tables.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        ) : (
          <input
            type="text"
            placeholder="e.g. profiles, orders…"
            value={tableName}
            onChange={(e) => onChange("tableName", e.target.value)}
            className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none transition-all"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-1)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        )}
      </div>

      {/* Main input */}
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-200"
        style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <textarea
          ref={textareaRef}
          value={description}
          onChange={(e) => onChange("description", e.target.value)}
          onKeyDown={handleKey}
          placeholder="Describe your security rule in plain English…"
          rows={3}
          className="w-full px-5 pt-5 pb-3 text-base resize-none outline-none bg-transparent leading-relaxed"
          style={{ color: "var(--text-1)", minHeight: 96 }}
          onFocus={(e) => {
            const parent = e.target.parentElement!;
            parent.style.borderColor = "#10b98166";
            parent.style.boxShadow = "0 0 0 3px #10b98115";
          }}
          onBlur={(e) => {
            const parent = e.target.parentElement!;
            parent.style.borderColor = "var(--border)";
            parent.style.boxShadow = "none";
          }}
        />
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: "1px solid var(--border-soft)" }}
        >
          <span className="text-xs" style={{ color: "var(--text-3)" }}>
            ⌘ + Enter to generate
          </span>
          <motion.button
            onClick={onGenerate}
            disabled={!canGenerate}
            whileHover={canGenerate ? { scale: 1.03 } : {}}
            whileTap={canGenerate ? { scale: 0.96 } : {}}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-150"
            style={{
              background: canGenerate ? "var(--accent)" : "var(--surface-2)",
              color: canGenerate ? "#022c22" : "var(--text-3)",
              cursor: canGenerate ? "pointer" : "not-allowed",
            }}
          >
            <GenerateIcon spinning={generating} />
            {generating ? "Generating…" : "Generate"}
          </motion.button>
        </div>
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {!description && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap gap-2"
          >
            {SUGGESTIONS.map((s, i) => (
              <motion.button
                key={s.text}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onChange("description", s.text)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text-2)",
                  cursor: "pointer",
                }}
              >
                <span>{s.icon}</span>
                {s.text}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

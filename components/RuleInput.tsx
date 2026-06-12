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

const INPUT_SHARED: React.CSSProperties = {
  background: "#09090b",
  border: "1px solid #3f3f46",
  borderRadius: 10,
  color: "#fafafa",
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

function GenerateIcon({ spinning }: { spinning: boolean }) {
  if (spinning) {
    return (
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
        style={{
          display: "inline-block", width: 14, height: 14, borderRadius: "50%",
          border: "2px solid #02533a", borderTopColor: "#022c22", flexShrink: 0,
        }}
      />
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}
      strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, flexShrink: 0 }}>
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
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [description]);

  const handleKey = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canGenerate) onGenerate();
  };

  return (
    <div style={{ width: "100%", maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Table selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, color: "#71717a", flexShrink: 0, fontFamily: "inherit" }}>Table:</span>
        {tables.length > 0 ? (
          <select
            value={tableName}
            onChange={(e) => onChange("tableName", e.target.value)}
            style={{ ...INPUT_SHARED, flex: 1, padding: "7px 12px", appearance: "none" }}
            onFocus={(e) => { e.target.style.borderColor = "#10b981"; e.target.style.boxShadow = "0 0 0 3px #10b98120"; }}
            onBlur={(e) => { e.target.style.borderColor = "#3f3f46"; e.target.style.boxShadow = "none"; }}
          >
            <option value="" style={{ background: "#18181b" }}>Select a table…</option>
            {tables.map((t) => <option key={t} value={t} style={{ background: "#18181b" }}>{t}</option>)}
          </select>
        ) : (
          <input
            type="text"
            placeholder="e.g. profiles, orders…"
            value={tableName}
            onChange={(e) => onChange("tableName", e.target.value)}
            style={{ ...INPUT_SHARED, flex: 1, padding: "7px 12px" }}
            onFocus={(e) => { e.target.style.borderColor = "#10b981"; e.target.style.boxShadow = "0 0 0 3px #10b98120"; }}
            onBlur={(e) => { e.target.style.borderColor = "#3f3f46"; e.target.style.boxShadow = "none"; }}
          />
        )}
      </div>

      {/* Main textarea card */}
      <div
        id="rule-card"
        style={{
          background: "#111113",
          border: "1px solid #3f3f46",
          borderRadius: 16,
          overflow: "hidden",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
        onFocusCapture={(e) => {
          const card = document.getElementById("rule-card");
          if (card) { card.style.borderColor = "#10b98166"; card.style.boxShadow = "0 0 0 3px #10b98115"; }
        }}
        onBlurCapture={() => {
          const card = document.getElementById("rule-card");
          if (card) { card.style.borderColor = "#3f3f46"; card.style.boxShadow = "none"; }
        }}
      >
        <textarea
          ref={textareaRef}
          value={description}
          onChange={(e) => onChange("description", e.target.value)}
          onKeyDown={handleKey}
          placeholder="Describe your security rule in plain English…"
          rows={3}
          style={{
            display: "block",
            width: "100%",
            padding: "18px 20px 12px",
            fontSize: 15,
            lineHeight: 1.65,
            resize: "none",
            outline: "none",
            background: "transparent",
            border: "none",
            color: "#fafafa",
            fontFamily: "inherit",
            minHeight: 96,
          }}
        />
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px",
          borderTop: "1px solid #1f1f23",
        }}>
          <span style={{ fontSize: 12, color: "#3f3f46", fontFamily: "inherit" }}>⌘ + Enter to generate</span>
          <motion.button
            onClick={onGenerate}
            disabled={!canGenerate}
            whileHover={canGenerate ? { scale: 1.03 } : {}}
            whileTap={canGenerate ? { scale: 0.96 } : {}}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 16px", borderRadius: 10, border: "none",
              fontSize: 13, fontWeight: 600,
              background: canGenerate ? "#10b981" : "#27272a",
              color: canGenerate ? "#022c22" : "#52525b",
              cursor: canGenerate ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            <GenerateIcon spinning={generating} />
            {generating ? "Generating…" : "Generate"}
          </motion.button>
        </div>
      </div>

      {/* Suggestion chips */}
      <AnimatePresence>
        {!description && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
          >
            {SUGGESTIONS.map((s, i) => (
              <motion.button
                key={s.text}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02, borderColor: "#52525b" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onChange("description", s.text)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 99,
                  fontSize: 12, fontFamily: "inherit",
                  background: "#111113",
                  border: "1px solid #3f3f46",
                  color: "#a1a1aa",
                  cursor: "pointer",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#fafafa"; e.currentTarget.style.borderColor = "#52525b"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.borderColor = "#3f3f46"; }}
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

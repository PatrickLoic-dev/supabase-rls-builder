"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, User, Shield, BookOpen, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/components/providers";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  "user": User,
  "shield": Shield,
  "book-open": BookOpen,
  "globe": Globe,
  "lock": Lock,
};

interface RuleInputProps {
  description: string;
  tableName: string;
  tables: string[];
  generating: boolean;
  onChange: (f: "description" | "tableName", v: string) => void;
  onGenerate: () => void;
}

export function RuleInput({ description, tableName, tables, generating, onChange, onGenerate }: RuleInputProps) {
  const { t } = useT();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canGenerate = description.trim() && tableName && !generating;

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 220)}px`;
  }, [description]);

  const handleKey = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canGenerate) onGenerate();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Table selector */}
      <div className="flex items-center gap-3">
        <Label className="text-sm text-muted-foreground shrink-0">{t.tableLabel}:</Label>
        {tables.length > 0 ? (
          <select
            value={tableName}
            onChange={(e) => onChange("tableName", e.target.value)}
            className={cn(
              "flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm",
              "outline-none focus:ring-2 focus:ring-ring/50 transition-shadow",
              "font-mono",
            )}
          >
            <option value="">{t.selectTable}</option>
            {tables.map((tb) => <option key={tb} value={tb}>{tb}</option>)}
          </select>
        ) : (
          <Input
            placeholder={t.tableInputPlaceholder}
            value={tableName}
            onChange={(e) => onChange("tableName", e.target.value)}
            className="flex-1 h-9 text-sm font-mono"
          />
        )}
      </div>

      {/* Textarea card */}
      <div
        className={cn(
          "rounded-xl border bg-card transition-shadow duration-200",
          "focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50",
        )}
      >
        <textarea
          ref={textareaRef}
          value={description}
          onChange={(e) => onChange("description", e.target.value)}
          onKeyDown={handleKey}
          placeholder={t.rulePlaceholder}
          rows={3}
          className={cn(
            "w-full resize-none bg-transparent px-5 pt-5 pb-3",
            "text-base leading-relaxed outline-none",
            "placeholder:text-muted-foreground",
            "font-sans",
          )}
          style={{ minHeight: 104 }}
        />
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50">
          <span className="text-xs text-muted-foreground">{t.shortcut}</span>
          <Button
            size="sm"
            className="gap-2 h-8 px-4 rounded-lg"
            onClick={onGenerate}
            disabled={!canGenerate}
          >
            {generating ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
                  className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full"
                />
                {t.generating}
              </>
            ) : (
              <>
                {t.generate}
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Suggestion chips */}
      <AnimatePresence>
        {!description && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap gap-2"
          >
            {t.suggestions.map((s: { icon: string; text: string }, i: number) => {
              const Icon = ICON_MAP[s.icon] ?? Lock;
              return (
                <motion.button
                  key={s.text}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onChange("description", s.text)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs",
                    "bg-muted hover:bg-accent border border-border hover:border-primary/30",
                    "text-muted-foreground hover:text-accent-foreground",
                    "transition-all duration-150 cursor-pointer",
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {s.text}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

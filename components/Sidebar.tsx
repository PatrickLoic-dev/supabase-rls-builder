"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  Link2, Key, Bot, Wifi, WifiOff, Table2,
  RefreshCw, ChevronRight, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/Logo";
import { useT } from "@/components/providers";
import { cn } from "@/lib/utils";
import { RLSPolicy } from "@/lib/supabase-manager";

interface SidebarProps {
  supabaseUrl: string;
  supabaseKey: string;
  openaiKey: string;
  connected: boolean;
  connecting: boolean;
  tables: string[];
  policies: RLSPolicy[];
  selectedTable: string;
  policiesLoading: boolean;
  onFieldChange: (f: "supabaseUrl" | "supabaseKey" | "openaiKey", v: string) => void;
  onConnect: () => void;
  onSelectTable: (t: string) => void;
  onRefresh: () => void;
}

const CMD_COLORS: Record<string, string> = {
  SELECT: "text-blue-500 bg-blue-500/10",
  INSERT: "text-emerald-600 bg-emerald-500/10",
  UPDATE: "text-amber-600 bg-amber-500/10",
  DELETE: "text-red-500 bg-red-500/10",
  ALL:    "text-purple-500 bg-purple-500/10",
};

export function Sidebar({
  supabaseUrl, supabaseKey, openaiKey,
  connected, connecting, tables, policies, selectedTable, policiesLoading,
  onFieldChange, onConnect, onSelectTable, onRefresh,
}: SidebarProps) {
  const { t } = useT();
  const canConnect = supabaseUrl && supabaseKey && openaiKey;

  return (
    <aside className="flex flex-col h-full bg-[var(--sidebar-bg)] border-r border-border overflow-hidden">
      {/* Brand */}
      <div className="px-5 py-4 flex-shrink-0">
        <Logo showWordmark tagline={t.appTagline} />
      </div>

      <Separator />

      {/* Connection */}
      <div className="px-4 py-4 flex-shrink-0 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {t.connection}
          </span>
          <AnimatePresence>
            {connected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="ml-auto flex items-center gap-1.5"
              >
                <span className="pulse-glow w-1.5 h-1.5 rounded-full bg-primary block" />
                <span className="text-[11px] font-semibold text-primary">{t.live}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5 text-muted-foreground">
              <Link2 className="w-3 h-3" />{t.projectUrl}
            </Label>
            <Input
              type="url"
              placeholder="https://xxxx.supabase.co"
              value={supabaseUrl}
              onChange={(e) => onFieldChange("supabaseUrl", e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5 text-muted-foreground">
              <Key className="w-3 h-3" />{t.serviceRoleKey}
            </Label>
            <Input
              type="password"
              placeholder="eyJ…"
              value={supabaseKey}
              onChange={(e) => onFieldChange("supabaseKey", e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5 text-muted-foreground">
              <Bot className="w-3 h-3" />{t.openAiKey}
            </Label>
            <Input
              type="password"
              placeholder="sk-…"
              value={openaiKey}
              onChange={(e) => onFieldChange("openaiKey", e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>

        <motion.div whileTap={canConnect && !connecting ? { scale: 0.98 } : {}}>
          <Button
            className="w-full h-8 text-xs gap-2"
            onClick={onConnect}
            disabled={!canConnect || connecting}
            variant={connected ? "outline" : "default"}
          >
            {connecting ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="w-3 h-3 border-2 border-current border-t-transparent rounded-full"
              />
            ) : connected ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            {connecting ? t.connecting : connected ? t.reconnect : t.connect}
          </Button>
        </motion.div>
      </div>

      <Separator />

      {/* Tables */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Table2 className="w-3 h-3" />
            {t.tables}{tables.length > 0 && ` (${tables.length})`}
          </span>
          {connected && (
            <Button
              variant="ghost"
              size="icon"
              className="w-5 h-5"
              onClick={onRefresh}
              disabled={policiesLoading}
            >
              <motion.span
                animate={policiesLoading ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 0.8, repeat: policiesLoading ? Infinity : 0, ease: "linear" }}
                className="flex items-center justify-center"
              >
                <RefreshCw className="w-3 h-3" />
              </motion.span>
            </Button>
          )}
        </div>

        {!connected ? (
          <p className="text-xs text-muted-foreground px-1 py-2">{t.connectToBrowse}</p>
        ) : policiesLoading && tables.length === 0 ? (
          <div className="space-y-1.5 px-1">
            {[80, 55, 70, 45].map((w, i) => (
              <div key={i} className="shimmer h-7 rounded-md" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : (
          <AnimatePresence>
            {["", ...tables].map((t2, i) => {
              const active = selectedTable === t2;
              const count = policies.filter((p) => p.table === t2).length;
              return (
                <motion.button
                  key={t2 || "__all__"}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.025 }}
                  onClick={() => onSelectTable(t2)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-left",
                    "transition-colors duration-100 cursor-pointer",
                    active
                      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted border-l-2 border-transparent",
                  )}
                >
                  <span className="flex-1 truncate font-mono">{t2 || t.allTables}</span>
                  {t2 && count > 0 && (
                    <Badge variant="secondary" className="text-[9px] px-1.5 h-4 rounded-sm">{count}</Badge>
                  )}
                  {active && <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />}
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}

        {/* Mini policy list */}
        <AnimatePresence>
          {selectedTable && policies.filter((p) => p.table === selectedTable).length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-2"
            >
              <Separator className="mb-2" />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-1 mb-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />{t.existingPolicies}
              </p>
              <div className="space-y-1">
                {policies.filter((p) => p.table === selectedTable).map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50"
                  >
                    <span className={cn("text-[9px] font-black font-mono px-1.5 py-0.5 rounded", CMD_COLORS[p.command] ?? CMD_COLORS.ALL)}>
                      {p.command}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">{p.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}

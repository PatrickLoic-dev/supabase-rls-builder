"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers";
import { LOCALES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useT();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={t.toggleTheme}
      className="relative w-8 h-8 rounded-lg text-foreground/70 hover:text-foreground"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0,   opacity: 1, scale: 1   }}
            exit={{   rotate:  90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sun className="w-[15px] h-[15px]" />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: 90,  opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0,   opacity: 1, scale: 1   }}
            exit={{   rotate: -90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Moon className="w-[15px] h-[15px]" />
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}

const LOCALE_META: Record<string, { flag: string; label: string }> = {
  en: { flag: "🇬🇧", label: "EN" },
  fr: { flag: "🇫🇷", label: "FR" },
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useT();

  return (
    <div className="flex items-center rounded-lg border border-border bg-muted/50 overflow-hidden p-0.5 gap-0.5">
      {LOCALES.map((l) => {
        const active = locale === l;
        const { flag, label } = LOCALE_META[l];
        return (
          <motion.button
            key={l}
            onClick={() => setLocale(l)}
            whileTap={{ scale: 0.93 }}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition-all duration-150 cursor-pointer",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="text-sm leading-none">{flag}</span>
            <span>{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

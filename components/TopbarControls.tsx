"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Languages } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers";
import { LOCALES } from "@/lib/i18n";

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
      className="relative w-8 h-8 rounded-lg"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sun className="w-4 h-4" />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Moon className="w-4 h-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}

const LOCALE_LABELS: Record<string, { flag: string; label: string }> = {
  en: { flag: "🇬🇧", label: "EN" },
  fr: { flag: "🇫🇷", label: "FR" },
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useT();

  return (
    <div className="flex items-center rounded-lg border border-border overflow-hidden">
      {LOCALES.map((l, i) => {
        const active = locale === l;
        const info = LOCALE_LABELS[l];
        return (
          <motion.button
            key={l}
            onClick={() => setLocale(l)}
            whileTap={{ scale: 0.94 }}
            className={[
              "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer",
              i > 0 ? "border-l border-border" : "",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            ].join(" ")}
          >
            <span className="text-sm leading-none">{info.flag}</span>
            <span>{info.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

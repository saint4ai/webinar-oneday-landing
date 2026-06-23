"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * TerminalTransition — кодерский переход на кремовой бумаге (light-terminal).
 *
 * zsh-prompt печатает команду (typewriter), затем «выводит» заголовок перехода
 * крупным шрифтом. Метафора: спикер запускает следующий шаг как команду.
 * Палитра под light: оранж-prompt + ink-вывод. Уважает prefers-reduced-motion.
 */
export interface TerminalTransitionProps {
  /** Команда после prompt (печатается). */
  command: string;
  /** Промежуточные строки-вывод (серые), появляются после команды. */
  steps?: string[];
  /** Большой «вывод» — заголовок перехода. */
  headline: ReactNode;
  /** Заголовок поверх терминала (zsh — ~/path). */
  title?: string;
  /** Капс на заголовке-выводе (по умолчанию да). */
  uppercase?: boolean;
  className?: string;
}

export function TerminalTransition({
  command,
  steps = [],
  headline,
  title = "zsh — ~/onai",
  uppercase = true,
  className,
}: TerminalTransitionProps) {
  const reduce = useReducedMotion();
  const [typed, setTyped] = useState(reduce ? command.length : 0);
  const done = typed >= command.length;

  useEffect(() => {
    if (reduce || typed >= command.length) return;
    const t = setTimeout(() => setTyped((n) => n + 1), 45);
    return () => clearTimeout(t);
  }, [typed, command.length, reduce]);

  return (
    <div
      className={cn("w-full max-w-[820px] rounded-2xl overflow-hidden", className)}
      style={{
        background: "var(--brand-cream-card, #FBF6EC)",
        border: "1px solid rgba(42,37,32,0.12)",
        boxShadow: "0 40px 90px -34px rgba(42,37,32,0.5), inset 0 1px 0 rgba(255,255,255,0.7)",
      }}
    >
      {/* Tab-bar */}
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ background: "#ECE2D0", borderBottom: "1px solid rgba(42,37,32,0.10)" }}
      >
        <span className="w-3 h-3 rounded-full" style={{ background: "#FC5C02" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#E8B500" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#3FB950" }} />
        <span className="ml-2 font-mono text-[12px] font-medium" style={{ color: "#8A7E6B" }}>
          {title}
        </span>
      </div>

      {/* Тело */}
      <div
        className="px-7 py-6"
        style={{ fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace" }}
      >
        {/* prompt + команда */}
        <div className="text-[14px] md:text-[16px]" style={{ color: "#2A2520" }}>
          <span style={{ color: "#FC5C02", fontWeight: 700 }}>➜</span>{" "}
          <span style={{ color: "#5E7A12" }}>~</span>{" "}
          <span>{command.slice(0, typed)}</span>
          {!done && <span className="cream-caret" style={{ color: "#FC5C02" }}>▌</span>}
        </div>

        {/* промежуточные строки */}
        {done &&
          steps.map((s, i) => (
            <motion.div
              key={i}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 + i * 0.25 }}
              className="text-[13px] md:text-[14px] mt-2 italic"
              style={{ color: "#A2937B" }}
            >
              <span style={{ color: "#5E7A12", fontStyle: "normal" }}>→ </span>
              {s}
            </motion.div>
          ))}

        {/* заголовок-вывод */}
        {done && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + steps.length * 0.25, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold leading-[1.02] tracking-[-0.025em] mt-5"
            style={{
              fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(26px, 3.2cqw, 50px)",
              color: "#2A2520",
              textTransform: uppercase ? "uppercase" : "none",
            }}
          >
            {headline}
            <span
              className="cream-caret inline-block ml-2"
              style={{ width: "0.13em", height: "0.78em", background: "#B6FF00", verticalAlign: "-0.06em", borderRadius: "1px" }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}

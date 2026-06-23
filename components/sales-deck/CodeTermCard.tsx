"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * CodeTermCard — светлая IDE-карточка («крафтовая бумага»), которая объясняет
 * термин через читаемый Python-блок: ключевые слова оранжевые, комментарии =
 * человеческое объяснение, пунчлайн — лайм-маркер.
 *
 * Используется на cream-слайдах (определения терминов + кодерские переходы).
 * Палитра под light-тему — НЕ бренд-лайм на тексте (нечитаемо на креме),
 * лайм только как маркер-подложка.
 */

const TOK = {
  kw: "#D14A00", // ключевые слова (def/return/import) — глубокий оранж
  fn: "#1B7A63", // имена функций/методов — тёмный teal
  com: "#A2937B", // комментарии — тёплый серый
  str: "#5E7A12", // строки/значения — олива (тёмный лайм, читаемо)
  ink: "#2A2520", // обычный текст
} as const;

export type CodeKind = keyof typeof TOK | "hl";
export interface CodeTok {
  text: string;
  k?: CodeKind;
  /** Зачёркнутый «старый способ» — line-through + приглушение. */
  strike?: boolean;
}

export interface CodeTermCardProps {
  filename?: string;
  /** Строки кода: массив строк, каждая — массив токенов. Пустой массив = пустая строка. */
  lines: CodeTok[][];
  /** Подсказки «на полях» (как у кодинг-ассистента): ключ = индекс строки (0-based). */
  hints?: Record<number, string>;
  /** Задержка старта раскатки строк (сек). */
  delay?: number;
  className?: string;
}

export function CodeTermCard({ filename = "vibecoding.py", lines, hints, delay = 0.2, className }: CodeTermCardProps) {
  const reduce = useReducedMotion();

  return (
    <div
      className={cn("relative w-full max-w-[540px] rounded-2xl overflow-hidden", className)}
      style={{
        background: "var(--brand-cream-card, #FBF6EC)",
        border: "1px solid rgba(42,37,32,0.12)",
        boxShadow: "0 36px 80px -32px rgba(42,37,32,0.5), inset 0 1px 0 rgba(255,255,255,0.7)",
      }}
    >
      {/* Tab-bar светлой IDE */}
      <div
        className="flex items-center gap-2.5 px-4 py-2.5"
        style={{ background: "#ECE2D0", borderBottom: "1px solid rgba(42,37,32,0.10)" }}
      >
        <span className="w-3 h-3 rounded-full" style={{ background: "#FC5C02" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#E8B500" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#3FB950" }} />
        <span className="ml-2 font-mono text-[12px] font-medium" style={{ color: "#8A7E6B" }}>
          {filename}
        </span>
      </div>

      {/* Тело кода */}
      <div
        className="px-5 py-4"
        style={{
          fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
          fontSize: "clamp(12px, 1.05cqw, 15px)",
          lineHeight: 1.75,
        }}
      >
        {lines.map((ln, i) => (
          <motion.div
            key={i}
            className="flex gap-4"
            initial={reduce ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: reduce ? 0 : delay + i * 0.16, ease: [0.25, 1, 0.5, 1] }}
          >
            <span className="select-none tabular-nums text-right shrink-0" style={{ width: 18, color: "#CBBEA4" }}>
              {i + 1}
            </span>
            <span className="whitespace-pre-wrap min-h-[1.2em]">
              {ln.map((tok, j) =>
                tok.k === "hl" ? (
                  <span
                    key={j}
                    style={{
                      background: "#B6FF00",
                      color: "#2A2520",
                      padding: "0.05em 0.3em",
                      borderRadius: "0.2em",
                      fontWeight: 700,
                      boxDecorationBreak: "clone",
                      WebkitBoxDecorationBreak: "clone",
                    }}
                  >
                    {tok.text}
                  </span>
                ) : (
                  <span
                    key={j}
                    style={{
                      color: tok.k ? TOK[tok.k] : TOK.ink,
                      fontWeight: tok.k === "kw" ? 700 : 400,
                      fontStyle: tok.k === "com" ? "italic" : "normal",
                      textDecoration: tok.strike ? "line-through" : undefined,
                      textDecorationColor: tok.strike ? "#FC5C02" : undefined,
                      opacity: tok.strike ? 0.42 : 1,
                    }}
                  >
                    {tok.text}
                  </span>
                )
              )}
            </span>
            {hints?.[i] && (
              <span
                className="ml-auto pl-4 italic shrink-0 self-center whitespace-nowrap"
                style={{ color: "#A89A82", fontSize: "0.8em" }}
              >
                <span style={{ color: "#FC5C02", fontStyle: "normal" }}>✦ </span>
                {hints[i]}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

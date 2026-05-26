"use client";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Анимированный псевдо-терминал на фоне фотографии.
 * - Циклически печатает строки кода (typewriter)
 * - IntersectionObserver: останавливает анимацию, когда вне viewport (не нагружает CPU)
 * - React.memo + useMemo для предотвращения лишних ре-рендеров
 */

type Line = {
  type: "prompt" | "log" | "code" | "ok" | "warn";
  text: string;
};

const SCRIPT: Line[] = [
  { type: "prompt", text: "собери мне дашборд для отдела продаж" },
  { type: "log", text: "анализирую требования…" },
  { type: "code", text: "→ Next.js + Supabase + Prisma" },
  { type: "ok", text: "schema базы создана" },
  { type: "prompt", text: "добавь авторизацию через Google" },
  { type: "log", text: "подключаю OAuth…" },
  { type: "code", text: "→ NextAuth + Google Provider" },
  { type: "ok", text: "auth готов" },
  { type: "prompt", text: "выведи KPI команды графиком" },
  { type: "code", text: "→ Recharts + tRPC" },
  { type: "ok", text: "build · deploy · готово" },
];

const TYPE_SPEED_MS = 22;
const LINE_PAUSE_MS = 380;
const LOOP_PAUSE_MS = 1400;

const colorFor = (type: Line["type"]) => {
  switch (type) {
    case "prompt":
      return "text-[#cdeb52]";
    case "ok":
      return "text-[#cdeb52]";
    case "warn":
      return "text-[#fc5c02]";
    case "code":
      return "text-white/80";
    case "log":
      return "text-white/45";
  }
};

const prefixFor = (type: Line["type"]) => {
  switch (type) {
    case "prompt":
      return "> ";
    case "ok":
      return "✓ ";
    case "warn":
      return "! ";
    case "code":
      return "  ";
    case "log":
      return "  ";
  }
};

export const CodeTerminal = memo(function CodeTerminal({
  className,
}: {
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(true);
  const [lines, setLines] = useState<Array<{ type: Line["type"]; text: string }>>(
    []
  );
  const [typing, setTyping] = useState({ idx: 0, char: 0 });

  // Кэшируем SCRIPT через useMemo (стабильная ссылка)
  const script = useMemo(() => SCRIPT, []);

  // IntersectionObserver — pause анимацию когда вне viewport
  useEffect(() => {
    if (!ref.current) return;
    const node = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0, rootMargin: "100px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Typewriter цикл
  useEffect(() => {
    if (!visible) return;

    const current = script[typing.idx];
    if (!current) return;

    // Заканчивается ли строка
    if (typing.char >= current.text.length) {
      const isLast = typing.idx >= script.length - 1;
      const pause = isLast ? LOOP_PAUSE_MS : LINE_PAUSE_MS;

      const t = setTimeout(() => {
        if (isLast) {
          // Сброс цикла
          setLines([]);
          setTyping({ idx: 0, char: 0 });
        } else {
          // Фиксируем строку, переходим к следующей
          setLines((prev) => [...prev, current]);
          setTyping({ idx: typing.idx + 1, char: 0 });
        }
      }, pause);
      return () => clearTimeout(t);
    }

    // Печатаем следующий символ
    const t = setTimeout(() => {
      setTyping((p) => ({ ...p, char: p.char + 1 }));
    }, TYPE_SPEED_MS);
    return () => clearTimeout(t);
  }, [typing, visible, script]);

  const currentLine = script[typing.idx];
  const currentText = currentLine
    ? currentLine.text.slice(0, typing.char)
    : "";

  return (
    <div
      ref={ref}
      className={cn(
        "absolute inset-0 z-0 pointer-events-none overflow-hidden",
        className
      )}
      aria-hidden
    >
      {/* Терминал-card */}
      <div
        className="absolute inset-x-3 top-3 bottom-3 rounded-xl overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(15,15,18,0.96) 0%, rgba(8,8,10,0.92) 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Header — точки macOS */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.05] bg-black/30">
          <span className="w-2 h-2 rounded-full bg-[#FF5F57]" />
          <span className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
          <span className="w-2 h-2 rounded-full bg-[#28C840]" />
          <span className="ml-2 font-mono text-[9px] text-white/35 uppercase tracking-[0.15em]">
            ~/onai · vibe.sh
          </span>
        </div>

        {/* Лог */}
        <div className="px-4 py-3 font-mono text-[10px] leading-[1.7] overflow-hidden">
          {lines.map((line, i) => (
            <div key={i} className={cn("truncate", colorFor(line.type))}>
              <span className="opacity-60">{prefixFor(line.type)}</span>
              {line.text}
            </div>
          ))}
          {currentLine && (
            <div className={cn("truncate", colorFor(currentLine.type))}>
              <span className="opacity-60">{prefixFor(currentLine.type)}</span>
              {currentText}
              <span className="inline-block w-1.5 h-3 bg-[#cdeb52] ml-0.5 align-middle animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

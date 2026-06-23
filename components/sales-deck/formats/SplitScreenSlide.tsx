"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion, type TargetAndTransition } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * SplitScreenSlide — формат №3: split-screen с асимметричной сеткой +
 * code/data-inspired визуал.
 *
 * Идея (референс 21st.dev «split screen code terminal»): экран делится на
 * две асимметричные зоны диагональю/бордером. Левая — крупный текст,
 * правая — code/data-панель (моноширинный, номера строк, diff-подсветка).
 * БЕЗ glassmorphism — панель это «редактор кода», плоская, с тонким бордером.
 *
 * Асимметрия: соотношение колонок 1.15fr / 0.85fr (не 50/50).
 * Зона спикера учтена: правая панель не залезает в speaker-zone.
 * Уважает prefers-reduced-motion. Адаптив: на mobile колонки → стек.
 */
export interface CodeLine {
  /** Текст строки (моноширинный). */
  text: string;
  /** Тип для подсветки: добавление/удаление/коммент/обычная. */
  kind?: "add" | "del" | "comment" | "default";
}

export interface SplitScreenSlideProps {
  kicker?: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  /** Заголовок code-панели (напр. путь файла). */
  panelTitle?: string;
  /** Строки кода/данных для правой панели. */
  codeLines?: CodeLine[];
  /** Произвольный контент правой панели вместо codeLines. */
  panelContent?: ReactNode;
  accent?: string;
  className?: string;
}

const EASE = [0.25, 1, 0.5, 1] as const;
const LIME = "#B6FF00";
const ORANGE = "#FC5C02";

export function SplitScreenSlide({
  kicker,
  title,
  lead,
  children,
  panelTitle = "~/project",
  codeLines,
  panelContent,
  accent = LIME,
  className,
}: SplitScreenSlideProps) {
  const reduce = useReducedMotion();

  const anim = (from: TargetAndTransition, to: TargetAndTransition, delay = 0) =>
    reduce
      ? ({ initial: false, animate: to } as const)
      : ({ initial: from, animate: to, transition: { duration: 0.7, delay, ease: EASE } } as const);

  const kindColor: Record<string, string> = {
    add: LIME,
    del: ORANGE,
    comment: "rgba(255,255,255,0.35)",
    default: "rgba(255,255,255,0.75)",
  };
  const kindPrefix: Record<string, string> = { add: "+", del: "-", comment: "", default: " " };

  return (
    <section
      className={cn("relative w-full h-full overflow-hidden bg-black text-white", className)}
    >
      <div
        className="relative z-10 h-full grid items-center"
        style={{
          // асимметрия 1.15 / 0.85 + зона спикера справа
          gridTemplateColumns: "1.15fr 0.85fr var(--sd-speaker-zone, 25cqw)",
        }}
      >
        {/* ЛЕВО — крупный текст */}
        <div className="flex flex-col justify-center" style={{ paddingLeft: "clamp(48px, 7cqw, 130px)", paddingRight: "3cqw" }}>
          {kicker && (
            <motion.div
              {...anim({ opacity: 0, y: -8 }, { opacity: 1, y: 0 }, 0.1)}
              className="font-mono text-[11px] tracking-[0.22em] uppercase font-semibold mb-5"
              style={{ color: accent }}
            >
              {kicker}
            </motion.div>
          )}

          <motion.h1
            {...(reduce
              ? { initial: false as const, animate: { opacity: 1, clipPath: "inset(0 0% 0 0)" } }
              : {
                  initial: { opacity: 0, clipPath: "inset(0 100% 0 0)" },
                  animate: { opacity: 1, clipPath: "inset(0 0% 0 0)" },
                  transition: { duration: 0.85, delay: 0.2, ease: EASE },
                })}
            className="font-bold uppercase leading-[0.95] tracking-[-0.035em]"
            style={{
              fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(30px, 3.8cqw, 60px)",
            }}
          >
            {title}
          </motion.h1>

          {lead && (
            <motion.div
              {...anim({ opacity: 0, y: 12 }, { opacity: 1, y: 0 }, 0.5)}
              className="text-white/70 text-base md:text-lg leading-snug mt-5 max-w-xl"
            >
              {lead}
            </motion.div>
          )}

          {children && (
            <motion.div {...anim({ opacity: 0, y: 12 }, { opacity: 1, y: 0 }, 0.7)} className="mt-7">
              {children}
            </motion.div>
          )}
        </div>

        {/* ПРАВО — code/data-панель (НЕ glassmorphism, плоский «редактор») */}
        <motion.div
          {...anim({ opacity: 0, x: 30 }, { opacity: 1, x: 0 }, 0.4)}
          className="relative rounded-xl overflow-hidden"
          style={{
            background: "#0a0c0a",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: `0 30px 60px -25px ${accent}30`,
            maxHeight: "78cqh",
          }}
        >
          {/* Title bar редактора */}
          <div
            className="flex items-center gap-2 px-4 py-2.5"
            style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
            <span className="ml-3 font-mono text-[11px] text-white/45">{panelTitle}</span>
          </div>

          {/* Тело панели */}
          <div className="p-4" style={{ fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace" }}>
            {panelContent
              ? panelContent
              : codeLines?.map((ln, i) => {
                  const kind = ln.kind || "default";
                  return (
                    <motion.div
                      key={i}
                      initial={reduce ? false : { opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: reduce ? 0 : 0.6 + i * 0.08 }}
                      className="flex items-start gap-3 text-[12px] md:text-[13px] leading-relaxed"
                    >
                      <span className="select-none text-white/20 tabular-nums w-5 text-right shrink-0">{i + 1}</span>
                      <span className="select-none w-2 shrink-0" style={{ color: kindColor[kind] }}>
                        {kindPrefix[kind]}
                      </span>
                      <span style={{ color: kindColor[kind] }}>{ln.text}</span>
                    </motion.div>
                  );
                })}
          </div>
        </motion.div>

        {/* speaker-zone (пустая колонка) */}
        <div />
      </div>
    </section>
  );
}

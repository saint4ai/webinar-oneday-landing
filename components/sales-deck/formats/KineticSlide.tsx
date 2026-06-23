"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * KineticSlide — формат №2: kinetic typography.
 *
 * Идея (референсы 21st.dev «AnimatedText» / «LayeredText»): заголовок
 * собирается по словам с маска-reveal снизу + stagger, акцентные слова
 * подсвечиваются лаймом. Никакого фона — только движущийся текст на чёрном.
 * Минимальный, «abstract minimal motion» без сфер/glass.
 *
 * Текст разбивается на слова: можно пометить акцентные через {word, accent:true}.
 * Уважает prefers-reduced-motion. Адаптив через clamp().
 */
export interface KineticWord {
  text: string;
  accent?: boolean;
}

export interface KineticSlideProps {
  kicker?: string;
  /** Слова заголовка с пометкой акцента. */
  words: KineticWord[];
  /** Подзаголовок под кинетик-строкой. */
  sub?: ReactNode;
  children?: ReactNode;
  accent?: string;
  /** Выравнивание контента. По умолчанию center (для chapter/engagement). */
  align?: "center" | "left";
  className?: string;
}

const EASE = [0.25, 1, 0.5, 1] as const;

export function KineticSlide({
  kicker,
  words,
  sub,
  children,
  accent = "#B6FF00",
  align = "center",
  className,
}: KineticSlideProps) {
  const reduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.09, delayChildren: reduce ? 0 : 0.2 },
    },
  };
  // Каждое слово выезжает из-под маски (clip снизу вверх)
  const word: Variants = reduce
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: "0.5em" },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      };

  const isCenter = align === "center";

  return (
    <section
      className={cn(
        "relative w-full h-full overflow-hidden bg-black text-white flex flex-col justify-center",
        className
      )}
      style={{
        paddingLeft: isCenter ? undefined : "clamp(48px, 9cqw, 160px)",
        paddingRight: "calc(var(--sd-speaker-zone, 25cqw) + 32px)",
        alignItems: isCenter ? "center" : "flex-start",
        textAlign: isCenter ? "center" : "left",
      }}
    >
      {kicker && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-mono text-[11px] tracking-[0.22em] uppercase font-semibold mb-6"
          style={{ color: accent }}
        >
          {kicker}
        </motion.div>
      )}

      {/* Кинетик-заголовок: слова со stagger + clip-маской */}
      <motion.h1
        variants={container}
        initial="hidden"
        animate="show"
        className={cn("font-bold uppercase leading-[0.95] tracking-[-0.035em]", isCenter ? "justify-center" : "", "flex flex-wrap gap-x-[0.25em]")}
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(40px, 6.5cqw, 110px)",
          maxWidth: isCenter ? "min(90cqw, 70rem)" : "min(46rem, 100%)",
        }}
      >
        {words.map((w, i) => (
          // overflow-hidden обёртка = маска, изнутри слово выезжает
          <span key={i} className="inline-block overflow-hidden" style={{ paddingBottom: "0.08em" }}>
            <motion.span
              variants={word}
              className="inline-block"
              style={w.accent ? { color: accent, textShadow: `0 0 40px ${accent}55` } : undefined}
            >
              {w.text}
            </motion.span>
          </span>
        ))}
      </motion.h1>

      {sub && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reduce ? 0 : 0.2 + words.length * 0.09 + 0.1 }}
          className="text-white/70 text-base md:text-2xl leading-snug mt-7"
          style={{ maxWidth: isCenter ? "min(80cqw, 44rem)" : "min(40rem, 100%)" }}
        >
          {sub}
        </motion.div>
      )}

      {children && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reduce ? 0 : 0.2 + words.length * 0.09 + 0.3 }}
          className="mt-9"
        >
          {children}
        </motion.div>
      )}
    </section>
  );
}

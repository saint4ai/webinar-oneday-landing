"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion, type TargetAndTransition } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * EditorialSlide — формат №1: editorial / magazine layout.
 *
 * Идея (референс 21st.dev «Hero 04»): сильная типографика с отрицательным
 * tracking, гигантский outline-номер на фоне, вертикальный kicker
 * (writing-mode), тонкий blueprint-грид через CSS mask. БЕЗ glassmorphism,
 * сфер и hero-background картинок.
 *
 * Дизайн-язык проекта: чёрный фон, лайм #B6FF00, оранж #FC5C02, benzin display.
 * Уважает prefers-reduced-motion (анимации → мгновенный показ).
 *
 * Адаптив: blueprint-грид + размеры через clamp(); на mobile outline-номер
 * уезжает за край, текст остаётся читаемым (min-width колонок).
 */
export interface EditorialSlideProps {
  /** Большой outline-номер на фоне (напр. "04"). Опционально. */
  bgNumber?: string;
  /** Маленький kicker над заголовком (напр. "ГЛАВА 2"). */
  kicker?: string;
  /** Вертикальный текст по левому краю (writing-mode). Опционально. */
  verticalLabel?: string;
  /** Главный заголовок — основной акцент. */
  title: ReactNode;
  /** Подзаголовок / lead-абзац. */
  lead?: ReactNode;
  /** Доп. контент под lead (теги, список, метрики). */
  children?: ReactNode;
  /** Акцентный цвет (по умолчанию лайм). */
  accent?: string;
  className?: string;
}

const EASE = [0.25, 1, 0.5, 1] as const;

export function EditorialSlide({
  bgNumber,
  kicker,
  verticalLabel,
  title,
  lead,
  children,
  accent = "#B6FF00",
  className,
}: EditorialSlideProps) {
  const reduce = useReducedMotion();

  // Хелпер: при reduced-motion отдаём статичные значения.
  // Типизирован под framer-motion (animate: TargetAndTransition).
  const anim = (from: TargetAndTransition, to: TargetAndTransition, delay = 0) =>
    reduce
      ? ({ initial: false, animate: to } as const)
      : ({ initial: from, animate: to, transition: { duration: 0.7, delay, ease: EASE } } as const);

  return (
    <section
      className={cn("relative w-screen h-screen overflow-hidden bg-black text-white", className)}
    >
      {/* Blueprint-грид с радиальным mask — НЕ gradient-сфера */}
      <div
        aria-hidden
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 70% 70% at 30% 50%, #000 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 30% 50%, #000 0%, transparent 80%)",
        }}
      />

      {/* Гигантский outline-номер на фоне */}
      {bgNumber && (
        <motion.div
          aria-hidden
          {...anim({ opacity: 0, x: -40 }, { opacity: 1, x: 0 }, 0.1)}
          className="absolute z-0 pointer-events-none select-none font-bold leading-none"
          style={{
            right: "calc(var(--sd-speaker-zone, 25vw) - 4vw)",
            top: "50%",
            transform: "translateY(-50%)",
            fontFamily: "var(--font-benzin), system-ui, sans-serif",
            fontSize: "clamp(180px, 32vw, 520px)",
            color: "transparent",
            WebkitTextStroke: `1.5px ${accent}22`,
          }}
        >
          {bgNumber}
        </motion.div>
      )}

      {/* Вертикальный label по левому краю */}
      {verticalLabel && (
        <motion.div
          {...anim({ opacity: 0 }, { opacity: 1 }, 0.3)}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-10 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 hidden md:block"
          style={{ writingMode: "vertical-rl", transform: "translateY(-50%) rotate(180deg)" }}
        >
          {verticalLabel}
        </motion.div>
      )}

      {/* Контент — editorial-колонка, прижата влево, зона спикера справа свободна */}
      <div
        className="relative z-10 h-full flex flex-col justify-center"
        style={{ paddingLeft: "clamp(48px, 9vw, 160px)", paddingRight: "calc(var(--sd-speaker-zone, 25vw) + 32px)" }}
      >
        <div className="max-w-[46rem]">
          {kicker && (
            <motion.div
              {...anim({ opacity: 0, y: -8 }, { opacity: 1, y: 0 }, 0.15)}
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
            className="font-bold uppercase leading-[0.92] tracking-[-0.04em]"
            style={{
              fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(34px, 5vw, 84px)",
            }}
          >
            {title}
          </motion.h1>

          {lead && (
            <motion.div
              {...anim({ opacity: 0, y: 12 }, { opacity: 1, y: 0 }, 0.5)}
              className="text-white/70 text-base md:text-xl leading-snug mt-6"
            >
              {lead}
            </motion.div>
          )}

          {children && (
            <motion.div {...anim({ opacity: 0, y: 12 }, { opacity: 1, y: 0 }, 0.7)} className="mt-8">
              {children}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { BinaryDecodeText } from "./BinaryDecodeText";
import { LiquidBackground } from "./LiquidBackground";
import { SlideLayout } from "./SlideLayout";

interface CyberpunkChapterProps {
  chapterNumber: string; // "ГЛАВА 1" или "ЧАСТЬ V"
  subtitle?: string;
  /** Графика слева от заголовка (например, claude-code terminal). Опционально. */
  leftContent?: ReactNode;
  className?: string;
}

/**
 * CyberpunkChapter — chapter-screen в стиле cyberpunk glitch.
 * Из правила memory/feedback_chapter_screen_cyberpunk_animation.md.
 *
 * Структура:
 *  - LiquidBackground variant="water" — мрачная вода с лайм-каустикой под текстом
 *  - Scan lines (CSS .sd-scan-lines) — движутся вверх
 *  - GlitchText "heavy" intensity на номере главы — RGB-split + 6-8 микро-сдвигов за 600мс
 *  - Subtitle — обычный fade-in после glitch
 *  - leftContent — слот для графики слева (terminal и т.п.)
 *
 * 📐 SlideLayout с зоной спикера справа. Без leftContent — заголовок занимает левую/центр.
 *
 * После заходящей анимации — CUT в следующий слайд без exit-fade.
 */
export function CyberpunkChapter({
  chapterNumber,
  subtitle,
  leftContent,
  className,
}: CyberpunkChapterProps) {
  return (
    <SlideLayout
      speakerSide="right"
      className={className}
      objectColumnSize={leftContent ? "32vw" : "0px"}
      background={
        <>
          <LiquidBackground variant="water" opacity={0.35} />
          <div className="sd-scan-lines" />
          <div
            className="absolute inset-0 pointer-events-none z-[1]"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)",
            }}
          />
        </>
      }
      leftObject={
        leftContent ? (
          <div className="w-full max-w-[460px] px-6">{leftContent}</div>
        ) : undefined
      }
    >
      {/* Гибрид: binary→текст decode + cyberpunk RGB-split + shake на сборке.
          Размер адаптивен по длине названия — длинные («ТРИ НАПРАВЛЕНИЯ»)
          НЕ лезут в зону спикера (max-width ограничен контентной колонкой). */}
      <div className="sd-glitch-rgb sd-chapter-shake" style={{ maxWidth: "100%" }}>
        <BinaryDecodeText
          text={chapterNumber}
          color="#ffffff"
          bitColor="rgba(182,255,0,0.6)"
          accentColor="#B6FF00"
          perChar={chapterNumber.length > 8 ? 90 : 130}
          startDelay={150}
          className="font-bold uppercase text-white leading-[0.96] tracking-[-0.04em] block"
          style={{
            fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
            fontSize:
              chapterNumber.length > 11
                ? "clamp(42px, 4.4vw, 80px)"
                : chapterNumber.length > 7
                ? "clamp(48px, 5.4vw, 96px)"
                : "clamp(56px, 7vw, 120px)",
            wordBreak: "keep-all",
            overflowWrap: "normal",
          }}
        />
      </div>

      {subtitle && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8, ease: [0.25, 1, 0.5, 1] }}
          className="text-white/85 text-sm md:text-base leading-snug font-mono uppercase tracking-[0.12em] mt-10"
          style={{ fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace" }}
        >
          {subtitle}
        </motion.div>
      )}

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 220 }}
        transition={{ duration: 0.7, delay: 1.2, ease: [0.25, 1, 0.5, 1] }}
        className="h-[2px] bg-[#B6FF00] mt-5"
        style={{ boxShadow: "0 0 12px rgba(182,255,0,0.6)" }}
      />
    </SlideLayout>
  );
}

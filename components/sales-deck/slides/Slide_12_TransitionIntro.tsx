"use client";

import { TerminalTransition } from "../TerminalTransition";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 12 · Переход-интро — CREAM кодерский терминал.
 * zsh печатает команду → «выводит» заголовок. Текст 1-в-1 из STRUCTURE.
 */
export function Slide_12_TransitionIntro() {
  return (
    <SlideLayout
      speakerSide="right"
      style={{ background: "var(--brand-cream)" }}
      background={
        <>
          <div className="cream-grid" />
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              top: "-12rem",
              left: "10%",
              width: 600,
              height: 600,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(252,92,2,0.12), transparent 68%)",
              filter: "blur(16px)",
            }}
          />
          <div className="cream-grain" />
        </>
      }
    >
      <TerminalTransition
        title="zsh — ~/onai"
        command="cat about_me.txt"
        steps={["несколько слов о себе…"]}
        headline={
          <>
            ПРЕЖДЕ ЧЕМ <span style={{ color: "#FC5C02" }}>НАЧНЁМ</span>
          </>
        }
      />
    </SlideLayout>
  );
}

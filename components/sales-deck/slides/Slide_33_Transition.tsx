"use client";

import { TerminalTransition } from "../TerminalTransition";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 33 · Переход — CREAM кодерский терминал.
 * python-команда → «компилирует» → выводит «НАЧНЁМ С ГЛАВНОГО».
 * Текст 1-в-1 из STRUCTURE.
 */
export function Slide_33_Transition() {
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
              bottom: "-14rem",
              right: "14%",
              width: 640,
              height: 640,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(252,92,2,0.13), transparent 68%)",
              filter: "blur(16px)",
            }}
          />
          <div className="cream-grain" />
        </>
      }
    >
      <TerminalTransition
        title="python — ~/onai"
        command="python start.py --next"
        steps={["с того, что чаще всего просят на рынке…"]}
        headline={
          <>
            НАЧНЁМ С <span style={{ color: "#FC5C02" }}>ГЛАВНОГО</span>
          </>
        }
      />
    </SlideLayout>
  );
}

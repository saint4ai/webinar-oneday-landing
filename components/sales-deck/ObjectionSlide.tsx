"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { SlideBg } from "./SlideBg";
import { SlideLayout } from "./SlideLayout";

interface ObjectionSlideProps {
  n: number;
  question: string;
  answer: string;
  children?: ReactNode;
  bg?: "orange-pain" | "lime-right" | "climax" | "aura-tl" | "aura-tr";
  qSize?: string; // override clamp при плотном body
}

/**
 * DL-4 брутализм для блока возражений (150-153). Узнаваемый «нокаут-вопрос»:
 * лайм-таб «ВОЗРАЖЕНИЕ N / 4» → гигантский вопрос белым → ответ в лайм-рамке слева → body (children).
 * Зритель мгновенно считывает тип слайда; body варьируется под конкретное возражение.
 */
export function ObjectionSlide({ n, question, answer, children, bg = "aura-tl", qSize = "clamp(30px, 4.2vw, 64px)" }: ObjectionSlideProps) {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={780} background={<SlideBg theme="dark" variant={bg} />}>
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="inline-flex items-center gap-2 self-start mb-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] font-bold text-black px-2.5 py-1 rounded" style={{ background: "#FC5C02" }}>ВОЗРАЖЕНИЕ {n}</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">/ 4</span>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[0.98] tracking-[-0.03em] mb-4"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: qSize }}
      >
        {question}
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-[#B6FF00] font-semibold text-base md:text-xl leading-snug max-w-2xl border-l-2 pl-4 mb-5" style={{ borderColor: "#B6FF00" }}>
        {answer}
      </motion.div>
      {children && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
          {children}
        </motion.div>
      )}
    </SlideLayout>
  );
}

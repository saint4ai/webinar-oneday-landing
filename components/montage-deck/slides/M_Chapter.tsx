"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { MontageBg } from "../MontageBg";
import { T } from "../theme";
import { EASE, H, Kicker, Lead, Px } from "../ui";

const BANDS = 6;

/** Экран урока или главы: большой знак собирается из золотых полос, въезжающих с чередующихся сторон. */
export function M_Chapter({ big, kicker, title, sub, bigSize = "13cqw", obj }: { big: string; kicker?: string; title: string; sub?: string; bigSize?: string; obj?: string }) {
  const text: React.CSSProperties = {
    fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: bigSize, lineHeight: 0.9, letterSpacing: "-.05em", whiteSpace: "nowrap",
    background: `linear-gradient(180deg, ${T.gold}, ${T.gold2})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
  };
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="soft" />}>
      <div className="flex items-end gap-[2cqw]">
      <div className="relative" style={{ height: `calc(${bigSize} * 0.95)` }}>
        <span style={{ ...text, visibility: "hidden" }}>{big}</span>
        {Array.from({ length: BANDS }, (_, i) => {
          const top = (i * 100) / BANDS;
          const bottom = 100 - ((i + 1) * 100) / BANDS;
          return (
            <motion.span
              key={i}
              aria-hidden
              className="absolute left-0 top-0"
              style={{ ...text, clipPath: `inset(${top}% 0 ${bottom}% 0)` }}
              initial={{ x: i % 2 ? "18cqw" : "-18cqw", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.1 + i * 0.07, ease: EASE }}
            >
              {big}
            </motion.span>
          );
        })}
      </div>
      {obj && <Px name={obj} size="14cqw" delay={0.55} style={{ marginBottom: "-0.5cqw" }} />}
      </div>
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, delay: 0.7, ease: EASE }}
        style={{ width: "6cqw", height: 3, background: T.accent, margin: "2cqw 0 1.6cqw", borderRadius: 2, transformOrigin: "left" }} />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.85, ease: EASE }}>
        {kicker && <Kicker>{kicker}</Kicker>}
        <H size="3.4cqw">{title}</H>
        {sub && <Lead style={{ marginTop: "1.2cqw", maxWidth: "46cqw" }}>{sub}</Lead>}
      </motion.div>
    </SlideLayout>
  );
}

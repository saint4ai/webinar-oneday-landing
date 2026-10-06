"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { VoxelField } from "../fx";
import { MontageBg } from "../MontageBg";
import { LT, T, goldText } from "../theme";
import { EASE, H, Kicker, Lead, Px, RISE_DUR, STEP } from "../ui";

/**
 * Экран урока или главы, ночной: фоном поле столбиков (гаснет к зоне камеры), огромная золотая цифра
 * поднимается из глубины, по ней один раз проходит блик, заголовок въезжает следом. Без глитча.
 */
export function M_Chapter({ big, kicker, title, sub, bigSize = "16cqw", obj }: { big: string; kicker?: string; title: string; sub?: string; bigSize?: string; obj?: string }) {
  const text: React.CSSProperties = {
    fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: bigSize, lineHeight: 0.9, letterSpacing: "-.05em", whiteSpace: "nowrap",
  };
  const after = 0.45; // заголовок — сразу за цифрой
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="night"><VoxelField /></MontageBg>} contentMinWidth={0}>
      <style>{`@keyframes ch-shine { from { background-position: 160% 0; } to { background-position: -60% 0; } }`}</style>
      <div className="flex items-end gap-[1.6cqw]">
        <motion.div className="relative" initial={{ opacity: 0, y: "3cqw", scale: 0.9 }} animate={{ opacity: 1, y: "0cqw", scale: 1 }}
          transition={{ duration: 0.6, ease: EASE }} style={{ transformOrigin: "left bottom" }}>
          <div style={{ ...text, ...goldText, filter: `drop-shadow(0 1.2cqw 2.4cqw rgba(20,16,14,.6))` }}>{big}</div>
          {/* Блик по золоту — один проход */}
          <div aria-hidden className="absolute inset-0" style={{
            ...text, color: "transparent",
            backgroundImage: `linear-gradient(100deg, transparent 38%, ${LT.card}B3 50%, transparent 62%)`,
            backgroundSize: "250% 100%", backgroundRepeat: "no-repeat", WebkitBackgroundClip: "text", backgroundClip: "text",
            animation: "ch-shine 1.4s ease-out 0.5s both",
          }}>{big}</div>
        </motion.div>
        {obj && <Px name={obj} size="11cqw" delay={0.3} style={{ marginBottom: "0.4cqw" }} />}
      </div>
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4, delay: after - STEP, ease: EASE }}
        style={{ width: "6cqw", height: "0.2cqw", background: T.gold2, margin: "2.2cqw 0 1.6cqw", borderRadius: 2, transformOrigin: "left" }} />
      <motion.div initial={{ opacity: 0, x: "-1.5cqw" }} animate={{ opacity: 1, x: "0cqw" }} transition={{ duration: RISE_DUR, delay: after, ease: EASE }}>
        {kicker && <Kicker color={T.gold}>{kicker}</Kicker>}
        <H size="3.4cqw" color={T.nightText} style={{ maxWidth: "50cqw" }}>{title}</H>
      </motion.div>
      {sub && (
        <motion.div initial={{ opacity: 0, x: "-1.5cqw" }} animate={{ opacity: 1, x: "0cqw" }} transition={{ duration: RISE_DUR, delay: after + STEP, ease: EASE }}>
          <Lead color={T.nightMuted} style={{ marginTop: "1.2cqw", maxWidth: "46cqw" }}>{sub}</Lead>
        </motion.div>
      )}
    </SlideLayout>
  );
}

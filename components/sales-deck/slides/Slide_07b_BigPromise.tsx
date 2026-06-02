"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Gift, Sparkles } from "lucide-react";

/**
 * Слайд «Большое обещание» — после S07_Program (агенда эфира).
 * Приём конкурента (скрин 20:12): озвучили программу → большое обещание + тизер презентации обучения.
 * Текст Александра: «отдам опыт за 3 года» + «представлю обучение, лучшие условия + прикладные AI-бонусы».
 */
const CARDS = [
  {
    Icon: Sparkles,
    title: "3 года опыта — за один день",
    body: "Реальные проекты, мои ошибки и рабочие схемы. Без воды — в конце ты поймёшь, как применить это у себя.",
    accent: "#B6FF00",
  },
  {
    Icon: Gift,
    title: "Представлю своё обучение",
    body: "Кто решит идти со мной дальше — заберёт лучшие условия по цене и крутые прикладные AI-бонусы.",
    accent: "#FC5C02",
  },
];

export function Slide_07b_BigPromise() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={780} background={<SlideBg theme="dark" variant="lime-right" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ЧЕСТНО
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-6"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 4vw, 60px)" }}
      >
        ОТДАМ ВСЁ, ЧТО <span className="text-[#B6FF00]">ЗНАЮ</span>
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mb-6">
        {CARDS.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.45 + i * 0.18, ease: [0.25, 1, 0.5, 1] }}
            className="rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: `${c.accent}10`, border: `1px solid ${c.accent}55`, boxShadow: `0 0 50px -20px ${c.accent}66` }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${c.accent}1f`, border: `1px solid ${c.accent}66` }}>
              <c.Icon className="w-5 h-5" strokeWidth={2.2} style={{ color: c.accent }} />
            </div>
            <div className="font-bold text-white leading-tight" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(18px, 1.7vw, 26px)" }}>{c.title}</div>
            <div className="text-white/75 text-sm md:text-base leading-snug">{c.body}</div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.9 }} className="text-white/85 text-base md:text-lg leading-snug max-w-2xl">
        Оставайся до конца — <span className="text-[#B6FF00] font-semibold">самое ценное будет там</span>.
      </motion.div>
    </SlideLayout>
  );
}

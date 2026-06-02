"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { ArrowRight } from "lucide-react";

/**
 * Блок C · Смысл 3 — карьера. После Smysl2.
 * НЕочевидное: рост ≠ больше часов. Смена роли: из исполнителя → в того, к кому приходят.
 * Приём: типографика-манифест (крупный H1) + одна горизонтальная смена роли. Меняем язык с карточек.
 */
export function Slide_Smysl3_Career() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={780} background={<SlideBg theme="dark" variant="climax" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-4">
        // КАРЬЕРА
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.85, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.035em] mb-4"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(32px, 4.4vw, 70px)" }}
      >
        РОСТ — ЭТО НЕ <span className="text-[#B6FF00]">БОЛЬШЕ РАБОТАТЬ</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-base md:text-xl leading-snug max-w-2xl mb-8">
        Пока продаёшь часы — потолок виден сразу.
      </motion.div>

      {/* Смена роли */}
      <div className="flex items-center gap-4 md:gap-5 flex-wrap mb-7">
        <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, delay: 0.65 }} className="rounded-2xl px-5 py-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <div className="text-white font-bold text-lg md:text-2xl leading-tight" style={{ fontFamily: "var(--font-benzin), system-ui" }}>ИСПОЛНИТЕЛЬ</div>
          <div className="text-white/45 text-sm md:text-base">которого нанимают</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.95 }}>
          <ArrowRight className="w-8 h-8 md:w-10 md:h-10 text-[#FC5C02]" strokeWidth={2.4} />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, delay: 1.1 }} className="rounded-2xl px-5 py-4" style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.45)", boxShadow: "0 0 50px -14px rgba(182,255,0,0.45)" }}>
          <div className="text-[#B6FF00] font-bold text-lg md:text-2xl leading-tight" style={{ fontFamily: "var(--font-benzin), system-ui" }}>ТОТ, К КОМУ ПРИХОДЯТ</div>
          <div className="text-white/60 text-sm md:text-base">за результатом</div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.35 }} className="text-white/85 text-base md:text-lg leading-snug max-w-2xl">
        Не нагрузка растёт — <span className="text-[#B6FF00] font-semibold">растёт доход</span>.
      </motion.div>
    </SlideLayout>
  );
}

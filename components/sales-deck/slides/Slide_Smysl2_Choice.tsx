"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { TrendingDown, TrendingUp } from "lucide-react";

/**
 * Блок C · Смысл 2 — выбор позиции. После Smysl1_Proof.
 * НЕочевидное: инструмент один, разница — где ты по отношению к нему (под ним vs над ним).
 * Приём: две траектории (вниз оранж / вверх лайм) с «ИЛИ». Упрощено — без «почасовку».
 */
export function Slide_Smysl2_Choice() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={780} background={<SlideBg theme="dark" variant="aura-tr" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ТВОЙ ВЫБОР
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.04] tracking-[-0.03em] mb-7"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3.1vw, 50px)" }}
      >
        КОНКУРИРОВАТЬ С НЕЙРОНКОЙ <span className="text-white/45">ИЛИ</span> <span className="text-[#B6FF00]">УПРАВЛЯТЬ ЕЙ</span>
      </motion.h1>

      <div className="flex items-stretch gap-4 max-w-3xl mb-6 flex-wrap">
        {/* КОНКУРИРОВАТЬ — вниз */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.5, ease: [0.25, 1, 0.5, 1] }} className="flex-1 min-w-[260px] rounded-2xl p-5" style={{ background: "rgba(252,92,2,0.06)", border: "1px solid rgba(252,92,2,0.3)" }}>
          <div className="flex items-center gap-2.5 mb-3">
            <TrendingDown className="w-6 h-6 text-[#FC5C02]" strokeWidth={2.4} />
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] font-bold text-[#FC5C02]">КОНКУРИРОВАТЬ</span>
          </div>
          <div className="text-white/85 text-sm md:text-base leading-snug">Продаёшь своё время. Нейросеть делает то же за минуты — и <span className="text-[#FC5C02] font-semibold">платят тебе всё меньше</span>.</div>
        </motion.div>

        {/* УПРАВЛЯТЬ — вверх */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.72, ease: [0.25, 1, 0.5, 1] }} className="flex-1 min-w-[260px] rounded-2xl p-5" style={{ background: "rgba(182,255,0,0.07)", border: "1px solid rgba(182,255,0,0.4)", boxShadow: "0 0 50px -16px rgba(182,255,0,0.4)" }}>
          <div className="flex items-center gap-2.5 mb-3">
            <TrendingUp className="w-6 h-6 text-[#B6FF00]" strokeWidth={2.4} />
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] font-bold text-[#B6FF00]">УПРАВЛЯТЬ</span>
          </div>
          <div className="text-white/85 text-sm md:text-base leading-snug">Управляешь нейросетью. Продаёшь результат — и <span className="text-[#B6FF00] font-semibold">берёшь больше за меньшее время</span>.</div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.1 }} className="text-white/85 text-base md:text-lg leading-snug max-w-2xl">
        Инструмент один и тот же. Разница — <span className="text-[#B6FF00] font-semibold">где ты по отношению к нему</span>: под ним или над ним.
      </motion.div>
    </SlideLayout>
  );
}

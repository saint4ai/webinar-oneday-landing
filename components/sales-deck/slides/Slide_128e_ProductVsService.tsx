"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { User, Server } from "lucide-react";

/**
 * Слайд 128e · «Услуга vs продукт» — закрывашка прогрева B перед 129 (390).
 * НЕочевидная математика: услуга 1:1 (продал время — кончилось), продукт 1:много (собрал раз — обслуживает всех).
 * Приём: визуальный контраст точками-клиентами, не текстовая колонка. Без «пассивного дохода» и «пока спишь».
 */
export function Slide_128e_ProductVsService() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={780} background={<SlideBg theme="dark" variant="aura-tr" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // УСЛУГА ПРОТИВ ПРОДУКТА
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.04] tracking-[-0.03em] mb-6"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 2.9vw, 46px)" }}
      >
        УСЛУГУ ДЕЛАЕШЬ КАЖДЫЙ РАЗ ЗАНОВО — <span className="text-[#B6FF00]">ПРОДУКТ СОБИРАЕШЬ ОДИН РАЗ</span>
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mb-6">
        {/* УСЛУГА — 1:1 */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.5, ease: [0.25, 1, 0.5, 1] }} className="rounded-2xl p-5 flex flex-col" style={{ background: "rgba(252,92,2,0.06)", border: "1px solid rgba(252,92,2,0.3)" }}>
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] font-bold text-[#FC5C02] mb-4">УСЛУГА · 1 : 1</div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(252,92,2,0.18)", border: "1px solid rgba(252,92,2,0.5)" }}>
              <User className="w-5 h-5 text-[#FC5C02]" strokeWidth={2.2} />
            </div>
            <div className="h-[2px] w-8 shrink-0" style={{ background: "rgba(252,92,2,0.5)" }} />
            <div className="w-9 h-9 rounded-full shrink-0" style={{ border: "2px solid rgba(252,92,2,0.45)" }} />
            <span className="text-white/55 text-sm ml-1">один клиент за раз</span>
          </div>
          <div className="text-white/85 text-sm md:text-base leading-snug mt-auto">Продал время — оно <span className="text-[#FC5C02] font-semibold">кончилось</span>. Завтра — сначала.</div>
        </motion.div>

        {/* ПРОДУКТ — 1:много */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.75, ease: [0.25, 1, 0.5, 1] }} className="rounded-2xl p-5 flex flex-col" style={{ background: "rgba(182,255,0,0.07)", border: "1px solid rgba(182,255,0,0.4)", boxShadow: "0 0 50px -16px rgba(182,255,0,0.4)" }}>
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] font-bold text-[#B6FF00] mb-4">ПРОДУКТ · 1 : ∞</div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#B6FF00", boxShadow: "0 0 24px -4px rgba(182,255,0,0.7)" }}>
              <Server className="w-5 h-5 text-black" strokeWidth={2.2} />
            </div>
            <div className="h-[2px] w-6 shrink-0" style={{ background: "rgba(182,255,0,0.5)" }} />
            <div className="flex flex-wrap gap-1.5 max-w-[150px]">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25, delay: 1.0 + i * 0.05 }} className="w-3 h-3 rounded-full" style={{ background: "rgba(182,255,0,0.8)" }} />
              ))}
            </div>
          </div>
          <div className="text-white/85 text-sm md:text-base leading-snug mt-auto">Собрал один раз — <span className="text-[#B6FF00] font-semibold">обслуживает десятки разом</span>.</div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.5 }} className="text-white/85 text-base md:text-lg leading-snug max-w-2xl">
        Ты не обслужишь десять человек разом — а то, что ты собрал, может. Это не «пассивный доход» — <span className="text-[#B6FF00] font-semibold">это другая математика.</span>
      </motion.div>
    </SlideLayout>
  );
}

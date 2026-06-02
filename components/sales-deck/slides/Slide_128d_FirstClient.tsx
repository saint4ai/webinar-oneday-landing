"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { MessageCircle, Phone, FileText, Banknote } from "lucide-react";

/**
 * Слайд 128d · Образ будущего «твой первый клиент» — между 128c (×год) и 129 (390).
 * Приём референса: продать будущее конкретной сценой, не обещанием. Вертикальный путь клиента.
 * Жёсткий дедлайн «через неделю» снят (консистентно с «навык за месяц») — образ сцены, не обещание скорости.
 */
const STEPS = [
  { Icon: MessageCircle, label: "Заявка из твоего Telegram-канала", sub: "человек сам написал" },
  { Icon: Phone, label: "Созвон — 15 минут", sub: "понял, что нужно" },
  { Icon: FileText, label: "Коммерческое за 30 минут", sub: "собрал в Claude" },
];

export function Slide_128d_FirstClient() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="aura-tl" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ЧТО БУДЕТ ДАЛЬШЕ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.03] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.5vw, 56px)" }}
      >
        ТВОЙ <span className="text-[#B6FF00]">ПЕРВЫЙ КЛИЕНТ</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="text-white/70 text-sm md:text-lg leading-snug max-w-2xl mb-6">
        Не «когда-нибудь». Вот как это выглядит на деле.
      </motion.div>

      {/* Вертикальный путь клиента */}
      <div className="relative flex flex-col gap-3 max-w-2xl mb-6">
        {/* соединяющая линия */}
        <motion.div
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.9, delay: 0.6, ease: [0.25, 1, 0.5, 1] }}
          className="absolute left-[22px] top-6 bottom-[46px] w-[2px] origin-top"
          style={{ background: "linear-gradient(180deg,rgba(182,255,0,0.5),rgba(182,255,0,0.15))" }}
        />
        {STEPS.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.7 + i * 0.18, ease: [0.25, 1, 0.5, 1] }} className="relative flex items-center gap-4">
            <div className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(182,255,0,0.08)", border: "1.5px solid rgba(182,255,0,0.45)" }}>
              <s.Icon className="w-5 h-5 text-[#B6FF00]" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-semibold text-base md:text-xl leading-tight">{s.label}</span>
              <span className="text-white/45 text-xs md:text-sm">{s.sub}</span>
            </div>
          </motion.div>
        ))}
        {/* финальный узел — оплата */}
        <motion.div initial={{ opacity: 0, scale: 0.9, x: -16 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 0.6, delay: 1.3, ease: [0.25, 1, 0.5, 1] }} className="relative flex items-center gap-4 mt-0.5">
          <div className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "#B6FF00", boxShadow: "0 0 36px -4px rgba(182,255,0,0.7)" }}>
            <Banknote className="w-5 h-5 text-black" strokeWidth={2.2} />
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="font-bold leading-none whitespace-nowrap" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(30px,3.6vw,52px)", color: "#B6FF00", textShadow: "0 0 50px rgba(182,255,0,0.4)" }}>300 000 ₸</span>
            <span className="text-white/60 text-sm md:text-base">на счёт — за то, что собрал сам</span>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.6 }} className="text-white/85 text-base md:text-lg leading-snug max-w-2xl">
        Без диплома, без портфолио, без согласований. <span className="text-[#B6FF00] font-semibold">И это ближе, чем кажется.</span>
      </motion.div>
    </SlideLayout>
  );
}

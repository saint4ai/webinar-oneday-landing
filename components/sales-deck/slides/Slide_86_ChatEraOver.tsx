"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { MessageSquareX, FolderCheck, ArrowRight } from "lucide-react";

/**
 * Слайд 86 · Старая эра vs новая. Текст 1-в-1 STRUCTURE 1052-1059.
 */
const OLD = ["Открыл ChatGPT, спросил, скопировал ответ ручками", "Контекст потерял", "Файлы заново скармливаешь"];
const NEW = ["Агент живёт прямо в папке проекта", "Помнит. Читает любые файлы", "Делает работу руками — не советует"];

export function Slide_86_ChatEraOver() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={760}
      background={<SlideBg theme="dark" variant="dual-bottom" />}
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // СТАРАЯ ЭРА vs НОВАЯ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 3.8vw, 58px)" }}
      >
        ЭРА ЧАТА <span style={{ color: "#FC5C02" }}>ЗАКОНЧИЛАСЬ</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-base md:text-lg leading-snug mb-8">
        Сейчас — эра агента в твоей папке.
      </motion.div>

      <div className="flex items-stretch gap-4 max-w-4xl flex-wrap">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="flex-1 min-w-[260px] rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(252,92,2,0.28)" }}>
          <div className="flex items-center gap-2.5 mb-4">
            <MessageSquareX className="w-5 h-5" strokeWidth={1.9} style={{ color: "#FC5C02" }} />
            <span className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: "#FC5C02" }}>раньше — чат</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {OLD.map((o) => (
              <div key={o} className="flex items-start gap-2 text-white/50 text-sm leading-snug">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#FC5C02" }} />{o}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.95 }} className="flex items-center justify-center shrink-0">
          <ArrowRight className="w-7 h-7 text-[#B6FF00]" strokeWidth={2.5} />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 1.1 }} className="flex-1 min-w-[260px] rounded-2xl p-5 relative overflow-hidden" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)", boxShadow: "0 0 50px -14px rgba(182,255,0,0.5)" }}>
          <div className="flex items-center gap-2.5 mb-4">
            <FolderCheck className="w-5 h-5 text-[#B6FF00]" strokeWidth={1.9} />
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#B6FF00]">сейчас — агент</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {NEW.map((n) => (
              <div key={n} className="flex items-start gap-2 text-white/85 text-sm leading-snug">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#B6FF00" }} />{n}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}

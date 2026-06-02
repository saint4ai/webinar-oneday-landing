"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Возражение «мне некуда применить AI» — слайд 2/2 (разворот: роботы пришли за дипломами, заменяет не AI — люди с агентами).
 * Текст Александра, спека: TASK_objection_nowhere_to_apply.md. Идёт сразу после Obj-1.
 */
const MULT = ["×5", "×10", "×20"];

export function Slide_ObjApply2_Diplomas() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={780} background={<SlideBg theme="dark" variant="climax" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ГЛАВНОЕ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.04] tracking-[-0.03em] mb-4"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 2.9vw, 46px)" }}
      >
        РОБОТЫ ПРИШЛИ НЕ ЗА РУЧНЫМ ТРУДОМ — <span className="text-[#B6FF00]">А ЗА ДИПЛОМАМИ</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="text-white/70 text-sm md:text-lg leading-snug max-w-2xl mb-5">
        Все ждали, что роботы заменят рабочих. А заменяют <span className="text-white">белых воротничков</span> — людей с образованием.
      </motion.div>

      {/* Усиление агентами ×5 ×10 ×20 */}
      <div className="flex items-center gap-3 md:gap-4 flex-wrap mb-5">
        <span className="text-white/70 text-sm md:text-base">И заменяет их не AI. Их заменяют люди, усилившие себя агентами:</span>
        <div className="flex items-end gap-2.5">
          {MULT.map((m, i) => (
            <motion.div
              key={m}
              initial={{ opacity: 0, scale: 0.6, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.7 + i * 0.22, ease: [0.34, 1.4, 0.64, 1] }}
              className="rounded-xl px-4 py-2 font-bold tabular-nums"
              style={{
                fontFamily: "var(--font-benzin), system-ui",
                fontSize: `clamp(${20 + i * 4}px, ${1.8 + i * 0.4}vw, ${28 + i * 8}px)`,
                color: "#B6FF00",
                background: "rgba(182,255,0,0.08)",
                border: "1px solid rgba(182,255,0,0.4)",
                boxShadow: `0 0 ${20 + i * 14}px -8px rgba(182,255,0,${0.4 + i * 0.15})`,
              }}
            >
              {m}
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.5 }} className="text-white/85 text-base md:text-lg leading-snug max-w-3xl">
        Пузырь это или нет — пусть решают инвесторы. Не хочешь через 10 лет остаться без работы и проектов — <span className="text-[#B6FF00] font-semibold">учись управлять агентами сейчас</span>.
      </motion.div>
    </SlideLayout>
  );
}

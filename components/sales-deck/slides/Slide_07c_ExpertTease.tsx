"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { MessageCircle } from "lucide-react";

/**
 * Слайд-тизер экспертного контента (открытая петля) — после S07b_BigPromise, в блоке программы.
 * Большое обещание: сегодня учимся зарабатывать на продуктах, А В ФИНАЛЕ — экспертный блок про
 * личную рутину: Claude Code + ChatGPT Codex снимают до 70% рутины → время на себя.
 * Приём: контраст «не про деньги — про время» + комментарий-реакция «а когда уже про это?».
 * Текст Александра: «убрать с себя 70% рутины, уделять больше времени себе и своим хотелкам».
 */
export function Slide_07c_ExpertTease() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={800} background={<SlideBg theme="dark" variant="lime-right" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // САМОЕ ВКУСНОЕ — В ФИНАЛЕ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.02] tracking-[-0.03em] mb-4"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.7vw, 58px)", paddingTop: "0.08em" }}
      >
        А В КОНЦЕ — НЕ ПРО ДЕНЬГИ.<br />ПРО ТВОЁ <span className="text-[#B6FF00]">ВРЕМЯ</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/80 text-base md:text-lg leading-snug max-w-2xl mb-5">
        В финале открою блок, который почти никто не отдаёт: как <span className="text-white font-semibold">Claude Code</span> и <span className="text-white font-semibold">ChatGPT Codex</span> снимают <span className="text-[#B6FF00] font-bold">до 70% твоей рутины</span>.
      </motion.div>

      {/* −70% → время на себя */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.6, ease: [0.25, 1, 0.5, 1] }} className="flex items-center gap-4 flex-wrap mb-6">
        <div className="flex items-baseline gap-2.5 rounded-2xl px-5 py-3" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.42)", boxShadow: "0 0 50px -16px rgba(182,255,0,0.5)" }}>
          <span className="font-bold leading-none tabular-nums" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(34px,4vw,60px)", color: "#B6FF00", textShadow: "0 0 50px rgba(182,255,0,0.45)" }}>−70%</span>
          <span className="text-white/70 text-sm md:text-base">рутины на ИИ → время на <span className="text-white">себя, семью и хотелки</span></span>
        </div>
      </motion.div>

      {/* Комментарий-реакция (открытая петля) */}
      <motion.div initial={{ opacity: 0, scale: 0.9, x: -12 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 0.5, delay: 1.05, ease: [0.34, 1.4, 0.64, 1] }} className="inline-flex items-center gap-3 self-start rounded-2xl rounded-bl-md px-4 py-3" style={{ background: "rgba(252,92,2,0.1)", border: "1px solid rgba(252,92,2,0.42)" }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(252,92,2,0.18)", border: "1px solid rgba(252,92,2,0.5)" }}>
          <MessageCircle className="w-4 h-4 text-[#FC5C02]" strokeWidth={2.4} />
        </div>
        <div className="leading-tight">
          <div className="text-white font-semibold text-sm md:text-base">«а когда уже про это будет?» 🔥</div>
          <div className="text-white/50 text-xs md:text-sm">← вот это ты и напишешь в чат. Досиди — не пожалеешь.</div>
        </div>
      </motion.div>
    </SlideLayout>
  );
}

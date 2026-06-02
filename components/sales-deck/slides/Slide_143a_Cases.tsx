"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { CasesCarousel } from "../CasesCarousel";
import { Star } from "lucide-react";

/**
 * Слайд 143a · Кейсы прошлого потока (ИИ-менеджеры в ОП) — пруф к главному бонусу за покупку.
 * Карусель 39 реальных скринов, авто-переключение 1 сек. Идёт между альбом-хедлайном (143) и программой (143b).
 */
export function Slide_143a_Cases() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="30vw"
      contentMinWidth={460}
      background={<SlideBg theme="dark" variant="climax" />}
      leftObject={
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
          className="relative w-full h-[82vh]"
        >
          <CasesCarousel />
        </motion.div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-3 self-start"
        style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)" }}
      >
        <Star className="w-3.5 h-3.5 text-[#B6FF00]" strokeWidth={2.4} fill="#B6FF00" />
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] font-bold text-[#B6FF00]">КЕЙСЫ ПРОШЛОГО ПОТОКА</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.02] tracking-[-0.03em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.4vw, 52px)" }}
      >
        ИХ РЕЗУЛЬТАТЫ — <span className="text-[#B6FF00]">НЕ ОБЕЩАНИЯ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/75 text-base md:text-lg leading-snug max-w-xl"
      >
        Реальные ученики прошлого потока внедряли ИИ-менеджеров и выходили на{" "}
        <span className="text-[#B6FF00] font-semibold">500 тысяч – 3 млн ₸ в месяц</span>. Здесь — их кейсы, а не мои слова.
      </motion.div>
    </SlideLayout>
  );
}

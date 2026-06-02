"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 161 · Список бонусов ЗА ДОСМОТР (3 шт, Higgsfield-карточки + ценники).
 * 4-й (сторис → курс по вирусному контенту) НЕ входит в «за просмотр» — он отдельно, в конце после ключевого слова.
 */
const BONUSES = [
  { img: "/cards-gifs-screenshots/bonus/bonus-watch1-android.png", p: "50 000 ₸" },
  { img: "/cards-gifs-screenshots/bonus/bonus-watch2-prompts.png", p: "15 000 ₸" },
  { img: "/cards-gifs-screenshots/bonus/bonus-watch3-checklist.png", p: "15 000 ₸" },
];

export function Slide_161_FourBonuses() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={820} background={<SlideBg theme="dark" variant="climax" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ПОДАРКИ ЗА УЧАСТИЕ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-6"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 4vw, 60px)" }}
      >
        ТВОИ ТРИ <span className="text-[#B6FF00]">БОНУСА</span>
      </motion.h1>

      <div className="grid grid-cols-3 gap-4 w-full max-w-[940px]">
        {BONUSES.map((b, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, delay: 0.4 + i * 0.15, ease: [0.34, 1.3, 0.64, 1] }} className="flex flex-col items-center gap-2.5">
            <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "4 / 5", background: "#ffffff", border: "1px solid rgba(182,255,0,0.3)", boxShadow: "0 24px 60px -28px rgba(0,0,0,0.6), 0 0 50px -26px rgba(182,255,0,0.3)" }}>
              <Image src={b.img} alt="Бонус за досмотр" fill className="object-contain" sizes="30vw" priority={i === 0} />
            </div>
            <span className="text-white/40 text-sm line-through tabular-nums" style={{ fontFamily: "var(--font-benzin), system-ui" }}>{b.p}</span>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.1 }} className="flex items-center gap-3 flex-wrap mt-6 rounded-xl px-5 py-3 max-w-3xl self-start" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)" }}>
        <span className="text-white/70 text-sm md:text-base">Всего ценности: <span className="line-through text-white/40">80 000 ₸</span> →</span>
        <span className="font-bold uppercase text-[#B6FF00]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(18px,1.8vw,26px)" }}>бесплатно за участие</span>
      </motion.div>
    </SlideLayout>
  );
}

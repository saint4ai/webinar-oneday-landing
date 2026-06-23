"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд «Оцени свой уровень владения нейросетями» — engagement-poll после знакомства (S03).
 * 4 LEGO-3D человечка (Higgsfield nano_banana_2 Pro, по росту мастерства). Текст НЕ в картинке — подписи в HTML.
 * Референс — конкурентский однодневник (скрин 20:08).
 */
const LEVELS = [
  { n: "01", img: "/cards-gifs-screenshots/levels/level1.png", cap: "ничего не понимаю" },
  { n: "02", img: "/cards-gifs-screenshots/levels/level2.png", cap: "базово — пользуюсь чатом GPT" },
  { n: "03", img: "/cards-gifs-screenshots/levels/level3.png", cap: "профессионально — разные нейросети" },
  { n: "04", img: "/cards-gifs-screenshots/levels/level4.png", cap: "зарабатываю на нейросетях" },
];

export function Slide_ChatLevelPoll() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={860} background={<SlideBg theme="dark" variant="aura-tr" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // НАПИШИ ЦИФРУ В ЧАТ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.02] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 3cqw, 48px)" }}
      >
        ОЦЕНИ СВОЙ УРОВЕНЬ ВЛАДЕНИЯ <span className="text-[#B6FF00]">НЕЙРОСЕТЯМИ</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="text-white/65 text-sm md:text-lg leading-snug max-w-2xl mb-6">
        Где ты сейчас? Напиши свою цифру <span className="text-[#B6FF00] font-semibold">1–4</span> в чат.
      </motion.div>

      <div className="w-full" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "16px", maxWidth: "1080px" }}>
        {LEVELS.map((lv, i) => {
          const top = i === 3;
          return (
            <motion.div
              key={lv.n}
              initial={{ opacity: 0, y: 22, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.55 + i * 0.13, ease: [0.34, 1.3, 0.64, 1] }}
              className="relative rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: top ? "rgba(182,255,0,0.08)" : "rgba(255,255,255,0.035)",
                border: top ? "1.5px solid rgba(182,255,0,0.55)" : "1px solid rgba(255,255,255,0.1)",
                boxShadow: top ? "0 0 50px -16px rgba(182,255,0,0.45)" : "none",
              }}
            >
              <div className="absolute top-2.5 left-2.5 z-10 font-mono font-bold text-[11px] px-2 py-0.5 rounded-md" style={{ background: top ? "#B6FF00" : "rgba(0,0,0,0.55)", color: top ? "#000" : "#B6FF00", border: top ? "none" : "1px solid rgba(182,255,0,0.4)" }}>
                {lv.n}
              </div>
              <div className="relative w-full" style={{ aspectRatio: "4 / 5" }}>
                <Image src={lv.img} alt={lv.cap} fill sizes="22cqw" className="object-cover" priority={i < 2} />
              </div>
              <div className="px-3 py-3 text-center">
                <span className={`leading-tight ${top ? "text-[#B6FF00] font-semibold" : "text-white/80"}`} style={{ fontSize: "clamp(13px, 0.95cqw, 15px)" }}>{lv.cap}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}

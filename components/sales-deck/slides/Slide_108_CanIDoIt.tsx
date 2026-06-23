"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 108 · Мой последний проект — платформа обучения за 10+ млн на вайбкодинге
 * + ученики, продающие свои решения (подписка / веб-платформы для бизнеса).
 * Текст-правка Александра. Скрин: public/handouts/last-project-10m.png (3 экрана платформы).
 */
export function Slide_108_CanIDoIt() {
  return (
    <SlideLayout speakerSide="right" contentClassName="!justify-start !py-0" background={<SlideBg theme="dark" variant="aura-tl" />}>
      <div className="flex flex-col h-full w-full justify-center" style={{ paddingTop: "clamp(24px,4cqh,52px)", paddingBottom: "clamp(24px,4cqh,52px)" }}>
        {/* ВЕРХ: заголовок + посыл */}
        <div className="shrink-0">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
            // МОЙ ПОСЛЕДНИЙ ПРОЕКТ
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase text-white leading-[1.02] tracking-[-0.02em] mb-3"
            style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3cqw, 50px)" }}
          >
            ПЛАТФОРМА ОБУЧЕНИЯ ЗА <span className="text-[#B6FF00]" style={{ whiteSpace: "nowrap" }}>10+&nbsp;МЛН&nbsp;₸</span>
          </motion.h1>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/70 text-base md:text-lg leading-snug max-w-2xl">
            Собираю её сам, на вайбкодинге. А мои ученики уже <span className="text-white font-semibold">реально продают свои решения</span> — и по подписочной модели, и как веб-платформы для бизнеса.
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="flex flex-wrap gap-2.5 mt-4">
            {["Платформа на вайбкодинге", "Подписочная модель", "Веб-платформы для бизнеса"].map((c) => (
              <span key={c} className="inline-flex items-center rounded-lg px-3 py-1.5 text-white/85 text-xs md:text-sm font-medium" style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.28)" }}>
                {c}
              </span>
            ))}
          </motion.div>
        </div>

        {/* НИЗ: 3 экрана платформы */}
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 1, 0.5, 1] }}
          className="shrink-0 mt-7 w-full max-w-[1180px] rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(182,255,0,0.22)", boxShadow: "0 40px 90px -34px rgba(0,0,0,0.7), 0 0 60px -26px rgba(182,255,0,0.22)" }}
        >
          <div className="relative w-full" style={{ aspectRatio: "1930 / 990" }}>
            <Image src="/handouts/last-project-10m.png" alt="Платформа обучения на вайбкодинге" fill className="object-cover object-top" sizes="60cqw" priority />
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}

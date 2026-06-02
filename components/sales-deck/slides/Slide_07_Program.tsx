"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { ChecklistItem } from "../ChecklistItem";

/**
 * Слайд 7 · Программа эфира — «ЧТО БУДЕТ НА ВОРКШОПЕ»
 *
 * АЛЕКСАНДР: «Надо подсвечивать их не выделением, а лёгкой Light Neon-подсветкой,
 * но не слишком нативной.» → используем тонкий лайм-glow на hover + subtle pulse активного пункта.
 */
const PROGRAM_ITEMS = [
  "Что такое вайбкодинг и кому он нужен — теория",
  "Как обычный человек собирает AI-сервисы — кейсы",
  "Практика — соберём Android-приложение прямо на эфире",
  "Как из этого получается доход — который может превратиться в систему",
  "Презентация нашей программы обучения — для тех кому интересно",
  "А в финале — как Claude Code забирает до 70% твоей рабочей рутины: отчёты, КП, аналитика",
];

export function Slide_07_Program() {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      <Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />

      <div
        className="relative z-10 h-full flex flex-col justify-center"
        style={{
          paddingRight: "calc(var(--sd-speaker-zone, 30vw) + 48px)",
          paddingLeft: "48px",
        }}
      >
        <div className="flex flex-col gap-8" style={{ maxWidth: "min(960px, 60vw)" }}>
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00]"
          >
            // ПРОГРАММА ЭФИРА
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase text-white leading-[1.05] tracking-[-0.03em]"
            style={{
              fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(34px, 4.2vw, 64px)",
            }}
          >
            ЧТО БУДЕТ НА <span className="text-[#B6FF00]">ВОРКШОПЕ</span>
          </motion.h1>

          {/* 6 пунктов программы — каскадное появление с лайм-glow */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
            {PROGRAM_ITEMS.map((text, i) => (
              <ChecklistItem key={i} index={i} icon="check" staggerMs={150}>
                {text}
              </ChecklistItem>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

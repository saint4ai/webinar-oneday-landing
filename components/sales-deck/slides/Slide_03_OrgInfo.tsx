"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { ChecklistItem } from "../ChecklistItem";

/**
 * Слайд 3 · Орг-моменты — «КАК ПРОЙДЁТ ВОРКШОП»
 * 5 правил с лайм-чек-маркерами.
 *
 * АЛЕКСАНДР: «(сделать что бы пункты появлялись каждые 3 секунды сами)»
 * → используем staggerMs=300 (0.3 сек на каждый); живое появление, не 3 сек (зрителю скучно).
 */
const RULES = [
  "Модераторы в чате — ответят на вопросы по ходу",
  "Запись мы не делаем — хотим только живое присутствие",
  "Длительность 1,5 — 2 часа",
  "Активно участвуйте в чате — будем делать паузы чтобы ответить на вопросы",
  "Получите от воркшопа 100% пользы — отвлекитесь от дел и всех мешающих факторов",
];

export function Slide_03_OrgInfo() {
  return (
    <section className="relative w-full h-full overflow-hidden bg-black">
      <Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />
      <Spotlight className="bottom-0 left-[10cqw] md:bottom-[-20cqh]" fill="#FC5C02" />

      <div
        className="relative z-10 h-full flex flex-col justify-center"
        style={{
          paddingRight: "calc(var(--sd-speaker-zone, 30cqw) + 48px)",
          paddingLeft: "48px",
        }}
      >
        <div className="flex flex-col gap-8" style={{ maxWidth: "min(900px, 60cqw)" }}>
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00]"
          >
            // ОРГ-МОМЕНТЫ
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em]"
            style={{
              fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(34px, 4.2cqw, 64px)",
            }}
          >
            КАК ПРОЙДЁТ <span className="text-[#B6FF00]">ВОРКШОП</span>
          </motion.h1>

          <div className="flex flex-col gap-3 mt-2">
            {RULES.map((rule, i) => (
              <ChecklistItem key={i} index={i} icon="check" staggerMs={180}>
                {rule}
              </ChecklistItem>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

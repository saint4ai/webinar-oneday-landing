"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 50 · Engagement — «ВЫ БЫ ЭТО ПРОДАЛИ?». Текст 1-в-1 STRUCTURE 608-613.
 * Свежий приём: облако тегов из типов бизнесов (лайм-капсулы, разный кегль),
 * появляются с пружинкой. Типы бизнесов — иллюстративные (KZ МСБ).
 */
const TAGS = [
  { t: "Салоны красоты", s: 1.25 }, { t: "Стоматологии", s: 1.0 }, { t: "Автосервисы", s: 1.15 },
  { t: "Рестораны", s: 1.35 }, { t: "Фитнес-студии", s: 1.0 }, { t: "Юрфирмы", s: 1.1 },
  { t: "Бухгалтерии", s: 1.3 }, { t: "Логистика", s: 1.0 }, { t: "Интернет-магазины", s: 1.2 },
  { t: "Клиники", s: 1.15 }, { t: "Турагентства", s: 0.95 }, { t: "Маркетинг-агентства", s: 1.1 },
  { t: "Риелторы", s: 1.3 }, { t: "HR-агентства", s: 1.0 }, { t: "Отделы продаж", s: 1.2 },
  { t: "Кофейни", s: 1.05 }, { t: "Аптеки", s: 1.1 }, { t: "Автошколы", s: 0.95 },
  { t: "Производство", s: 1.15 }, { t: "Стройка", s: 1.05 },
];

export function Slide_50_Engagement2() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={720}
      background={<SlideBg theme="dark" variant="dual-bottom" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // ВОПРОС В ЧАТ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-4"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(28px, 3.6vw, 58px)",
        }}
      >
        СМОГЛИ БЫ НАЙТИ <span className="text-[#B6FF00]">КЛИЕНТА</span> НА ТАКОЕ РЕШЕНИЕ?
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/70 text-base md:text-lg leading-snug max-w-2xl mb-8"
      >
        Напишите в чат — стало понятно, какие решения для бизнеса и людей могут делать вайбкодеры? Есть ли в вашем кругу такие?
      </motion.div>

      {/* Облако тегов */}
      <div className="flex flex-wrap items-center gap-2.5 max-w-4xl">
        {TAGS.map((tag, i) => {
          const o = i % 3 === 1; // часть капсул — оранжевые (разбавляем лайм)
          const rgb = o ? "252,92,2" : "182,255,0";
          const strong = tag.s >= 1.2;
          return (
            <motion.span
              key={tag.t}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.6 + i * 0.06, ease: [0.34, 1.56, 0.64, 1] }}
              className="rounded-full font-semibold leading-none"
              style={{
                fontSize: `${tag.s * 15}px`,
                padding: `${tag.s * 8}px ${tag.s * 16}px`,
                color: strong ? `rgb(${rgb})` : `rgba(${rgb},0.78)`,
                background: `rgba(${rgb},${strong ? 0.1 : 0.05})`,
                border: `1px solid rgba(${rgb},${strong ? 0.35 : 0.2})`,
              }}
            >
              {tag.t}
            </motion.span>
          );
        })}
      </div>
    </SlideLayout>
  );
}

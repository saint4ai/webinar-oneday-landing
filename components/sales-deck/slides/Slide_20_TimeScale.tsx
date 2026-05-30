"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 20 · Сколько времени занимает — «ОТ ИДЕИ ДО РАБОЧЕЙ ВЕРСИИ».
 * Горизонтальная шкала времени, заполняется лаймом слева направо.
 * Текст 1-в-1 из STRUCTURE.
 *
 * Тема «время/шкала» → анимация: прогресс-бар заливается + точки-вехи всплывают.
 */
const MARKS = [
  { label: "1 час", sub: "простой лендинг", pos: 0 },
  { label: "1 день", sub: "приложение", pos: 0.33 },
  { label: "1 неделя", sub: "сервис с базой", pos: 0.66 },
  { label: "месяц", sub: "сложный продукт", pos: 1 },
];

export function Slide_20_TimeScale() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={620}
      background={<Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // СКОЛЬКО ВРЕМЕНИ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-5"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(28px, 3.6vw, 52px)",
        }}
      >
        ОТ ИДЕИ ДО <span className="text-[#B6FF00]">РАБОЧЕЙ ВЕРСИИ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-white/75 text-base md:text-lg leading-snug max-w-xl"
      >
        Час, день, неделя, месяц — в зависимости от сложности.
      </motion.div>

      {/* Шкала времени — большой верхний отступ, чтобы верхние ярлыки
          («1 ДЕНЬ», «МЕСЯЦ») не слипались с описанием выше */}
      <div className="relative max-w-2xl mt-24 pb-2" style={{ paddingLeft: "8px", paddingRight: "8px" }}>
        {/* Трек */}
        <div className="relative h-[3px] rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
          {/* Заливка */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.6, delay: 0.7, ease: [0.25, 1, 0.5, 1] }}
            className="absolute inset-y-0 left-0 right-0 rounded-full origin-left"
            style={{
              background: "linear-gradient(to right, #B6FF00, #FC5C02)",
              boxShadow: "0 0 16px rgba(182,255,0,0.5)",
            }}
          />
          {/* Вехи */}
          {MARKS.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.9 + m.pos * 1.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${m.pos * 100}%` }}
            >
              {/* Точка */}
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  background: i === MARKS.length - 1 ? "#FC5C02" : "#B6FF00",
                  boxShadow: `0 0 14px ${i === MARKS.length - 1 ? "#FC5C02" : "#B6FF00"}`,
                  border: "2px solid #000",
                }}
              />
              {/* Подпись */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 ${i % 2 === 0 ? "top-6" : "bottom-6"} text-center whitespace-nowrap`}
              >
                <div
                  className="font-bold uppercase leading-none"
                  style={{
                    color: i === MARKS.length - 1 ? "#FC5C02" : "#B6FF00",
                    fontFamily: "var(--font-benzin), system-ui, sans-serif",
                    fontSize: "clamp(16px, 1.8vw, 24px)",
                  }}
                >
                  {m.label}
                </div>
                <div className="text-white/45 text-[10px] md:text-xs mt-1 font-mono uppercase tracking-[0.05em]">{m.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SlideLayout>
  );
}

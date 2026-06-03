"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";

/**
 * Слайд 8 · Программа эфира — «ЧТО БУДЕТ НА ВОРКШОПЕ»
 * Нумерованные темы (01–06) + продающий промис под каждой + тег-формат.
 * NB: тут НЕ пишем «заберёшь с собой» — это слайд 10 (Benefits).
 */
const TOPICS = [
  { n: "01", title: "Что такое вайбкодинг", promise: "Поймёшь, как софт собирают без единой строчки кода — и почему это уже не будущее, а настоящее.", tag: "теория" },
  { n: "02", title: "Живые кейсы", promise: "Что обычные люди собирают и продают — с цифрами. Увидишь своими глазами: это реально.", tag: "кейсы" },
  { n: "03", title: "Собираем приложение", promise: "Прямо в эфире соберём рабочее приложение — с нуля, у тебя на глазах, за минуты.", tag: "практика" },
  { n: "04", title: "Как это приносит деньги", promise: "Как один собранный сервис превращается в поток заказов и систему — а не разовую халтуру.", tag: "доход" },
  { n: "05", title: "Программа обучения", promise: "Покажу, как пойти глубже — для тех, кому захочется. Спокойно, без впаривания.", tag: "оффер" },
  { n: "06", title: "Claude Code в рутине", promise: "Как ИИ снимает до 70% рабочей рутины: отчёты, КП, аналитика — за минуты вместо часов.", tag: "финал" },
];

export function Slide_07_Program() {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      <Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />

      <div
        className="relative z-10 h-full flex flex-col justify-center"
        style={{ paddingRight: "calc(var(--sd-speaker-zone, 30vw) + 48px)", paddingLeft: "48px" }}
      >
        <div className="flex flex-col gap-7" style={{ maxWidth: "min(1000px, 64vw)" }}>
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
            style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(32px, 4vw, 60px)" }}
          >
            ЧТО БУДЕТ НА <span className="text-[#B6FF00]">ВОРКШОПЕ</span>
          </motion.h1>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px 28px" }}>
            {TOPICS.map((t, i) => (
              <motion.div
                key={t.n}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 + i * 0.1, ease: [0.25, 1, 0.5, 1] }}
                className="flex gap-3.5 rounded-xl px-3.5 py-3"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <span
                  className="font-bold leading-none shrink-0"
                  style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(22px, 2vw, 30px)", color: "#B6FF00" }}
                >
                  {t.n}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap mb-0.5">
                    <span className="font-bold uppercase text-white text-[15px] md:text-[17px] tracking-[-0.01em]" style={{ fontFamily: "var(--font-benzin), system-ui" }}>
                      {t.title}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] font-bold text-[#FC5C02] px-1.5 py-0.5 rounded" style={{ background: "rgba(252,92,2,0.1)", border: "1px solid rgba(252,92,2,0.35)" }}>
                      {t.tag}
                    </span>
                  </div>
                  <p className="text-white/60 text-[13px] md:text-sm leading-snug">{t.promise}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

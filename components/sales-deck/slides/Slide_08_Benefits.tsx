"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Spotlight } from "../Spotlight";

/**
 * Слайд 10 · Что заберёшь — «ЧТО ТЫ ЗАБЕРЁШЬ С СОБОЙ»
 * 4 больших обещания (title + деталь). Тут как раз место для «заберёшь с собой».
 */
const BENEFITS = [
  { title: "Ясную картину вайбкодинга", detail: "Поймёшь, как люди без кода собирают софт — и сможешь объяснить это другу за минуту." },
  { title: "5 живых примеров", detail: "Что собирают ученики, кому продают и за сколько. Уйдёшь с готовыми идеями под себя." },
  { title: "Своё первое приложение", detail: "Соберёшь его сам, прямо в эфире — и унесёшь готовым, а не просто посмотришь со стороны." },
  { title: "Честный ответ — твоё или нет", detail: "Без розовых обещаний: где будет легко, а где придётся вложиться. Решишь на холодную голову." },
];

export function Slide_08_Benefits() {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      <Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />
      <Spotlight className="bottom-0 right-[10vw] md:bottom-[-20vh]" fill="#FC5C02" />

      <div
        className="relative z-10 h-full flex flex-col justify-center"
        style={{ paddingRight: "calc(var(--sd-speaker-zone, 30vw) + 48px)", paddingLeft: "48px" }}
      >
        <div className="flex flex-col gap-7" style={{ maxWidth: "min(960px, 62vw)" }}>
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00]"
          >
            // ЧТО ПОЛУЧИШЬ В КОНЦЕ
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase text-white leading-[1.05] tracking-[-0.03em]"
            style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(32px, 4vw, 60px)" }}
          >
            ЧТО ТЫ <span className="text-[#B6FF00]">ЗАБЕРЁШЬ</span> С СОБОЙ
          </motion.h1>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px 24px" }}>
            {BENEFITS.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 + i * 0.12, ease: [0.25, 1, 0.5, 1] }}
                className="flex gap-3.5 rounded-2xl px-4 py-4"
                style={{ background: "rgba(182,255,0,0.04)", border: "1px solid rgba(182,255,0,0.18)" }}
              >
                <div className="shrink-0 mt-0.5 flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, background: "rgba(182,255,0,0.12)", border: "1px solid rgba(182,255,0,0.4)" }}>
                  <ArrowRight className="w-4 h-4 text-[#B6FF00]" strokeWidth={2.6} />
                </div>
                <div className="min-w-0">
                  <div className="font-bold uppercase text-white text-[16px] md:text-[19px] tracking-[-0.01em] leading-tight mb-1" style={{ fontFamily: "var(--font-benzin), system-ui" }}>
                    {b.title}
                  </div>
                  <p className="text-white/65 text-[13px] md:text-sm leading-snug">{b.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

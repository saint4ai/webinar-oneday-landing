"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";
import { User, Cpu } from "lucide-react";

/**
 * WhyBusinessPays — прогрессивная боль «ПОЧЕМУ БИЗНЕС ПЛАТИТ» (слайды 36-40).
 * Один заголовок, строки накапливаются: каждый слайд показывает на 1 строку
 * больше (slide-up для новой, предыдущие статичны). Текст 1-в-1 из STRUCTURE.
 * Параметризован пропом `step: 1..5`.
 *
 * Live-механика однодневника: спикер кликает дальше после каждой строки.
 */
const LINES = [
  { text: "В любом бизнесе есть рутина, которой никто не хочет заниматься. Хотят упрощать, ускорять бизнес-процессы.", accent: false },
  { text: "Сотрудники сжигают на ней по 4 часа в день.", accent: false },
  { text: "Один такой сотрудник стоит компании 300–500 тысяч в месяц.", accent: false },
  { text: "А ещё ошибки. Ещё текучка. Ещё переобучение каждые полгода.", accent: false },
  { text: "А AI делает это за 30 секунд. И помогает сотрудникам быть быстрее и эффективнее.", accent: true },
];

export function WhyBusinessPays({ step }: { step: 1 | 2 | 3 | 4 | 5 }) {
  const visible = LINES.slice(0, step);
  const newIndex = step - 1; // последняя строка — новая (slide-up)

  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={640}
      background={
        <>
          <Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />
          {step === 5 && <Spotlight className="bottom-0 left-[10vw] md:bottom-[-20vh]" fill="#B6FF00" />}
        </>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // ПОЧЕМУ БИЗНЕС ПЛАТИТ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-8"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(30px, 3.8vw, 56px)",
        }}
      >
        ПОЧЕМУ БИЗНЕС <span className="text-[#B6FF00]">ПЛАТИТ</span>
      </motion.h1>

      {/* Накапливающиеся строки */}
      <div className="flex flex-col gap-5 max-w-3xl">
        {visible.map((line, i) => {
          const isNew = i === newIndex;
          return (
            <motion.div
              key={i}
              initial={isNew ? { opacity: 0, y: 22 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: isNew ? 0.35 : 0, ease: [0.25, 1, 0.5, 1] }}
              className="flex items-start gap-4"
            >
              <span
                className="mt-3 shrink-0 rounded-full"
                style={{
                  width: line.accent ? 12 : 8,
                  height: line.accent ? 12 : 8,
                  background: "#B6FF00",
                  boxShadow: line.accent ? "0 0 14px rgba(182,255,0,0.7)" : "none",
                }}
              />
              {line.accent ? (
                /* Финал — дизайн-карта контраста «человек 4 часа → AI 30 секунд» */
                <div className="w-full pt-2">
                  <div className="flex items-stretch gap-4 max-w-3xl flex-wrap">
                    {/* Человек — зачёркнут */}
                    <motion.div
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="flex-1 min-w-[200px] rounded-2xl p-5 relative"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <User className="w-5 h-5 text-white/50" strokeWidth={1.8} />
                        </div>
                        <span className="text-white/40 font-mono text-[11px] uppercase tracking-[0.14em]">человек</span>
                      </div>
                      <div className="font-bold leading-none" style={{ fontFamily: "var(--font-benzin)", fontSize: "clamp(26px,2.8vw,42px)", color: "rgba(255,255,255,0.45)", textDecoration: "line-through", textDecorationColor: "#FC5C02", textDecorationThickness: "3px" }}>
                        4 часа / день
                      </div>
                    </motion.div>

                    {/* Стрелка */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.7 }}
                      className="flex items-center justify-center shrink-0"
                    >
                      <span style={{ color: "#B6FF00", fontSize: "clamp(28px,3vw,44px)" }}>→</span>
                    </motion.div>

                    {/* AI — акцент, пульсация */}
                    <motion.div
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.85 }}
                      className="flex-1 min-w-[200px] rounded-2xl p-5 relative overflow-hidden"
                      style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)", boxShadow: "0 0 50px -12px rgba(182,255,0,0.5)" }}
                    >
                      <motion.div
                        aria-hidden
                        animate={{ opacity: [0.15, 0.35, 0.15] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: "radial-gradient(ellipse at center, rgba(182,255,0,0.3), transparent 70%)" }}
                      />
                      <div className="relative flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#B6FF00" }}>
                          <Cpu className="w-5 h-5 text-black" strokeWidth={1.8} />
                        </div>
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: "#B6FF00" }}>ai</span>
                      </div>
                      <div className="relative font-bold leading-none" style={{ fontFamily: "var(--font-benzin)", fontSize: "clamp(26px,2.8vw,42px)", color: "#B6FF00" }}>
                        30 секунд
                      </div>
                    </motion.div>
                  </div>

                  {/* Подпись */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.1 }}
                    className="text-white/70 text-base md:text-xl leading-snug mt-5 max-w-3xl"
                  >
                    AI делает это <span className="text-[#B6FF00] font-semibold">мгновенно</span> — и помогает сотрудникам быть быстрее и эффективнее.
                  </motion.div>
                </div>
              ) : (
                <span className="text-white/85 text-lg md:text-2xl leading-snug">{line.text}</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}

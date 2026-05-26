"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Sparkles,
  Users,
  Mic,
  Code2,
  TrendingUp,
} from "lucide-react";
import { GlowingCard } from "@/components/ui/glowing-card";
import { BeamsBackground } from "@/components/ui/beams-background";

/**
 * Блок «Кто я» — короткое представление Александра после hero.
 * Не CV. Не «о компании». А честный путь + что делаю сейчас + что внутри стоит за лендингом.
 */

const FACTS = [
  {
    Icon: Code2,
    value: "1 год",
    label: "вайбкодинга",
    note: "от первой строки до 6 рабочих продуктов",
  },
  {
    Icon: Briefcase,
    value: "6 проектов",
    label: "в продакшене",
    note: "3 собственных SaaS + 3 решения для клиентов",
  },
  {
    Icon: Users,
    value: "900+",
    label: "выпускников школы",
    note: "из них 250 учатся прямо сейчас",
  },
  {
    Icon: TrendingUp,
    value: "600К–10,5М ₸",
    label: "чеки клиентов",
    note: "от дашборда отделу до платформы под ключ",
  },
  {
    Icon: Mic,
    value: "Almaty Hub",
    label: "спикер",
    note: "выступления о вайбкодинге для предпринимателей",
  },
  {
    Icon: Sparkles,
    value: "3 года",
    label: "до этого — no-code",
    note: "N8N, Make, GPT-боты для 30+ бизнесов KZ/UA/RU",
  },
];

export const AboutMe = () => {
  return (
    <section
      id="about"
      className="relative z-10 pt-8 sm:pt-14 lg:pt-20 pb-8 overflow-hidden"
    >
      {/* Beams фон — полная заливка секции, но fade у самых краёв (3% сверху/снизу),
       *  чтобы не было резкой границы при стыке с соседними секциями.
       */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          maskImage:
            "linear-gradient(180deg, transparent 0%, black 4%, black 96%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0%, black 4%, black 96%, transparent 100%)",
        }}
      >
        <BeamsBackground intensity="strong" beamCount={20} blur={10} />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="mb-8 sm:mb-12"
      >
        <div className="section-divider">кто я</div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 lg:gap-12 mt-4">
          {/* LEFT — заголовок и история */}
          <div>
            <h2
              className="uppercase text-white"
              style={{
                fontFamily:
                  "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
                fontWeight: 800,
                fontSize: "clamp(26px, 3.8vw, 52px)",
                lineHeight: 1.05,
                letterSpacing: "-0.01em",
              }}
            >
              Александр —
              <br />
              <span className="text-white/55">основатель</span>
              <br />
              onAI.academy
            </h2>
          </div>

          {/* RIGHT — текст-история */}
          <div className="flex flex-col gap-4 text-[15px] sm:text-[16px] lg:text-[17px] text-white/70 leading-relaxed max-w-xl">
            <p>
              Год назад я даже не подозревал, что смогу{" "}
              <span className="text-white font-bold">
                простым человеческим языком
              </span>{" "}
              писать приложения.
            </p>
            <p>
              Сейчас у меня в продакшене{" "}
              <span className="text-white font-bold">
                три собственных приложения
              </span>{" "}
              — onAI.academy, AI-Таргетолог и OmniDash. И ещё{" "}
              <span className="text-white font-bold">три решения</span>,
              которые я сделал клиентам — с чеком от 600 тысяч до 10
              миллионов&nbsp;₸.
            </p>
            <p className="text-white/55 text-[14px] sm:text-[15px]">
              На воркшопе делюсь формулой, по которой это собирается. Без
              воды, без обещаний «миллион за месяц» — просто как это работает
              на практике.
            </p>
          </div>
        </div>

        {/* Сетка фактов */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 mt-12 sm:mt-16">
          {FACTS.map(({ Icon, value, label, note }) => (
            <GlowingCard key={label} intensity="subtle" radius="16px">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0a0c] h-full">
                <Icon
                  size={20}
                  strokeWidth={1.8}
                  className="text-[#cdeb52] mb-3"
                />
                <div
                  className="hl-lime uppercase whitespace-nowrap"
                  style={{
                    fontFamily:
                      "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
                    fontWeight: 800,
                    fontSize: "clamp(15px, 1.5vw, 22px)",
                    letterSpacing: "-0.005em",
                    lineHeight: 1,
                  }}
                >
                  {value}
                </div>
                <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.16em] text-white/45 mt-1.5">
                  {label}
                </div>
                <p className="text-[12px] sm:text-[13px] text-white/55 leading-relaxed mt-3">
                  {note}
                </p>
              </div>
            </GlowingCard>
          ))}
        </div>
      </motion.div>
      </div>
    </section>
  );
};

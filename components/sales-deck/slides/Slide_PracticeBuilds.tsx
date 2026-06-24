"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Presentation, Smartphone, Globe } from "lucide-react";

/**
 * Практика · ЧТО СОБЕРЁМ — три продукта вокруг приложения Bloom вживую.
 * 1) Продающая КП-презентация (Claude Code). 2) Приложение Bloom (Google AI Studio). 3) Сайт под Bloom (Google AI Studio).
 */
const BUILDS = [
  {
    no: "01",
    icon: Presentation,
    accent: "#B6FF00",
    t: "Продающая презентация",
    sub: "Коммерческое предложение (КП)",
    tool: "Claude Code",
    d: "Премиальная презентация, которая продаёт Bloom клиенту — за минуты, не за вечер в PowerPoint.",
  },
  {
    no: "02",
    icon: Smartphone,
    accent: "#FC5C02",
    t: "Приложение Bloom",
    sub: "Семейный трекер привычек",
    tool: "Google AI Studio",
    d: "Вся семья и дети, награды и серии, премиум-дизайн — по детальному ТЗ.",
  },
  {
    no: "03",
    icon: Globe,
    accent: "#8FA3B8",
    t: "Сайт под Bloom",
    sub: "Лендинг с анимациями",
    tool: "Google AI Studio",
    d: "Промо-страница для приложения — тот же бренд-код, эффектные анимации.",
  },
];

export function Slide_PracticeBuilds() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="aura-tl" />}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // ПРАКТИКА · СОБИРАЕМ ВЖИВУЮ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.04] tracking-[-0.03em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(22px, 2.7cqw, 40px)" }}
      >
        ТРИ ПРОДУКТА — <span className="text-[#B6FF00]">ПРЯМО В ЭФИРЕ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/65 text-base md:text-lg leading-snug mb-7 max-w-2xl"
      >
        Целый запуск одного продукта вживую: приложение, сайт и презентация, которая его продаёт.
      </motion.div>

      <div className="grid grid-cols-3 gap-4 max-w-4xl">
        {BUILDS.map((b, i) => {
          const Icon = b.icon;
          return (
            <motion.div
              key={b.no}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.5 + i * 0.15, ease: [0.25, 1, 0.5, 1] }}
              className="rounded-2xl p-4 flex flex-col"
              style={{ background: `${b.accent}0d`, border: `1px solid ${b.accent}44` }}
            >
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${b.accent}1f`, border: `1px solid ${b.accent}55` }}>
                  <Icon className="w-5 h-5" strokeWidth={2} style={{ color: b.accent }} />
                </div>
                <span className="font-mono text-[12px] font-bold tracking-[0.12em]" style={{ color: b.accent }}>{b.no}</span>
              </div>
              <div className="text-white font-bold text-base md:text-lg leading-tight" style={{ fontFamily: "var(--font-benzin), system-ui" }}>{b.t}</div>
              <div className="text-white/45 text-xs md:text-[13px] mt-1">{b.sub}</div>
              <div className="mt-2.5 self-start font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-1 rounded-md" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}>
                через {b.tool}
              </div>
              <div className="text-white/60 text-[12px] md:text-[13px] leading-snug mt-3.5">{b.d}</div>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}

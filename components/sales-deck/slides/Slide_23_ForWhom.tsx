"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";
import { Briefcase, Megaphone, Building2, Palette, Lightbulb } from "lucide-react";

/**
 * Слайд 23 · Это для кого — «КОМУ ВАЙБКОДИНГ ПОДХОДИТ».
 * Тема «аудитория/роли» → анимация: роли появляются одна за другой, иконки.
 * Текст 1-в-1 из STRUCTURE.
 */
const ROLES = [
  { icon: Briefcase, t: "Предпринимателю", s: "с идеей сервиса" },
  { icon: Megaphone, t: "Маркетологу", s: "в работе или для своих приложений" },
  { icon: Building2, t: "Офисному сотруднику", s: "с рабочей рутиной" },
  { icon: Palette, t: "Дизайнеру", s: "добавить разработку или автоматизировать через Higgsfield" },
  { icon: Lightbulb, t: "Любому", s: "кто хочет свой IT-продукт" },
];

export function Slide_23_ForWhom() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={600}
      background={<Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // ДЛЯ КОГО
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-7"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(28px, 3.6vw, 52px)",
        }}
      >
        КОМУ ВАЙБКОДИНГ <span className="text-[#B6FF00]">ПОДХОДИТ</span>
      </motion.h1>

      <div className="flex flex-col gap-3.5 max-w-3xl">
        {ROLES.map((r, i) => {
          const Icon = r.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.5 + i * 0.16, ease: [0.25, 1, 0.5, 1] }}
              className="flex items-center gap-5 rounded-xl px-5 py-4"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.25)" }}
              >
                <Icon className="w-6 h-6" style={{ color: "#B6FF00" }} strokeWidth={2} />
              </div>
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-white font-semibold text-lg md:text-2xl leading-tight">{r.t}</span>
                <span className="text-white/50 text-sm md:text-base">— {r.s}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}

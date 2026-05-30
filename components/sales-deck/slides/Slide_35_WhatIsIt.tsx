"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";
import { Home, LayoutDashboard, CalendarCheck, ScanLine, Briefcase } from "lucide-react";

/**
 * Слайд 35a · «О ЧЁМ РЕЧЬ» — типы AI-сервисов на продажу.
 * Бенто-сетка 5 категорий (BentoCard-стиль inline). Текст 1-в-1 из STRUCTURE.
 * Тема «каталог/возможности» → карточки всплывают stagger.
 */
const SERVICES = [
  { icon: Home, t: "Помощник для риелторов", s: "ведёт объекты, отвечает на вопросы, собирает лиды, делает подборки", span: "col-span-1" },
  { icon: LayoutDashboard, t: "Дашборд для руководителя", s: "сводит показатели по отделам — перегруз, простои, просадки", span: "col-span-1" },
  { icon: CalendarCheck, t: "Ассистент для салонов, клиник, студий", s: "запись, напоминания, ответы на частые вопросы, загрузка мастеров", span: "col-span-2" },
  { icon: ScanLine, t: "Сканер документов и чеков", s: "обработка входящих бумажек и PDF без ручного ввода", span: "col-span-1" },
  { icon: Briefcase, t: "AI-помощник для sales / HR", s: "ответы кандидатам, КП, follow-up, квалификация лидов", span: "col-span-1" },
];

export function Slide_35_WhatIsIt() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={640}
      background={<Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // О ЧЁМ РЕЧЬ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-7"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(30px, 3.8vw, 56px)",
        }}
      >
        О ЧЁМ <span className="text-[#B6FF00]">РЕЧЬ</span>
      </motion.h1>

      {/* Бенто-сетка 2 колонки */}
      <div className="grid grid-cols-2 gap-4 max-w-3xl">
        {SERVICES.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.45 + i * 0.12, ease: [0.25, 1, 0.5, 1] }}
              whileHover={{ y: -4 }}
              className={`${item.span} rounded-2xl p-5`}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3.5"
                style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.25)" }}
              >
                <Icon className="w-6 h-6" style={{ color: "#B6FF00" }} strokeWidth={2} />
              </div>
              <div className="text-white font-semibold text-lg md:text-xl leading-tight">{item.t}</div>
              <div className="text-white/50 text-sm md:text-base mt-1.5 leading-snug">{item.s}</div>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}

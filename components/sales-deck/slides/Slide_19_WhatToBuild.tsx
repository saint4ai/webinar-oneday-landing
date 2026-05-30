"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";
import { Globe, Smartphone, LayoutDashboard, Bot, Workflow } from "lucide-react";

/**
 * Слайд 19 · Что можно собрать — «ЧТО МОЖНО СОБРАТЬ».
 * Бенто-сетка 5 категорий, каждая карточка появляется с задержкой.
 * Текст 1-в-1 из STRUCTURE.
 *
 * Тема «возможности/каталог» → анимация: bento-карточки всплывают снизу stagger + hover-lift.
 */
const ITEMS = [
  { icon: Globe, t: "Сайты", s: "лендинги, портфолио, магазины", span: "col-span-1" },
  { icon: Smartphone, t: "Приложения для телефона", s: "Android и iOS", span: "col-span-1" },
  { icon: LayoutDashboard, t: "Веб-сервисы", s: "личные кабинеты, CRM, дашборды, оценка нагрузки и сна", span: "col-span-2" },
  { icon: Bot, t: "Боты", s: "Telegram, WhatsApp, Instagram", span: "col-span-1" },
  { icon: Workflow, t: "Автоматизации", s: "отчёты, рассылки, парсинг, AI-менеджер по продажам", span: "col-span-1" },
];

export function Slide_19_WhatToBuild() {
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
        // ВОЗМОЖНОСТИ
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
        ЧТО МОЖНО <span className="text-[#B6FF00]">СОБРАТЬ</span>
      </motion.h1>

      {/* Бенто-сетка 2 колонки */}
      <div className="grid grid-cols-2 gap-4 max-w-3xl">
        {ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.45 + i * 0.13, ease: [0.25, 1, 0.5, 1] }}
              whileHover={{ y: -4 }}
              className={`${item.span} rounded-2xl p-6 group`}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
                style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.25)" }}
              >
                <Icon className="w-6 h-6" style={{ color: "#B6FF00" }} strokeWidth={2} />
              </div>
              <div className="text-white font-semibold text-lg md:text-2xl leading-tight">{item.t}</div>
              <div className="text-white/50 text-sm md:text-base mt-1.5 leading-snug">{item.s}</div>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}

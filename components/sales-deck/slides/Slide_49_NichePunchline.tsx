"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { MarkerReveal } from "../MarkerReveal";
import { Calculator, Scale, Dumbbell, Scissors, Megaphone, Home, LayoutDashboard, Users } from "lucide-react";

/**
 * Слайд 49 · Панчлайн — «В КАЖДОЙ НИШЕ ЖДУТ ТЕБЯ». Текст 1-в-1 STRUCTURE 585-599.
 * Кульминация ниша-арки: монтаж 8 профессий с лайм-плашками продуктов
 * (вкл. callbacks риелтор/руководитель/HR) + контраст Раньше→Сейчас +
 * пульсирующий бейдж «ОКНО ОТКРЫТО».
 */
const PROFS = [
  { icon: Calculator, prof: "Бухгалтер", product: "сервис под ЭСФ" },
  { icon: Scale, prof: "Юрист", product: "конструктор договоров" },
  { icon: Dumbbell, prof: "Тренер", product: "CRM" },
  { icon: Scissors, prof: "Салон", product: "отчёт по точкам" },
  { icon: Megaphone, prof: "Маркетолог", product: "мониторинг конкурентов" },
  { icon: Home, prof: "Риелтор", product: "4 объявления из фото" },
  { icon: LayoutDashboard, prof: "Руководитель", product: "дашборд нагрузки" },
  { icon: Users, prof: "HR", product: "скоринг 200 резюме" },
];

export function Slide_49_NichePunchline() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={720}
      background={<SlideBg theme="dark" variant="climax" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // ОКНО ВОЗМОЖНОСТЕЙ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.04] tracking-[-0.03em] mb-3"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(40px, 5.2vw, 84px)",
          paddingTop: "0.1em",
        }}
      >
        В КАЖДОЙ НИШЕ <span className="text-[#B6FF00]">ЖДУТ ТЕБЯ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/70 text-base md:text-lg leading-snug max-w-2xl mb-6"
      >
        2 миллиона бизнесов в Казахстане. У каждого своя боль. И никто кроме тебя её не закроет.
      </motion.div>

      {/* 8 профессий → продукты */}
      <div className="grid grid-cols-4 gap-2.5 max-w-4xl mb-6">
        {PROFS.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.div
              key={p.prof}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.6 + i * 0.08, ease: [0.25, 1, 0.5, 1] }}
              className="rounded-xl px-3 py-2.5 flex flex-col gap-1.5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-white/55 shrink-0" strokeWidth={1.8} />
                <span className="text-white/80 text-xs md:text-sm font-semibold leading-tight">{p.prof}</span>
              </div>
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.4, delay: 0.9 + i * 0.08, ease: [0.25, 1, 0.5, 1] }}
                className="text-[11px] md:text-xs font-medium rounded-md px-2 py-1 origin-left leading-tight"
                style={{ background: "rgba(182,255,0,0.12)", border: "1px solid rgba(182,255,0,0.28)", color: "#B6FF00" }}
              >
                {p.product}
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Раньше → Сейчас + закрытие + таймер */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.5 }}
        className="flex flex-wrap items-center gap-x-5 gap-y-3 max-w-4xl"
      >
        <div className="flex items-center gap-3 text-sm md:text-base">
          <span className="text-white/45 line-through" style={{ textDecorationColor: "#FC5C02" }}>миллионы ₸, команда, полгода</span>
          <span className="text-[#B6FF00] text-lg">→</span>
          <span className="text-white font-semibold">ты + Claude Code + 2-4 недели</span>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.9, ease: [0.34, 1.56, 0.64, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full"
          style={{ background: "rgba(252,92,2,0.12)", border: "1px solid rgba(252,92,2,0.45)" }}
        >
          <motion.span
            animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="w-2 h-2 rounded-full"
            style={{ background: "#FC5C02", boxShadow: "0 0 10px #FC5C02" }}
          />
          <span className="font-mono text-[11px] md:text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "#FC5C02" }}>окно открыто</span>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 2.2 }}
        className="text-white text-base md:text-xl font-semibold mt-4"
      >
        Кто зайдёт первым — <MarkerReveal color="#B6FF00" delay={2.4}>снимет сливки</MarkerReveal>.
      </motion.div>
    </SlideLayout>
  );
}

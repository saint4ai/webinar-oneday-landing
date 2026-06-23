"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";
import { Calculator, Phone, Users, Megaphone, FileText } from "lucide-react";

/**
 * Слайд 29 · Направление 3 — автоматизация своей работы.
 * Таблица 5 ролей: боль → что делает вайбкодинг. Тема «направления».
 * Текст 1-в-1 из STRUCTURE (маркеры forbes+1 убраны — это источники ресёрча).
 */
const ROLES = [
  { icon: Calculator, role: "Бухгалтер", pain: "«Сверяю одно и то же в 5 таблицах»", fix: "Автосводка, проверка ошибок, шаблонные отчёты" },
  { icon: Phone, role: "Менеджер по продажам", pain: "«Пишу одни и те же коммерческие и напоминания»", fix: "Генерация коммерческих, письма, авто-задачи в CRM" },
  { icon: Users, role: "HR", pain: "«Тону в откликах и переписке»", fix: "Сортировка кандидатов, короткий список, шаблоны" },
  { icon: Megaphone, role: "Маркетолог", pain: "«Каждый день собираю отчёт вручную»", fix: "Автоотчёты, сводные таблицы, дашборды" },
  { icon: FileText, role: "Офис-менеджер", pain: "«Документы и согласования съедают день»", fix: "Автодокументы, чек-листы, маршруты" },
];

export function Slide_29_Direction3() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={660}
      background={<Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex items-baseline gap-3 mb-3"
      >
        <span className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00]">// НАПРАВЛЕНИЕ</span>
        <span
          className="font-bold leading-none"
          style={{ color: "#B6FF00", fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(36px,4.5cqw,64px)", textShadow: "0 0 30px rgba(182,255,0,0.4)" }}
        >
          03
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-6"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(26px, 3.2cqw, 46px)",
        }}
      >
        АВТОМАТИЗАЦИЯ <span className="text-[#B6FF00]">70%</span>
        <br />
        РАБОЧЕЙ РУТИНЫ
      </motion.h1>

      {/* Таблица ролей */}
      <div className="flex flex-col gap-3 max-w-4xl">
        {ROLES.map((r, i) => {
          const Icon = r.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.5 + i * 0.13, ease: [0.25, 1, 0.5, 1] }}
              className="flex items-center gap-4 rounded-xl px-5 py-4"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {/* Роль */}
              <div className="flex items-center gap-3 shrink-0" style={{ width: "210px" }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.25)" }}>
                  <Icon className="w-5 h-5" style={{ color: "#B6FF00" }} strokeWidth={2} />
                </div>
                <span className="text-white font-semibold text-base md:text-lg leading-tight">{r.role}</span>
              </div>
              {/* Боль */}
              <div className="text-white/45 text-sm md:text-base leading-tight italic flex-1 min-w-0">{r.pain}</div>
              {/* Стрелка */}
              <span className="text-[#B6FF00] shrink-0 text-lg">→</span>
              {/* Решение */}
              <div className="text-white/80 text-sm md:text-base leading-snug flex-1 min-w-0">{r.fix}</div>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}

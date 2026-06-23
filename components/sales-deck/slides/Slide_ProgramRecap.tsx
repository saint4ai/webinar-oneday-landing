"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Блок H · 2-е окно — краткая программа: 10 модулей, у каждого результат (конденсат 114-123 promise=).
 * Идёт после RemindMainTraining, перед SalesWindow2. Результаты — из реальных promise модулей.
 */
const MODULES = [
  { t: "ЗАПУСК ДВИГАТЕЛЯ", r: "Первый рабочий сайт — за неделю" },
  { t: "ЯЗЫК АГЕНТА", r: "Идея → техзадание → первая версия продукта" },
  { t: "КОНСТИТУЦИЯ ПРОЕКТА", r: "Память проекта — не разваливается на полпути" },
  { t: "РЕЗЕРВНАЯ КОПИЯ", r: "Резервная копия — ни строчки не потеряешь" },
  { t: "ПРОКАЧКА АГЕНТА", r: "Продукт выглядит дорого — будто над ним сидела команда" },
  { t: "АРМИЯ АГЕНТОВ", r: "Команда ИИ-агентов — собираешь в 2-3 раза быстрее" },
  { t: "БОЕВОЙ ЗАПУСК", r: "Продукт в сети — клиенты могут платить" },
  { t: "БАЗА ДАННЫХ ПРОДУКТА", r: "Живой сервис, которым уже пользуются" },
  { t: "ДЕНЬГИ НА СЧЁТ", r: "Первая оплата падает на счёт" },
  { t: "ПЕРВЫЙ ПЛАТЯЩИЙ КЛИЕНТ", r: "Первый клиент + знаешь, где брать заказы" },
];

export function Slide_ProgramRecap() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={820} background={<SlideBg theme="dark" variant="climax" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ВСЯ ПРОГРАММА ОБУЧЕНИЯ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-5"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(22px, 2.7cqw, 42px)" }}
      >
        10 МОДУЛЕЙ — ОТ УСТАНОВКИ <span className="text-[#B6FF00]">ДО ПЕРВОГО КЛИЕНТА</span>
      </motion.h1>

      <div className="grid grid-cols-2 gap-x-5 gap-y-2 max-w-4xl">
        {MODULES.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.35 + i * 0.06 }} className="flex items-start gap-2.5 py-1.5">
            <span className="font-bold text-[#B6FF00]/80 tabular-nums shrink-0 w-6" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(14px,1.3cqw,18px)" }}>{i + 1}</span>
            <div className="min-w-0">
              <div className="font-mono text-[10px] tracking-wide uppercase text-[#B6FF00]/60 leading-tight">{m.t}</div>
              <div className="text-white font-semibold text-[15px] leading-tight">{m.r}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.2 }} className="text-white/85 text-sm md:text-base leading-snug max-w-2xl mt-5">
        Каждый модуль — <span className="text-[#B6FF00] font-semibold">конкретный результат на руках</span>, а не «посмотрел видео».
      </motion.div>
    </SlideLayout>
  );
}

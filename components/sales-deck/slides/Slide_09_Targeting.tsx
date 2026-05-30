"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { ChecklistItem } from "../ChecklistItem";

/**
 * Слайд 9 · Для кого этот эфир — «ВОРКШОП ДЛЯ ВАС ЕСЛИ»
 * 5 категорий ЦА. Текст длинный — компактный шрифт + 2 колонки.
 *
 * АЛЕКСАНДР: «(Возможно, слайды данного блока нужно будет разбить на два...)»
 * → пока один слайд с 2 колонками; если не влезает — разбить на 9a/9b.
 */
const TARGETING = [
  "У вас куча гениальных идей сервисов или приложений — и вы не хотите платить разработчикам или искать команду",
  "Вы хотите автоматизировать 70% своей рабочей рутины и освободить время на более важные дела",
  "Вы предприниматель и хотите свой IT-продукт",
  "Вы офисный сотрудник и хотите перестать делать одно и то же — или вырасти по карьерной лестнице за счёт новых AI-навыков",
  "Вы фрилансер с клиентами и спросом на такие решения — которые помогут вам и вашим клиентам заработать",
];

export function Slide_09_Targeting() {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      <Spotlight className="-top-40 left-0 md:-top-20" fill="#B6FF00" />

      <div
        className="relative z-10 h-full flex flex-col justify-center"
        style={{
          paddingRight: "calc(var(--sd-speaker-zone, 30vw) + 48px)",
          paddingLeft: "48px",
        }}
      >
        <div className="flex flex-col gap-7" style={{ maxWidth: "min(1000px, 62vw)" }}>
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00]"
          >
            // ДЛЯ КОГО
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase text-white leading-[1.05] tracking-[-0.03em]"
            style={{
              fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(34px, 4.2vw, 60px)",
            }}
          >
            ВОРКШОП ДЛЯ ВАС <span className="text-[#B6FF00]">ЕСЛИ</span>
          </motion.h1>

          {/* 5 пунктов — компактный шрифт, 2 колонки на десктопе */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-[15px] md:text-[16px]">
            {TARGETING.map((text, i) => (
              <ChecklistItem key={i} index={i} icon="check" staggerMs={130}>
                {text}
              </ChecklistItem>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

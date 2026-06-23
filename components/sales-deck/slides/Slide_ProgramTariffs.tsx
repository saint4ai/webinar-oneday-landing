"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд-напоминание · вся программа (10 модулей) + 2 тарифа со стоимостью.
 * Ставится 2+ раза (после оплаты и во 2-м окне) — ученики просят повторно показать тарифы и что входит.
 * Цены/наполнение — решения Александра 2026-06-05.
 */
const MODULES = [
  "Запуск двигателя",
  "Язык агента",
  "Конституция проекта",
  "Резервная копия",
  "Прокачка агента",
  "Армия агентов",
  "Боевой запуск",
  "База данных продукта",
  "Деньги на счёт",
  "Первый платящий клиент",
];

function TariffMini({ name, tag, rung, final, off, accent, recommended }: { name: string; tag: string; rung: string; final: string; off: string; accent: string; recommended?: boolean }) {
  return (
    <div className="rounded-xl px-4 py-3 flex-1 min-w-[210px]" style={{ background: recommended ? "rgba(182,255,0,0.07)" : "rgba(255,255,255,0.03)", border: `1px solid ${recommended ? "rgba(182,255,0,0.45)" : "rgba(255,255,255,0.12)"}`, boxShadow: recommended ? "0 0 50px -22px rgba(182,255,0,0.5)" : "none" }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-bold uppercase text-white" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 16 }}>{name}</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] rounded-full px-2 py-0.5" style={{ color: accent, background: `${accent}1a`, border: `1px solid ${accent}55` }}>{tag}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-white/35 line-through tabular-nums text-[13px]">{rung}</span>
        <span className="font-bold tabular-nums leading-none" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 26, color: accent }}>{final}</span>
        <span className="rounded px-1.5 py-0.5 text-[10px] font-bold mb-0.5" style={{ color: accent, background: `${accent}1a`, border: `1px solid ${accent}55` }}>{off}</span>
      </div>
    </div>
  );
}

export function Slide_ProgramTariffs() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={840} background={<SlideBg theme="dark" variant="climax" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // НАПОМИНАЮ — ЧТО ВХОДИТ И СКОЛЬКО
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-4"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(22px, 2.7cqw, 42px)" }}
      >
        ВСЯ ПРОГРАММА <span className="text-[#B6FF00]">+ 2 ТАРИФА</span>
      </motion.h1>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 max-w-3xl mb-5">
        {MODULES.map((m, i) => (
          <motion.div key={m} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }} className="flex items-center gap-2.5 py-1">
            <span className="font-bold text-[#B6FF00]/80 tabular-nums shrink-0 w-5 text-right" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 14 }}>{i + 1}</span>
            <span className="text-white/85 text-sm leading-tight">{m}</span>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.85 }} className="flex gap-3 flex-wrap max-w-3xl">
        <TariffMini name="Вайб Solo" tag="без ОС" rung="400 000 ₸" final="220 000 ₸" off="−45%" accent="#FFFFFF" />
        <TariffMini name="Вайбкодер Pro" tag="рекомендуем" rung="490 000 ₸" final="290 900 ₸" off="−40%" accent="#B6FF00" recommended />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 1.2 }} className="text-white/55 text-xs md:text-sm mt-3 max-w-3xl">
        Solo — все модули и материалы без обратной связи. Pro — всё то же + кураторы, ИИ-менеджеры и доведение до результата.
      </motion.div>
    </SlideLayout>
  );
}

"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Check } from "lucide-react";

/**
 * Слайд · 2 тарифа — Вайб Solo (без ОС) vs Вайбкодер Pro (полный пакет).
 * Лесенка цен и наполнение — решения Александра 2026-06-05.
 *   Solo: 400 000 → 300 000 → 220 000 (−45%). Pro: 490 000 → 390 000 → 290 900 (−40%).
 *   ИИ-менеджеры, ОС, мастер-классы, Hermes, сертификат, договоры, спикер, источник заказов — только Pro.
 */
const SOLO = [
  "Все 10 модулей + 50 уроков",
  "Все раздаточные материалы и шаблоны",
  "Доступ 12 месяцев",
  "Бонусы за предоплату и за просмотр",
];

const PRO_EXTRAS = [
  "Обратная связь: проверка ДЗ + Zoom-разбор проектов каждую неделю",
  "Обучение «ИИ-менеджеры в отделы продаж» — 390 000 ₸ в подарок",
  "Мастер-классы приглашённых спикеров: продажи, разработка, App Store, Android",
  "Блок Hermes — своя система AI-агентов в Telegram, 24/7 на твой бизнес",
  "Договоры IT + AI · Секретный спикер · Готовый источник заказов",
  "Сертификат о прохождении от onAI Академии",
];

function PriceLadder({ rungs, final, off, accent }: { rungs: string[]; final: string; off: string; accent: string }) {
  return (
    <div className="flex items-end gap-2.5 flex-wrap">
      <div className="flex flex-col leading-none">
        {rungs.map((r) => (
          <span key={r} className="text-white/35 line-through tabular-nums text-[13px] md:text-sm">{r}</span>
        ))}
      </div>
      <span className="font-bold tabular-nums leading-none" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(26px,2.7vw,40px)", color: accent, textShadow: `0 0 44px ${accent}55` }}>{final}</span>
      <span className="rounded-md px-2 py-1 text-[11px] font-bold mb-0.5" style={{ background: `${accent}1a`, border: `1px solid ${accent}66`, color: accent }}>{off}</span>
    </div>
  );
}

export function Slide_Tariffs() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={880} background={<SlideBg theme="dark" variant="climax" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ДВА ФОРМАТА — ВЫБИРАЙ СВОЙ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-5"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 3vw, 46px)" }}
      >
        КАК ЗАЙДЁШЬ <span className="text-[#B6FF00]">В ОБУЧЕНИЕ</span>
      </motion.h1>

      <div className="grid grid-cols-2 gap-4 max-w-5xl items-stretch">
        {/* Solo — базовый, приглушённый */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, delay: 0.4 }} className="rounded-2xl p-5 flex flex-col" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <span className="self-start font-mono text-[10px] uppercase tracking-[0.14em] text-white/50 rounded-full px-2.5 py-1 mb-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}>без обратной связи</span>
          <div className="font-bold uppercase text-white mb-2.5" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(20px,2vw,30px)" }}>Вайб Solo</div>
          <div className="mb-4"><PriceLadder rungs={["400 000 ₸", "300 000 ₸"]} final="220 000 ₸" off="−45%" accent="#FFFFFF" /></div>
          <div className="flex flex-col gap-2">
            {SOLO.map((s) => (
              <div key={s} className="flex items-start gap-2.5"><Check className="w-4 h-4 mt-0.5 shrink-0 text-white/55" strokeWidth={2.6} /><span className="text-white/75 text-[13px] md:text-sm leading-snug">{s}</span></div>
            ))}
          </div>
          <div className="mt-auto pt-4 text-white/45 text-xs">Проходишь сам, в своём темпе.</div>
        </motion.div>

        {/* Pro — полный, акцент */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, delay: 0.55 }} className="rounded-2xl p-5 flex flex-col relative" style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.45)", boxShadow: "0 0 70px -24px rgba(182,255,0,0.5)" }}>
          <span className="self-start font-mono text-[10px] uppercase tracking-[0.14em] text-[#B6FF00] rounded-full px-2.5 py-1 mb-3 font-bold" style={{ background: "rgba(182,255,0,0.12)", border: "1px solid rgba(182,255,0,0.45)" }}>рекомендуем · с обратной связью</span>
          <div className="font-bold uppercase text-white mb-2.5" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(20px,2vw,30px)" }}>Вайбкодер <span className="text-[#B6FF00]">Pro</span></div>
          <div className="mb-3"><PriceLadder rungs={["490 000 ₸", "390 000 ₸"]} final="290 900 ₸" off="−40%" accent="#B6FF00" /></div>
          <div className="text-white/85 text-[13px] md:text-sm font-semibold mb-2">Всё из Solo, плюс:</div>
          <div className="flex flex-col gap-1.5">
            {PRO_EXTRAS.map((p) => (
              <div key={p} className="flex items-start gap-2.5"><Check className="w-4 h-4 mt-0.5 shrink-0 text-[#B6FF00]" strokeWidth={2.8} /><span className="text-white/85 text-[13px] md:text-sm leading-snug">{p}</span></div>
            ))}
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}

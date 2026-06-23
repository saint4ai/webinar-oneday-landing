"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Блок C · Смысл 1 — социальное доказательство (после Smysl1_Relevance).
 * 3-е лицо: рынок сам это обсуждает. Реальный скрин ai_nishanov (720К/год) + цитаты из Threads.
 * ⚠ Цитаты — реальные публичные комментарии Threads. Атрибуция generic «участник обсуждения» (не личные хэндлы — подтвердить с Александром, могу вернуть @).
 */
const QUOTES = [
  { text: "Описал сценарий — агент готов. Заявки, документы, отчёты — без IT-отдела.", who: "участник обсуждения в Threads" },
  { text: "Разработка автоматизаций сократилась с пары недель до пары часов.", who: "участник обсуждения в Threads" },
];

export function Slide_Smysl1b_Proof() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="28cqw"
      contentMinWidth={500}
      background={<SlideBg theme="dark" variant="aura-tl" />}
      leftObject={
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
          className="relative w-full h-[80cqh] rounded-2xl overflow-hidden border"
          style={{ borderColor: "rgba(255,255,255,0.12)", boxShadow: "0 30px 80px -30px rgba(0,0,0,0.7)" }}
        >
          <Image src="/cards-gifs-screenshots/social-proof/proof-ai-nishanov.png" alt="Реальный пост в Threads: экономия 720 000 в год" fill sizes="28cqw" className="object-cover object-top" priority />
        </motion.div>
      }
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3 self-start">
        // ЖИВЫЕ ГОЛОСА ИЗ THREADS
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.04] tracking-[-0.03em] mb-4"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3.1cqw, 50px)" }}
      >
        ЭТО НЕ Я ГОВОРЮ — <span className="text-[#B6FF00]">ЭТО УЖЕ ОБСУЖДАЮТ</span>
      </motion.h1>

      {/* Колаут к скрину */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="rounded-xl px-4 py-3 mb-4 max-w-xl" style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.35)" }}>
        <span className="text-white/85 text-sm md:text-base leading-snug">
          Слева — реальный пост. Человек заменил рутину собственным сервисом и посчитал: <span className="text-[#B6FF00] font-bold">больше 4 млн ₸ в год</span> экономии. На одной задаче.
        </span>
      </motion.div>

      {/* Цитаты */}
      <div className="flex flex-col gap-2.5 max-w-xl mb-5">
        {QUOTES.map((q, i) => (
          <motion.div key={q.text} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.7 + i * 0.18 }} className="relative rounded-xl pl-4 pr-4 py-3" style={{ background: "rgba(255,255,255,0.04)", borderLeft: "3px solid rgba(182,255,0,0.6)" }}>
            <div className="text-white/90 text-sm md:text-base leading-snug">«{q.text}»</div>
            <div className="text-white/40 text-[13px] md:text-sm mt-1.5">— {q.who}</div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.2 }} className="text-white/85 text-base md:text-lg leading-snug max-w-xl">
        Это происходит <span className="text-[#B6FF00] font-semibold">прямо сейчас</span>. Без меня и без рекламы.
      </motion.div>
    </SlideLayout>
  );
}

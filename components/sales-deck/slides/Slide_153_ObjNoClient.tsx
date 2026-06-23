"use client";

import { motion } from "framer-motion";
import { ObjectionSlide } from "../ObjectionSlide";
import { Trophy } from "lucide-react";

/** Слайд 153 · Возражение 4 — не найду клиента → Модуль 10. Текст 1-в-1 STRUCTURE 2132-2145. */
const LESSONS = [
  "Ниша, оффер, позиционирование",
  "Оффер по формуле Гранд Слэм (Hormozi)",
  "Холодные рассылки и тёплые касания",
  "Карта TG-чатов где сидят платящие клиенты",
  "Нетворкинг и реферальная система",
  "Авторский мастер-класс по воронке продаж",
  "Скрипты постановки клиента на созвон",
  "Структура созвона + работа с возражениями",
  "Готовое КП с упаковкой, отправкой, дожимом",
];

export function Slide_153_ObjNoClient() {
  return (
    <ObjectionSlide n={4} question="А ЕСЛИ Я НЕ НАЙДУ КЛИЕНТА?" answer="Модуль 10 — целиком про то, как находить клиентов и закрывать на оплату." bg="aura-tr" qSize="clamp(24px, 3cqw, 46px)">
      <div className="flex items-start gap-5 max-w-4xl">
        <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 flex-1">
          {LESSONS.map((l, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.65 + i * 0.06 }} className="flex items-start gap-2">
              <span className="font-mono text-[10px] text-[#B6FF00] shrink-0 mt-0.5 font-bold">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-white/80 text-xs md:text-[13px] leading-snug">{l}</span>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 1.2, ease: [0.34, 1.4, 0.64, 1] }} className="flex flex-col items-center rounded-2xl px-5 py-4 shrink-0" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)" }}>
          <Trophy className="w-7 h-7 text-[#B6FF00] mb-2" strokeWidth={1.8} />
          <span className="text-white/60 text-[10px] uppercase tracking-[0.1em] text-center mb-1">первый клиент<br />с чеком от</span>
          <span className="font-bold text-[#B6FF00] leading-none" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(28px,3cqw,46px)" }}>$500</span>
        </motion.div>
      </div>
    </ObjectionSlide>
  );
}

"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Star } from "lucide-react";

/**
 * Слайд 143 · ГЛАВНЫЙ бонус вечера ЗА ПОКУПКУ — «ИИ-менеджер для отдела продаж». Альбом-хедлайн.
 * Большая альбомная (16:9) карточка-баннер бонуса. Дальше: 143a кейсы → 143b программа.
 */
export function Slide_143_OTO1() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={780}
      background={<SlideBg theme="dark" variant="climax" />}
      contentClassName="!justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-4 self-start"
        style={{ background: "rgba(182,255,0,0.12)", border: "1px solid rgba(182,255,0,0.45)" }}
      >
        <Star className="w-3.5 h-3.5 text-[#B6FF00]" strokeWidth={2.4} fill="#B6FF00" />
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] font-bold text-[#B6FF00]">
          ГЛАВНЫЙ БОНУС ВЕЧЕРА · ЗА ПОКУПКУ ДО КОНЦА ДНЯ
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
        className="relative w-full rounded-2xl overflow-hidden border"
        style={{ aspectRatio: "16 / 9", borderColor: "rgba(182,255,0,0.3)", boxShadow: "0 30px 80px -30px rgba(0,0,0,0.7), 0 0 70px -24px rgba(182,255,0,0.32)" }}
      >
        <Image
          src="/cards-gifs-screenshots/bonus/bonus-album-ii-manager.png"
          alt="Главный бонус вечера — ИИ-менеджер для отдела продаж"
          fill
          sizes="70vw"
          className="object-cover"
          priority
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-white/75 text-base md:text-lg leading-snug max-w-3xl mt-5"
      >
        Весь прошлый год я обучал внедрению ИИ-менеджеров в отделы продаж. Ученики зарабатывали{" "}
        <span className="text-[#B6FF00] font-semibold">от 500 тысяч до 3 млн ₸ в месяц</span>. Забираешь за покупку обучения до конца дня.
      </motion.div>
    </SlideLayout>
  );
}

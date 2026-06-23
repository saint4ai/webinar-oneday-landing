"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 13 · Знакомство Александра — «МЕНЯ ЗОВУТ АЛЕКСАНДР».
 *
 * Сейчас: реальный hero-shot Александра в onAI футболке (`/handouts/alex/alex_hero.png`).
 * TODO когда сгенерится — заменить на half_robot.png: «АЛЕКСАНДР: Вставить мою
 *  фотографию с лицом где я на половину робот на половину кожаный человек».
 *
 * 📐 Layout через SlideLayout (Grid).
 */
export function Slide_13_AlexanderIntro() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="28cqw"
      background={
        <>
          <Spotlight className="-top-40 left-0 md:-top-20" fill="#B6FF00" />
          <Spotlight className="bottom-0 left-[10cqw] md:bottom-[-20cqh]" fill="#FC5C02" />
        </>
      }
      leftObject={
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
          className="relative w-[92%] max-w-[420px] aspect-[4/5] rounded-2xl overflow-hidden"
          style={{
            boxShadow:
              "0 30px 60px -20px rgba(182,255,0,0.35), 0 0 0 1px rgba(182,255,0,0.15), 0 0 80px -20px rgba(252,92,2,0.25)",
          }}
        >
          <Image
            src="/handouts/alex/alex_portrait_story.png"
            alt="Александр — основатель onAI Academy"
            fill
            sizes="(max-width: 1280px) 28vw, 420px"
            className="object-cover"
            style={{ objectPosition: "center bottom" }}
            priority
          />
          {/* Лёгкое затемнение снизу для читаемости границы */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 25%)",
            }}
          />
        </motion.div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // ЗНАКОМСТВО
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em]"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(32px, 4cqw, 56px)",
        }}
      >
        МЕНЯ ЗОВУТ <span className="text-[#B6FF00]">АЛЕКСАНДР</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="text-white text-base md:text-lg leading-snug mt-5"
      >
        За последний год я собрал <span className="text-[#B6FF00] font-semibold">7 рабочих сервисов</span>. Один. Без команды.
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.85 }}
        className="text-white/75 text-sm md:text-base leading-relaxed mt-3"
      >
        Без программистов. Без студии за 5 млн. Без учёбы по 2 года. Просто разговаривал с AI на естественном языке + качественно планировал. Шаг за шагом.
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.1 }}
        className="text-white/85 text-sm md:text-base leading-relaxed mt-3"
      >
        Самый большой проект которым я горжусь — <span className="text-[#B6FF00] font-semibold">onai.academy</span>. Платформа обучения на базе ИИ.
      </motion.div>

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 160 }}
        transition={{ duration: 0.7, delay: 1.35, ease: [0.25, 1, 0.5, 1] }}
        className="h-[2px] bg-[#B6FF00] mt-6"
      />
    </SlideLayout>
  );
}

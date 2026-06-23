"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";
import { ClaudeCodeTerminal } from "../ClaudeCodeTerminal";

/**
 * Слайд 25 · Engagement — «ВАМ ЭТО ЗНАКОМО?».
 * Эмоциональный слайд-триггер реакции в чате. Терминал печатает сервис (зацикл),
 * заголовок пульсирует, прямой вопрос провоцирует написать в чат.
 * Текст 1-в-1 из STRUCTURE.
 */
export function Slide_25_PollIdea() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="30cqw"
      background={
        <>
          <Spotlight className="-top-40 left-0 md:-top-20" fill="#B6FF00" />
          <Spotlight className="bottom-0 right-[10cqw] md:bottom-[-20cqh]" fill="#FC5C02" />
        </>
      }
      leftObject={
        <div className="w-full max-w-[440px] px-4">
          <ClaudeCodeTerminal
            prompt="собери приложение для учёта моих клиентов"
            response="Создаю CRM: таблица клиентов, фильтры, экспорт, напоминания..."
            speed={45}
          />
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-5"
      >
        // ВОПРОС В ЧАТ
      </motion.div>

      {/* Пульсирующий заголовок — крючок после «кто такой вайбкодер» */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        className="font-bold uppercase text-white leading-[0.95] tracking-[-0.03em] mb-6"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(32px, 4cqw, 60px)",
        }}
      >
        А ЧТО{" "}
        <motion.span
          animate={{
            opacity: [1, 0.6, 1],
            textShadow: [
              "0 0 30px rgba(182,255,0,0.5)",
              "0 0 60px rgba(182,255,0,0.9)",
              "0 0 30px rgba(182,255,0,0.5)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block text-[#B6FF00]"
        >
          СОБЕРЁТЕ
        </motion.span>
        <br />
        ВЫ?
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="text-white text-lg md:text-2xl leading-snug max-w-xl"
      >
        Напишите в чат — есть у вас{" "}
        <span className="text-[#B6FF00] font-semibold">идея сервиса</span> в голове?
      </motion.div>

      {/* Подсказка-стрелка к чату */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.5, 1] }}
        transition={{ duration: 2.5, delay: 1.2, repeat: Infinity }}
        className="flex items-center gap-2 mt-6 text-[#B6FF00] font-mono text-sm uppercase tracking-[0.1em]"
      >
        <span>↓</span> пишите прямо сейчас
      </motion.div>
    </SlideLayout>
  );
}

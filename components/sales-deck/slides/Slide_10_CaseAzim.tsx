"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 10a · Кейс Азима, часть 1 — переписка WhatsApp.
 *
 * Layout: заголовок + текст сверху, landscape-скриншот переписки снизу.
 * Последние 4 цифры телефона замазаны (privacy).
 *
 * Александр: «Скриншот должен быть вверху, в альбомном варианте.
 * Телефон ему надо замазать, хотя бы последние четыре цифры.»
 */
export function Slide_10_CaseAzim() {
  return (
    <SlideLayout
      speakerSide="right"
      background={<Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // ПОЧЕМУ ВАЖНО ДОСМОТРЕТЬ ДО КОНЦА
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-4"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(28px, 3.4cqw, 52px)",
        }}
      >
        ПОЧЕМУ ВАЖНО <span className="text-[#B6FF00]">ДОСМОТРЕТЬ</span>
        <br />
        ДО КОНЦА?
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-white text-sm md:text-base leading-relaxed mb-5 max-w-2xl"
      >
        Ученик прошлого такого же воркшопа уже сделал <span className="text-[#B6FF00] font-semibold">своё приложение</span> — за неделю, без программистов.
      </motion.div>

      {/* Скриншот переписки WhatsApp — ЦЕЛИКОМ (object-contain), реальный ratio 2:1,
          закруглённые углы. Александр замазал телефон прямо в PNG. */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.7, ease: [0.25, 1, 0.5, 1] }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          aspectRatio: "1834 / 914",
          maxHeight: "52cqh",
          maxWidth: "100%",
          boxShadow:
            "0 30px 60px -20px rgba(182,255,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)",
        }}
      >
        <Image
          src="/handouts/students/azim_chat.png"
          alt="Переписка с Азимом — выпускник прошлого потока"
          fill
          sizes="(max-width: 1280px) 70cqw, 1000px"
          className="object-contain"
          priority
        />

        {/* Лейбл */}
        <div
          className="absolute top-3 right-3 text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-1 rounded-md"
          style={{
            background: "rgba(0,0,0,0.75)",
            color: "#B6FF00",
            border: "1px solid rgba(182,255,0,0.3)",
            backdropFilter: "blur(8px)",
          }}
        >
          // АЗИМ · WHATSAPP
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.0 }}
        className="text-white/65 text-xs md:text-sm leading-relaxed mt-4 max-w-2xl"
      >
        На следующем слайде покажу как именно выглядит его приложение.
      </motion.div>
    </SlideLayout>
  );
}

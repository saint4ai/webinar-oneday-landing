"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { NicheTag } from "../NicheTag";
import { Send } from "lucide-react";

/**
 * Слайд 44 · Решение — Руководитель (дашборд нагрузки). Текст 1-в-1 STRUCTURE 505-516.
 * Layout «текст сверху / дашборд снизу» (реальный скрин нагрузки отделов) +
 * плавающая Telegram-карточка утреннего отчёта (свежий элемент). Пара к Slide 43.
 * Скрин: public/handouts/niches/manager_load.png (реальный, MacBook Александра).
 */
const CONNECT = ["Asana", "Bitrix", "Jira", "Trello", "календарь", "Slack/Telegram"];
const REPORT = [
  { dot: "#FF4D4D", text: "Айгерим перегружена — разгрузи, пока не выгорела." },
  { dot: "rgba(255,255,255,0.4)", text: "У Дамира есть ресурс — можно передать часть задач." },
  { dot: "#FC5C02", text: "Аскар застрял 3 дня — нужна помощь, подключись." },
];

export function Slide_44_ManagerSolution() {
  return (
    <SlideLayout
      speakerSide="right"
      contentClassName="!justify-start !py-0"
      background={<SlideBg theme="dark" variant="aura-tl" />}
    >
      <div
        className="flex flex-col h-full w-full"
        style={{ paddingTop: "clamp(36px,6vh,72px)", paddingBottom: "clamp(28px,4vh,52px)" }}
      >
        {/* ===== ВЕРХ ===== */}
        <div className="shrink-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-3 mb-3"
          >
            <NicheTag label="РУКОВОДИТЕЛЬ" tone="lime" />
            <span className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00]">// РЕШЕНИЕ</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase leading-[1.04] tracking-[-0.02em]"
            style={{
              fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(22px, 2.5vw, 40px)",
              wordBreak: "keep-all",
              overflowWrap: "normal",
              hyphens: "none",
            }}
          >
            <span className="text-white">ОДИН ДАШБОРД ПОКАЗЫВАЕТ, </span>
            <span style={{ color: "#B6FF00" }}>ГДЕ КОМАНДЕ НУЖНА ПОМОЩЬ</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="text-white/65 text-sm md:text-base leading-snug max-w-2xl mt-3"
          >
            AI видит реальную нагрузку команды, подсвечивает перегруз и узкие места → ты вовремя разгружаешь и держишь темп. Отчёт к 9 утра.
          </motion.div>

          {/* ряд: что подключаем + цена */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-5"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-white/40 mr-1">подключаем:</span>
              {CONNECT.map((c) => (
                <span
                  key={c}
                  className="font-mono text-[11px] px-2.5 py-1 rounded-md"
                  style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.25)", color: "#B6FF00" }}
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="font-bold" style={{ fontFamily: "var(--font-benzin)", fontSize: "clamp(18px,1.7vw,26px)", color: "#B6FF00", whiteSpace: "nowrap" }}>
                от 700 000 ₸
              </span>
              <span className="text-white/50 text-[12px]">окупается за 2 месяца</span>
            </div>
          </motion.div>
        </div>

        {/* ===== НИЗ: дашборд нагрузки + Telegram-отчёт ===== */}
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 1, 0.5, 1] }}
          className="flex-1 min-h-0 flex flex-col justify-end mt-6"
        >
          <div className="relative w-full" style={{ maxHeight: "100%", maxWidth: 820 }}>
            {/* дашборд в браузер-рамке */}
            <div
              className="relative w-full rounded-xl overflow-hidden border border-white/15"
              style={{
                aspectRatio: "16 / 9",
                boxShadow: "0 30px 80px -24px rgba(0,0,0,0.85), 0 0 70px -14px rgba(182,255,0,0.22)",
              }}
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border-b border-white/10">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 font-mono text-[11px] text-white/45">🔒 dashboard / нагрузка команды</span>
                <span
                  className="ml-auto flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-[0.12em]"
                  style={{ background: "rgba(182,255,0,0.12)", border: "1px solid rgba(182,255,0,0.35)", color: "#B6FF00" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#B6FF00" }} />
                  live
                </span>
              </div>
              <div className="relative w-full bg-white" style={{ height: "calc(100% - 33px)" }}>
                <Image
                  src="/handouts/niches/manager_load.png"
                  alt="Дашборд реальной нагрузки команды — кто перегружен, кто простаивает"
                  fill
                  className="object-cover object-top"
                  sizes="70vw"
                  priority
                />
              </div>
            </div>

            {/* Telegram-карточка утреннего отчёта — плавает над правым краем дашборда */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.1, ease: [0.25, 1, 0.5, 1] }}
              className="absolute z-20 rounded-2xl p-4 w-[300px] md:w-[340px]"
              style={{
                right: "0px",
                bottom: "8px",
                background: "rgba(10,12,14,0.92)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(182,255,0,0.3)",
                boxShadow: "0 24px 60px -16px rgba(0,0,0,0.9)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#B6FF00" }}>
                  <Send className="w-3.5 h-3.5 text-black" strokeWidth={2.2} />
                </div>
                <span className="font-semibold text-white text-sm">Отчёт владельцу</span>
                <span className="ml-auto font-mono text-[11px] text-white/45">9:00</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {REPORT.map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.4 + i * 0.2 }}
                    className="flex items-start gap-2.5"
                  >
                    <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: r.dot, boxShadow: `0 0 8px ${r.dot}` }} />
                    <span className="text-white/85 text-[13px] leading-snug">{r.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}

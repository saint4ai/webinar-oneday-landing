"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { NicheTag } from "../NicheTag";
import { PriceChip } from "../PriceChip";
import { Image as ImageIcon, Sparkles, ChevronRight, Clock } from "lucide-react";

/**
 * Слайд 42 · Решение — Риелтор. Текст 1-в-1 из STRUCTURE (строки 473-484).
 * Свежий приём «pipeline-flow»: 8 фото → AI-узел → 4 объявления + таймер 3:00.
 * Пара к Slide 41 (боль) — единый ниша-тег РИЕЛТОР, решение = лайм.
 */
const PLATFORMS = [
  { name: "Krisha", tone: "факты: метраж, этаж", c: "#13B45A" },
  { name: "Instagram", tone: "эмоции: вид с балкона", c: "#E1306C" },
  { name: "OLX", tone: "коротко: цена, район", c: "#7AC143" },
  { name: "Threads", tone: "живой пост", c: "#FFFFFF" },
];

export function Slide_42_RealtorSolution() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={680}
      background={<SlideBg theme="dark" variant="aura-tr" />}
    >
      {/* eyebrow: ниша-тег + метка решения */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center gap-3 mb-3"
      >
        <NicheTag label="РИЕЛТОР" tone="lime" />
        <span className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00]">// РЕШЕНИЕ</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.02] tracking-[-0.03em] mb-3"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(24px, 2.9vw, 44px)",
        }}
      >
        AI ПИШЕТ 4 ОБЪЯВЛЕНИЯ ИЗ 8 ФОТО ЗА <span className="text-[#B6FF00]">3 МИНУТЫ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="text-white/65 text-sm md:text-base leading-snug max-w-2xl mb-7"
      >
        Загружает фото → AI смотрит на квартиру → 4 текста каждый со своим тоном → автопостинг.
      </motion.div>

      {/* ===== PIPELINE FLOW: 8 фото → AI → 4 объявления ===== */}
      <div className="flex items-stretch gap-4 md:gap-5 mb-7">
        {/* Stage A — 8 фото */}
        <PipelineStage caption="8 фото + 2 строки" delay={0.7}>
          <div className="grid grid-cols-4 grid-rows-2 gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.8 + i * 0.05, ease: [0.34, 1.56, 0.64, 1] }}
                className="w-9 h-9 md:w-10 md:h-10 rounded-md flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(182,255,0,0.10), rgba(255,255,255,0.04))",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <ImageIcon className="w-3.5 h-3.5 text-white/35" strokeWidth={1.8} />
              </motion.div>
            ))}
          </div>
        </PipelineStage>

        <FlowArrow delay={1.15} />

        {/* Stage B — AI-узел */}
        <PipelineStage caption="AI понимает квартиру" delay={1.2}>
          <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
            <motion.div
              aria-hidden
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(182,255,0,0.45), transparent 70%)" }}
            />
            <div
              className="relative w-[68px] h-[68px] rounded-full flex items-center justify-center"
              style={{ background: "#B6FF00", boxShadow: "0 0 40px rgba(182,255,0,0.5)" }}
            >
              <Sparkles className="w-7 h-7 text-black" strokeWidth={2} />
            </div>
          </div>
        </PipelineStage>

        <FlowArrow delay={1.35} />

        {/* Stage C — 4 объявления */}
        <PipelineStage caption="4 текста — каждый со своим тоном" delay={1.4} grow>
          <div className="flex flex-col gap-1.5 w-full">
            {PLATFORMS.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 1.5 + i * 0.12, ease: [0.25, 1, 0.5, 1] }}
                className="flex items-center gap-2.5 rounded-lg px-3 py-1.5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(182,255,0,0.18)" }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.c, boxShadow: `0 0 8px ${p.c}` }} />
                <span className="text-white font-semibold text-xs md:text-sm shrink-0 w-[78px]">{p.name}</span>
                <span className="text-white/45 text-[11px] md:text-xs leading-tight truncate">{p.tone}</span>
              </motion.div>
            ))}
          </div>
        </PipelineStage>

        {/* Таймер */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 2.0, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex flex-col items-center justify-center self-center shrink-0 pl-1"
        >
          <div className="flex items-center gap-1.5">
            <Clock className="w-5 h-5 text-[#B6FF00]" strokeWidth={2} />
            <span className="font-bold text-[#B6FF00] leading-none" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(28px,3vw,44px)" }}>3:00</span>
          </div>
          <span className="text-white/45 text-[10px] md:text-[11px] mt-1 font-mono uppercase tracking-[0.08em]">вместо <span style={{ color: "#FC5C02" }}>40 минут</span></span>
        </motion.div>
      </div>

      {/* ===== Нижняя строка: что подключаем · результат · цена ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 2.2 }}
        className="flex flex-wrap items-stretch gap-4 max-w-3xl"
      >
        <InfoBlock label="ЧТО ПОДКЛЮЧАЕМ">
          Krisha + Instagram + OLX + Threads <span className="text-white/40">(любые 4-5 площадок)</span>
        </InfoBlock>
        <InfoBlock label="РЕЗУЛЬТАТ">
          Один риелтор экономит <span className="text-white font-semibold">30 часов/мес</span>. Агентство 10 риелторов — <span className="text-white font-semibold">300 часов</span>.
        </InfoBlock>
        <PriceChip price="от 500 000 ₸" payback="окупается за 2-3 недели" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 2.5 }}
        className="text-white/35 text-xs md:text-sm mt-4 max-w-2xl"
      >
        Глобальные AI не знают разницы тона между Krisha и Instagram.
      </motion.div>
    </SlideLayout>
  );
}

/* — вспомогательные под-блоки слайда (локальные, не выносим: только тут) — */

function PipelineStage({ children, caption, delay, grow }: { children: React.ReactNode; caption: string; delay: number; grow?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 1, 0.5, 1] }}
      className={`flex flex-col items-center gap-2.5 ${grow ? "flex-1 min-w-[180px]" : "shrink-0"}`}
    >
      <div className="flex items-center justify-center flex-1">{children}</div>
      <span className="text-white/45 text-[10px] md:text-[11px] font-mono uppercase tracking-[0.06em] text-center leading-tight max-w-[150px]">{caption}</span>
    </motion.div>
  );
}

function FlowArrow({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-center self-start pt-5 shrink-0"
    >
      <ChevronRight className="w-6 h-6 text-[#B6FF00]/70" strokeWidth={2.5} />
    </motion.div>
  );
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 min-w-[220px] rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#B6FF00] mb-1.5">{label}</div>
      <div className="text-white/70 text-xs md:text-sm leading-snug">{children}</div>
    </div>
  );
}

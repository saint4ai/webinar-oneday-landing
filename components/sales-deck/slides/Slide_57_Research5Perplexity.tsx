"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { SlideLayout } from "../SlideLayout";
import { Search } from "lucide-react";

/**
 * Слайд 57 · Research 5/5 — «ГОТОВЫЙ ПРОМПТ ДЛЯ PERPLEXITY». Текст 1-в-1 STRUCTURE 700-724.
 * CREAM light-terminal (по cream-системе деки): кремовая бумага + IDE-карточка
 * с промптом, ink-текст, оранж-prompt, лайм ТОЛЬКО как маркер ключевых слов.
 * + слот под реальный скрин (Александр даст позже).
 */
const PROMPT_LINES: { parts: { t: string; hl?: boolean }[] }[] = [
  { parts: [{ t: "Найди реальные повторяющиеся боли у " }, { t: "[ГРУППА — напр. бухгалтеров МСБ в Казахстане]", hl: true }, { t: "." }] },
  { parts: [{ t: "Проверь по Reddit, Threads, форумам владельцев МСБ и обзорам сервисов:" }] },
  { parts: [{ t: "  1. Что делают вручную каждую неделю." }] },
  { parts: [{ t: "  2. Где теряют время и деньги." }] },
  { parts: [{ t: "  3. Какие ошибки возникают регулярно." }] },
  { parts: [{ t: "  4. Какие решения уже есть и сколько стоят." }] },
  { parts: [{ t: "  5. Что им НЕ нравится — конкретные жалобы." }] },
  { parts: [{ t: "  6. Что можно собрать без кода / на вайбкодинге." }] },
  { parts: [{ t: "На каждую идею дай: проблему, кто сталкивается, как решают," }] },
  { parts: [{ t: "что автоматизировать, эффект, " }, { t: "готовность платить", hl: true }, { t: " (с цифрой), " }, { t: "ссылку-источник", hl: true }, { t: "." }] },
];

const INK = "#2A2520";
const INK_MUTED = "#6E6354";
const ORANGE = "#FC5C02";

export function Slide_57_Research5Perplexity() {
  return (
    <SlideLayout
      speakerSide="right"
      contentClassName="!justify-start !py-0"
      contentMinWidth={760}
      style={{ background: "var(--brand-cream)" }}
      background={
        <>
          <div className="cream-grid" />
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{ top: "-12rem", right: "10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(252,92,2,0.12), transparent 68%)", filter: "blur(18px)" }}
          />
          <div className="cream-grain" />
        </>
      }
    >
      <div className="flex flex-col h-full w-full" style={{ paddingTop: "clamp(32px,5vh,64px)", paddingBottom: "clamp(24px,4vh,48px)" }}>
        <div className="shrink-0">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold mb-3"
            style={{ color: ORANGE }}
          >
            // RESEARCH · 5 / 5
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase leading-[1.0] tracking-[-0.03em] mb-2"
            style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3.2vw, 48px)", color: INK }}
          >
            ГОТОВЫЙ ПРОМПТ ДЛЯ <span style={{ color: ORANGE }}>PERPLEXITY</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-xs md:text-sm leading-snug max-w-3xl mb-5"
            style={{ color: INK_MUTED }}
          >
            Не Claude, не GPT — Claude не ходит в свежий интернет. Perplexity ходит, цитирует источники по 5-10 reddit-тредам за запрос. Копируешь → подставляешь нишу → получаешь список идей приложений.
          </motion.div>
        </div>

        {/* Терминал (cream IDE) + слот под скрин */}
        <div className="flex-1 min-h-0 flex items-stretch gap-4">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.25, 1, 0.5, 1] }}
            className="rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: "var(--brand-cream-card, #FBF6EC)",
              border: "1px solid rgba(42,37,32,0.12)",
              boxShadow: "0 36px 80px -32px rgba(42,37,32,0.45), inset 0 1px 0 rgba(255,255,255,0.7)",
              flex: "1.5 1 0%",
              minWidth: 0,
            }}
          >
            <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ background: "#ECE2D0", borderBottom: "1px solid rgba(42,37,32,0.10)" }}>
              <span className="w-3 h-3 rounded-full" style={{ background: ORANGE }} />
              <span className="w-3 h-3 rounded-full" style={{ background: "#E8B500" }} />
              <span className="w-3 h-3 rounded-full" style={{ background: "#3FB950" }} />
              <span className="ml-2 flex items-center gap-1.5 font-mono text-[12px] font-medium" style={{ color: "#8A7E6B" }}>
                <Search className="w-3 h-3" strokeWidth={2.2} style={{ color: ORANGE }} /> perplexity.ai — Deep Research
              </span>
            </div>
            <div className="px-5 py-4 font-mono" style={{ fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace", fontSize: "clamp(11px, 0.92vw, 14px)", lineHeight: 1.7 }}>
              {PROMPT_LINES.map((line, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: 0.9 + i * 0.2 }} style={{ color: INK }}>
                  {line.parts.map((p, j) =>
                    p.hl ? (
                      <span key={j} style={{ background: "#B6FF00", color: INK, padding: "0.05em 0.3em", borderRadius: "0.2em", fontWeight: 700, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>{p.t}</span>
                    ) : (
                      <span key={j}>{p.t}</span>
                    )
                  )}
                  {i === PROMPT_LINES.length - 1 && (
                    <span className="cream-caret inline-block ml-1" style={{ color: ORANGE }}>▌</span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Реальный скрин Perplexity Deep Research */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7, ease: [0.25, 1, 0.5, 1] }}
            className="relative rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(42,37,32,0.15)", background: "#ffffff", boxShadow: "0 30px 70px -30px rgba(42,37,32,0.45)", flex: "1 1 0%", minWidth: 0 }}
          >
            <Image src="/handouts/screens/perplexity_screen.png" alt="Реальный результат Perplexity Deep Research" fill sizes="30vw" className="object-cover object-top" priority />
          </motion.div>
        </div>

        {/* Итоговая плашка (cream) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="shrink-0 mt-4 inline-flex items-center rounded-xl px-4 py-2.5"
          style={{ background: "#FBF6EC", border: "1px solid rgba(42,37,32,0.12)" }}
        >
          <span className="text-sm md:text-base leading-snug" style={{ color: INK }}>
            Один промпт в Deep Research — <span style={{ background: "#B6FF00", color: INK, padding: "0.05em 0.35em", borderRadius: "0.2em", fontWeight: 700 }}>10 идей со ссылками за 60 секунд</span>. Дальше через 7 критериев.
          </span>
        </motion.div>
      </div>
    </SlideLayout>
  );
}

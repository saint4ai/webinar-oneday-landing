"use client";

import { motion } from "framer-motion";
import { CodeTermCard, type CodeTok } from "../CodeTermCard";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 17 · «ВАМ НЕ НУЖНО УЧИТЬ ПРОГРАММИРОВАНИЕ» — CREAM / light-IDE.
 * Layout «текст сверху во всю ширину + код снизу» (длинное слово
 * ПРОГРАММИРОВАНИЕ не влезало в узкую колонку). Метафора кодом: «старый способ»
 * ЗАЧЁРКНУТ, «новый» — человеческие вызовы. Текст 1-в-1 из STRUCTURE.
 */
const INK = "#2A2520";

const CODE: CodeTok[][] = [
  [{ text: "# что учить НЕ нужно:", k: "com" }],
  [{ text: "class ", k: "kw", strike: true }, { text: "Алгоритмы", k: "fn", strike: true }, { text: ":", strike: true }],
  [{ text: "    def ", k: "kw", strike: true }, { text: "рекурсия", k: "fn", strike: true }, { text: "(self): ...", strike: true }],
  [{ text: "    синтаксис, указатели", strike: true }],
  [{ text: "# + 2 года теории", k: "com", strike: true }],
  [],
  [{ text: "# что нужно уметь:", k: "com" }],
  [{ text: "опиши", k: "fn" }, { text: "(" }, { text: '"чего хочу"', k: "str" }, { text: ")" }],
  [{ text: "пойми", k: "fn" }, { text: "(фронтенд, бэкенд)" }],
  [
    { text: "остальное = ai." },
    { text: "научит", k: "fn" },
    { text: "()" },
    { text: "  # на ходу", k: "com" },
  ],
];

export function Slide_17_Misconception() {
  return (
    <SlideLayout
      speakerSide="right"
      contentClassName="!justify-start !py-0"
      style={{ background: "var(--brand-cream)" }}
      background={
        <>
          <div className="cream-grid" />
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              top: "-12rem",
              right: "10%",
              width: 600,
              height: 600,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(252,92,2,0.14), transparent 68%)",
              filter: "blur(16px)",
            }}
          />
          <div className="cream-grain" />
        </>
      }
    >
      <div
        className="flex flex-col h-full w-full"
        style={{ paddingTop: "clamp(40px,7cqh,90px)", paddingBottom: "clamp(28px,4cqh,56px)" }}
      >
        {/* ===== ВЕРХ: заголовок во всю ширину ===== */}
        <div className="shrink-0">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold mb-3"
            style={{ color: "#9A8A6E" }}
          >
            <span style={{ color: "#FC5C02", fontWeight: 700 }}>// </span>РАЗВЕНЧИВАЕМ МИФ
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase leading-[1.02] tracking-[-0.02em]"
            style={{
              color: INK,
              fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(28px, 3.4cqw, 58px)",
            }}
          >
            ВАМ{" "}
            <span style={{ color: "#FC5C02", textDecoration: "line-through", textDecorationThickness: "4px" }}>
              НЕ НУЖНО
            </span>{" "}
            УЧИТЬ <span style={{ color: "#FC5C02" }}>ПРОГРАММИРОВАНИЕ</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-base md:text-xl leading-snug mt-5 max-w-3xl"
            style={{ color: INK }}
          >
            Достаточно уметь чётко описывать чего вы хотите. Понимать базу: что такое{" "}
            <span style={{ background: "#B6FF00", color: INK, padding: "0.05em 0.25em", borderRadius: "0.15em", fontWeight: 600 }}>
              фронтенд
            </span>{" "}
            и{" "}
            <span style={{ background: "#B6FF00", color: INK, padding: "0.05em 0.25em", borderRadius: "0.15em", fontWeight: 600 }}>
              бэкенд
            </span>
            .
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85 }}
            className="text-sm md:text-base leading-relaxed mt-3 max-w-3xl"
            style={{ color: "rgba(42,37,32,0.62)" }}
          >
            Всё остальное — дело опыта. А то чего не понимаете — учитесь у AI на ходу.
          </motion.div>
        </div>

        {/* ===== НИЗ: код-карточка слева ===== */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="flex-1 min-h-0 flex items-end mt-6"
        >
          <CodeTermCard filename="learn_to_code.py" lines={CODE} className="w-[58%] max-w-[560px]" />
        </motion.div>
      </div>
    </SlideLayout>
  );
}

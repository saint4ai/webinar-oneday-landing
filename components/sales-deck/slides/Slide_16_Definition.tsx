"use client";

import { motion } from "framer-motion";
import { CodeTermCard, type CodeTok } from "../CodeTermCard";
import { BinaryDecodeText } from "../BinaryDecodeText";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 16 · Определение — «ВАЙБКОДИНГ»
 * CREAM / light-IDE стиль: термин объясняется читаемым Python-блоком слева
 * (комментарии = человеческое объяснение, пунчлайн «кто угодно» — лайм-маркер),
 * текст-определение справа тёмным ink по кремовой бумаге.
 *
 * 📐 Layout через SlideLayout (Grid). Текст 1-в-1 из STRUCTURE.
 */
const INK = "#2A2520";

// Python-блок, который читается как определение термина.
const CODE: CodeTok[][] = [
  [{ text: "# что такое вайбкодинг", k: "com" }],
  [],
  [{ text: "def ", k: "kw" }, { text: "вайбкодинг", k: "fn" }, { text: "(идея):" }],
  [{ text: "    план = " }, { text: "обсудить", k: "fn" }, { text: "(идея, с=ai)" }],
  [
    { text: "    продукт = ai." },
    { text: "собрать", k: "fn" },
    { text: "(план)" },
    { text: "   # без единой строки кода", k: "com" },
  ],
  [
    { text: "    return ", k: "kw" },
    { text: "продукт" },
    { text: "   # сайт · приложение · сервис", k: "com" },
  ],
  [],
  [{ text: "# раньше — только программисты", k: "com" }],
  [{ text: "# теперь — ", k: "com" }, { text: "кто угодно", k: "hl" }],
];

export function Slide_16_Definition() {
  return (
    <SlideLayout
      speakerSide="right"
      style={{ background: "var(--brand-cream)" }}
      background={
        <>
          <div className="cream-grid" />
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              top: "-12rem",
              right: "8%",
              width: 620,
              height: 620,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(252,92,2,0.16), transparent 68%)",
              filter: "blur(14px)",
            }}
          />
          <div className="cream-grain" />
        </>
      }
      leftObject={<CodeTermCard filename="vibecoding.py" lines={CODE} className="w-[92%]" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold mb-4"
        style={{ color: "#9A8A6E" }}
      >
        <span style={{ color: "#FC5C02", fontWeight: 700 }}>// </span>ОПРЕДЕЛЕНИЕ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="font-bold uppercase leading-[0.95] tracking-[-0.04em]"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(30px, 3.8vw, 60px)",
        }}
      >
        <BinaryDecodeText
          text="ВАЙБКОДИНГ"
          color={INK}
          bitColor="rgba(42,37,32,0.26)"
          accentRange={[4, 10]}
          accentColor="#FC5C02"
          perChar={110}
          startDelay={300}
        />
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="text-base md:text-xl leading-snug mt-5"
        style={{ color: INK }}
      >
        Это написание сайтов, приложений и сервисов через разговор с{" "}
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 1.0 }}
          className="inline-block font-bold"
          style={{ background: "#B6FF00", color: INK, padding: "0.05em 0.3em", borderRadius: "0.15em" }}
        >
          AI
        </motion.span>
        .
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.3 }}
        className="text-sm md:text-base leading-relaxed mt-4 max-w-xl"
        style={{ color: "rgba(42,37,32,0.62)" }}
      >
        Раньше это могли только программисты — на языке кода. Теперь можем мы — на обычном языке: спросить как сделать приложение, распланировать его и создать, без особых навыков.
      </motion.div>
    </SlideLayout>
  );
}

"use client";

import { motion } from "framer-motion";
import { CodeTermCard, type CodeTok } from "../CodeTermCard";
import { BinaryDecodeText } from "../BinaryDecodeText";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 24 · «КТО ТАКОЙ ВАЙБКОДЕР» — CREAM / light-IDE.
 * Термин объясняется Python-классом слева + подсказки «на полях» как у кодинг-
 * ассистента. Заголовок — binary→текст. Текст 1-в-1 из STRUCTURE.
 */
const INK = "#2A2520";

const CODE: CodeTok[][] = [
  [{ text: "# кто такой вайбкодер", k: "com" }],
  [],
  [{ text: "class ", k: "kw" }, { text: "Вайбкодер", k: "fn" }, { text: ":" }],
  [{ text: "    пишет_код = " }, { text: "False", k: "kw" }],
  [{ text: "    есть_идея = " }, { text: "True", k: "kw" }],
  [],
  [{ text: "    def ", k: "kw" }, { text: "собрать", k: "fn" }, { text: "(self, идея):" }],
  [{ text: "        план = " }, { text: "обсудить", k: "fn" }, { text: "(идея, с=ai)" }],
  [
    { text: "        return ai." },
    { text: "построить", k: "fn" },
    { text: "(план)" },
    { text: "   # сервис за неделю", k: "com" },
  ],
];

const HINTS = { 3: "не технарь", 6: "описывает словами" };

export function Slide_24_WhoIsVibecoder() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="26cqw"
      style={{ background: "var(--brand-cream)" }}
      background={
        <>
          <div className="cream-grid" />
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              bottom: "-14rem",
              left: "16%",
              width: 640,
              height: 640,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(252,92,2,0.13), transparent 68%)",
              filter: "blur(16px)",
            }}
          />
          <div className="cream-grain" />
        </>
      }
      leftObject={<CodeTermCard filename="vibecoder.py" lines={CODE} hints={HINTS} className="w-[94%]" />}
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
        className="font-bold uppercase leading-[1.0] tracking-[-0.03em]"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(24px, 2.9cqw, 44px)",
        }}
      >
        <BinaryDecodeText
          text="КТО ТАКОЙ ВАЙБКОДЕР"
          color={INK}
          bitColor="rgba(42,37,32,0.26)"
          accentRange={[10, 19]}
          accentColor="#FC5C02"
          perChar={85}
          startDelay={280}
        />
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="text-base md:text-xl leading-snug mt-6 max-w-2xl"
        style={{ color: INK }}
      >
        Это человек, который собирает сервисы{" "}
        <span
          className="font-bold"
          style={{ background: "#B6FF00", color: INK, padding: "0.05em 0.3em", borderRadius: "0.15em" }}
        >
          через диалог с AI
        </span>{" "}
        — а не пишет код руками.
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="text-sm md:text-base leading-relaxed mt-4 max-w-2xl"
        style={{ color: "rgba(42,37,32,0.62)" }}
      >
        Пока другие учат программирование три года — вайбкодер собирает первый сервис{" "}
        <span style={{ color: INK, fontWeight: 600 }}>за неделю</span>. Предприниматели смотрят в их сторону:
        быстрее собирают продукты, тестируют на реальной аудитории и отдают команде на большую разработку.
      </motion.div>
    </SlideLayout>
  );
}

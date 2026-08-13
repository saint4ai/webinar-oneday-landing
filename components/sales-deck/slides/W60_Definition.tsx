"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "../SlideLayout";

/**
 * W60 · «ЧТО ТАКОЕ ВАЙБКОДИНГ» — cream.
 *
 * Заменяет Slide_16_Definition, где вайбкодинг определялся как «написание сайтов,
 * приложений и сервисов» — уклон в разработку платформ.
 *
 * Новый смысл (Александр): вайбкодинг — способ работы с агентом обычными словами.
 * Вы говорите задачу, он делает. Не про создание софта, а про закрытие задач.
 */
const INK = "#2A2520";

const FLOW = [
  { n: "01", t: "Вы говорите задачу", d: "Обычными словами. Голосом или текстом, как коллеге." },
  { n: "02", t: "Агент делает работу", d: "Открывает файлы, считает, пишет, собирает — сам." },
  { n: "03", t: "Вы смотрите результат", d: "Не устроило — говорите что поправить. И так до готового." },
];

export function W60_Definition() {
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
              top: "-11rem",
              right: "10%",
              width: 620,
              height: 620,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(182,255,0,0.20), transparent 68%)",
              filter: "blur(18px)",
            }}
          />
          <div className="cream-grain" />
        </>
      }
    >
      <div
        className="flex flex-col h-full w-full"
        style={{ paddingTop: "clamp(34px,5.5cqh,76px)", paddingBottom: "clamp(24px,3.6cqh,48px)" }}
      >
        <div className="shrink-0">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold mb-3"
            style={{ color: "#9A8A6E" }}
          >
            <span style={{ color: "#FC5C02", fontWeight: 700 }}>// </span>ОПРЕДЕЛЕНИЕ
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(-18% 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(-18% 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.14, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase leading-[1.02] tracking-[-0.02em]"
            style={{
              color: INK,
              fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(27px, 3.3cqw, 56px)",
            }}
          >
            ВЫ ГОВОРИТЕ СЛОВАМИ —
            <br />
            <span style={{ color: "#FC5C02" }}>АГЕНТ ДЕЛАЕТ РАБОТУ</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-4 leading-snug max-w-3xl"
            style={{ color: INK, fontSize: "clamp(15px,1.35cqw,23px)" }}
          >
            Вот и весь вайбкодинг. Никаких особых знаний, никакого специального языка —{" "}
            <span
              style={{
                background: "#B6FF00",
                color: INK,
                padding: "0.05em 0.28em",
                borderRadius: "0.15em",
                fontWeight: 600,
              }}
            >
              обычная человеческая речь
            </span>
            .
          </motion.p>
        </div>

        <div className="flex-1 min-h-0 mt-6">
          <div className="w-full h-full grid gap-3 content-center">
            {FLOW.map((c, i) => (
              <motion.div
                key={c.n}
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.15, ease: [0.25, 1, 0.5, 1] }}
                className="flex items-center gap-5 rounded-xl px-5 py-4"
                style={{ background: "#FBF6EC", border: "1px solid #E7DCC8" }}
              >
                <span
                  className="font-mono shrink-0"
                  style={{ color: "#FC5C02", fontSize: "clamp(13px,1.15cqw,20px)" }}
                >
                  {c.n}
                </span>
                <div className="min-w-0">
                  <div
                    className="font-semibold leading-tight"
                    style={{ color: INK, fontSize: "clamp(15px,1.45cqw,26px)" }}
                  >
                    {c.t}
                  </div>
                  <div
                    className="mt-0.5 leading-snug"
                    style={{ color: "rgba(42,37,32,0.62)", fontSize: "clamp(13px,1.15cqw,20px)" }}
                  >
                    {c.d}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.25 }}
          className="shrink-0 font-semibold leading-snug"
          style={{ color: INK, fontSize: "clamp(15px,1.4cqw,25px)" }}
        >
          Умеете объяснить задачу человеку — умеете объяснить её агенту.
        </motion.div>
      </div>
    </SlideLayout>
  );
}

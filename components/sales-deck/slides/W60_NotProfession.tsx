"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "../SlideLayout";

/**
 * W60 · «ЭТО НЕ НОВАЯ ПРОФЕССИЯ» — dark.
 * Снимает главный барьер: «мне поздно, я не программист».
 * Механика слайда: три ложных ожидания зачёркиваются, снизу — одна правда.
 */
const FALSE = [
  "Бросить своё дело и переучиться",
  "Два года учить теорию с нуля",
  "Конкурировать с разработчиками",
];

export function W60_NotProfession() {
  return (
    <SlideLayout
      speakerSide="right"
      background={
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(720px 520px at 76% 6%, rgba(252,92,2,0.10), transparent 66%), radial-gradient(560px 460px at 6% 90%, rgba(182,255,0,0.07), transparent 70%)",
          }}
        />
      }
    >
      <div className="flex flex-col justify-center h-full w-full">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold mb-3"
          style={{ color: "#7E7E7E" }}
        >
          <span style={{ color: "#FC5C02", fontWeight: 700 }}>// </span>ГЛАВНОЕ НЕДОПОНИМАНИЕ
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, clipPath: "inset(-18% 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(-18% 0% 0 0)" }}
          transition={{ duration: 0.75, delay: 0.12, ease: [0.25, 1, 0.5, 1] }}
          className="font-bold uppercase leading-[1.02] tracking-[-0.02em] text-white"
          style={{
            fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
            fontSize: "clamp(30px, 3.7cqw, 64px)",
          }}
        >
          ВАЙБКОДИНГ — ЭТО{" "}
          <span
            style={{
              color: "#FC5C02",
              textDecoration: "line-through",
              textDecorationThickness: "5px",
            }}
          >
            НЕ НОВАЯ
          </span>{" "}
          ПРОФЕССИЯ
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-5 leading-snug max-w-2xl"
          style={{ color: "rgba(255,255,255,0.62)", fontSize: "clamp(15px,1.35cqw,23px)" }}
        >
          Вам не нужно ничего из этого:
        </motion.p>

        <div className="mt-4 flex flex-col gap-2.5 max-w-2xl">
          {FALSE.map((t, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.65 + i * 0.14 }}
              className="flex items-center gap-3"
            >
              <span
                aria-hidden
                className="shrink-0"
                style={{
                  width: 22,
                  height: 2,
                  background: "#FC5C02",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  color: "rgba(255,255,255,0.42)",
                  textDecoration: "line-through",
                  textDecorationColor: "rgba(252,92,2,0.75)",
                  textDecorationThickness: "2px",
                  fontSize: "clamp(15px,1.4cqw,25px)",
                }}
              >
                {t}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.15, ease: [0.25, 1, 0.5, 1] }}
          className="mt-8 rounded-2xl px-6 py-5 max-w-2xl"
          style={{
            background: "rgba(182,255,0,0.07)",
            border: "1px solid rgba(182,255,0,0.28)",
          }}
        >
          <div
            className="font-semibold leading-tight text-white"
            style={{ fontSize: "clamp(17px,1.7cqw,30px)" }}
          >
            Нужно другое. Перестать делать руками то,
            <br />
            что за вас сделает <span style={{ color: "#B6FF00" }}>агент</span>.
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}

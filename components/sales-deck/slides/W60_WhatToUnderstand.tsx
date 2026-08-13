"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "../SlideLayout";

/**
 * W60 · «ЧТО НУЖНО ПОНИМАТЬ ВМЕСТО КОДА» — cream.
 *
 * Заменяет Slide_17_Misconception, который грузил аудиторию фронтендом и бэкендом.
 * Новый смысл (Александр): чтобы владеть вайб-кодингом, нужно понимать функционал
 * агента и что он умеет. Из этого само становится понятно, как его применять.
 *
 * Механика: слева зачёркнуто то, что учить не надо; справа — три вещи, которые
 * реально решают. Внизу — вывод: понимание возможностей рождает применение.
 */
const INK = "#2A2520";

const NOT_NEEDED = ["Синтаксис и алгоритмы", "Фреймворки и библиотеки", "Два года теории"];

const NEEDED = [
  {
    t: "Что агент умеет",
    d: "Где его сила, а где он бесполезен. Это видно за один вечер практики.",
  },
  {
    t: "Как ставить задачу",
    d: "Точная формулировка даёт результат с первого раза, расплывчатая — переделки.",
  },
  {
    t: "Как проверить результат",
    d: "Понять, сделал он дело или красиво соврал. Этому учат на примерах.",
  },
];

export function W60_WhatToUnderstand() {
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
            <span style={{ color: "#FC5C02", fontWeight: 700 }}>// </span>РАЗВЕНЧИВАЕМ МИФ
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
            УЧИТЬ НУЖНО НЕ КОД,
            <br />А <span style={{ color: "#FC5C02" }}>ВОЗМОЖНОСТИ АГЕНТА</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-4 leading-snug max-w-3xl"
            style={{ color: INK, fontSize: "clamp(15px,1.35cqw,23px)" }}
          >
            Код пишет он. Ваша работа — понимать, на что он способен. Когда знаешь
            возможности, применение придумывается само.
          </motion.p>
        </div>

        <div className="flex-1 min-h-0 mt-6">
          <div
            className="w-full h-full grid gap-4 content-center"
            style={{ gridTemplateColumns: "minmax(0,0.75fr) minmax(0,1.25fr)" }}
          >
            {/* чего учить не надо */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="rounded-2xl px-5 py-5 flex flex-col justify-center"
              style={{ background: "rgba(42,37,32,0.04)", border: "1px dashed #D8CBB2" }}
            >
              <div
                className="font-mono uppercase tracking-[0.14em] mb-4"
                style={{ color: "#A79E8D", fontSize: "clamp(10px,0.85cqw,13px)" }}
              >
                Учить не нужно
              </div>
              {NOT_NEEDED.map((t) => (
                <div
                  key={t}
                  className="leading-snug mb-2.5 last:mb-0"
                  style={{
                    color: "rgba(42,37,32,0.42)",
                    textDecoration: "line-through",
                    textDecorationColor: "rgba(252,92,2,0.55)",
                    textDecorationThickness: "2px",
                    fontSize: "clamp(14px,1.25cqw,22px)",
                  }}
                >
                  {t}
                </div>
              ))}
            </motion.div>

            {/* что реально решает */}
            <div className="flex flex-col gap-2.5">
              {NEEDED.map((c, i) => (
                <motion.div
                  key={c.t}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.75 + i * 0.13, ease: [0.25, 1, 0.5, 1] }}
                  className="rounded-xl px-5 py-4"
                  style={{ background: "#FBF6EC", border: "1px solid #E7DCC8" }}
                >
                  <div
                    className="font-semibold leading-tight"
                    style={{ color: INK, fontSize: "clamp(15px,1.45cqw,26px)" }}
                  >
                    {c.t}
                  </div>
                  <div
                    className="mt-1 leading-snug"
                    style={{ color: "rgba(42,37,32,0.62)", fontSize: "clamp(13px,1.15cqw,20px)" }}
                  >
                    {c.d}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.25 }}
          className="shrink-0 font-semibold leading-snug"
          style={{ color: INK, fontSize: "clamp(15px,1.4cqw,25px)" }}
        >
          Это не про айти. Это про то, чтобы знать инструмент, которым работаешь.
        </motion.div>
      </div>
    </SlideLayout>
  );
}

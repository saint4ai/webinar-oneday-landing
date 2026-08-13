"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "../SlideLayout";

/**
 * W60 · «ВАШ ОПЫТ — ЭТО ПРЕИМУЩЕСТВО» — dark.
 * Закрывает страх «сейчас все с ИИ, я опоздал».
 * Механика: два человека с одним инструментом, разный результат. Решает опыт.
 */
export function W60_ExpertAdvantage() {
  return (
    <SlideLayout
      speakerSide="right"
      background={
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(720px 520px at 74% 8%, rgba(182,255,0,0.11), transparent 66%), radial-gradient(520px 420px at 6% 88%, rgba(252,92,2,0.07), transparent 70%)",
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
          <span style={{ color: "#B6FF00", fontWeight: 700 }}>// </span>«Я ОПОЗДАЛ, СЕЙЧАС ВСЕ С ИИ»
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, clipPath: "inset(-18% 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(-18% 0% 0 0)" }}
          transition={{ duration: 0.75, delay: 0.12, ease: [0.25, 1, 0.5, 1] }}
          className="font-bold uppercase leading-[1.02] tracking-[-0.02em] text-white"
          style={{
            fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
            fontSize: "clamp(28px, 3.5cqw, 60px)",
          }}
        >
          ИНСТРУМЕНТ ОДИН.
          <br />
          РЕЗУЛЬТАТ <span style={{ color: "#B6FF00" }}>РАЗНЫЙ</span>
        </motion.h1>

        <div className="mt-8 grid gap-4" style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.25, 1, 0.5, 1] }}
            className="rounded-2xl px-6 py-6"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)" }}
          >
            <div
              className="font-mono uppercase tracking-[0.14em] mb-3"
              style={{ color: "#6E6E6E", fontSize: "clamp(10px,0.85cqw,13px)" }}
            >
              Новичок с агентом
            </div>
            <div
              className="leading-snug"
              style={{ color: "rgba(255,255,255,0.5)", fontSize: "clamp(14px,1.25cqw,22px)" }}
            >
              Просит «сделай красиво». Получает то, что не понимает. Не может отличить
              рабочее решение от мусора.
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.72, ease: [0.25, 1, 0.5, 1] }}
            className="rounded-2xl px-6 py-6"
            style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.3)" }}
          >
            <div
              className="font-mono uppercase tracking-[0.14em] mb-3"
              style={{ color: "#B6FF00", fontSize: "clamp(10px,0.85cqw,13px)" }}
            >
              Вы с агентом
            </div>
            <div
              className="leading-snug text-white font-medium"
              style={{ fontSize: "clamp(14px,1.28cqw,23px)" }}
            >
              Знаете свой процесс до мелочей. Ставите точную задачу. Сразу видите, где
              агент ошибся, потому что понимаете предмет.
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1, ease: [0.25, 1, 0.5, 1] }}
          className="mt-7 rounded-2xl px-6 py-5"
          style={{ background: "rgba(252,92,2,0.08)", border: "1px solid rgba(252,92,2,0.32)" }}
        >
          <div
            className="font-semibold leading-tight text-white"
            style={{ fontSize: "clamp(17px,1.65cqw,29px)" }}
          >
            Выигрывает не тот, кто раньше начал.
            <br />
            Выигрывает тот, кто <span style={{ color: "#FC5C02" }}>знает своё дело</span> и взял
            агента в руки.
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}

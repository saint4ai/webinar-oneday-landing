"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "../SlideLayout";

/**
 * W60 · «ДВА ВЫХОДА ИЗ НАВЫКА» — cream.
 * Закрывает блок смысла: куда этот навык ведёт человека.
 * Механика: две крупные карточки — рост на текущем месте и свои решения.
 */
const INK = "#2A2520";

export function W60_Career() {
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
              right: "12%",
              width: 600,
              height: 600,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(252,92,2,0.13), transparent 68%)",
              filter: "blur(16px)",
            }}
          />
          <div className="cream-grain" />
        </>
      }
    >
      <div
        className="flex flex-col h-full w-full"
        style={{ paddingTop: "clamp(38px,6.5cqh,86px)", paddingBottom: "clamp(26px,4cqh,52px)" }}
      >
        <div className="shrink-0">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold mb-3"
            style={{ color: "#9A8A6E" }}
          >
            <span style={{ color: "#FC5C02", fontWeight: 700 }}>// </span>КУДА ЭТО ВЕДЁТ
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(-18% 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(-18% 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.14, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase leading-[1.02] tracking-[-0.02em]"
            style={{
              color: INK,
              fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(28px, 3.5cqw, 60px)",
            }}
          >
            ДВА ВЫХОДА ИЗ ОДНОГО <span style={{ color: "#FC5C02" }}>НАВЫКА</span>
          </motion.h1>
        </div>

        <div className="flex-1 min-h-0 flex items-center mt-6">
          <div className="w-full grid gap-4" style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.25, 1, 0.5, 1] }}
              className="rounded-2xl px-6 py-6 h-full flex flex-col"
              style={{ background: "#FBF6EC", border: "1px solid #E7DCC8" }}
            >
              <div
                className="font-mono uppercase tracking-[0.14em] mb-3"
                style={{ color: "#9A8A6E", fontSize: "clamp(10px,0.85cqw,13px)" }}
              >
                Выход первый
              </div>
              <div
                className="font-bold uppercase leading-tight"
                style={{
                  color: INK,
                  fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
                  fontSize: "clamp(19px,1.9cqw,34px)",
                }}
              >
                Рост там, где вы сейчас
              </div>
              <p
                className="mt-3 leading-snug"
                style={{ color: "rgba(42,37,32,0.72)", fontSize: "clamp(14px,1.15cqw,20px)" }}
              >
                Вы делаете за день то, на что у отдела уходит неделя. Такого сотрудника не
                сокращают и не обходят при повышении.
              </p>
              <div
                className="mt-auto pt-4 font-semibold leading-snug"
                style={{ color: INK, fontSize: "clamp(14px,1.2cqw,21px)" }}
              >
                Вы закрываете задачи,
                <br />
                а не ждёте, пока их закроют.
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.72, ease: [0.25, 1, 0.5, 1] }}
              className="rounded-2xl px-6 py-6 h-full flex flex-col"
              style={{ background: INK, border: "1px solid #2A2520" }}
            >
              <div
                className="font-mono uppercase tracking-[0.14em] mb-3"
                style={{ color: "#B6FF00", fontSize: "clamp(10px,0.85cqw,13px)" }}
              >
                Выход второй
              </div>
              <div
                className="font-bold uppercase leading-tight text-white"
                style={{
                  fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
                  fontSize: "clamp(19px,1.9cqw,34px)",
                }}
              >
                Свои решения под свои задачи
              </div>
              <p
                className="mt-3 leading-snug"
                style={{ color: "rgba(242,235,221,0.72)", fontSize: "clamp(14px,1.15cqw,20px)" }}
              >
                Не подстраиваться под чужие программы и не платить за то, что вам нужно
                наполовину. Собрать ровно под свой процесс.
              </p>
              <div
                className="mt-auto pt-4 font-semibold leading-snug"
                style={{ color: "#B6FF00", fontSize: "clamp(14px,1.2cqw,21px)" }}
              >
                А потом продавать это тем,
                <br />
                у кого та же задача.
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </SlideLayout>
  );
}

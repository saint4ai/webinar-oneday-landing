"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "../SlideLayout";

/**
 * W60 · «ЭТО УСИЛЕНИЕ ТОГО, ЧТО ВЫ УЖЕ УМЕЕТЕ» — cream.
 * Ядро всего блока. Разворот: опыт не обнуляется, он умножается.
 * Механика: четыре профессии, у каждой «было руками → стало с агентом».
 */
const INK = "#2A2520";

const ROWS = [
  { who: "Бухгалтер", was: "Сверка вечер в Excel", now: "15 минут, отчёт сам" },
  { who: "Маркетолог", was: "Ждёт дашборд от разработчиков", now: "Собрал сам за вечер" },
  { who: "Продажник", was: "Готовит КП два часа", now: "КП под клиента за 10 минут" },
  { who: "Юрист", was: "Вычитывает договор построчно", now: "Список расхождений на экране" },
];

export function W60_Amplify() {
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
              top: "-10rem",
              right: "8%",
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
            <span style={{ color: "#FC5C02", fontWeight: 700 }}>// </span>ЧТО ЭТО НА САМОМ ДЕЛЕ
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
            ЭТО УСИЛЕНИЕ ТОГО,
            <br />
            ЧТО ВЫ <span style={{ color: "#FC5C02" }}>УЖЕ УМЕЕТЕ</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-4 leading-snug max-w-3xl"
            style={{ color: INK, fontSize: "clamp(15px,1.35cqw,22px)" }}
          >
            Ваш опыт не обнуляется. Он{" "}
            <span
              style={{
                background: "#B6FF00",
                color: INK,
                padding: "0.05em 0.28em",
                borderRadius: "0.15em",
                fontWeight: 600,
              }}
            >
              умножается
            </span>
            . Вы остаётесь собой, но закрываете за вечер то, на что уходила неделя.
          </motion.p>
        </div>

        <div className="flex-1 min-h-0 flex items-start mt-5">
          <div className="w-full flex flex-col gap-2.5">
            {ROWS.map((r, i) => (
              <motion.div
                key={r.who}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.75 + i * 0.13, ease: [0.25, 1, 0.5, 1] }}
                className="grid items-center rounded-xl px-5 py-4"
                style={{
                  gridTemplateColumns: "minmax(120px,0.8fr) minmax(0,1.1fr) 26px minmax(0,1.1fr)",
                  gap: "12px",
                  background: "#FBF6EC",
                  border: "1px solid #E7DCC8",
                }}
              >
                <div
                  className="font-semibold"
                  style={{ color: INK, fontSize: "clamp(15px,1.45cqw,26px)" }}
                >
                  {r.who}
                </div>
                <div
                  className="leading-snug"
                  style={{
                    color: "rgba(42,37,32,0.5)",
                    textDecoration: "line-through",
                    textDecorationColor: "rgba(252,92,2,0.5)",
                    fontSize: "clamp(14px,1.28cqw,23px)",
                  }}
                >
                  {r.was}
                </div>
                <div
                  aria-hidden
                  className="font-mono text-center"
                  style={{ color: "#FC5C02", fontSize: "clamp(14px,1.1cqw,20px)" }}
                >
                  &rarr;
                </div>
                <div
                  className="font-semibold leading-snug"
                  style={{ color: INK, fontSize: "clamp(14px,1.32cqw,24px)" }}
                >
                  {r.now}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </SlideLayout>
  );
}

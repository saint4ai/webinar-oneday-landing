"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "../SlideLayout";

/**
 * W60 · «АГЕНТ ЖИВЁТ НА ВАШЕМ КОМПЬЮТЕРЕ» — dark.
 * Ключевое отличие от чата в браузере, которое почти никто не понимает.
 * Механика: две колонки — чат умеет только говорить, агент работает с файлами.
 */
const CHAT = ["Живёт в браузере", "Ваших файлов не видит", "Забывает прошлый разговор", "Отвечает текстом"];
const AGENT = ["Стоит на вашем компьютере", "Открывает ваши папки и файлы", "Помнит проект целиком", "Делает работу и сохраняет результат"];

export function W60_AgentOnPC() {
  return (
    <SlideLayout
      speakerSide="right"
      background={
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(700px 520px at 74% 8%, rgba(182,255,0,0.12), transparent 66%), radial-gradient(520px 420px at 8% 88%, rgba(252,92,2,0.07), transparent 70%)",
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
          <span style={{ color: "#B6FF00", fontWeight: 700 }}>// </span>ПОЧЕМУ ЭТО РАБОТАЕТ
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
          АГЕНТ ЖИВЁТ НА <span style={{ color: "#B6FF00" }}>ВАШЕМ КОМПЬЮТЕРЕ</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-4 leading-snug max-w-2xl"
          style={{ color: "rgba(255,255,255,0.6)", fontSize: "clamp(15px,1.3cqw,22px)" }}
        >
          Это не чат в браузере. Разница принципиальная.
        </motion.p>

        <div
          className="mt-7 grid gap-4"
          style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}
        >
          {/* Чат */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65, ease: [0.25, 1, 0.5, 1] }}
            className="rounded-2xl px-5 py-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)" }}
          >
            <div
              className="font-mono uppercase tracking-[0.14em] mb-4"
              style={{ color: "#6E6E6E", fontSize: "clamp(10px,0.85cqw,13px)" }}
            >
              Чат в браузере
            </div>
            <div className="flex flex-col gap-2.5">
              {CHAT.map((t) => (
                <div key={t} className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className="shrink-0 mt-[0.6em]"
                    style={{ width: 14, height: 2, background: "rgba(255,255,255,0.25)" }}
                  />
                  <span
                    className="leading-snug"
                    style={{ color: "rgba(255,255,255,0.45)", fontSize: "clamp(13px,1.1cqw,19px)" }}
                  >
                    {t}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Агент */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85, ease: [0.25, 1, 0.5, 1] }}
            className="rounded-2xl px-5 py-5"
            style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.3)" }}
          >
            <div
              className="font-mono uppercase tracking-[0.14em] mb-4"
              style={{ color: "#B6FF00", fontSize: "clamp(10px,0.85cqw,13px)" }}
            >
              Агент на компьютере
            </div>
            <div className="flex flex-col gap-2.5">
              {AGENT.map((t) => (
                <div key={t} className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className="shrink-0 mt-[0.55em]"
                    style={{ width: 14, height: 2, background: "#B6FF00" }}
                  />
                  <span
                    className="leading-snug font-medium text-white"
                    style={{ fontSize: "clamp(13px,1.12cqw,20px)" }}
                  >
                    {t}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.15 }}
          className="mt-6 leading-snug max-w-3xl"
          style={{ color: "rgba(255,255,255,0.72)", fontSize: "clamp(14px,1.25cqw,21px)" }}
        >
          Ваши данные остаются у вас. Агент работает с ними прямо в ваших папках.
        </motion.div>
      </div>
    </SlideLayout>
  );
}

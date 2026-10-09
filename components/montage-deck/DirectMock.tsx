"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Px } from "./ui";

/**
 * Макет переписки в Instagram Direct (тёмная тема, по слепку экрана Александра 06.10): шапка с аватаром и кнопками,
 * серые входящие, фиолетовые исходящие, голосовые с волной, «Ответил(-а) на вашу историю», строка ввода.
 * Переписки — обобщённые примеры типичных запросов (услуги, консультации, обучение): имена размыты, аватары без лиц,
 * на слайде подпись «пример». Настоящих людей и их сообщений здесь нет.
 * 3D: стопка из трёх окон в перспективе, переднее сменяется переворотом, сверху парит объёмная иконка.
 */

type Msg =
  | { kind: "in" | "out"; text: string; heart?: boolean }
  | { kind: "voice"; dir: "in" | "out"; sec: string }
  | { kind: "story"; img: string }
  | { kind: "time"; text: string };

type Thread = { hue: number; msgs: Msg[] };

export const DIRECT_THREADS: Thread[] = [
  { hue: 28, msgs: [
    { kind: "time", text: "СБ 22:09" },
    { kind: "story", img: "/montage/reels/new-claude50.jpg" }, // 09.10: вместо обложки «4 умных коннектора» (уже на слайдах 30, 35 и 44): рилс «Весь Claude за 50 секунд»
    { kind: "in", text: "Здравствуйте! Хотим так же монтировать рилсы для клиники. Сколько стоит внедрение?" },
    { kind: "out", text: "Добрый вечер! Давайте созвонимся на 15 минут, покажу, как это устроено" },
    { kind: "voice", dir: "in", sec: "0:42" },
  ] },
  { hue: 200, msgs: [
    { kind: "time", text: "ВС 16:12" },
    { kind: "in", text: "Увидел ролик про ИИ-менеджера. Нужен такой в WhatsApp для автосалона, возьмётесь?" },
    { kind: "out", text: "Да, делаем. Сколько заявок приходит в день?" },
    { kind: "in", text: "Около 40, половина ночью" },
    { kind: "voice", dir: "out", sec: "0:25" },
  ] },
  { hue: 300, msgs: [
    { kind: "time", text: "ПН 11:40" },
    { kind: "in", text: "Можно консультацию по Claude Code? Хочу собрать CRM для своей команды" },
    { kind: "out", text: "Конечно. Скину ссылку на запись" },
    { kind: "in", text: "Спасибо, жду!", heart: true },
  ] },
];

const IG_FONT = "-apple-system, 'SF Pro Text', 'Segoe UI', Roboto, Arial, sans-serif";
const OUT_BG = "linear-gradient(135deg, #8B3DFF, #5E52F5)";

/** Размытая строка вместо имени: видно, что там текст, но не читается. */
const Redacted = ({ w, h = "0.62cqw", o = 0.85 }: { w: string; h?: string; o?: number }) => (
  <span style={{ display: "block", width: w, height: h, borderRadius: 99, background: `rgba(255,255,255,${o})`, filter: "blur(0.18cqw)" }} />
);

/** Аватар без лица: цветной круг с силуэтом в кольце истории Instagram. */
const Avatar = ({ hue, size = "2.3cqw", ring = true }: { hue: number; size?: string; ring?: boolean }) => (
  <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", padding: ring ? "0.14cqw" : 0, flexShrink: 0,
    background: ring ? "conic-gradient(from 210deg, #F9CE34, #EE2A7B, #6228D7, #F9CE34)" : "transparent" }}>
    <span style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden",
      border: ring ? "0.12cqw solid #000" : "none", background: `linear-gradient(160deg, hsl(${hue} 55% 62%), hsl(${hue + 30} 50% 38%))` }}>
      <svg viewBox="0 0 24 24" width="80%" height="80%" fill="rgba(255,255,255,.75)" aria-hidden><circle cx="12" cy="9" r="4.6" /><path d="M3 24c0-5.2 4-8.6 9-8.6s9 3.4 9 8.6z" /></svg>
    </span>
  </span>
);

const IconBtn = ({ children }: { children: ReactNode }) => (
  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "1.9cqw", height: "1.9cqw", borderRadius: "50%", background: "#1C1C1E", color: "#fff", flexShrink: 0 }}>
    <svg viewBox="0 0 24 24" width="55%" height="55%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{children}</svg>
  </span>
);

const Wave = ({ seed, light }: { seed: number; light: boolean }) => (
  <span className="flex items-center" style={{ gap: "0.12cqw", height: "1.6cqw", flex: 1 }}>
    {Array.from({ length: 22 }, (_, k) => {
      const h = 0.25 + Math.abs(Math.sin((k + 1) * (seed + 1.7)) * Math.cos(k * 0.6 + seed)) * 1.3;
      return <span key={k} style={{ width: "0.14cqw", height: `${h}cqw`, borderRadius: 99, background: light ? "#fff" : "rgba(255,255,255,.9)" }} />;
    })}
  </span>
);

function Bubble({ m, hue, last }: { m: Msg; hue: number; last: boolean }) {
  const base: CSSProperties = { fontFamily: IG_FONT, fontSize: "0.9cqw", lineHeight: 1.3, color: "#fff", padding: "0.6cqw 0.9cqw", borderRadius: "1.2cqw", maxWidth: "78%" };
  if (m.kind === "time") return <div style={{ fontFamily: IG_FONT, fontSize: "0.7cqw", color: "rgba(255,255,255,.55)", textAlign: "center", margin: "0.2cqw 0" }}>{m.text}</div>;
  if (m.kind === "story") {
    return (
      <div style={{ paddingLeft: "2.6cqw" }}>
        <div style={{ fontFamily: IG_FONT, fontSize: "0.68cqw", color: "rgba(255,255,255,.55)", marginBottom: "0.35cqw" }}>Ответил(-а) на вашу историю</div>
        <div style={{ borderLeft: "0.18cqw solid rgba(255,255,255,.25)", paddingLeft: "0.5cqw" }}>
          <img src={m.img} alt="" style={{ display: "block", width: "4.2cqw", aspectRatio: "9 / 16", objectFit: "cover", borderRadius: "0.6cqw" }} />
        </div>
      </div>
    );
  }
  const out = m.kind === "out" || (m.kind === "voice" && m.dir === "out");
  const inner = m.kind === "voice" ? (
    <span className="flex items-center" style={{ gap: "0.5cqw", width: "12cqw" }}>
      <svg viewBox="0 0 24 24" width="1cqw" height="1cqw" fill="#fff" aria-hidden><path d="M7 4.5v15l12.5-7.5z" /></svg>
      <Wave seed={hue / 40 + (out ? 2 : 0)} light={out} />
      <span style={{ fontSize: "0.72cqw" }}>{m.sec}</span>
    </span>
  ) : m.text;
  return (
    <div className="flex items-end" style={{ gap: "0.4cqw", justifyContent: out ? "flex-end" : "flex-start" }}>
      {!out && <span style={{ width: "1.5cqw", flexShrink: 0 }}>{last && <Avatar hue={hue} size="1.5cqw" ring={false} />}</span>}
      <div className="relative" style={{ ...base, background: out ? OUT_BG : "#262628" }}>
        {inner}
        {m.kind === "in" && m.heart && (
          <span style={{ position: "absolute", right: "0.4cqw", bottom: "-0.9cqw", width: "1.4cqw", height: "1.4cqw", borderRadius: "50%", background: "#262628", border: "0.12cqw solid #000",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75cqw" }}>❤️</span>
        )}
      </div>
    </div>
  );
}

/** Один экран переписки: шапка, сообщения, строка ввода. */
export function DirectScreen({ t }: { t: Thread }) {
  const lastIn = t.msgs.map((m) => m.kind === "in" || (m.kind === "voice" && m.dir === "in")).lastIndexOf(true);
  return (
    <div className="flex h-full w-full flex-col" style={{ background: "#000", borderRadius: "1.6cqw", overflow: "hidden", fontFamily: IG_FONT,
      boxShadow: "0 0 0 1px rgba(255,255,255,.08), 0 2.4cqw 4cqw -1.6cqw rgba(20,10,4,.55)" }}>
      <div className="flex items-center" style={{ gap: "0.55cqw", padding: "0.9cqw 0.8cqw 0.7cqw" }}>
        <IconBtn><path d="M15 5l-7 7 7 7" /></IconBtn>
        <Avatar hue={t.hue} />
        <div className="grid min-w-0 flex-1" style={{ gap: "0.35cqw" }}><Redacted w="70%" /><Redacted w="45%" h="0.5cqw" o={0.55} /></div>
        <IconBtn><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></IconBtn>
        <IconBtn><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" /><circle cx="7" cy="7" r="1.2" /></IconBtn>
      </div>
      <div className="flex flex-1 flex-col justify-end" style={{ gap: "0.6cqw", padding: "0.4cqw 0.8cqw 0.9cqw", minHeight: 0, overflow: "hidden" }}>
        {t.msgs.map((m, i) => <Bubble key={i} m={m} hue={t.hue} last={i === lastIn} />)}
      </div>
      <div className="flex items-center" style={{ gap: "0.5cqw", margin: "0 0.7cqw 0.8cqw", padding: "0.4cqw 0.5cqw", borderRadius: 99, background: "#1C1C1E" }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "1.8cqw", height: "1.8cqw", borderRadius: "50%", background: "#3B5BF7", flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" width="55%" height="55%" fill="none" stroke="#fff" strokeWidth="2" aria-hidden><path d="M4 8h3l2-2.5h6L17 8h3v11H4z" /><circle cx="12" cy="13.2" r="3.4" /></svg>
        </span>
        <span style={{ flex: 1, minWidth: 0, fontSize: "0.74cqw", color: "rgba(255,255,255,.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Напишите сообщение…</span>
        {["M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3", "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4", "M12 3a9 9 0 1 0 9 9M8 12h.01M12 12h.01M16 12h.01"].map((d) => (
          <svg key={d} viewBox="0 0 24 24" width="1.05cqw" height="1.05cqw" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0 }}><path d={d} /></svg>
        ))}
      </div>
    </div>
  );
}

/** Стопка переписок в 3D: переднее окно сменяется переворотом каждые HOLD секунд, два следующих лежат сзади веером. */
export function DirectStack({ width = "21cqw", hold = 4.2 }: { width?: string; hold?: number }) {
  const n = DIRECT_THREADS.length;
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % n), hold * 1000);
    return () => clearInterval(id);
  }, [n, hold]);
  const at = (k: number) => DIRECT_THREADS[(i + k) % n];
  return (
    <div className="relative" style={{ width, aspectRatio: "9 / 13.2", perspective: "70cqw" }}>
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transform: "rotateY(-14deg) rotateX(5deg)" }}>
        {[2, 1].map((k) => (
          <div key={`back-${k}-${(i + k) % n}`} className="absolute inset-0" style={{ transform: `translate3d(${k * 1.6}cqw, ${k * -1.1}cqw, ${k * -3}cqw)`, opacity: 1 - k * 0.3, filter: `brightness(${1 - k * 0.18})` }}>
            <DirectScreen t={at(k)} />
          </div>
        ))}
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div key={i} className="absolute inset-0" initial={{ rotateY: 70, x: "6cqw", opacity: 0 }} animate={{ rotateY: 0, x: "0cqw", opacity: 1 }} exit={{ rotateY: -60, x: "-5cqw", opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} style={{ transformOrigin: "left center" }}>
            <DirectScreen t={at(0)} />
          </motion.div>
        </AnimatePresence>
      </div>
      {/* объёмная иконка над стопкой: новый запрос в директ */}
      <div className="absolute" style={{ right: "-2.2cqw", top: "-2.6cqw", pointerEvents: "none" }}><Px name="lg-i-botchat" size="6.4cqw" /></div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Phone } from "../Phone";
import { Statement } from "../Statement";
import { T, glass } from "../theme";
import { Arrow, Card, EASE, Note } from "../ui";

/**
 * Демо-ролик урока 2 на нейтральном товаре. Пока файла нет — в телефоне схема-иллюстрация.
 * Когда ролик готов: положить в public/montage/lesson2-demo.mp4 и поставить сюда путь.
 * Бренды из уроков партнёра («Рахат», «Аксай-нан», TASSAY) не показываем.
 */
const LESSON2_DEMO: string | null = null;

const txt: React.CSSProperties = { fontFamily: "var(--font-manrope)", fontWeight: 600, fontSize: "1.05cqw", lineHeight: 1.4, color: T.ink };
const Stagger = ({ i, children, style }: { i: number; children: React.ReactNode; style?: React.CSSProperties }) => (
  <motion.div style={style} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.08, duration: 0.45, ease: EASE }}>{children}</motion.div>
);

/** Чашка кофе — нейтральный товар для схем урока 2. stage 0 — кадр «до», 1 — кадр «после», "anim" — движение между ними. */
function Cup({ stage }: { stage: 0 | 1 | "anim" }) {
  const after = stage === 1;
  const anim = stage === "anim";
  const steam = ["M48 38c-5-7 5-11 0-19", "M60 36c-5-7 5-11 0-19", "M72 38c-5-7 5-11 0-19"];
  return (
    <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%" }}>
      <ellipse cx="60" cy="98" rx="44" ry="7" fill="rgba(139,94,60,.18)" />
      <path d="M84 56a12 12 0 0 1 0 22" fill="none" stroke={T.accent} strokeWidth="5" />
      <path d="M28 48h56v24a28 28 0 0 1-28 28 28 28 0 0 1-28-28z" fill={T.paper} stroke={T.accent} strokeWidth="3" />
      <ellipse cx="56" cy="49" rx="27" ry="5.5" fill="#6B4A33" />
      {(after || anim) && (
        <motion.path d="M56 58c-3-5-11-2-7 3l7 6 7-6c4-5-4-8-7-3z" fill={T.paper} stroke="none"
          initial={anim ? { scale: 0, opacity: 0 } : false} animate={anim ? { scale: [0, 1, 1, 0], opacity: [0, 1, 1, 0] } : undefined}
          transition={anim ? { duration: 3, times: [0, 0.35, 0.85, 1], repeat: Infinity } : undefined}
          style={{ transformOrigin: "56px 60px" }} />
      )}
      {(after || anim) && steam.map((d, i) => (
        <motion.path key={d} d={d} fill="none" stroke={T.gold2} strokeWidth="3" strokeLinecap="round"
          initial={anim ? { pathLength: 0, opacity: 0 } : false} animate={anim ? { pathLength: [0, 1, 1], opacity: [0, 1, 0] } : undefined}
          transition={anim ? { duration: 3, delay: i * 0.25, repeat: Infinity } : undefined} />
      ))}
    </svg>
  );
}

const Frame = ({ label, children, gold }: { label: string; children: React.ReactNode; gold?: boolean }) => (
  <div style={{ ...glass, borderRadius: 22, padding: "1cqw", width: "12cqw", ...(gold ? { border: `1.5px solid ${T.gold2}` } : null) }}>
    <div style={{ aspectRatio: "9/12", borderRadius: 14, background: T.soft, padding: "0.8cqw" }}>{children}</div>
    <div style={{ ...txt, fontSize: "0.9cqw", textAlign: "center", marginTop: "0.7cqw", color: gold ? T.accent : T.ink }}>{label}</div>
  </div>
);

/** 25 · Реклама без съёмки. */
export function M_NoShoot() {
  const chain = [["Фото товара", "с телефона"], ["Сценарий и кадры", "делает ИИ"], ["Ролик 9:16", "на 15 секунд"]];
  return (
    <Statement obj="lg-i-box" kicker="Урок 2 · AI-креатор" title="Реклама без съёмки" size="3cqw" lead="Не нужны ни оператор, ни студия. Из фотографий товара собираем рекламный ролик.">
      <div className="flex items-center gap-[1cqw]">
        {chain.map(([t, d], i) => (
          <div key={t} className="flex items-center gap-[1cqw]">
            <Stagger i={i * 2}><Card title={t} text={d} accent={i === 2} style={{ minWidth: "12cqw" }} /></Stagger>
            {i < chain.length - 1 && <Stagger i={i * 2 + 1}><Arrow /></Stagger>}
          </div>
        ))}
      </div>
    </Statement>
  );
}

/** 26 ✦ · Два кадра и движение между ними. */
export function M_TwoFrames() {
  return (
    <Statement kicker="Главный приём модуля" title="Два кадра и движение между ними" size="2.8cqw">
      <div className="flex items-center gap-[1cqw]">
        <Stagger i={0}><Frame label="Кадр 1: до"><Cup stage={0} /></Frame></Stagger>
        <Stagger i={1}><Arrow /></Stagger>
        <Stagger i={2}>
          <div style={{ ...glass, borderRadius: 22, padding: "1cqw", width: "14cqw", border: `1.5px solid ${T.gold2}` }}>
            <div className="relative overflow-hidden" style={{ aspectRatio: "9/12", borderRadius: 14, background: T.ink, padding: "1cqw" }}>
              <Cup stage="anim" />
              <div className="absolute inset-x-[8%] bottom-[6%] h-[4px] overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.2)" }}>
                <motion.div className="h-full" style={{ background: T.gold }} initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
              </div>
            </div>
            <div style={{ ...txt, fontSize: "0.9cqw", textAlign: "center", marginTop: "0.7cqw", color: T.accent }}>5 секунд движения</div>
          </div>
        </Stagger>
        <Stagger i={3}><Arrow /></Stagger>
        <Stagger i={4}><Frame label="Кадр 2: после"><Cup stage={1} /></Frame></Stagger>
      </div>
      <Note>ИИ рисует два согласованных кадра одной сцены и строит движение между ними</Note>
    </Statement>
  );
}

/** 27 · Два варианта одного товара. */
export function M_TwoVariants() {
  return (
    <Statement kicker="Урок 2" title="Два варианта одного товара" size="2.9cqw" lead="Делаем оба и выбираем по понятным критериям: что лучше держит взгляд и продаёт.">
      <div className="grid grid-cols-2 gap-[1cqw]" style={{ maxWidth: "48cqw" }}>
        <Stagger i={0}><Card no="Вариант 1" title="Повседневная реклама" text="Товар на домашнем столе, как будто снял покупатель" style={{ height: "100%" }} /></Stagger>
        <Stagger i={1}><Card no="Вариант 2" title="Предметная Motion-реклама" text="Товар в студийном свете и в движении" accent style={{ height: "100%" }} /></Stagger>
      </div>
    </Statement>
  );
}

/** 28 · Озвучка копией своего голоса. */
export function M_VoiceClone() {
  const Wave = ({ gold, i }: { gold?: boolean; i: number }) => (
    <div className="flex items-center gap-[0.22cqw]" style={{ height: "2.6cqw" }}>
      {Array.from({ length: 40 }, (_, k) => (
        <motion.div key={k} style={{ width: "0.36cqw", borderRadius: 3, background: gold ? T.gold2 : "rgba(110,95,83,.5)" }}
          animate={{ height: [`${25 + ((k * 29 + i * 11) % 55)}%`, `${40 + ((k * 47 + i * 7) % 60)}%`, `${25 + ((k * 29 + i * 11) % 55)}%`] }}
          transition={{ duration: 1.3 + (k % 4) * 0.2, repeat: Infinity, ease: "easeInOut" }} />
      ))}
    </div>
  );
  return (
    <Statement kicker="Урок 2 · Финал" title="Озвучка копией своего голоса" size="2.9cqw" lead="Даёте образец своего голоса. ИИ озвучивает ролик вашим тембром, а вы проверяете, насколько похоже.">
      <div className="grid gap-[0.9cqw]" style={{ ...glass, borderRadius: 22, padding: "1.4cqw 1.6cqw", maxWidth: "40cqw" }}>
        <div><div style={{ ...txt, fontSize: "0.9cqw", color: T.muted, marginBottom: "0.4cqw" }}>Ваш голос</div><Wave i={0} /></div>
        <div><div style={{ ...txt, fontSize: "0.9cqw", color: T.accent, marginBottom: "0.4cqw" }}>Копия в ElevenLabs</div><Wave i={1} gold /></div>
      </div>
    </Statement>
  );
}

/** 29 · Готовый рекламный ролик. */
export function M_AdResult() {
  return (
    <Statement kicker="Результат модуля 2" title="Готовый рекламный ролик" size="3cqw" lead="От фотографий до ролика 9:16 с озвучкой вашим голосом. Весь модуль 2 про это."
      leftSize="20cqw"
      left={LESSON2_DEMO ? <Phone video={LESSON2_DEMO} width="14cqw" showTop={false} /> : (
        <div style={{ width: "14cqw", aspectRatio: "9/19", background: "#141210", borderRadius: "2.4cqw", padding: "0.52cqw", boxShadow: T.shadow }}>
          <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden" style={{ borderRadius: "1.98cqw", background: `linear-gradient(180deg, ${T.soft}, #E9DCCB)` }}>
            <div style={{ width: "70%" }}><Cup stage="anim" /></div>
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: T.ink, marginTop: "0.6cqw" }}>9:16 · 15 секунд</div>
          </div>
        </div>
      )}>
      <div className="flex flex-wrap gap-[0.6cqw]">
        {["Без съёмки", "Без оператора", "Озвучка вашим голосом"].map((c) => (
          <span key={c} style={{ ...glass, borderRadius: 999, padding: "0.7cqw 1.2cqw", ...txt, fontSize: "0.95cqw" }}>{c}</span>
        ))}
      </div>
    </Statement>
  );
}

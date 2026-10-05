"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CASES, type BizCase } from "../cases";
import { Statement } from "../Statement";
import { T } from "../theme";
import { EASE, Em, Note, Px, txt } from "../ui";

/**
 * 08c · Что я собрал для бизнеса: автокарусель кейсов на ночном слайде. Жидкое стекло: окно браузера и карточка кейса —
 * полупрозрачные панели с размытием фона, градиентной кромкой и бликом; за ними тёплое свечение бренда, которое медленно плывёт,
 * поэтому стекло видно. Окна кейсов лежат стопкой: следующий кейс и пустая карточка выглядывают сзади веером.
 * Кейс сменяется каждые 3,4 с, сверху полоса «историй» и счётчик. Когда кадра нет, в окне логотип клиента или карточка продукта.
 * Данные — components/montage-deck/cases.ts. Всё в левых 60% кадра.
 */

const HOLD = 3.4; // секунд на кейс
const LABELS_MAX = 6; // до стольких кейсов под сегментами подписи, дальше только счётчик

const plural = (n: number) => {
  const a = n % 10, b = n % 100;
  return a === 1 && b !== 11 ? "решение" : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? "решения" : "решений";
};
const pad = (n: number) => String(n).padStart(2, "0");

/** Жидкое стекло: тонированная подложка, размытие и насыщение фона, внутренний свет сверху, глубокая тень. */
const glass = (radius: string): CSSProperties => ({
  position: "relative",
  borderRadius: radius,
  background: "linear-gradient(150deg, rgba(251,243,228,.14), rgba(251,243,228,.045) 50%, rgba(251,243,228,.08))",
  backdropFilter: "blur(22px) saturate(170%)",
  WebkitBackdropFilter: "blur(22px) saturate(170%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.30), inset 0 -1px 0 rgba(255,255,255,.05), 0 2.6cqw 5cqw -1.6cqw rgba(0,0,0,.8)",
});

/** Кромка стекла: градиентная рамка в 1 px (светлее сверху слева, золотом снизу справа) и мягкий блик по диагонали. */
const Rim = ({ sheen = 0.14 }: { sheen?: number }) => (
  <>
    <span aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "inherit", padding: 1, pointerEvents: "none",
      background: "linear-gradient(140deg, rgba(255,255,255,.6), rgba(255,255,255,.08) 32%, rgba(227,192,123,.38) 72%, rgba(255,255,255,.16))",
      WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }} />
    <span aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none",
      background: `linear-gradient(115deg, rgba(255,255,255,${sheen}) 0%, rgba(255,255,255,0) 36%)` }} />
  </>
);

/** Метка-пилюля из стекла: теги в карточке продукта, пометка «демо-данные». */
const Pill = ({ children, gold = false, size = "0.7cqw" }: { children: ReactNode; gold?: boolean; size?: string }) => (
  <span style={{ ...txt, fontSize: size, fontWeight: 700, whiteSpace: "nowrap", padding: "0.3cqw 0.7cqw", borderRadius: 99,
    color: gold ? "#F1D9A8" : T.nightText, background: gold ? "rgba(227,192,123,.12)" : "rgba(20,16,14,.55)",
    border: `1px solid ${gold ? "rgba(227,192,123,.34)" : "rgba(251,243,228,.18)"}`, boxShadow: "inset 0 1px 0 rgba(255,255,255,.14)",
    backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>{children}</span>
);

/** Экран под адресной строкой: скриншот, логотип клиента или карточка продукта. Заполняет остаток окна. */
function Screen({ c }: { c: BizCase }) {
  const v = c.visual;
  const box: CSSProperties = { position: "relative", flex: 1, minHeight: 0, borderRadius: "0.8cqw", overflow: "hidden", boxShadow: "0 0 0 1px rgba(255,255,255,.08)" };
  if (v.kind === "shot") {
    return (
      <div style={box}>
        <img src={v.src} alt={`Экран решения: ${c.title}`} draggable={false} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
        {v.demo && <span style={{ position: "absolute", right: "0.7cqw", bottom: "0.7cqw" }}><Pill>демо-данные</Pill></span>}
      </div>
    );
  }
  const light = v.kind === "logo" && !v.dark;
  return (
    <div className="flex flex-col items-center justify-center" style={{ ...box, gap: "0.9cqw",
      background: light
        ? "linear-gradient(160deg, #FFFFFF, #FBF3E4)"
        : `radial-gradient(60% 55% at 50% 30%, rgba(227,192,123,.22), transparent 70%), radial-gradient(120% 90% at 50% 0%, ${T.night2}, ${T.night})` }}>
      {v.kind === "logo" ? (
        <>
          <img src={v.src} alt={`Логотип клиента: ${c.title}`} draggable={false} style={{ display: "block", height: "4.4cqw", maxWidth: "60%", objectFit: "contain" }} />
          <div style={{ ...txt, fontSize: "0.72cqw", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: light ? T.accent : T.gold }}>Клиент</div>
        </>
      ) : (
        <>
          <Px name={v.icon} size="6cqw" />
          <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.3cqw", color: T.nightText, textAlign: "center", lineHeight: 1.2 }}>{v.label}</div>
        </>
      )}
      <div className="flex flex-wrap justify-center" style={{ gap: "0.35cqw", maxWidth: "90%" }}>
        {v.tags.map((t) => light
          ? <span key={t} style={{ ...txt, fontSize: "0.7cqw", fontWeight: 700, whiteSpace: "nowrap", padding: "0.3cqw 0.7cqw", borderRadius: 99, border: `1px solid ${T.line}`, color: T.muted }}>{t}</span>
          : <Pill key={t} gold>{t}</Pill>)}
      </div>
    </div>
  );
}

/** Окно браузера в стеклянной рамке: точки и адрес страницы кейса в стеклянной пилюле, под ними экран решения. */
function Window({ c }: { c: BizCase }) {
  return (
    <div className="flex h-full w-full flex-col" style={{ ...glass("1.4cqw"), padding: "0 0.5cqw 0.5cqw" }}>
      <div className="flex items-center" style={{ gap: "0.4cqw", padding: "0.5cqw 0.3cqw" }}>
        {[T.gold, T.brownLt, "rgba(251,243,228,.35)"].map((col, k) => <span key={k} style={{ width: "0.55cqw", height: "0.55cqw", borderRadius: 99, background: col, flexShrink: 0 }} />)}
        <span style={{ ...txt, fontSize: "0.68cqw", color: T.nightMuted, marginLeft: "0.5cqw", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          padding: "0.2cqw 0.8cqw", borderRadius: 99, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}>{c.url}</span>
      </div>
      <Screen c={c} />
      <Rim sheen={0.1} />
    </div>
  );
}

export function M_Cases() {
  const n = CASES.length;
  const labels = n <= LABELS_MAX;
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % n), HOLD * 1000);
    return () => clearInterval(id);
  }, [n]);
  const c = CASES[i];
  const next = CASES[(i + 1) % n];

  return (
    <Statement tone="night" kicker={`Вайбкодинг · ${n} ${plural(n)} для бизнеса`} title="Что я собрал для бизнеса" lead={<Em night>Без программистов</Em>} size="2.7cqw">
      {/* Кадры всех кейсов грузятся заранее, чтобы смена окна не мигала пустым экраном */}
      <div hidden>{CASES.map((x) => x.visual.kind !== "card" && <img key={x.slug} src={x.visual.src} alt="" />)}</div>

      {/* Полоса «историй»: сколько решений и какое на экране */}
      <div className="grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gap: labels ? "0.6cqw" : "0.3cqw", maxWidth: "54cqw" }}>
        {CASES.map((x, k) => (
          <div key={x.slug} className="min-w-0">
            <div style={{ height: "0.3cqw", borderRadius: 99, background: "rgba(251,243,228,.12)", overflow: "hidden" }}>
              {k < i && <div style={{ width: "100%", height: "100%", background: "rgba(227,192,123,.55)" }} />}
              {k === i && <motion.div key={`fill-${i}`} initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: HOLD, ease: "linear" }}
                style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${T.gold2}, ${T.gold})`, boxShadow: "0 0 0.6cqw rgba(227,192,123,.7)" }} />}
            </div>
            {labels && <div style={{ ...txt, fontSize: "0.8cqw", fontWeight: 700, marginTop: "0.45cqw", color: k === i ? T.gold : T.nightMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", transition: "color .3s" }}>{x.title}</div>}
          </div>
        ))}
      </div>
      {!labels && (
        <div style={{ ...txt, fontSize: "0.8cqw", fontWeight: 700, marginTop: "0.5cqw", color: T.nightMuted, fontVariantNumeric: "tabular-nums", letterSpacing: ".06em" }}>
          <span style={{ color: T.gold }}>{pad(i + 1)}</span> / {pad(n)}
        </div>
      )}

      <div className="relative grid items-center" style={{ gridTemplateColumns: "30cqw minmax(0, 1fr)", gap: "2.4cqw", maxWidth: "54cqw", marginTop: "1.4cqw" }}>
        {/* Тёплое свечение бренда за стеклом: без него стекло на ночном фоне не читается. Медленно плывёт, правее колонки не выходит */}
        <motion.div aria-hidden className="pointer-events-none absolute" style={{ top: "-14%", bottom: "-14%", left: "-6%", right: 0, filter: "blur(2.6cqw)",
          // свет падает на кромки окна сверху и снизу и под карточку кейса, иначе края стекла тонут в ночном фоне
          background: "radial-gradient(30% 30% at 18% 6%, rgba(227,192,123,.55), transparent 70%), radial-gradient(34% 30% at 40% 96%, rgba(160,83,42,.8), transparent 72%), radial-gradient(36% 46% at 70% 64%, rgba(160,83,42,.6), transparent 72%), radial-gradient(26% 32% at 86% 22%, rgba(227,192,123,.35), transparent 70%)" }}
          animate={{ x: ["0cqw", "1cqw", "0cqw"], y: ["0cqw", "-0.7cqw", "0cqw"] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} />

        <div className="relative" style={{ aspectRatio: "16 / 11.4", perspective: "90cqw" }}>
          {/* Стопка карточек: пустое стекло и следующий кейс веером выглядывают сзади — видно, что решений много */}
          <div className="absolute inset-0" style={{ ...glass("1.4cqw"), transform: "translate(2.6cqw, 1.5cqw) rotate(7deg) scale(0.88)", opacity: 0.75 }}><Rim sheen={0.2} /></div>
          {n > 1 && (
            <div className="absolute inset-0" style={{ transform: "translate(1.4cqw, 0.8cqw) rotate(3.5deg) scale(0.94)", opacity: 0.7, filter: "saturate(.8) brightness(.9)" }}>
              <Window c={next} />
            </div>
          )}
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div key={c.slug} className="absolute inset-0" initial={{ opacity: 0, x: "5cqw", rotateY: -14, scale: 0.97 }} animate={{ opacity: 1, x: "0cqw", rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, x: "-5cqw", rotateY: 14, scale: 0.97 }} transition={{ duration: 0.6, ease: EASE }} style={{ transformOrigin: "center" }}>
              <Window c={c} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Карточка кейса: стекло стоит на месте, меняется только содержимое */}
        <div className="min-w-0" style={{ ...glass("1.4cqw"), padding: "1.5cqw 1.6cqw" }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={`info-${c.slug}`} initial={{ opacity: 0, y: "0.8cqw" }} animate={{ opacity: 1, y: "0cqw" }} exit={{ opacity: 0, y: "-0.6cqw" }} transition={{ duration: 0.35, ease: EASE }}>
              <div style={{ ...txt, fontSize: "0.78cqw", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: T.gold }}>{c.niche}</div>
              <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.65cqw", lineHeight: 1.15, color: T.nightText, marginTop: "0.55cqw" }}>{c.title}</div>
              <div style={{ ...txt, fontSize: "1.1cqw", fontWeight: 600, lineHeight: 1.35, marginTop: "0.7cqw", color: "rgba(251,243,228,.82)" }}>{c.oneLiner}</div>
              <div className="flex flex-wrap" style={{ gap: "0.4cqw", marginTop: "1.1cqw" }}>
                {c.metric.split(" · ").map((p) => <Pill key={p} gold size="0.85cqw">{p[0].toUpperCase() + p.slice(1)}</Pill>)}
              </div>
            </motion.div>
          </AnimatePresence>
          <Rim />
        </div>
      </div>
      <Note color={T.nightMuted} style={{ marginTop: "1.6cqw", fontSize: "0.95cqw" }}>Все кейсы целиком: onai.academy/saint</Note>
    </Statement>
  );
}

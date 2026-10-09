"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CASES, PLATFORMS, type BizCase, type Platform } from "../cases";
import { Pill, Rim, glassSurface } from "../Glass";
import { Phone } from "../Phone";
import { Statement } from "../Statement";
import { T } from "../theme";
import { EASE, Em, Note, Px, Stagger, txt } from "../ui";

/**
 * 08p1–08p3 · Три платформы обучения (Александр, 07.10 вечером): окно браузера с экраном платформы на компьютере, поверх снизу справа телефон
 * с мобильным экраном, справа логотип на светлой плашке и 2–3 факта. 08c · Что я собрал для бизнеса: автокарусель остальных кейсов.
 * 08cs · Каждый кейс разобран на сайте: страницы кейсов onai.academy/saint (компьютер и телефон) трёх платформ строками.
 * Жидкое стекло: окно браузера и карточка кейса — полупрозрачные панели с размытием фона, градиентной кромкой и бликом; за ними тёплое свечение бренда, которое медленно плывёт,
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

/** Стекло, кромка и метки живут в общем модуле Glass.tsx: тот же приём используют карточки всей колоды (theme.ts). */
const glass = (radius: string, lift: "sm" | "lg" = "lg") => glassSurface(radius, { lift });

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

/**
 * Окно браузера в стеклянной рамке: точки и адрес страницы в стеклянной пилюле, под ними содержимое.
 * k — масштаб рамки: 1 как в карусели, меньше для мелких превью, больше для крупных окон платформ.
 */
function BrowserFrame({ url, children, k = 1, lift = "lg" }: { url: string; children: ReactNode; k?: number; lift?: "sm" | "lg" }) {
  const c = (v: number) => `${+(v * k).toFixed(3)}cqw`;
  return (
    <div className="flex h-full w-full flex-col" style={{ ...glass(c(1.4), lift), padding: `0 ${c(0.5)} ${c(0.5)}` }}>
      <div className="flex items-center" style={{ gap: c(0.4), padding: `${c(0.5)} ${c(0.3)}` }}>
        {[T.gold, T.brownLt, "rgba(251,243,228,.35)"].map((col, i) => <span key={i} style={{ width: c(0.55), height: c(0.55), borderRadius: 99, background: col, flexShrink: 0 }} />)}
        <span style={{ ...txt, fontSize: c(0.68), color: T.nightMuted, marginLeft: c(0.5), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          padding: `${c(0.2)} ${c(0.8)}`, borderRadius: 99, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}>{url}</span>
      </div>
      {children}
      <Rim sheen={0.1} />
    </div>
  );
}

/** Окно браузера карусели: адрес страницы кейса и экран решения под ним. */
function Window({ c }: { c: BizCase }) {
  return <BrowserFrame url={c.url}><Screen c={c} /></BrowserFrame>;
}

/**
 * Окно браузера с картинкой на компьютере (16:10) и телефон поверх него снизу справа: телефон выступает за правый и нижний край окна.
 * w, phoneW — ширина окна и телефона в cqw, k — масштаб рамки окна, demo — подпись «демо-данные» слева снизу, delay — задержка въезда.
 */
function DeviceStage({ url, desk, mob, alt, w, phoneW, k = 1, demo = false, delay = 0 }: {
  url: string; desk: string; mob: string; alt: string; w: number; phoneW: number; k?: number; demo?: boolean; delay?: number;
}) {
  const over = +(phoneW * 0.42).toFixed(2); // насколько телефон выходит за правый край окна
  const below = +(phoneW * 0.28).toFixed(2); // и за нижний
  return (
    <div className="relative shrink-0" style={{ width: `${+(w + over).toFixed(2)}cqw`, paddingBottom: `${below}cqw` }}>
      <motion.div style={{ width: `${w}cqw` }} initial={{ opacity: 0, y: "1.2cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ duration: 0.5, delay, ease: EASE }}>
        <BrowserFrame url={url} k={k} lift={k < 1 ? "sm" : "lg"}>
          <div style={{ position: "relative", aspectRatio: "16 / 10", borderRadius: `${+(0.8 * k).toFixed(3)}cqw`, overflow: "hidden", boxShadow: "0 0 0 1px rgba(255,255,255,.08)" }}>
            <img src={desk} alt={alt} draggable={false} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            {demo && <span style={{ position: "absolute", left: `${+(0.7 * k).toFixed(3)}cqw`, bottom: `${+(0.7 * k).toFixed(3)}cqw` }}><Pill size={`${+(0.7 * Math.max(k, 0.8)).toFixed(3)}cqw`}>демо-данные</Pill></span>}
          </div>
        </BrowserFrame>
      </motion.div>
      <motion.div className="absolute" style={{ right: 0, bottom: 0 }} initial={{ opacity: 0, y: "3cqw", scale: 0.92 }} animate={{ opacity: 1, y: "0cqw", scale: 1 }}
        transition={{ delay: delay + 0.4, type: "spring", stiffness: 120, damping: 16 }}>
        <Phone src={mob} width={`${phoneW}cqw`} ratio="9 / 19.5" chrome={false} />
      </motion.div>
    </div>
  );
}

/** Светлая плашка с логотипом платформы: логотипы сайтов нарисованы для светлого фона, на тёмном стекле их не видно. */
function LogoPlate({ p, k = 1, delay = 0 }: { p: Platform; k?: number; delay?: number }) {
  return (
    <motion.div className="flex items-center justify-center" initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ duration: 0.42, delay, ease: EASE }}
      style={{ borderRadius: `${+(0.9 * k).toFixed(3)}cqw`, padding: `${+(0.9 * k).toFixed(3)}cqw ${+(1.2 * k).toFixed(3)}cqw`, background: "linear-gradient(160deg, #FFFFFF, #FBF3E4)",
        boxShadow: "0 0 0 1px rgba(255,255,255,.22), 0 1.2cqw 2.4cqw -1.2cqw rgba(0,0,0,.65)" }}>
      <img src={`/montage/cases/${p.logo}?v=1007`} alt={`Логотип: ${p.name}`} draggable={false} style={{ display: "block", height: `${+(p.logoH * k).toFixed(3)}cqw`, maxWidth: "100%", objectFit: "contain" }} />
    </motion.div>
  );
}

/** Факт на стеклянной карточке: крупно золотом, ниже пояснение. */
function Fact({ big, small, i }: { big: string; small: string; i: number }) {
  return (
    <Stagger i={i} base={0.3} style={{ ...glass("1cqw", "sm"), padding: "0.85cqw 1.1cqw" }}>
      <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.4cqw", lineHeight: 1.15, color: T.gold, whiteSpace: "nowrap" }}>{big}</div>
      <div style={{ ...txt, fontSize: "0.9cqw", lineHeight: 1.3, marginTop: "0.3cqw", color: "rgba(251,243,228,.82)" }}>{small}</div>
      <Rim />
    </Stagger>
  );
}

/** 08p1–08p3 · одна платформа обучения: экран на компьютере и телефоне, логотип, одна строка и факты. Всё в левых 60% кадра. */
export function M_Platform({ i }: { i: 0 | 1 | 2 }) {
  const p = PLATFORMS[i];
  return (
    <Statement tone="night" kicker={`Три платформы обучения · ${i + 1} из ${PLATFORMS.length}`} title={p.name} lead={p.line} size="2.7cqw">
      <div className="relative flex items-center" style={{ gap: "1.6cqw", maxWidth: "54cqw" }}>
        {/* Тёплое свечение за стеклом: без него стекло на ночном фоне не читается */}
        <div aria-hidden className="pointer-events-none absolute" style={{ top: "-12%", bottom: "-12%", left: "-6%", width: "70%", filter: "blur(2.6cqw)",
          background: "radial-gradient(34% 30% at 20% 8%, rgba(227,192,123,.5), transparent 70%), radial-gradient(40% 34% at 44% 96%, rgba(160,83,42,.75), transparent 72%), radial-gradient(34% 44% at 76% 60%, rgba(160,83,42,.5), transparent 72%)" }} />
        <DeviceStage url={`onai.academy/saint/cases/${p.slug}`} desk={p.desk} mob={p.mob} alt={`Экран платформы ${p.name} на компьютере`} w={33} phoneW={9} k={1.1} demo={p.demo} delay={0.1} />
        <div className="relative flex min-w-0 flex-1 flex-col" style={{ gap: "0.8cqw" }}>
          <LogoPlate p={p} delay={0.3} />
          {p.facts.map((f, k) => <Fact key={f.big} big={f.big} small={f.small} i={k} />)}
        </div>
      </div>
    </Statement>
  );
}

/** Строка 08cs: страница кейса на сайте (компьютер и телефон) и справа название, адрес и о чём страница. */
function PageRow({ p, i }: { p: Platform; i: number }) {
  const delay = 0.15 + i * 0.14;
  return (
    <div className="relative flex items-center" style={{ gap: "2.2cqw" }}>
      <DeviceStage url={`onai.academy/saint/cases/${p.slug}`} desk={p.pageDesk} mob={p.pageMob} alt={`Страница кейса ${p.name} на сайте, компьютер`} w={14.5} phoneW={4.9} k={0.6} delay={delay} />
      <motion.div className="min-w-0" initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ duration: 0.42, delay: delay + 0.2, ease: EASE }}>
        <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.55cqw", lineHeight: 1.15, color: T.nightText }}>{p.name}</div>
        <div style={{ ...txt, fontSize: "1.05cqw", lineHeight: 1.35, marginTop: "0.45cqw", color: "rgba(251,243,228,.82)" }}>Задача, решение и проверенные цифры</div>
        <div style={{ marginTop: "0.75cqw" }}><Pill gold size="0.9cqw">{`onai.academy/saint/cases/${p.slug}`}</Pill></div>
      </motion.div>
    </div>
  );
}

/** 08cs · Каждый кейс разобран на сайте: три страницы кейсов платформ, на каждой компьютерная и телефонная версии. */
export function M_CasePages() {
  return (
    <Statement tone="night" kicker="Страницы кейсов на сайте" title={<>Каждый кейс <Em night>разобран на сайте</Em></>} size="2.7cqw">
      <div className="relative flex flex-col" style={{ gap: "0.9cqw", maxWidth: "54cqw" }}>
        <div aria-hidden className="pointer-events-none absolute" style={{ top: "-4%", bottom: "-4%", left: "-6%", width: "46%", filter: "blur(2.6cqw)",
          background: "radial-gradient(40% 18% at 24% 6%, rgba(227,192,123,.45), transparent 70%), radial-gradient(44% 22% at 40% 52%, rgba(160,83,42,.6), transparent 72%), radial-gradient(40% 18% at 30% 96%, rgba(160,83,42,.6), transparent 72%)" }} />
        {PLATFORMS.map((p, i) => <PageRow key={p.slug} p={p} i={i} />)}
      </div>
      <Note color={T.nightMuted} style={{ marginTop: "1.2cqw", fontSize: "0.95cqw" }}>Все кейсы целиком: onai.academy/saint</Note>
    </Statement>
  );
}

/**
 * 08c · карусель кейсов. kicker, title, lead — свои тексты для повтора: слайд 08c2 после блока Vibe Coding PRO
 * («какие проекты я уже сделал сам»), та же карусель и те же кейсы.
 */
export function M_Cases({ kicker, title = "Что я собрал для бизнеса", lead = <Em night>Без программистов</Em> }: { kicker?: string; title?: string; lead?: ReactNode } = {}) {
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
    <Statement tone="night" kicker={kicker ?? `Вайбкодинг · ${n} ${plural(n)} для бизнеса`} title={title} lead={lead} size="2.7cqw">
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
        <div aria-hidden className="pointer-events-none absolute" style={{ top: "-14%", bottom: "-14%", left: "-6%", right: 0, filter: "blur(2.6cqw)", animation: "cases-drift 9s ease-in-out infinite",
          // свет падает на кромки окна сверху и снизу и под карточку кейса, иначе края стекла тонут в ночном фоне
          background: "radial-gradient(30% 30% at 18% 6%, rgba(227,192,123,.55), transparent 70%), radial-gradient(34% 30% at 40% 96%, rgba(160,83,42,.8), transparent 72%), radial-gradient(36% 46% at 70% 64%, rgba(160,83,42,.6), transparent 72%), radial-gradient(26% 32% at 86% 22%, rgba(227,192,123,.35), transparent 70%)" }} />

        <div className="relative" style={{ aspectRatio: "16 / 11.4", perspective: "90cqw" }}>
          {/* Стопка карточек: пустое стекло и следующий кейс веером выглядывают сзади — видно, что решений много */}
          <div className="absolute inset-0" style={{ ...glass("1.4cqw"), position: "absolute", transform: "translate(2.6cqw, 1.5cqw) rotate(7deg) scale(0.88)", opacity: 0.75 }}><Rim sheen={0.2} /></div>
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

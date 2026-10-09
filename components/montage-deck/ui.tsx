"use client";

import { Children, CSSProperties, ReactNode, cloneElement, isValidElement } from "react";
import { motion } from "framer-motion";
import { LT, T, card, nightCard } from "./theme";
import { moneyUsd } from "./prices";

/** Неразрывные пробелы в числах: «300 000 ₸» не рвётся по строкам. */
export const nb = (s: string) => s.replace(/ /g, " ");

const NBSP = String.fromCharCode(160);
/** Слова из одной-двух букв и служебные из трёх (без, для, что, как...): не остаются в конце строки, клеятся к следующему слову. */
const GLUE_SHORT = /(?<=^|[\s(«"“„])([А-Яа-яЁёA-Za-z]{1,2}|без|для|над|под|при|про|что|как|это|все|вам|вас|нас|или) (?=\S)/gi;

/**
 * Типографская склейка для заголовков, подводок и подписей (как функция Je на сайте /saint/): строка не рвётся в плохом месте.
 * Число идёт с разрядами и своим словом («6 форматов», «150 000 ₸», «118 тыс.»), слово перед числом остаётся рядом
 * («Практика 1», «на 19 сентября 2026»), предлоги и союзы из 1–3 букв приклеены к следующему слову, тире и «·» не начинают строку, последнее короткое слово не остаётся одно.
 * Цифры и слова не меняются, только пробелы между ними становятся неразрывными.
 */
export function glue(s: string): string {
  return s
    .replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NBSP}`) // разряды: 150 000
    .replace(/(\d) (?=[^\s\d])/g, `$1${NBSP}`) // число и единица: 6 форматов, 150 000 ₸, 118 тыс.
    .replace(/([A-Za-zА-Яа-яЁё]{2,}) (?=\d)/g, `$1${NBSP}`) // слово и число после него: Практика 1, сентября 2026
    .replace(GLUE_SHORT, `$1${NBSP}`) // предлоги и союзы
    .replace(/ ([–·]) /g, `${NBSP}$1 `) // тире и «·» остаются на строке со словом слева
    .replace(/(\S) (\S{1,5})$/, `$1${NBSP}$2`); // короткое последнее слово не остаётся одно на строке
}

/** Соседние строки и числа сливаются в одну: «от » и «300 000 ₸» из двух JSX-выражений склеиваются как одна фраза. */
function mergeText(list: ReactNode[]): ReactNode[] {
  const out: ReactNode[] = [];
  for (const n of list) {
    const last = out[out.length - 1];
    if ((typeof n === "string" || typeof n === "number") && (typeof last === "string" || typeof last === "number")) out[out.length - 1] = String(last) + String(n);
    else out.push(n);
  }
  return out;
}

/** glue() для готового узла: идёт по строкам внутри элементов, компоненты и ключи не трогает. */
export function glueNode(n: ReactNode): ReactNode {
  if (typeof n === "string") return glue(n);
  if (Array.isArray(n)) return mergeText(Children.toArray(n)).map(glueNode);
  if (isValidElement(n)) {
    const c = (n.props as { children?: ReactNode }).children;
    if (c == null || typeof c === "function") return n;
    return cloneElement(n, undefined, ...(Array.isArray(c) ? mergeText(Children.toArray(c)).map(glueNode) : [glueNode(c)]));
  }
  return n;
}

/** 107237 → «107 237» с неразрывным пробелом. */
export const thousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/** Тёмный ореол вокруг текста на экране с полем столбиков (главы, подводка к практике): золотые грани под буквами не съедают контраст. */
export const NIGHT_HALO = "0 0 0.7cqw rgba(15,11,9,.92), 0 0 1.8cqw rgba(15,11,9,.8)";

/** Затемнение под текстом на экранах с полем столбиков: мягкий овал, края растворяются, сами столбики остаются видны вокруг. */
export const nightScrim = (at: string, rx: string, ry: string, alpha = 0.6): CSSProperties => ({
  position: "absolute", inset: 0, pointerEvents: "none",
  background: `radial-gradient(ellipse ${rx} ${ry} at ${at}, rgba(15,11,9,${alpha}), rgba(15,11,9,${alpha / 2}) 58%, rgba(15,11,9,0) 100%)`,
});

export const EASE = [0.23, 1, 0.32, 1] as const;

/** Ритм въезда: шаг 70 мс, въезд элемента 0,42 с — слайд собирается за ~0,6 с. */
export const STEP = 0.07;
export const RISE_DUR = 0.42;
/** Задержка i-го элемента слайда; после шестого шаг не растёт, чтобы въезд не затягивался. */
export const at = (i: number, base = 0) => base + Math.min(i, 6) * STEP;

/** Заголовок сайта: Unbounded 800, коричневый; на ночи — #FBF3E4. Слово-акцент — <Em>. */
export const H = ({ children, size = "3.2cqw", color = T.brown, style }: { children: ReactNode; size?: string; color?: string; style?: CSSProperties }) => (
  <h2 style={{ fontFamily: "var(--font-unbounded)", fontWeight: 800, letterSpacing: "-.025em", lineHeight: 1.1, fontSize: size, color, ...style }}>{glueNode(children)}</h2>
);

/** Слово-акцент в заголовке: #C08552 на светлом, золото на ночи. */
export const Em = ({ children, night = false }: { children: ReactNode; night?: boolean }) => (
  <span style={{ color: night ? T.gold : T.brownLt }}>{children}</span>
);

export const Kicker = ({ children, color = T.accent }: { children: ReactNode; color?: string }) => (
  <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.85cqw", letterSpacing: ".16em", textTransform: "uppercase", color, marginBottom: "1.3cqw" }}>{glueNode(children)}</div>
);

export const Lead = ({ children, color = T.muted, style }: { children: ReactNode; color?: string; style?: CSSProperties }) => (
  <p style={{ fontFamily: "var(--font-manrope)", fontWeight: 500, fontSize: "1.3cqw", lineHeight: 1.45, color, ...style }}>{glueNode(children)}</p>
);

export const Chip = ({ children, night = false, gold = false }: { children: ReactNode; night?: boolean; gold?: boolean }) => (
  <span style={{
    fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1cqw", borderRadius: 999, padding: "0.6cqw 1.2cqw", whiteSpace: "nowrap", display: "inline-block",
    ...(gold
      ? { background: `linear-gradient(180deg, ${T.gold}, ${T.gold2})`, color: LT.ink, border: `1px solid ${T.gold2}` }
      : night
        ? { background: T.night2, color: T.nightText, border: `1px solid ${T.nightLine}` }
        : { background: T.card, color: T.ink, border: `1px solid ${T.line}` }),
  }}>{glueNode(children)}</span>
);

export const Num = ({ children, size = "4cqw", color = T.ink }: { children: ReactNode; size?: string; color?: string }) => (
  <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, letterSpacing: "-.03em", fontSize: size, color, fontVariantNumeric: "tabular-nums", lineHeight: 1, whiteSpace: "nowrap" }}>{children}</span>
);

/** Подпись-источник под цифрой. */
export const Note = ({ children, color = T.muted, style }: { children: ReactNode; color?: string; style?: CSSProperties }) => (
  <div style={{ fontFamily: "var(--font-manrope)", fontSize: "0.85cqw", lineHeight: 1.4, color, marginTop: "1.4cqw", ...style }}>{glueNode(children)}</div>
);

/** Появление снизу со сдвигом по времени. Сдвиг в cqw → cqw: одинаковые единицы на входе и выходе. */
export const Rise = ({ children, delay = 0, style, className }: { children: ReactNode; delay?: number; style?: CSSProperties; className?: string }) => (
  <motion.div className={className} style={style} initial={{ opacity: 0, y: "0.9cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ duration: RISE_DUR, delay, ease: EASE }}>
    {children}
  </motion.div>
);

/**
 * Объект слайда. «lg-*» — лего-сцены gpt-image-2.5 (public/montage/lego/*.webp, прозрачный фон, пропорции свои).
 * Остальные имена — пиксельные спрайты сайта (public/montage/px/*.png). Появляется пружиной, bob — лёгкое покачивание.
 */
export const Px = ({ name, size = "6cqw", delay = 0.15, bob = true, style }: { name: string; size?: string; delay?: number; bob?: boolean; style?: CSSProperties }) => {
  const lego = name.startsWith("lg-");
  return (
    <motion.div style={{ height: size, width: lego ? "auto" : size, flexShrink: 0, ...style }} initial={{ opacity: 0, scale: 0.6, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 14, delay }}>
      {/* Покачивание: CSS-анимация transform (globals.css, px-bob), а не Motion: она идёт на компоновщике и не будит главный поток каждый кадр.
          Те же 3,2 с, easeInOut, y 0 → −4% → 0, старт через delay + 0,6 с, как было в framer-motion. Двигается обёртка, а картинка с тенью drop-shadow
          стоит внутри неподвижно: тень едет вместе с картинкой, но размытие тени не пересчитывается на каждом кадре. */}
      <div style={{ height: "100%", width: lego ? "auto" : "100%", ...(bob ? { animation: `px-bob 3.2s ease-in-out ${delay + 0.6}s infinite` } : null) }}>
        <img src={lego ? `/montage/lego/${name}.webp` : `/montage/px/${name}.png`} alt=""
          style={{ height: "100%", width: lego ? "auto" : "100%", display: "block", imageRendering: lego ? "auto" : "pixelated", filter: "drop-shadow(0 14px 18px rgba(42,33,28,.18))" }} />
      </div>
    </motion.div>
  );
};

/** Карточка сайта с номером и текстом. accent — золотая рамка. */
export const Card = ({ no, title, text, accent, style, icon, night }: { no?: string; title: ReactNode; text?: ReactNode; accent?: boolean; style?: CSSProperties; icon?: string; night?: boolean }) => (
  <div style={{ ...(night ? nightCard : card), borderRadius: 22, padding: "1.3cqw 1.5cqw", ...(accent ? { border: `1.5px solid ${T.gold2}` } : null), ...style }}>
    {icon && <Px name={icon} size="4.2cqw" bob={false} style={{ margin: "-0.4cqw 0 0.5cqw -0.4cqw" }} />}
    {no && <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: accent ? T.gold2 : night ? T.gold : T.accent, marginBottom: "0.6cqw" }}>{no}</div>}
    <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.2cqw", lineHeight: 1.3, color: night ? T.nightText : T.ink }}>{glueNode(title)}</div>
    {text && <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 500, fontSize: "0.95cqw", lineHeight: 1.45, color: night ? T.nightMuted : T.muted, marginTop: "0.4cqw" }}>{glueNode(text)}</div>}
  </div>
);

/** Стрелка-связка для цепочек. */
export const Arrow = ({ color = T.accent, size = "1.4cqw" }: { color?: string; size?: string }) => (
  <svg viewBox="0 0 24 24" style={{ width: size, height: size, flexShrink: 0 }} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

/** Значок сервиса (public/montage/logos/*.svg) одноцветной маской: у файлов свои фирменные цвета, в деке — цвет бренда. */
export const MaskIcon = ({ name, color = T.accent, size = "1.4cqw" }: { name: string; color?: string; size?: string }) => (
  <span aria-hidden style={{
    display: "inline-block", flexShrink: 0, width: size, height: size, backgroundColor: color,
    WebkitMaskImage: `url(/montage/logos/${name}.svg)`, maskImage: `url(/montage/logos/${name}.svg)`,
    WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center",
  }} />
);

/** Въезд i-го элемента в ритме деки: после заголовка (0,28 с), шаг 70 мс, сдвиг в cqw. Общий для всех блоков. */
export const Stagger = ({ i, children, style, className, base = 0.28 }: { i: number; children: ReactNode; style?: CSSProperties; className?: string; base?: number }) => (
  <motion.div className={className} style={style} initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: at(i, base), duration: RISE_DUR, ease: EASE }}>{children}</motion.div>
);

/** Текст карточек и строк: Manrope 600, 1,05cqw. */
export const txt: CSSProperties = { fontFamily: "var(--font-manrope)", fontWeight: 600, fontSize: "1.05cqw", lineHeight: 1.4, color: T.ink };

/** Линия-связка, прорисовывается слева направо за delay. */
export const DrawLine = ({ delay = 0, width = "2.4cqw", dur = 0.35 }: { delay?: number; width?: string; dur?: number }) => (
  <div className="relative" style={{ width, height: "0.18cqw", borderRadius: 4, background: `${T.brown}26`, flexShrink: 0 }}>
    <motion.div className="absolute inset-0" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay, duration: dur, ease: EASE }}
      style={{ borderRadius: 4, background: `linear-gradient(90deg, ${T.gold}, ${T.gold2})`, transformOrigin: "left" }} />
  </div>
);

/** Доллары мелко рядом с тенге в заголовке или крупной строке: «(≈ $335)». Размер в em от окружающего текста, не переносится. */
export const UsdTag = ({ n, size = "0.5em", color = T.muted, paren = true }: { n: number; size?: string; color?: string; paren?: boolean }) => (
  <span style={{ whiteSpace: "nowrap", fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: size, letterSpacing: 0, color }}>{paren ? `(${moneyUsd(n)})` : moneyUsd(n)}</span>
);

/** Пропуск, который дописывает Александр: пунктирная плашка «[…]». На эфир не выходит, пока не заменён текстом. */
export const Fill = ({ children }: { children: ReactNode }) => (
  <span style={{ display: "inline", color: T.brownLt, background: `${T.gold}1F`, border: `1px dashed ${T.brownLt}`, borderRadius: 8, padding: "0 0.35cqw", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>
    [{children}]
  </span>
);

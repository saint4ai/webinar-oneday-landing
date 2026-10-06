import type { CSSProperties } from "react";
import { B, MANROPE, UNBOUNDED } from "./fx/brand";
import { glassSurface } from "./Glass";

export { MANROPE, UNBOUNDED };

/**
 * Переключатель стиля колоды. true — liquid glass (Александр 06.10): все слайды ночные, карточки из стекла, акцент золотом.
 * false — прежняя светлая тема сайтов onai.academy: белый фон, карточки #FBF3E4, коричневые заголовки. Если перед эфиром что-то
 * пойдёт не так, достаточно поставить false и пересобрать: слайды берут цвета только отсюда.
 */
export const GLASS = true;

/**
 * Светлая палитра сайтов (бренд-код fx/brand.ts). В режиме GLASS её берут только предметы, которые обязаны остаться светлыми:
 * плита с QR (иначе камера не прочитает), полароиды, плашки логотипов банков, скрин профиля Instagram, белый текст поверх видео,
 * тёмный текст на золотой кнопке.
 */
export const LT = B;

/** Цвет грани и толщины объёмных цифр (ExtrudedNumber, пропс accent): на тёмном стекле коричневая грань тускнеет, поэтому золото. */
export const NUM_ACCENT: string = GLASS ? B.gold : B.brown;

/** Токены тёмного стекла: те же имена, что у светлой палитры, поэтому слайды менять не нужно. Все цвета hex, чтобы работало `${T.x}1F`. */
const GLASS_TOKENS = {
  paper: "#1A1512", // подложка окон и плит
  card: "#FBF3E411", // заливка стекла 7%
  ink: "#FBF3E4", // основной текст
  muted: "#B8A794",
  brown: "#F3E3C3", // заголовки и главные цифры: тёплый светлый
  brownLt: "#E3C07B", // слово-акцент
  accent: "#E3C07B", // кикеры
  line: "rgba(251,243,228,.14)",
} as const;

/**
 * Тема деки = бренд-код сайтов onai.academy. Цвета — из fx/brand.ts; при GLASS поверх них ложатся токены тёмного стекла.
 * Золото — кнопки, главная цифра, цена, акцент. Лайма, оранжа и чёрного #050505 нет.
 */
export const T = {
  ...B,
  ...(GLASS ? GLASS_TOKENS : null),
  /** Второй слой поверхностей. */
  soft: GLASS ? GLASS_TOKENS.card : B.card,
  white: GLASS ? GLASS_TOKENS.paper : B.paper,
  shadow: GLASS ? "0 2.6cqw 5cqw -1.6cqw rgba(0,0,0,.75)" : "0 44px 90px -46px rgba(42,33,28,.4)",
  shadowSm: GLASS ? "0 1.4cqw 3cqw -1.4cqw rgba(0,0,0,.6)" : "0 20px 44px -28px rgba(42,33,28,.34)",
} as const;

/** Карточка сайта: при GLASS стекло с размытием и бликом, иначе #FBF3E4 с рамкой line и тёплой тенью. */
export const card: CSSProperties = GLASS
  ? glassSurface(24)
  : { borderRadius: 24, background: B.card, border: `1px solid ${B.line}`, boxShadow: "0 20px 44px -28px rgba(42,33,28,.34)" };

/** Старое имя карточки: слайды v1 звали её «стеклом». */
export const glass = card;

/** Плотное стекло для панелей поверх видео и скринов. */
export const glassStrong: CSSProperties = glassSurface(24, { strong: true });

/** Карточка ночного слайда: второй слой ночи и светлая рамка. */
export const nightCard: CSSProperties = {
  borderRadius: 24,
  background: T.night2,
  border: `1px solid ${T.nightLine}`,
};

/** Золотая кнопка сайта. Текст на ней всегда тёмный, поэтому цвет берётся из светлой палитры. */
export const goldButton: CSSProperties = {
  background: `linear-gradient(180deg, ${T.gold}, ${T.gold2})`,
  color: B.ink,
  boxShadow: `0 12px 26px -14px ${T.gold2}`,
};

/** Золотой градиент по буквам — главная цифра, цена, большое слово. */
export const goldText: CSSProperties = {
  background: `linear-gradient(180deg, ${T.gold}, ${T.gold2})`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

/** Тёмная плашка цены, как на сайте: #2A211C, цена золотом. При GLASS ещё и тонкая золотая кромка, иначе плашка тонет в ночном фоне. */
export const pricePlate: CSSProperties = {
  borderRadius: 24,
  background: GLASS ? "linear-gradient(160deg, rgba(42,33,28,.92), rgba(20,16,14,.95))" : B.ink,
  color: T.gold,
  boxShadow: T.shadow,
  ...(GLASS ? { border: `1px solid ${T.gold2}55` } : null),
};

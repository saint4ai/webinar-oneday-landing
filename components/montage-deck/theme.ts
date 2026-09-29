import type { CSSProperties } from "react";
import { B, MANROPE, UNBOUNDED } from "./fx/brand";

export { MANROPE, UNBOUNDED };

/**
 * Тема деки = бренд-код сайтов onai.academy (эфир /workshop-montazh/ и главная). Все цвета — из fx/brand.ts.
 * Светлые слайды: белый фон, карточки #FBF3E4, рамки line, заголовки коричневым, акцент-слово #C08552.
 * Ночные (обложка, главы, воронка 44, финал): фон #14100E, второй слой #211A16, текст #FBF3E4, акцент золотом.
 * Золото — только кнопки, главная цифра и цена. Лайма, оранжа и чёрного #050505 нет.
 */
export const T = {
  ...B,
  /** Второй светлый слой — цвет карточек сайта. */
  soft: B.card,
  white: B.paper,
  shadow: "0 44px 90px -46px rgba(42,33,28,.4)",
  shadowSm: "0 20px 44px -28px rgba(42,33,28,.34)",
} as const;

/** Карточка сайта: #FBF3E4, рамка line, тёплая тень. */
export const card: CSSProperties = {
  borderRadius: 24,
  background: T.card,
  border: `1px solid ${T.line}`,
  boxShadow: T.shadowSm,
};

/** Старое имя карточки: слайды v1 звали её «стеклом». */
export const glass = card;

/** Карточка ночного слайда: второй слой ночи и светлая рамка. */
export const nightCard: CSSProperties = {
  borderRadius: 24,
  background: T.night2,
  border: `1px solid ${T.nightLine}`,
};

/** Золотая кнопка сайта. */
export const goldButton: CSSProperties = {
  background: `linear-gradient(180deg, ${T.gold}, ${T.gold2})`,
  color: T.ink,
  boxShadow: `0 12px 26px -14px ${T.gold2}`,
};

/** Золотой градиент по буквам — главная цифра, цена, большое слово. */
export const goldText: CSSProperties = {
  background: `linear-gradient(180deg, ${T.gold}, ${T.gold2})`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

/** Тёмная плашка цены, как на сайте: #2A211C, цена золотом. */
export const pricePlate: CSSProperties = {
  borderRadius: 24,
  background: T.ink,
  color: T.gold,
  boxShadow: T.shadow,
};

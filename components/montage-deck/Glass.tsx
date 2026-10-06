"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Жидкое стекло колоды (Александр 06.10: стиль сайта onai.academy/saint, «дороже, прозрачные элементы»).
 * Три приёма, которые вместе дают стекло: полупрозрачная заливка с диагональным бликом, размытие фона под панелью
 * (backdrop-filter) и кромка в 1 px, светлая сверху слева и золотая снизу справа (компонент Rim).
 * Стекло видно, только если за ним что-то есть: в MontageBg живёт тёплое свечение, оно и просвечивает.
 * Чистые стили без цветов темы, чтобы theme.ts мог брать отсюда card без круговых импортов.
 */

export type GlassOpts = { strong?: boolean; lift?: "sm" | "lg"; blur?: number };

/** Стиль стеклянной поверхности. strong — для панелей поверх видео и скринов (плотнее и размытее). */
export const glassSurface = (radius: string | number = 24, { strong = false, lift = "sm", blur }: GlassOpts = {}): CSSProperties => {
  const b = blur ?? (strong ? 26 : 16);
  return {
    position: "relative",
    borderRadius: radius,
    background: strong
      ? "linear-gradient(150deg, rgba(251,243,228,.20), rgba(251,243,228,.08) 50%, rgba(251,243,228,.13))"
      : "linear-gradient(150deg, rgba(251,243,228,.13), rgba(251,243,228,.04) 50%, rgba(251,243,228,.075))",
    backdropFilter: `blur(${b}px) saturate(165%)`,
    WebkitBackdropFilter: `blur(${b}px) saturate(165%)`,
    border: "1px solid rgba(251,243,228,.13)",
    boxShadow: lift === "lg"
      ? "inset 0 1px 0 rgba(255,255,255,.28), inset 0 -1px 0 rgba(255,255,255,.05), 0 2.6cqw 5cqw -1.6cqw rgba(0,0,0,.8)"
      : "inset 0 1px 0 rgba(255,255,255,.24), inset 0 -1px 0 rgba(255,255,255,.04), 0 1.4cqw 3cqw -1.4cqw rgba(0,0,0,.65)",
  };
};

/** Кромка стекла: градиентная рамка в 1 px (светлая сверху слева, золотая снизу справа) и мягкий блик по диагонали. Кладётся внутрь панели. */
export const Rim = ({ sheen = 0.14 }: { sheen?: number }) => (
  <>
    <span aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "inherit", padding: 1, pointerEvents: "none",
      background: "linear-gradient(140deg, rgba(255,255,255,.6), rgba(255,255,255,.08) 32%, rgba(227,192,123,.38) 72%, rgba(255,255,255,.16))",
      WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }} />
    <span aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none",
      background: `linear-gradient(115deg, rgba(255,255,255,${sheen}) 0%, rgba(255,255,255,0) 36%)` }} />
  </>
);

/** Стеклянная панель с кромкой. Для крупных блоков: окна, главные карточки. */
export const GlassPanel = ({ children, radius = "1.4cqw", strong = false, lift = "lg", style, className }: { children: ReactNode; radius?: string | number; strong?: boolean; lift?: "sm" | "lg"; style?: CSSProperties; className?: string }) => (
  <div className={className} style={{ ...glassSurface(radius, { strong, lift }), ...style }}>
    {children}
    <Rim />
  </div>
);

/** Метка-пилюля из стекла: теги, пометки «демо-данные». gold — золотая подсветка. */
export const Pill = ({ children, gold = false, size = "0.7cqw" }: { children: ReactNode; gold?: boolean; size?: string }) => (
  <span style={{ fontFamily: "var(--font-manrope)", fontSize: size, fontWeight: 700, whiteSpace: "nowrap", padding: "0.3em 0.9em", borderRadius: 99,
    color: gold ? "#F1D9A8" : "#FBF3E4", background: gold ? "rgba(227,192,123,.12)" : "rgba(20,16,14,.55)",
    border: `1px solid ${gold ? "rgba(227,192,123,.34)" : "rgba(251,243,228,.18)"}`, boxShadow: "inset 0 1px 0 rgba(255,255,255,.14)",
    backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>{children}</span>
);

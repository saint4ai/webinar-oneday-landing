/** Тема «молоко и какао» — единая с сайтом продукта. Источник: projects/ai_montage_landing/BRAND.md */
export const T = {
  paper: "#FBF8F3",
  soft: "#F4EDE4",
  white: "#FFFFFF",
  ink: "#2A211C",
  muted: "#6E5F53",
  accent: "#8B5E3C",
  gold: "#E3C07B",
  gold2: "#C9A05A",
  line: "rgba(139,94,60,.22)",
  shadow: "0 44px 90px -46px rgba(42,33,28,.4)",
} as const;

export const goldButton: React.CSSProperties = {
  background: `linear-gradient(180deg, ${T.gold}, ${T.gold2})`,
  color: T.ink,
  boxShadow: `0 12px 26px -14px ${T.gold2}`,
};

export const glass: React.CSSProperties = {
  borderRadius: 30,
  background: "linear-gradient(180deg, rgba(255,255,255,.82), rgba(255,255,255,.6))",
  border: "1px solid rgba(255,255,255,.9)",
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
  boxShadow: T.shadow,
};

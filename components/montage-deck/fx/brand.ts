/** Бренд-код сайтов onai.academy (эфир и главная) для объёмных эффектов. Источник: :root в projects/ai_montage_landing/index.html и projects/products_site/index.html */
export const B = {
  paper: "#FFFFFF",
  card: "#FBF3E4",
  ink: "#2A211C",
  muted: "#6E5F53",
  brown: "#A0532A",
  brownLt: "#C08552",
  accent: "#8B5E3C",
  gold: "#E3C07B",
  gold2: "#C9A05A",
  line: "rgba(160,83,42,.20)",
  night: "#14100E",
  night2: "#211A16",
  nightText: "#FBF3E4",
  nightMuted: "rgba(251,243,228,.62)",
  nightLine: "rgba(251,243,228,.16)",
} as const;

export const UNBOUNDED = "var(--font-unbounded), system-ui, sans-serif";
export const MANROPE = "var(--font-manrope), system-ui, sans-serif";

/** Полноэкранные фоны гаснут к зоне камеры: правые 40% кадра остаются чистым фоном. */
export const CAMERA_SAFE_MASK = "linear-gradient(90deg, #000 0%, #000 50%, transparent 59%)";

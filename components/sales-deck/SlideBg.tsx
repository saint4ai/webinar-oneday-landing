"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * SlideBg — система фонов «fintech_aura» (по референсу Александра carousel-15).
 * Слои: базовый градиент (dark/light) + 2 радиальных glow (оранж/лайм, дрейфуют) +
 * сетка hairlines/dots с радиальной маской + угловые скобки-сигнатура.
 *
 * Заменяет плоский «чёрный + один Spotlight». Каждый слайд берёт свой `variant`,
 * чтобы фоны не повторялись. Кладётся в `background` проп SlideLayout (под контент).
 */

type Theme = "dark" | "light";
type GridKind = "lines" | "dots" | "none";

const RGB = { orange: "252,92,2", lime: "182,255,0" } as const;

interface Glow {
  x: string;
  y: string;
  c: keyof typeof RGB;
  /** радиус относительно 1000px */
  s: number;
  a: number;
}

const BASE: Record<Theme, string> = {
  dark: "linear-gradient(165deg, #0A0B0F 0%, #12141B 100%)",
  light: "linear-gradient(165deg, #F4EFE3 0%, #ECE5D2 100%)",
};

const VARIANTS: Record<string, { glows: Glow[]; grid: GridKind }> = {
  // оранж TR + лайм BL (как в референсе) — дефолт «решений»
  "aura-tr": { glows: [{ x: "82%", y: "-12%", c: "orange", s: 1.4, a: 0.18 }, { x: "-8%", y: "112%", c: "lime", s: 1.1, a: 0.11 }], grid: "lines" },
  // зеркально: оранж TL + лайм BR
  "aura-tl": { glows: [{ x: "14%", y: "-12%", c: "orange", s: 1.3, a: 0.16 }, { x: "110%", y: "112%", c: "lime", s: 1.1, a: 0.12 }], grid: "lines" },
  // лайм-доминанта справа, точечная сетка
  "lime-right": { glows: [{ x: "98%", y: "44%", c: "lime", s: 1.25, a: 0.15 }, { x: "-6%", y: "-12%", c: "orange", s: 1.0, a: 0.10 }], grid: "dots" },
  // оранж-доминанта — слайды боли (напряжение)
  "orange-pain": { glows: [{ x: "80%", y: "-10%", c: "orange", s: 1.5, a: 0.24 }, { x: "8%", y: "116%", c: "orange", s: 1.05, a: 0.12 }], grid: "lines" },
  // двойной снизу, точки
  "dual-bottom": { glows: [{ x: "22%", y: "120%", c: "lime", s: 1.35, a: 0.15 }, { x: "92%", y: "108%", c: "orange", s: 1.2, a: 0.15 }], grid: "dots" },
  // климакс — мощные оба
  "climax": { glows: [{ x: "20%", y: "-10%", c: "lime", s: 1.4, a: 0.18 }, { x: "95%", y: "115%", c: "orange", s: 1.5, a: 0.20 }], grid: "lines" },
  // светлая тёплая
  "light-warm": { glows: [{ x: "108%", y: "-8%", c: "orange", s: 1.2, a: 0.11 }, { x: "-8%", y: "114%", c: "lime", s: 1.0, a: 0.10 }], grid: "lines" },
};

function gridStyle(kind: GridKind, theme: Theme): React.CSSProperties | null {
  if (kind === "none") return null;
  const c = theme === "dark" ? "rgba(242,243,247,1)" : "rgba(22,24,28,1)";
  const mask = "radial-gradient(85% 72% at 50% 42%, #000 28%, transparent 92%)";
  if (kind === "lines") {
    return {
      backgroundImage: `linear-gradient(${c} 0 1px, transparent 1px 100%), linear-gradient(90deg, ${c} 0 1px, transparent 1px 100%)`,
      backgroundSize: "74px 74px, 74px 74px",
      opacity: theme === "dark" ? 0.05 : 0.06,
      maskImage: mask,
      WebkitMaskImage: mask,
    };
  }
  return {
    backgroundImage: `radial-gradient(${c} 1.1px, transparent 1.6px)`,
    backgroundSize: "34px 34px",
    opacity: theme === "dark" ? 0.07 : 0.08,
    maskImage: mask,
    WebkitMaskImage: mask,
  };
}

export function SlideBg({
  theme = "dark",
  variant = "aura-tr",
  brackets = true,
}: {
  theme?: Theme;
  variant?: keyof typeof VARIANTS;
  brackets?: boolean;
}) {
  const reduce = useReducedMotion();
  const v = VARIANTS[variant] ?? VARIANTS["aura-tr"];
  const grid = gridStyle(v.grid, theme);
  const bracketColor = theme === "dark" ? "rgba(242,243,247,0.32)" : "rgba(22,24,28,0.3)";

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* база */}
      <div className="absolute inset-0" style={{ background: BASE[theme] }} />

      {/* glow-блобы (дрейфуют) */}
      {v.glows.map((g, i) => (
        <motion.div
          key={i}
          aria-hidden
          className="absolute"
          style={{
            left: g.x,
            top: g.y,
            width: `${g.s * 1100}px`,
            height: `${g.s * 760}px`,
            transform: "translate(-50%,-50%)",
            background: `radial-gradient(ellipse at center, rgba(${RGB[g.c]},${g.a}), transparent 62%)`,
            filter: "blur(6px)",
          }}
          animate={reduce ? undefined : { x: [0, i % 2 ? -26 : 26, 0], y: [0, i % 2 ? 18 : -18, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 16 + i * 4, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* сетка */}
      {grid && <div className="absolute inset-0" style={grid} />}

      {/* угловые скобки */}
      {brackets && (
        <>
          <span className="absolute" style={{ top: 40, left: 40, width: 26, height: 26, borderTop: `1.5px solid ${bracketColor}`, borderLeft: `1.5px solid ${bracketColor}` }} />
          <span className="absolute" style={{ top: 40, right: 40, width: 26, height: 26, borderTop: `1.5px solid ${bracketColor}`, borderRight: `1.5px solid ${bracketColor}` }} />
          <span className="absolute" style={{ bottom: 40, left: 40, width: 26, height: 26, borderBottom: `1.5px solid ${bracketColor}`, borderLeft: `1.5px solid ${bracketColor}` }} />
          <span className="absolute" style={{ bottom: 40, right: 40, width: 26, height: 26, borderBottom: `1.5px solid ${bracketColor}`, borderRight: `1.5px solid ${bracketColor}` }} />
        </>
      )}
    </div>
  );
}

"use client";

import { useReducedMotion } from "framer-motion";

/**
 * «Кто я»: одна изометрическая стопка плит. Сначала она вырастает до суммы from (расходы на монтажёра),
 * потом верхние плиты осыпаются, оставшиеся перекрашиваются в лайм — это сумма to (подписка).
 * На месте прежней высоты остаётся пунктирный контур, прежняя сумма перечёркивается.
 * Масштаб честный: плиты считаются из value («300 000 ₸» и «~50 000 ₸» → 30 и 5).
 */
export type CostSide = { value: string; label: string };

const A = 40, H = 6, GAP = 1.2, STEP_Y = H + GAP; // единицы viewBox
const C = 0.866, S = 0.5;
const iso = (x: number, y: number, z: number) => `${((x - z) * C).toFixed(1)},${((x + z) * S - y).toFixed(1)}`;
const num = (v: string) => Number((v.match(/[\d\s ]*\d/)?.[0] ?? "").replace(/[\s ]/g, "")) || 0;

const ORANGE = { top: "#FC5C02", left: "#B84302", right: "#7A2D01" };
const LIME = { top: "#B6FF00", left: "#8BC400", right: "#5A7F00" };
const FROM_N = 30;
const FALL = 2.1; // с какой секунды осыпается
const mono = "var(--font-jetbrains-mono), monospace";
const sans = "var(--font-inter-tight), system-ui, sans-serif";

function Slab({ i, tone }: { i: number; tone: typeof ORANGE }) {
  const y0 = i * STEP_Y, y1 = y0 + H;
  return (
    <>
      <polygon points={[iso(0, y0, A), iso(A, y0, A), iso(A, y1, A), iso(0, y1, A)].join(" ")} fill={tone.left} />
      <polygon points={[iso(A, y0, 0), iso(A, y0, A), iso(A, y1, A), iso(A, y1, 0)].join(" ")} fill={tone.right} />
      <polygon points={[iso(0, y1, 0), iso(A, y1, 0), iso(A, y1, A), iso(0, y1, A)].join(" ")} fill={tone.top} />
    </>
  );
}

export function CostDrop3D({ from, to }: { from: CostSide; to: CostSide }) {
  const reduce = useReducedMotion();
  const toN = Math.min(FROM_N, Math.max(1, Math.round((FROM_N * num(to.value)) / (num(from.value) || 1))));
  const topY = FROM_N * STEP_Y;
  const ghost = [iso(0, 0, A), iso(0, topY, A), iso(0, topY, 0), iso(A, topY, 0), iso(A, 0, 0), iso(A, 0, A)].join(" ");
  const recolor = FALL + 0.7;

  return (
    <div className="flex items-end" style={{ gap: "3cqw" }}>
      <style>{`
        @keyframes cd-in { from { transform: translateY(-70px); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes cd-fall { to { transform: translate(var(--fx), 170px) rotate(var(--fr)); opacity: 0; } }
        @keyframes cd-show { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cd-dim { to { opacity: .45; } }
        @keyframes cd-strike { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes cd-rise { from { opacity: 0; transform: translateY(1cqw); } to { opacity: 1; transform: none; } }
      `}</style>
      <svg viewBox="-42 -232 84 280" style={{ height: "30cqw", width: "auto", overflow: "visible", display: "block", flex: "none" }} aria-hidden>
        <polygon points={ghost} fill="none" stroke="rgba(252,92,2,.6)" strokeWidth={1} strokeDasharray="4 4"
          style={{ opacity: reduce ? 1 : 0, animation: reduce ? undefined : `cd-show .6s ease-out ${FALL + 0.4}s forwards` }} />
        {Array.from({ length: FROM_N }, (_, i) => {
          const falls = i >= toN;
          if (reduce && falls) return null;
          return (
            <g key={i} style={{
              transformBox: "fill-box", transformOrigin: "center",
              ["--fx" as string]: `${(i % 2 ? 1 : -1) * (18 + ((i * 37) % 55))}px`, ["--fr" as string]: `${(i % 2 ? 1 : -1) * (14 + ((i * 23) % 40))}deg`,
              animation: reduce ? undefined : [`cd-in .45s cubic-bezier(.23,1,.32,1) ${0.2 + i * 0.04}s both`, falls ? `cd-fall .9s cubic-bezier(.55,0,.8,.4) ${FALL + (FROM_N - 1 - i) * 0.025}s forwards` : ""].filter(Boolean).join(", "),
            }}>
              <Slab i={i} tone={ORANGE} />
              {!falls && (
                <g style={{ opacity: reduce ? 1 : 0, animation: reduce ? undefined : `cd-show .5s ease-out ${recolor + i * 0.06}s forwards` }}>
                  <Slab i={i} tone={LIME} />
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <div className="flex flex-col" style={{ gap: "2.4cqw", paddingBottom: "1cqw" }}>
        <div style={{ animation: reduce ? undefined : `cd-dim .5s ease-out ${FALL + 0.6}s forwards` }}>
          <div className="relative inline-block" style={{ fontFamily: mono, fontWeight: 700, fontSize: "2.2cqw", color: "#FC5C02", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
            {from.value}
            <span className="absolute left-0 right-0" style={{
              top: "52%", height: "0.2cqw", background: "#FC5C02", transformOrigin: "left",
              transform: reduce ? "none" : "scaleX(0)", animation: reduce ? undefined : `cd-strike .5s ease-out ${FALL + 0.6}s forwards`,
            }} />
          </div>
          <div style={{ fontFamily: sans, fontSize: "1cqw", color: "#A1A1AA", marginTop: "0.4cqw", whiteSpace: "nowrap" }}>{from.label}</div>
        </div>
        <div style={{ opacity: reduce ? 1 : 0, animation: reduce ? undefined : `cd-rise .6s cubic-bezier(.23,1,.32,1) ${recolor}s forwards` }}>
          <div style={{ fontFamily: mono, fontWeight: 700, fontSize: "3.2cqw", color: "#B6FF00", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{to.value}</div>
          <div style={{ fontFamily: sans, fontSize: "1cqw", color: "#A1A1AA", marginTop: "0.5cqw", whiteSpace: "nowrap" }}>{to.label}</div>
        </div>
      </div>
    </div>
  );
}

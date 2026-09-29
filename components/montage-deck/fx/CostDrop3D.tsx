"use client";

import { useReducedMotion } from "framer-motion";
import { B, MANROPE, UNBOUNDED } from "./brand";

/**
 * «Кто я»: одна изометрическая стопка плит. Сначала она вырастает до суммы from (расходы на монтажёра),
 * плиты коричневые; потом верхние осыпаются, оставшиеся перекрашиваются в золото — это сумма to (подписка).
 * На месте прежней высоты остаётся пунктирный контур, прежняя сумма перечёркивается.
 * Для светлого слайда: суммы Unbounded, итог — золотом на тёмной плашке, как цена на сайте.
 * Масштаб честный: плиты считаются из value («300 000 ₸» и «~50 000 ₸» → 30 и 5).
 */
export type CostSide = { value: string; label: string };

const A = 40, H = 6, GAP = 1.2, STEP_Y = H + GAP; // единицы viewBox
const C = 0.866, S = 0.5;
const iso = (x: number, y: number, z: number) => `${((x - z) * C).toFixed(1)},${((x + z) * S - y).toFixed(1)}`;
const num = (v: string) => Number((v.match(/[\d\s ]*\d/)?.[0] ?? "").replace(/[\s ]/g, "")) || 0;

/** Грани плит — оттенки цветов бренда: цвет, смешанный с тёплым почти-чёрным #2A211C. */
const shade = (hex: string, t: number) => {
  const a = parseInt(hex.slice(1), 16), b = parseInt(B.ink.slice(1), 16);
  const ch = (s: number) => Math.round(((a >> s) & 255) * t + ((b >> s) & 255) * (1 - t));
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
};
const BROWN = { top: B.brownLt, left: B.brown, right: shade(B.brown, 0.72) };
const GOLD = { top: B.gold, left: B.gold2, right: shade(B.gold2, 0.74) };
const FROM_N = 30;
const FALL = 2.1; // с какой секунды осыпается

function Slab({ i, tone }: { i: number; tone: { top: string; left: string; right: string } }) {
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
        @keyframes cd-dim { to { opacity: .55; } }
        @keyframes cd-strike { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes cd-rise { from { opacity: 0; transform: translateY(1cqw); } to { opacity: 1; transform: none; } }
      `}</style>
      <svg viewBox="-42 -232 84 280" style={{ height: "30cqw", width: "auto", overflow: "visible", display: "block", flex: "none" }} aria-hidden>
        <polygon points={ghost} fill="none" stroke={B.brownLt} strokeWidth={1} strokeDasharray="4 4"
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
              <Slab i={i} tone={BROWN} />
              {!falls && (
                <g style={{ opacity: reduce ? 1 : 0, animation: reduce ? undefined : `cd-show .5s ease-out ${recolor + i * 0.06}s forwards` }}>
                  <Slab i={i} tone={GOLD} />
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <div className="flex flex-col" style={{ gap: "2.4cqw", paddingBottom: "1cqw" }}>
        <div style={{ animation: reduce ? undefined : `cd-dim .5s ease-out ${FALL + 0.6}s forwards` }}>
          <div className="relative inline-block" style={{ fontFamily: UNBOUNDED, fontWeight: 700, letterSpacing: "-.03em", fontSize: "2.2cqw", color: B.brown, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
            {from.value}
            <span className="absolute" style={{
              left: "-3%", right: "-3%", top: "50%", height: "0.22cqw", borderRadius: "0.2cqw", background: B.brown, transformOrigin: "left",
              transform: reduce ? "none" : "scaleX(0)", animation: reduce ? undefined : `cd-strike .5s ease-out ${FALL + 0.6}s forwards`,
            }} />
          </div>
          <div style={{ fontFamily: MANROPE, fontWeight: 600, fontSize: "1cqw", color: B.muted, marginTop: "0.5cqw", whiteSpace: "nowrap" }}>{from.label}</div>
        </div>
        <div style={{ opacity: reduce ? 1 : 0, animation: reduce ? undefined : `cd-rise .6s cubic-bezier(.23,1,.32,1) ${recolor}s forwards` }}>
          <div style={{
            display: "inline-block", borderRadius: "1.1cqw", padding: "0.9cqw 1.4cqw 1cqw", background: B.ink, boxShadow: "0 1.6cqw 3cqw -1.6cqw rgba(42,33,28,.6)",
            fontFamily: UNBOUNDED, fontWeight: 700, letterSpacing: "-.03em", fontSize: "3cqw", color: B.gold, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", lineHeight: 1,
          }}>{to.value}</div>
          <div style={{ fontFamily: MANROPE, fontWeight: 600, fontSize: "1cqw", color: B.muted, marginTop: "0.7cqw", whiteSpace: "nowrap" }}>{to.label}</div>
        </div>
      </div>
    </div>
  );
}

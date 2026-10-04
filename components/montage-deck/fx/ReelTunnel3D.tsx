"use client";

import { useReducedMotion } from "framer-motion";
import { B, CAMERA_SAFE_MASK } from "./brand";

/**
 * Обложка и финал: рилсы летят на зрителя из глубины по спирали — тоннель из вертикальных роликов.
 * Только CSS-3D и одна анимация на карточку (transform + opacity), без канваса и без видео:
 * 34 карточки держат 60 кадров на ноутбуке ведущего.
 * Ось тоннеля — на 44% ширины: слева остаётся спокойное тёмное поле под заголовок обложки.
 * Всё гаснет к 59%: правые 40% кадра — зона камеры, там только ночной фон.
 */
export type Reel = { poster: string; video?: string };

const CARDS = 34;
const LOOP = 18; // секунд на пролёт одной карточки
const RINGS = [8, 12, 16, 20]; // радиусы орбит, cqw — облако помещается в левые 60%
const AXIS = "44%"; // ось тоннеля по ширине кадра

export function ReelTunnel3D({ reels }: { reels: Reel[] }) {
  const reduce = useReducedMotion();
  if (reels.length === 0) return null;
  const cards = Array.from({ length: CARDS }, (_, i) => {
    const angle = (i * 137.5) % 360; // золотой угол — карточки не выстраиваются в столбы
    const r = RINGS[i % RINGS.length];
    const rad = (angle * Math.PI) / 180;
    // Округление: сервер и браузер расходятся в последнем знаке Math.sin/cos → ошибка гидрации на обложке
    const r3 = (v: number) => Math.round(v * 1000) / 1000;
    return {
      reel: reels[i % reels.length],
      x: r3(Math.cos(rad) * r),
      y: r3(Math.sin(rad) * r * 0.62), // эллипс: кадр шире, чем выше
      ry: r3(-Math.cos(rad) * 28), // карточка чуть развёрнута к оси — видна толщина тоннеля
      delay: r3(-(i * LOOP) / CARDS),
    };
  });

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden style={{ background: B.night }}>
      <div className="absolute inset-0" style={{ WebkitMaskImage: CAMERA_SAFE_MASK, maskImage: CAMERA_SAFE_MASK }}>
      <style>{`
        @keyframes rt-fly {
          0%   { transform: translate3d(var(--x), var(--y), -260cqw) rotateY(var(--ry)); opacity: 0; }
          12%  { opacity: 1; }
          82%  { opacity: 1; }
          100% { transform: translate3d(var(--x), var(--y), 70cqw) rotateY(var(--ry)); opacity: 0; }
        }
        @keyframes rt-spin { to { transform: rotateZ(360deg); } }
        @keyframes rt-pulse { 0%, 100% { opacity: .55; } 50% { opacity: .9; } }
      `}</style>

      {/* Свет в конце тоннеля */}
      <div className="absolute" style={{
        left: AXIS, top: "50%", width: "40cqw", height: "40cqw", transform: "translate(-50%, -50%)",
        background: "radial-gradient(closest-side, rgba(227,192,123,.30), rgba(227,192,123,.07) 55%, transparent 75%)",
        animation: reduce ? undefined : "rt-pulse 5s ease-in-out infinite",
      }} />

      <div className="absolute inset-0" style={{ perspective: "70cqw", perspectiveOrigin: `${AXIS} 50%` }}>
        <div className="absolute" style={{
          left: AXIS, top: "50%", transformStyle: "preserve-3d",
          animation: reduce ? undefined : "rt-spin 90s linear infinite",
        }}>
          {cards.map((c, i) => (
            <div key={i} className="absolute" style={{
              width: "7.2cqw", aspectRatio: "9 / 16", marginLeft: "-3.6cqw", marginTop: "-6.4cqw",
              ["--x" as string]: `${c.x}cqw`, ["--y" as string]: `${c.y}cqw`, ["--ry" as string]: `${c.ry}deg`,
              transform: reduce ? `translate3d(${c.x}cqw, ${c.y}cqw, ${-20 - i * 9}cqw) rotateY(${c.ry}deg)` : undefined,
              animation: reduce ? undefined : `rt-fly ${LOOP}s linear ${c.delay}s infinite`,
              borderRadius: "0.7cqw", overflow: "hidden", willChange: "transform, opacity",
              boxShadow: `0 0 0 1px ${B.nightLine}, 0 1.2cqw 3cqw rgba(0,0,0,.55)`,
              background: B.night2,
            }}>
              <img src={c.reel.poster} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              {/* Блик по стеклу карточки */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(155deg, rgba(255,255,255,.22), transparent 38%)" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Затемнение слева под заголовок и по краям — текст на обложке стоит на спокойном тёмном поле */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(90deg, ${B.night} 0%, ${B.night}F2 20%, ${B.night}B3 30%, ${B.night}40 38%, transparent 44%), radial-gradient(90% 90% at ${AXIS} 50%, transparent 50%, ${B.night}D9 100%)`,
      }} />
      </div>
    </div>
  );
}

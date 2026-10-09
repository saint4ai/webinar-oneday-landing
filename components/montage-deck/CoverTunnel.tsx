"use client";

import { useReducedMotion } from "framer-motion";
import { B, CAMERA_SAFE_MASK } from "./fx/brand";
import { SlideVideo } from "./SlideVideo";

/**
 * Тоннель обложки (правка Александра 05.10.2026): на зрителя летят его свежие скрины рилсов со счётчиками
 * просмотров, через одну карточку — видео залетевшего рилса. Механика та же, что у fx/ReelTunnel3D
 * (общий эффект в fx/ не трогаем): CSS-3D, одна анимация на карточку. Видео — петли 4 с 360×640 без звука,
 * чтобы 17 роликов держали 60 кадров на ноутбуке ведущего. Всё гаснет к 59%: правые 40% — зона камеры.
 */
export type CoverCard = { poster: string; video?: string };

const CARDS = 34;
const LOOP = 18; // секунд на пролёт одной карточки
const RINGS = [8, 12, 16, 20]; // радиусы орбит, cqw
const AXIS = "44%"; // ось тоннеля по ширине кадра

export function CoverTunnel({ cards: items }: { cards: CoverCard[] }) {
  const reduce = useReducedMotion();
  if (items.length === 0) return null;
  const cards = Array.from({ length: CARDS }, (_, i) => {
    const angle = (i * 137.5) % 360;
    const r = RINGS[i % RINGS.length];
    const rad = (angle * Math.PI) / 180;
    const r3 = (v: number) => Math.round(v * 1000) / 1000;
    return {
      item: items[i % items.length],
      x: r3(Math.cos(rad) * r),
      y: r3(Math.sin(rad) * r * 0.62),
      ry: r3(-Math.cos(rad) * 28),
      delay: r3(-(i * LOOP) / CARDS),
    };
  });

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden style={{ background: B.night }}>
      <div className="absolute inset-0" style={{ WebkitMaskImage: CAMERA_SAFE_MASK, maskImage: CAMERA_SAFE_MASK }}>
      <style>{`
        @keyframes ct-fly {
          0%   { transform: translate3d(var(--x), var(--y), -260cqw) rotateY(var(--ry)); opacity: 0; }
          12%  { opacity: 1; }
          82%  { opacity: 1; }
          100% { transform: translate3d(var(--x), var(--y), 70cqw) rotateY(var(--ry)); opacity: 0; }
        }
        @keyframes ct-spin { to { transform: rotateZ(360deg); } }
        @keyframes ct-pulse { 0%, 100% { opacity: .55; } 50% { opacity: .9; } }
      `}</style>

      <div className="absolute" style={{
        left: AXIS, top: "50%", width: "40cqw", height: "40cqw", transform: "translate(-50%, -50%)",
        background: "radial-gradient(closest-side, rgba(227,192,123,.30), rgba(227,192,123,.07) 55%, transparent 75%)",
        animation: reduce ? undefined : "ct-pulse 5s ease-in-out infinite",
      }} />

      <div className="absolute inset-0" style={{ perspective: "70cqw", perspectiveOrigin: `${AXIS} 50%` }}>
        <div className="absolute" style={{
          left: AXIS, top: "50%", transformStyle: "preserve-3d",
          animation: reduce ? undefined : "ct-spin 90s linear infinite",
        }}>
          {cards.map((c, i) => (
            <div key={i} className="absolute" style={{
              width: "7.2cqw", aspectRatio: "9 / 16", marginLeft: "-3.6cqw", marginTop: "-6.4cqw",
              ["--x" as string]: `${c.x}cqw`, ["--y" as string]: `${c.y}cqw`, ["--ry" as string]: `${c.ry}deg`,
              transform: reduce ? `translate3d(${c.x}cqw, ${c.y}cqw, ${-20 - i * 9}cqw) rotateY(${c.ry}deg)` : undefined,
              animation: reduce ? undefined : `ct-fly ${LOOP}s linear ${c.delay}s infinite`,
              borderRadius: "0.7cqw", overflow: "hidden", willChange: "transform, opacity",
              boxShadow: `0 0 0 1px ${B.nightLine}, 0 1.2cqw 3cqw rgba(0,0,0,.55)`,
              background: B.night2,
            }}>
              {c.item.video ? (
                <SlideVideo src={c.item.video} poster={c.item.poster} muted autoPlay loop playsInline preload="auto"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <img src={c.item.poster} alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(155deg, rgba(255,255,255,.22), transparent 38%)" }} />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-0" style={{
        background: `linear-gradient(90deg, ${B.night} 0%, ${B.night}F2 20%, ${B.night}B3 30%, ${B.night}40 38%, transparent 44%), radial-gradient(90% 90% at ${AXIS} 50%, transparent 50%, ${B.night}D9 100%)`,
      }} />
      </div>
    </div>
  );
}

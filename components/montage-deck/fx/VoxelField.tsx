"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { B, CAMERA_SAFE_MASK } from "./brand";

/**
 * Фон глав: изометрическое поле столбиков на ночном фоне сайта, по нему катится волна.
 * Высокие столбики на гребне подсвечиваются золотом — поле «дышит» под заголовком главы.
 * Canvas 2D, ~700 столбиков, рисуются от дальних к ближним. Размер берётся с родителя.
 * Поле гаснет к 59% ширины: правые 40% кадра — зона камеры, там только ночной фон.
 */
const N = 26; // столбиков по стороне
const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255] as const;
};
const hexA = (hex: string, a: number) => `rgba(${rgb(hex).join(", ")}, ${a})`;
/** Смесь двух цветов бренда: грани столбиков — оттенки ночного фона, без чужих цветов. */
const mixA = (a: string, b: string, t: number, alpha: number) => {
  const x = rgb(a), y = rgb(b);
  return `rgba(${x.map((v, i) => Math.round(v * t + y[i] * (1 - t))).join(", ")}, ${alpha})`;
};

export function VoxelField({ accent = B.gold }: { accent?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let w = 0, h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const tile = w / 30; // полуширина ромба
      const ox = w * 0.34, oy = h * 0.3; // вершина поля — в левой части кадра
      const maxH = tile * 3.2;
      // волна идёт из угла поля по диагонали + вторая, медленная, поперёк
      for (let s = 0; s <= 2 * (N - 1); s++) {
        for (let i = 0; i < N; i++) {
          const j = s - i;
          if (j < 0 || j >= N) continue;
          const d = Math.hypot(i - N * 0.3, j - N * 0.3);
          const wave = Math.sin(d * 0.55 - t * 1.6) * 0.5 + 0.5;
          const swell = Math.sin((i - j) * 0.25 + t * 0.7) * 0.5 + 0.5;
          const k = Math.pow(wave * 0.75 + swell * 0.25, 2.2);
          const colH = tile * 0.25 + k * maxH;
          const x = ox + (i - j) * tile;
          const y = oy + (i + j) * tile * 0.5;
          // затухание к краям — поле растворяется в фоне
          const edge = Math.min(i, j, N - 1 - i, N - 1 - j) / (N * 0.22);
          const fade = Math.min(1, edge) * (0.35 + 0.65 * (1 - (i + j) / (2 * N)));
          if (fade <= 0.02) continue;
          const top = y - colH;
          // левая грань — второй слой ночи, правая — между ночью и вторым слоем
          ctx.fillStyle = mixA(B.night2, B.brown, 0.9, fade);
          ctx.beginPath(); ctx.moveTo(x - tile, top + tile * 0.5); ctx.lineTo(x, top + tile); ctx.lineTo(x, y + tile); ctx.lineTo(x - tile, y + tile * 0.5); ctx.fill();
          ctx.fillStyle = mixA(B.night2, B.night, 0.35, fade);
          ctx.beginPath(); ctx.moveTo(x + tile, top + tile * 0.5); ctx.lineTo(x, top + tile); ctx.lineTo(x, y + tile); ctx.lineTo(x + tile, y + tile * 0.5); ctx.fill();
          // крышка: тёплая тёмная внизу волны, золото на гребне
          ctx.fillStyle = k > 0.5 ? hexA(accent, fade * Math.min(0.95, 0.22 + (k - 0.5) * 1.6)) : mixA(B.night2, B.brown, 0.8, fade);
          ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + tile, top + tile * 0.5); ctx.lineTo(x, top + tile); ctx.lineTo(x - tile, top + tile * 0.5); ctx.fill();
          ctx.strokeStyle = hexA(accent, fade * (0.08 + k * 0.3));
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    };

    if (reduce) draw(1.2);
    else {
      const start = performance.now();
      const loop = (now: number) => { draw((now - start) / 1000); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [accent, reduce]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden style={{ background: B.night }}>
      <div className="absolute inset-0" style={{ WebkitMaskImage: CAMERA_SAFE_MASK, maskImage: CAMERA_SAFE_MASK }}>
        <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />
        {/* Виньетка в цвет ночи: поле уходит в фон к краям и под заголовком слева */}
        <div className="absolute inset-0" style={{
          background: `linear-gradient(90deg, ${B.night}B3 0%, ${B.night}40 22%, transparent 38%), radial-gradient(95% 75% at 36% 60%, transparent 45%, ${B.night}E0 100%)`,
        }} />
      </div>
    </div>
  );
}

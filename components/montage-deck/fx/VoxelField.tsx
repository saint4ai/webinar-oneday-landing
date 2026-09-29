"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Фон глав: изометрическое поле столбиков, по нему катится волна.
 * Высокие столбики на гребне подсвечиваются акцентом — поле «дышит» под заголовком главы.
 * Canvas 2D, ~700 столбиков, рисуются от дальних к ближним. Размер берётся с родителя.
 */
const N = 26; // столбиков по стороне
const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

export function VoxelField({ accent = "#B6FF00" }: { accent?: string }) {
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
      const ox = w * 0.42, oy = h * 0.4; // вершина поля
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
          // левая грань
          ctx.fillStyle = `rgba(22, 24, 20, ${fade})`;
          ctx.beginPath(); ctx.moveTo(x - tile, top + tile * 0.5); ctx.lineTo(x, top + tile); ctx.lineTo(x, y + tile); ctx.lineTo(x - tile, y + tile * 0.5); ctx.fill();
          // правая грань
          ctx.fillStyle = `rgba(12, 13, 11, ${fade})`;
          ctx.beginPath(); ctx.moveTo(x + tile, top + tile * 0.5); ctx.lineTo(x, top + tile); ctx.lineTo(x, y + tile); ctx.lineTo(x + tile, y + tile * 0.5); ctx.fill();
          // крышка: тёмная внизу волны, акцент на гребне
          ctx.fillStyle = k > 0.55 ? hexA(accent, fade * (0.16 + (k - 0.55) * 1.1)) : `rgba(34, 36, 30, ${fade})`;
          ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + tile, top + tile * 0.5); ctx.lineTo(x, top + tile); ctx.lineTo(x - tile, top + tile * 0.5); ctx.fill();
          ctx.strokeStyle = hexA(accent, fade * (0.06 + k * 0.22));
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
    <div className="absolute inset-0 overflow-hidden" aria-hidden style={{ background: "#050505" }}>
      <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block", opacity: 0.9 }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(90% 70% at 42% 60%, transparent 40%, rgba(5,5,5,.9) 100%)" }} />
    </div>
  );
}

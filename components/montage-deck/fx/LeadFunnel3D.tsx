"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { B, MANROPE, UNBOUNDED } from "./brand";

/**
 * Урок 3: объёмная воронка из колец для ночного слайда. Сверху сыплются просмотры-частицы (#FBF3E4)
 * и крутятся по спирали вниз; на каждом кольце часть отваливается наружу и гаснет, до нижнего кольца
 * доходит горстка — заявки, они золотые. Кольца золотом, Canvas 2D; подписи ступеней — обычный текст
 * справа от колец: цифры Unbounded, подписи Manrope. Занимает весь родитель.
 */
export type FunnelStage = { label: string; value: string };

const rgb = (hex: string) => { const n = parseInt(hex.slice(1), 16); return `${n >> 16}, ${(n >> 8) & 255}, ${n & 255}`; };
const ACCENT = rgb(B.gold);
const DOT = rgb(B.nightText);
const KEEP = [0.5, 0.42, 0.34]; // доля частиц, прошедших кольцо 2, 3, 4
const TOP = 0.1, BOTTOM = 0.84, CX = 0.34, R0 = 0.28, TILT = 0.26;

type P = { a: number; y: number; stage: number; out: number; w: number };

const ringY = (k: number, n: number) => TOP + ((BOTTOM - TOP) * k) / (n - 1);
const ringR = (k: number, n: number) => R0 * (1 - (0.72 * k) / (n - 1));

export function LeadFunnel3D({ stages }: { stages: FunnelStage[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const n = Math.max(2, stages.length);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let w = 0, h = 0, raf = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    const ps: P[] = [];
    // радиус воронки на высоте y (доля высоты) — между соседними кольцами линейно
    const radiusAt = (y: number) => {
      const f = Math.min(Math.max((y - TOP) / (BOTTOM - TOP), 0), 1) * (n - 1);
      const k = Math.min(Math.floor(f), n - 2);
      const r1 = ringR(k, n), r2 = ringR(k + 1, n);
      return r1 + (r2 - r1) * (f - k);
    };
    const ellipse = (k: number, alpha: number, half: "back" | "front") => {
      const r = ringR(k, n) * w, y = ringY(k, n) * h;
      ctx.beginPath();
      ctx.ellipse(CX * w, y, r, r * TILT, 0, half === "back" ? Math.PI : 0, half === "back" ? 2 * Math.PI : Math.PI);
      ctx.strokeStyle = `rgba(${ACCENT}, ${alpha})`;
      ctx.lineWidth = half === "front" ? 2 : 1;
      ctx.stroke();
    };
    const drawP = (p: P, front: boolean) => {
      const r = radiusAt(p.y) * w * (1 + p.out * 0.9);
      const depth = Math.sin(p.a); // >0 — ближняя половина кольца
      if ((depth > 0) !== front) return;
      const x = CX * w + Math.cos(p.a) * r;
      const y = p.y * h + depth * r * TILT + p.out * h * 0.05;
      const fade = 1 - p.out;
      const last = p.stage >= n - 1;
      const size = (last ? 2.6 : 1.7) * (0.75 + 0.25 * (depth + 1)) * (w / 900);
      ctx.fillStyle = last ? `rgba(${ACCENT}, ${0.95 * fade})` : `rgba(${DOT}, ${(0.35 + 0.45 * (depth + 1) / 2) * fade})`;
      ctx.beginPath(); ctx.arc(x, y, Math.max(size, 1), 0, Math.PI * 2); ctx.fill();
    };

    let last = performance.now(), acc = 0;
    const step = (now: number, dt: number) => {
      acc += dt * 38; // частиц в секунду
      while (acc >= 1) { acc -= 1; ps.push({ a: Math.random() * Math.PI * 2, y: TOP - 0.02, stage: 0, out: 0, w: 1.6 + Math.random() * 1.2 }); }
      for (const p of ps) {
        if (p.out > 0) { p.out += dt * 1.3; continue; }
        const before = p.y;
        p.y += dt * 0.11;
        p.a += dt * p.w;
        for (let k = 1; k < n; k++) {
          const ry = ringY(k, n);
          if (before < ry && p.y >= ry) {
            if (Math.random() > (KEEP[k - 1] ?? 0.4)) p.out = 0.001; else p.stage = k;
          }
        }
      }
      for (let i = ps.length - 1; i >= 0; i--) if (ps[i].out >= 1 || ps[i].y > BOTTOM + 0.035) ps.splice(i, 1);

      ctx.clearRect(0, 0, w, h);
      // свечение на дне — там рождаются заявки
      const pulse = 0.55 + 0.25 * Math.sin(now / 420);
      const g = ctx.createRadialGradient(CX * w, BOTTOM * h, 0, CX * w, BOTTOM * h, w * 0.16);
      g.addColorStop(0, `rgba(${ACCENT}, ${0.42 * pulse})`); g.addColorStop(1, `rgba(${ACCENT}, 0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      for (let k = 0; k < n; k++) ellipse(k, 0.18 + 0.1 * k, "back");
      for (const p of ps) drawP(p, false);
      // стенки воронки
      ctx.strokeStyle = `rgba(${ACCENT}, 0.16)`; ctx.lineWidth = 1;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        for (let k = 0; k < n; k++) { const x = CX * w + side * ringR(k, n) * w, y = ringY(k, n) * h; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.stroke();
      }
      for (const p of ps) drawP(p, true);
      for (let k = 0; k < n; k++) ellipse(k, 0.45 + 0.15 * k, "front");
    };

    if (reduce) {
      for (let i = 0; i < 400; i++) step(0, 1 / 30);
    } else {
      // прогрев: воронка уже полная в момент показа слайда
      for (let i = 0; i < 240; i++) step(0, 1 / 30);
      // не чаще ~60 кадров в секунду: движение считается по dt, на экранах 120 Гц результат тот же, работа вдвое меньше
      const loop = (now: number) => { raf = requestAnimationFrame(loop); if (now - last < 14) return; const dt = Math.min((now - last) / 1000, 0.05); last = now; step(now, dt); };
      raf = requestAnimationFrame(loop);
    }
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [n, reduce]);

  return (
    <div className="relative h-full w-full" style={{ minHeight: "30cqw" }}>
      <canvas ref={ref} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {stages.map((s, k) => {
        const lastStage = k === stages.length - 1;
        return (
          <motion.div key={s.label} className="absolute"
            initial={reduce ? false : { opacity: 0, x: "1.5cqw", y: "-50%" }} animate={{ opacity: 1, x: "0cqw", y: "-50%" }}
            transition={{ delay: 0.3 + k * 0.25, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            style={{ left: `${(CX + ringR(k, n) + 0.04) * 100}%`, top: `${ringY(k, n) * 100}%`, lineHeight: 1.1 }}>
            <div style={{ fontFamily: UNBOUNDED, fontWeight: 700, letterSpacing: "-.03em", fontSize: lastStage ? "2.6cqw" : "1.8cqw", color: lastStage ? B.gold : B.nightText, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{s.value}</div>
            <div style={{ fontFamily: MANROPE, fontWeight: 600, fontSize: "0.95cqw", color: B.nightMuted, marginTop: "0.35cqw", whiteSpace: "nowrap" }}>{s.label}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

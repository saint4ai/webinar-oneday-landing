"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Application, SPEObject } from "@splinetool/runtime";
import { Spotlight } from "../Spotlight";
import { SplineScene } from "../SplineScene";

const ROBOT_SCENE = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

// Зум камеры. Подобрать через DevTools: __spline.setZoom(N)
const ROBOT_ZOOM = 2.0;
// Имена объекта головы — robot rig в сцене kZDDjO5HuC9GJUM2 называет голову "Head".
const HEAD_NAMES = ["Head", "Head 2", "head"];
// Лимиты поворота головы при mouse-tracking. ±22.5° yaw, ±11.25° pitch.
const MAX_YAW = Math.PI / 4;
const MAX_PITCH = Math.PI / 8;

/**
 * Slide 1.1 · Cold Open
 * 3D-робот в большом контейнере (правая рука уходит за экран),
 * текст слева сверху, голова робота следит за мышкой.
 */
export function Slide_01_ColdOpen() {
  const headRef = useRef<SPEObject | null>(null);
  const headInitRotRef = useRef<{ x: number; y: number; z: number } | null>(null);

  const handleSplineLoad = useCallback((app: Application) => {
    try {
      app.setZoom(ROBOT_ZOOM);
    } catch (e) {
      console.warn("[Slide_01] setZoom failed:", e);
    }

    // Найти голову для mouse-tracking.
    let head: SPEObject | undefined;
    for (const name of HEAD_NAMES) {
      const found = app.findObjectByName(name);
      if (found) {
        head = found;
        break;
      }
    }
    if (head) {
      headRef.current = head;
      headInitRotRef.current = { x: head.rotation.x, y: head.rotation.y, z: head.rotation.z };
    }

    // Debug-хук — подбор zoom без перезагрузки: __spline.setZoom(N)
    (window as unknown as { __spline?: Application }).__spline = app;
  }, []);

  // Mouse-tracking: голова за курсором. rAF-throttle.
  useEffect(() => {
    let rafId: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const update = () => {
      rafId = null;
      const head = headRef.current;
      const init = headInitRotRef.current;
      if (!head || !init) return;
      const nx = lastX / window.innerWidth - 0.5;
      const ny = lastY / window.innerHeight - 0.5;
      head.rotation.y = init.y + nx * MAX_YAW;
      head.rotation.x = init.x + ny * MAX_PITCH;
    };

    const onMove = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (rafId === null) rafId = requestAnimationFrame(update);
    };

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      <Spotlight className="-top-40 right-0 md:right-20 md:-top-20" fill="#B6FF00" />

      {/* === 3D-РОБОТ · контейнер 110vw / right:-30vw — правая рука уходит за экран === */}
      <div
        className="pointer-events-auto absolute top-0 bottom-0 z-[2]"
        style={{ width: "110vw", right: "-30vw" }}
      >
        <SplineScene scene={ROBOT_SCENE} className="w-full h-full" onLoad={handleSplineLoad} />
      </div>

      {/* === Текст · pointer-events: none → мышь проходит на canvas → голова следит === */}
      <div
        className="pointer-events-none relative z-10 h-full flex flex-col justify-center"
        style={{
          paddingLeft: "calc(var(--sd-speaker-zone, 30vw) + 48px)",
          paddingRight: "48px",
        }}
      >
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00]"
          >
            // БЕЗ ПРЕЛЮДИЙ
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase text-white leading-[1.0] tracking-[-0.04em]"
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(40px, 4.5vw, 84px)",
            }}
          >
            ЗА 12 МЕСЯЦЕВ —
            <br />
            <span className="bg-[#B6FF00] text-black px-[0.12em] py-[0.02em] rounded-[0.1em]">
              3 SaaS в проде
            </span>
            <br />
            БЕЗ ПРОГРАММИСТОВ
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="font-mono text-sm text-white/55 mt-4"
          >
            100+ платящих клиентов · собрано одним человеком
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="text-white text-base md:text-lg leading-relaxed mt-2"
          >
            Через 75 минут ты поймёшь{" "}
            <span className="text-[#B6FF00] font-semibold">как</span> — и почему это
            повторимо для тебя.
          </motion.div>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 180 }}
            transition={{ duration: 0.7, delay: 1.3, ease: [0.25, 1, 0.5, 1] }}
            className="h-[2px] bg-[#B6FF00] mt-3"
          />
        </div>
      </div>
    </section>
  );
}

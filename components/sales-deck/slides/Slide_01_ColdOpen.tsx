"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Application, SPEObject } from "@splinetool/runtime";
import { Spotlight } from "../Spotlight";
import { SplineScene } from "../SplineScene";

const ROBOT_SCENE = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

// Зум камеры. Подобрать через DevTools: __spline.setZoom(N)
const ROBOT_ZOOM = 2.0;
// Имена объекта головы — robot rig в сцене называет голову "Head".
const HEAD_NAMES = ["Head", "Head 2", "head"];
// Лимиты поворота головы при mouse-tracking. ±22.5° yaw, ±11.25° pitch.
const MAX_YAW = Math.PI / 4;
const MAX_PITCH = Math.PI / 8;

/**
 * Slide 1.1 · Cold Open
 * 3D-робот в большом контейнере (правая рука за экраном),
 * текст слева сверху, голова робота следит за курсором.
 */
export function Slide_01_ColdOpen() {
  const headRef = useRef<SPEObject | null>(null);
  const headInitRotRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const targetYawRef = useRef(0);
  const targetPitchRef = useRef(0);

  const handleSplineLoad = useCallback((app: Application) => {
    try {
      app.setZoom(ROBOT_ZOOM);
    } catch (e) {
      console.warn("[Slide_01] setZoom failed:", e);
    }

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

    (window as unknown as { __spline?: Application }).__spline = app;
  }, []);

  // Mouse-tracking: каждый кадр пишем rotation поверх Spline animation loop'а
  // (иначе Spline перезаписывает наше значение на следующем тике и голова не двигается).
  useEffect(() => {
    let rafId = 0;
    let running = true;

    const onMove = (e: MouseEvent) => {
      targetYawRef.current = (e.clientX / window.innerWidth - 0.5) * MAX_YAW;
      targetPitchRef.current = (e.clientY / window.innerHeight - 0.5) * MAX_PITCH;
    };

    const tick = () => {
      if (!running) return;
      const head = headRef.current;
      const init = headInitRotRef.current;
      if (head && init) {
        head.rotation.y = init.y + targetYawRef.current;
        head.rotation.x = init.x + targetPitchRef.current;
      }
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    rafId = requestAnimationFrame(tick);
    return () => {
      running = false;
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      <Spotlight className="-top-40 right-0 md:right-20 md:-top-20" fill="#B6FF00" />

      {/* === 3D-РОБОТ · контейнер 110vw / right:-40vw — правая рука за экраном === */}
      <div
        className="pointer-events-auto absolute top-0 bottom-0 z-[2]"
        style={{ width: "110vw", right: "-40vw" }}
      >
        <SplineScene scene={ROBOT_SCENE} className="w-full h-full" onLoad={handleSplineLoad} />
      </div>

      {/* === Текст · pointer-events: none → мышь проходит на canvas === */}
      <div
        className="pointer-events-none relative z-10 h-full flex flex-col justify-center"
        style={{
          paddingLeft: "calc(var(--sd-speaker-zone, 30vw) + 48px)",
          paddingRight: "48px",
        }}
      >
        <div className="flex flex-col gap-6 max-w-[820px]">
          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase text-white leading-[1.0] tracking-[-0.04em]"
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(40px, 4.5vw, 84px)",
            }}
          >
            СОБЕРИ{" "}
            <span className="bg-[#B6FF00] text-black px-[0.12em] py-[0.02em] rounded-[0.1em]">
              AI-сервис
            </span>
            <br />
            ЗА ОДИН ДЕНЬ —
            <br />
            БЕЗ КОДА И КОМАНДЫ
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-white text-base md:text-lg leading-relaxed mt-2"
          >
            На этом воркшопе ты поймёшь, как и почему это работает — и{" "}
            <span className="text-[#B6FF00] font-semibold">как повторить</span> это для
            себя.
          </motion.div>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 180 }}
            transition={{ duration: 0.7, delay: 1.0, ease: [0.25, 1, 0.5, 1] }}
            className="h-[2px] bg-[#B6FF00] mt-3"
          />
        </div>
      </div>
    </section>
  );
}

"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Application, SPEObject } from "@splinetool/runtime";
import { Spotlight } from "../Spotlight";
import { SplineScene } from "../SplineScene";
import { SlideLayout } from "../SlideLayout";

const ROBOT_SCENE = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

// Зум камеры подобран так, чтобы робот занимал левую часть и рука выходила в правую.
const ROBOT_ZOOM = 3.0;
const HEAD_NAMES = ["Head", "Head 2", "head"];
const MAX_YAW = Math.PI / 4;
const MAX_PITCH = Math.PI / 8;
const MOUSE_SENSITIVITY = 2.0;

/**
 * Slide 1 · Cold Open — «СТАНЬ АРХИТЕКТОРОМ»
 * Робот в background (absolute, 110vw, left:-40vw) — корпус частично за левым краем,
 * рука выходит в правую часть слайда и проходит ЗА полупрозрачным текстом.
 * Текст без подкладки — фон полностью прозрачный.
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

  useEffect(() => {
    let rafId = 0;
    let running = true;
    const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * MOUSE_SENSITIVITY;
      const ny = (e.clientY / window.innerHeight - 0.5) * MOUSE_SENSITIVITY;
      targetYawRef.current = clamp(nx, 0.5) * MAX_YAW;
      targetPitchRef.current = clamp(ny, 0.5) * MAX_PITCH;
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
    <SlideLayout
      speakerSide="right"
      contentClassName="items-stretch text-left"
      background={
        <>
          <Spotlight className="-top-40 right-0 md:right-20 md:-top-20" fill="#B6FF00" />
          {/* Робот absolute — сдвинут далеко влево (left:-80vw),
              видна только правая половина (от плеча и правее), рука вытянута через весь слайд.
              Canvas всё равно занимает всю горизонталь (right edge 80vw, 80vw → +60vw = 100vw покрытия). */}
          <div
            className="absolute top-0 bottom-0"
            style={{ width: "180vw", left: "-80vw", zIndex: 2, pointerEvents: "none" }}
          >
            <SplineScene scene={ROBOT_SCENE} className="w-full h-full" onLoad={handleSplineLoad} />
          </div>
        </>
      }
    >
      {/* Отступ в vw — пропорционален роботу на любой ширине: на широком
          экране (1920) текст уходит правее руки, на 1440 остаётся near робота.
          Без него текст-колонка стартует с X=0 и налезает на робота. */}
      <div style={{ paddingLeft: "clamp(0px, 18vw, 420px)" }}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-5 pointer-events-none"
      >
        // ВОРКШОП
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.05] tracking-[-0.03em] pointer-events-none"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(22px, 2.4vw, 42px)",
          maxWidth: "min(820px, 46vw)",
        }}
      >
        СТАНЬ <span className="text-[#B6FF00]">АРХИТЕКТОРОМ</span><br />
        СВОЕГО IT-РЕШЕНИЯ.
        <br />
        <span className="text-white/80">
          ОДИН ДЕНЬ — ОТ ИДЕИ<br />
          ДО РАБОЧЕГО ПРИЛОЖЕНИЯ.
        </span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="text-white text-sm md:text-base leading-snug mt-6 pointer-events-none"
      >
        Свой сервис <span className="text-[#B6FF00] font-semibold">плюс</span> автоматизация{" "}
        <span className="text-[#B6FF00] font-semibold">70%</span> твоей рабочей рутины.
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.05 }}
        className="text-white/65 text-xs md:text-sm leading-relaxed mt-2 pointer-events-none"
      >
        Без программистов. С AI как программистом.
      </motion.div>

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 180 }}
        transition={{ duration: 0.7, delay: 1.25, ease: [0.25, 1, 0.5, 1] }}
        className="h-[2px] bg-[#B6FF00] mt-5"
      />
      </div>
    </SlideLayout>
  );
}

"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SlideDeckProps {
  slides: React.ReactNode[];
  /** Ключи слайдов на светлом (cream) фоне — для них счётчик красится тёмным, иначе сливается. */
  lightSlideKeys?: Set<string>;
}

/**
 * SlideDeck — оркестратор слайдов: keyboard navigation, speaker-zone toggle,
 * indicators, transitions через AnimatePresence.
 *
 * Управление:
 *   ← → / SPACE — навигация
 *   F — fullscreen
 *   S — toggle speaker-zone (30cqw ↔ 0)
 *   Home / End — в начало/конец
 *   Esc — выход из fullscreen
 */
export function SlideDeck({ slides, lightSlideKeys }: SlideDeckProps) {
  const [idx, setIdx] = useState(0);
  const [speakerMode, setSpeakerMode] = useState<"live" | "preview">("live");

  // Cursor-glow — radial-gradient следующий за мышкой.
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let rafId: number | null = null;
    let pendingX = 0;
    let pendingY = 0;

    const flushCursor = () => {
      rafId = null;
      setCursor({ x: pendingX, y: pendingY });
    };

    const onMove = (e: MouseEvent) => {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (rafId === null) rafId = requestAnimationFrame(flushCursor);
    };

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // Restore speaker mode
  useEffect(() => {
    const saved = localStorage.getItem("sd-speaker") as "live" | "preview" | null;
    if (saved) setSpeakerMode(saved);
  }, []);

  // Apply speaker-zone CSS var on root
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sd-speaker-zone",
      speakerMode === "live" ? "40cqw" : "0cqw"
    );
    localStorage.setItem("sd-speaker", speakerMode);
  }, [speakerMode]);

  const go = useCallback(
    (i: number) => {
      if (i < 0 || i >= slides.length) return;
      setIdx(i);
      history.replaceState(null, "", `#${i + 1}`);
    },
    [slides.length]
  );

  // Keyboard nav — слушаем на document с capture-фазе, чтобы Spline iframe
  // не перехватывал клавиши, когда фокус «уплыл» в 3D-сцену
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      // Не реагируем когда юзер печатает в input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        e.stopPropagation();
        go(idx + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        e.stopPropagation();
        go(idx - 1);
      } else if (e.key === "f" || e.key === "F") {
        // requestFullscreen возвращает promise + требует transient activation —
        // глушим reject если браузер не разрешил (например, без gesture после stopPropagation).
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else if (e.key === "Escape") {
        document.exitFullscreen?.().catch(() => {});
      } else if (e.key === "Home") {
        go(0);
      } else if (e.key === "End") {
        go(slides.length - 1);
      } else if (e.key === "s" || e.key === "S") {
        setSpeakerMode((m) => (m === "live" ? "preview" : "live"));
      }
    };
    // Capture-phase — ловим клавишу ДО iframe.
    // НЕ делаем window.focus() на клик — это ломало Spline mouse tracking.
    document.addEventListener("keydown", h, true);
    window.addEventListener("keydown", h, true);

    return () => {
      document.removeEventListener("keydown", h, true);
      window.removeEventListener("keydown", h, true);
    };
  }, [idx, go, slides.length]);

  // Initial hash
  useEffect(() => {
    const startIdx = parseInt(location.hash.slice(1)) - 1;
    if (!isNaN(startIdx) && startIdx >= 0 && startIdx < slides.length) {
      setIdx(startIdx);
    }
  }, [slides.length]);

  // Тема текущего слайда — для читаемости счётчика на cream-фоне.
  const currentKey = (slides[idx] as React.ReactElement | null)?.key ?? null;
  const counterLight = currentKey != null && !!lightSlideKeys?.has(String(currentKey));

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center">
      {/* 16:9 рамка — лочим формат 1920×1080; на широких экранах чёрные поля по бокам.
          container-type: size → cqw/cqh внутри считаются от РАМКИ, а не от вьюпорта. */}
      <div
        className="relative overflow-hidden"
        style={{ width: "min(100vw, 177.778vh)", height: "min(100vh, 56.25vw)", containerType: "size" }}
      >
      {/* === Cursor-glow · radial gradient за курсором (как в vanilla presentation.html) === */}
      {cursor && (
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background: `radial-gradient(450px circle at ${cursor.x}px ${cursor.y}px, rgba(182,255,0,0.18), transparent 65%)`,
          }}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
          className="absolute inset-0 z-10 pointer-events-none"
        >
          {slides[idx]}
        </motion.div>
      </AnimatePresence>

      {/* Speaker-zone vertical divider (Acid Green) — справа, где Александр */}
      <div
        className={cn(
          "pointer-events-none absolute top-[10%] bottom-[10%] w-px z-30 transition-opacity",
          speakerMode === "live" ? "opacity-100" : "opacity-0"
        )}
        style={{
          right: "var(--sd-speaker-zone)",
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(182,255,0,0.15) 30%, rgba(182,255,0,0.25) 50%, rgba(182,255,0,0.15) 70%, transparent 100%)",
        }}
      />

      {/* Slide counter — правый нижний угол, неброско. На cream-слайдах — тёмные чернила (#2A2520), иначе сливается. */}
      <div
        className="pointer-events-none absolute bottom-4 right-5 z-30 font-mono text-[11px] tracking-[0.2em]"
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          color: counterLight ? "rgba(42,37,32,0.55)" : "rgba(255,255,255,0.35)",
        }}
      >
        {String(idx + 1).padStart(2, "0")}{" "}
        <span style={{ color: counterLight ? "rgba(42,37,32,0.3)" : "rgba(255,255,255,0.2)" }}>/</span>{" "}
        {String(slides.length).padStart(2, "0")}
      </div>
      </div>
    </div>
  );
}

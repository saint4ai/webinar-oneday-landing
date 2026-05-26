"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SlideDeckProps {
  slides: React.ReactNode[];
  blockLabels?: Record<number, string>;
}

/**
 * SlideDeck — оркестратор слайдов: keyboard navigation, speaker-zone toggle,
 * indicators, transitions через AnimatePresence.
 *
 * Управление:
 *   ← → / SPACE — навигация
 *   F — fullscreen
 *   S — toggle speaker-zone (LIVE 30% ↔ PREVIEW 0%)
 *   Home / End — в начало/конец
 *   Esc — выход из fullscreen
 */
export function SlideDeck({ slides, blockLabels = {} }: SlideDeckProps) {
  const [idx, setIdx] = useState(0);
  const [speakerMode, setSpeakerMode] = useState<"live" | "preview">("live");
  // Все служебные UI (стрелки, индикатор, help) скрыты от зрителей.
  // Показываются на 2.5 сек при движении мыши — потом fade out.
  const [controlsVisible, setControlsVisible] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cursor-glow — radial-gradient следующий за мышкой (как в исходной vanilla-презентации).
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
      // Cursor-glow (rAF-throttle).
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (rafId === null) rafId = requestAnimationFrame(flushCursor);

      // Auto-hide служебных UI.
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), 2500);
    };
    const onClick = () => {
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), 2500);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
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
      speakerMode === "live" ? "30vw" : "0vw"
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
        document.documentElement.requestFullscreen?.();
      } else if (e.key === "Escape") {
        document.exitFullscreen?.();
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

  const blockNum = Math.floor(idx / 10) + 1; // приближённо для индикатора
  const blockLabel = blockLabels[blockNum] || `БЛОК ${blockNum}`;

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* === Cursor-glow · radial gradient за курсором (как в vanilla presentation.html) === */}
      {cursor && (
        <div
          className="pointer-events-none fixed inset-0 z-[1]"
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

      {/* Speaker-zone vertical divider (Acid Green) */}
      <div
        className={cn(
          "pointer-events-none absolute top-[10%] bottom-[10%] w-px z-30 transition-opacity",
          speakerMode === "live" ? "opacity-100" : "opacity-0"
        )}
        style={{
          left: "var(--sd-speaker-zone)",
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(182,255,0,0.15) 30%, rgba(182,255,0,0.25) 50%, rgba(182,255,0,0.15) 70%, transparent 100%)",
        }}
      />

      {/* === СЛУЖЕБНЫЕ UI · скрыто от зрителей === */}
      {/* Появляются только при движении мыши, fade out через 2.5 сек */}
      <div
        className={cn(
          "transition-opacity duration-500 ease-out",
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Indicator: slide N / TOTAL · block · mode */}
        <div className="fixed bottom-6 right-8 z-50 font-mono text-[11px] tracking-[0.2em] uppercase text-white/45 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full">
          СЛАЙД <b className="text-[#B6FF00] font-bold">{idx + 1}</b>
          <span className="text-white/30"> / {slides.length}</span>
          <span className="mx-2 text-white/20">·</span>
          {blockLabel}
          <span className="mx-2 text-white/20">·</span>
          <span
            className={cn(
              "font-bold",
              speakerMode === "live" ? "text-[#B6FF00]" : "text-white/40"
            )}
          >
            {speakerMode === "live" ? "LIVE 30%" : "PREVIEW"}
          </span>
        </div>

        {/* Help bar */}
        <div className="fixed bottom-6 left-8 z-50 font-mono text-[10px] tracking-[0.18em] uppercase text-white/30">
          ← → · SPACE · F = FULLSCREEN · S = ЗОНА СПИКЕРА
        </div>
      </div>
    </div>
  );
}

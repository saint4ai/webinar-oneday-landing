"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Canvas-фон с диагональными «лучами» (beams).
 * Адаптация под бренд: hue 18° (#fc5c02 orange) ↔ 72° (#cdeb52 lime).
 *
 * Pure utility — НЕ рендерит никакого контента, только canvas.
 * Применяется как absolute background внутри секции.
 *
 * Props:
 *  intensity: subtle / medium / strong — общая яркость
 *  beamCount: сколько лучей (default 18 — баланс между плотностью и FPS)
 *  blur:      blur контейнера + canvas (px) — даёт «глянцевый» эффект
 */
interface Beam {
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  speed: number;
  opacity: number;
  hue: number;
  pulse: number;
  pulseSpeed: number;
}

type Intensity = "subtle" | "medium" | "strong";

interface BeamsBackgroundProps {
  className?: string;
  intensity?: Intensity;
  beamCount?: number;
  blur?: number;
}

function createBeam(width: number, height: number): Beam {
  const angle = -35 + Math.random() * 10;
  return {
    x: Math.random() * width * 1.5 - width * 0.25,
    y: Math.random() * height * 1.5 - height * 0.25,
    width: 30 + Math.random() * 60,
    length: height * 2.5,
    angle: angle,
    speed: 0.6 + Math.random() * 1.2,
    opacity: 0.12 + Math.random() * 0.16,
    hue: 18 + Math.random() * 54, // 18 (orange) → 72 (lime)
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.02 + Math.random() * 0.03,
  };
}

export function BeamsBackground({
  className,
  intensity = "medium",
  beamCount = 18,
  blur = 15,
}: BeamsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beamsRef = useRef<Beam[]>([]);
  const rafRef = useRef<number>(0);
  const visibleRef = useRef<boolean>(true);

  const opacityMap: Record<Intensity, number> = {
    subtle: 0.55,
    medium: 0.85,
    strong: 1,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Honor reduced motion — рисуем 1 кадр и не анимируем
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : window.innerWidth;
      const h = parent ? parent.clientHeight : window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
      ctx.scale(dpr, dpr);

      beamsRef.current = Array.from({ length: beamCount }, () =>
        createBeam(canvas.width, canvas.height),
      );
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Pause animation off-screen for performance
    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting && !prefersReducedMotion && !rafRef.current) {
          animate();
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    function resetBeam(beam: Beam, index: number) {
      if (!canvas) return beam;
      const column = index % 3;
      const spacing = canvas.width / 3;
      beam.y = canvas.height + 100;
      beam.x =
        column * spacing +
        spacing / 2 +
        (Math.random() - 0.5) * spacing * 0.5;
      beam.width = 100 + Math.random() * 100;
      beam.speed = 0.5 + Math.random() * 0.4;
      beam.hue = 18 + (index * 54) / beamCount; // 18 → 72
      beam.opacity = 0.2 + Math.random() * 0.1;
      return beam;
    }

    function drawBeam(c: CanvasRenderingContext2D, beam: Beam) {
      c.save();
      c.translate(beam.x, beam.y);
      c.rotate((beam.angle * Math.PI) / 180);

      const pulsingOpacity =
        beam.opacity *
        (0.8 + Math.sin(beam.pulse) * 0.2) *
        opacityMap[intensity];

      const gradient = c.createLinearGradient(0, 0, 0, beam.length);
      gradient.addColorStop(0, `hsla(${beam.hue}, 90%, 60%, 0)`);
      gradient.addColorStop(
        0.1,
        `hsla(${beam.hue}, 90%, 60%, ${pulsingOpacity * 0.5})`,
      );
      gradient.addColorStop(
        0.4,
        `hsla(${beam.hue}, 90%, 60%, ${pulsingOpacity})`,
      );
      gradient.addColorStop(
        0.6,
        `hsla(${beam.hue}, 90%, 60%, ${pulsingOpacity})`,
      );
      gradient.addColorStop(
        0.9,
        `hsla(${beam.hue}, 90%, 60%, ${pulsingOpacity * 0.5})`,
      );
      gradient.addColorStop(1, `hsla(${beam.hue}, 90%, 60%, 0)`);

      c.fillStyle = gradient;
      c.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      c.restore();
    }

    function animate() {
      if (!canvas || !ctx) return;
      if (!visibleRef.current) {
        rafRef.current = 0;
        return; // не жжём CPU когда не видно
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = "blur(35px)";

      beamsRef.current.forEach((beam, index) => {
        beam.y -= beam.speed;
        beam.pulse += beam.pulseSpeed;
        if (beam.y + beam.length < -100) {
          resetBeam(beam, index);
        }
        drawBeam(ctx, beam);
      });

      rafRef.current = requestAnimationFrame(animate);
    }

    if (prefersReducedMotion) {
      // 1 статичный кадр
      beamsRef.current.forEach((beam, i) => {
        beam.hue = 18 + (i * 54) / beamCount;
        drawBeam(ctx, beam);
      });
    } else {
      animate();
    }

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      io.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [intensity, beamCount, opacityMap]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn(
        "absolute inset-0 w-full h-full pointer-events-none",
        className,
      )}
      style={{ filter: `blur(${blur}px)` }}
    />
  );
}

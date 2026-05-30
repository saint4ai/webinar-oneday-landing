"use client";

import { Water, Waves, MeshGradient, LiquidMetal, Spiral, GodRays } from "@paper-design/shaders-react";
import { cn } from "@/lib/utils";

type Variant = "water" | "waves" | "mesh" | "liquid-metal" | "spiral" | "godrays";

interface LiquidBackgroundProps {
  variant?: Variant;
  className?: string;
  /** 0..1 — общая непрозрачность layer'а поверх чёрного фона */
  opacity?: number;
}

/**
 * LiquidBackground — анимированный GPU-шейдер на бренд-палитре (#000 + #B6FF00 лайм + #FC5C02 оранж).
 * Кладётся ПОД контент слайда. Через GlassPane сверху создаёт эффект «вода за стеклом».
 *
 * variant:
 *   - "water"        — каустика (вода с бликами)        — Chapter screens
 *   - "waves"        — медленные волны                  — Authority counters
 *   - "mesh"         — мульти-цветной градиент          — атмосферные слайды
 *   - "liquid-metal" — жидкий металл с переливами       — под BentoCard
 *   - "spiral"       — гипнотическая спираль            — engagement
 *   - "godrays"      — лучи света                       — переходные
 */
export function LiquidBackground({ variant = "mesh", className, opacity = 0.55 }: LiquidBackgroundProps) {
  const LIME = "#B6FF00";
  const ORANGE = "#FC5C02";
  const DARK = "#0A0A0A";
  const BLACK = "#000000";

  const style = { width: "100%", height: "100%", opacity };

  return (
    <div className={cn("pointer-events-none absolute inset-0 z-0", className)}>
      {variant === "water" && (
        <Water
          style={style}
          colorBack={BLACK}
          colorHighlight={LIME}
          highlights={0.5}
          layering={0.6}
          edges={0.4}
          waves={0.3}
          caustic={0.45}
          size={0.85}
          speed={0.4}
        />
      )}
      {variant === "waves" && (
        <Waves
          style={style}
          colorFront={LIME}
          colorBack={BLACK}
          frequency={0.5}
          amplitude={0.18}
          spacing={0.55}
          rotation={20}
          softness={0.5}
        />
      )}
      {variant === "mesh" && (
        <MeshGradient
          style={style}
          colors={[BLACK, DARK, LIME, ORANGE]}
          distortion={0.55}
          swirl={0.35}
          speed={0.18}
        />
      )}
      {variant === "liquid-metal" && (
        <LiquidMetal
          style={style}
          colorBack={BLACK}
          colorTint={LIME}
          repetition={4}
          softness={0.55}
          shiftRed={0.3}
          shiftBlue={0.18}
          distortion={0.4}
          contour={0.55}
          shape="circle"
          offsetX={0.05}
          offsetY={-0.1}
          speed={0.55}
        />
      )}
      {variant === "spiral" && (
        <Spiral
          style={style}
          colorFront={LIME}
          colorBack={BLACK}
          density={0.5}
          distortion={0.18}
          strokeWidth={0.45}
          strokeTaper={0.4}
          softness={0.25}
          noise={0.3}
          noiseFrequency={0.4}
          speed={0.35}
        />
      )}
      {variant === "godrays" && (
        <GodRays
          style={style}
          colorBack={BLACK}
          colorBloom={LIME}
          colors={[LIME, ORANGE]}
          midSize={0.6}
          midIntensity={0.7}
          density={0.5}
          spotty={0.35}
          bloom={0.4}
          speed={0.3}
        />
      )}
    </div>
  );
}

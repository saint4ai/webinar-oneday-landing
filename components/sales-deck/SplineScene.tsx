"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { Application } from "@splinetool/runtime";

interface SplineSceneProps {
  scene: string;
  className?: string;
  onLoad?: (app: Application) => void;
}

type SplineComp = ComponentType<{
  scene: string;
  className?: string;
  onLoad?: (app: Application) => void;
}>;

/**
 * Spline 3D scene wrapper. useEffect+import — единственный паттерн, который не падает
 * в Turbopack (lazy + Suspense дают hydration mismatch, next/dynamic — module factory error).
 */
export function SplineScene({ scene, className, onLoad }: SplineSceneProps) {
  const [Spline, setSpline] = useState<SplineComp | null>(null);

  useEffect(() => {
    let mounted = true;
    import("@splinetool/react-spline")
      .then((mod) => {
        if (mounted) setSpline(() => mod.default as SplineComp);
      })
      .catch((err) => console.error("[SplineScene] load failed:", err));
    return () => {
      mounted = false;
    };
  }, []);

  if (!Spline) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-white/15 border-t-[#B6FF00] animate-spin" />
      </div>
    );
  }

  return <Spline scene={scene} className={className} onLoad={onLoad} />;
}

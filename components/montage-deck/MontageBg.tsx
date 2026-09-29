import type { ReactNode } from "react";
import { T } from "./theme";

export type Tone = "paper" | "soft" | "night";

/**
 * Фон слайда как на сайтах: белый (основа), карточный #FBF3E4 или ночной #14100E,
 * сетка «рыбий глаз» маской (коричневая на светлом, светлая на ночи) и засветка к краям.
 * data-deck-bg — метка фона: проверка зоны камеры в docs/deck-v2/shoot.mjs его пропускает.
 * children — полноэкранный эффект поверх фона (VoxelField, ReelTunnel3D), он тоже считается фоном.
 */
export function MontageBg({ tone = "paper", children }: { tone?: Tone | "ink"; children?: ReactNode }) {
  const night = tone === "night" || tone === "ink";
  const base = night ? T.night : tone === "soft" ? T.card : T.paper;
  return (
    <div className="absolute inset-0" data-deck-bg style={{ background: base }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: night ? T.nightText : T.brown,
          opacity: night ? 0.07 : 0.1,
          WebkitMaskImage: "url(/montage/fisheye-grid.svg)",
          maskImage: "url(/montage/fisheye-grid.svg)",
          WebkitMaskSize: "cover",
          maskSize: "cover",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse at 40% 45%, transparent 35%, ${base} 92%)` }}
      />
      {children}
    </div>
  );
}

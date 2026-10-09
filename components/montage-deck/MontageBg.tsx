"use client";

import type { ReactNode } from "react";
import { CAMERA_SAFE_MASK } from "./fx/brand";
import { GLASS, T } from "./theme";
import { Typo } from "./Typo";

export type Tone = "paper" | "soft" | "night";

/**
 * Фон слайда как на сайтах: белый (основа), карточный #FBF3E4 или ночной #14100E,
 * сетка «рыбий глаз» маской (коричневая на светлом, светлая на ночи) и засветка к краям.
 * При GLASS (theme.ts) любой тон рисуется ночным и получает тёплое свечение: золото сверху, коричневое снизу и в середине.
 * Свечение просвечивает сквозь стеклянные карточки, без него стекло выглядело бы пустым. Оно гаснет к зоне камеры (правые 40% чистые)
 * и медленно плывёт (14 с), на слайдах с children (воксели, тоннели) не рисуется: там свой полноэкранный эффект.
 * data-deck-bg — метка фона: проверка зоны камеры в docs/deck-v2/shoot-offline.mjs его пропускает.
 * children — полноэкранный эффект поверх фона (VoxelField, ReelTunnel3D), он тоже считается фоном.
 * Заодно переводит отступы колонки общего SlideLayout (фиксированные 32px и 56px) в cqw: 56px = 2,917cqw от кадра 1920. Слайд остаётся точной копией
 * кадра на любом окне, текст не сжимается в узком окне (на 1100 px шириной «6 форматов и 9 стилей» рвалось на четыре строки).
 */
export function MontageBg({ tone = "paper", children }: { tone?: Tone | "ink"; children?: ReactNode }) {
  const night = GLASS || tone === "night" || tone === "ink";
  const base = night ? T.night : tone === "soft" ? T.card : T.paper;
  return (
    <div className="absolute inset-0" data-deck-bg style={{ background: base }}>
      <style>{`.montage-deck .sl-col { padding: 1.667cqw 2.917cqw !important; }`}</style>
      <Typo />
      {night ? (
        // Сетка ночного фона: готовая картинка (линии #FBF3E4 с прозрачностью 0,5 × 0,07, docs/perf/make-grid-png.mjs), а не слой-маска из SVG:
        // тот же рисунок, но слой с векторной маской на каждом кадре стоил около половины затрат GPU-процесса.
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "url(/montage/fisheye-grid-night.png)", backgroundSize: "cover", backgroundPosition: "center" }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: T.brown,
            opacity: 0.1,
            WebkitMaskImage: "url(/montage/fisheye-grid.svg)",
            maskImage: "url(/montage/fisheye-grid.svg)",
            WebkitMaskSize: "cover",
            maskSize: "cover",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      )}
      {GLASS && !children && (
        <div className="absolute inset-0 overflow-hidden" style={{ WebkitMaskImage: CAMERA_SAFE_MASK, maskImage: CAMERA_SAFE_MASK }} aria-hidden>
          {/* дрейф свечения: CSS-анимация (globals.css, mbg-drift): 14 с, easeInOut, x 0 → 2,2% → 0, y 0 → −1,6% → 0, как было в framer-motion */}
          <div
            className="absolute"
            style={{
              inset: "-6%",
              background: [
                "radial-gradient(34% 42% at 14% 12%, rgba(227,192,123,.34), transparent 70%)",
                "radial-gradient(42% 42% at 36% 92%, rgba(160,83,42,.48), transparent 72%)",
                "radial-gradient(38% 48% at 60% 52%, rgba(160,83,42,.26), transparent 74%)",
                "radial-gradient(26% 30% at 46% 14%, rgba(227,192,123,.15), transparent 70%)",
              ].join(","),
              animation: "mbg-drift 14s ease-in-out infinite",
            }}
          />
        </div>
      )}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse at 40% 45%, transparent 35%, ${base} 92%)` }}
      />
      {children}
    </div>
  );
}

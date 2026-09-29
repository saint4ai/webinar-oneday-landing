"use client";

/** Обложка и финал: вертикальные рилсы летят по объёмной спирали. ЗАГЛУШКА — настоящую версию делает Claude, API не менять. */
export type Reel = { poster: string; video?: string };

export function ReelTunnel3D({ reels }: { reels: Reel[] }) {
  return (
    <div className="absolute inset-0 flex items-center justify-end gap-[1cqw] pr-[4cqw] opacity-60" aria-hidden>
      {reels.slice(0, 4).map((r) => (
        <img key={r.poster} src={r.poster} alt="" style={{ width: "9cqw", aspectRatio: "9 / 16", objectFit: "cover", borderRadius: "0.8cqw" }} />
      ))}
    </div>
  );
}

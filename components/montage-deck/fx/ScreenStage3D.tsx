"use client";

/** Скриншот на объёмной подставке с бликом и выделением главной цифры. Нет src — пунктирное место с подписью empty. ЗАГЛУШКА — настоящую версию делает Claude, API не менять. */
export function ScreenStage3D({ src, alt, empty }: { src?: string; alt: string; empty: string }) {
  return src ? (
    <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "1cqw" }} />
  ) : (
    <div className="flex h-full w-full items-center justify-center rounded-[1cqw] border-2 border-dashed border-white/30 text-center" style={{ fontSize: "1cqw", padding: "2cqw" }}>
      {empty}
    </div>
  );
}

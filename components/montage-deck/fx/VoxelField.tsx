"use client";

/** Фон глав и акцентных слайдов: объёмное поле кубиков, по нему идёт волна. ЗАГЛУШКА — настоящую версию делает Claude, API не менять. */
export function VoxelField({ accent = "#B6FF00" }: { accent?: string }) {
  return <div className="absolute inset-0" aria-hidden style={{ background: `radial-gradient(60% 60% at 30% 60%, ${accent}22, transparent 70%)` }} />;
}

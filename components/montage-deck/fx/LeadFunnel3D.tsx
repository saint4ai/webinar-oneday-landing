"use client";

/** Урок 3: просмотры → кодовое слово → диалог с ботом → заявка. Частицы текут по объёмной воронке. ЗАГЛУШКА — настоящую версию делает Claude, API не менять. */
export type FunnelStage = { label: string; value: string };

export function LeadFunnel3D({ stages }: { stages: FunnelStage[] }) {
  return (
    <div className="flex flex-col items-center gap-[0.6cqw]">
      {stages.map((s, i) => (
        <div key={s.label} className="flex items-baseline justify-between rounded-[0.6cqw] border border-white/15 px-[1.2cqw] py-[0.8cqw]"
          style={{ width: `${30 - i * 5}cqw` }}>
          <span style={{ fontSize: "0.9cqw" }}>{s.label}</span>
          <b style={{ fontSize: "1.6cqw" }}>{s.value}</b>
        </div>
      ))}
    </div>
  );
}

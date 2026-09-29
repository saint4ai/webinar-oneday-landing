"use client";

/** «Кто я»: стопка расходов на монтажёра рушится до цены подписки. ЗАГЛУШКА — настоящую версию делает Claude, API не менять. */
export type CostSide = { value: string; label: string };

export function CostDrop3D({ from, to }: { from: CostSide; to: CostSide }) {
  return (
    <div className="flex items-end gap-[3cqw]">
      {[from, to].map((s, i) => (
        <div key={s.label} className="flex flex-col items-center gap-[0.6cqw]">
          <div className="rounded-[0.5cqw]" style={{ width: "7cqw", height: i ? "4cqw" : "22cqw", background: i ? "#B6FF00" : "#FC5C02" }} />
          <b style={{ fontSize: "1.8cqw" }}>{s.value}</b>
          <span style={{ fontSize: "0.9cqw", opacity: 0.7 }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

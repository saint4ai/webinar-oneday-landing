"use client";

/**
 * NicheTag — чип ниши («РИЕЛТОР», «РУКОВОДИТЕЛЬ», «HR») для ниша-арки 41-49.
 * tone="orange" — слайды боли, tone="lime" — слайды решения.
 */
export function NicheTag({ label, tone = "lime" }: { label: string; tone?: "lime" | "orange" }) {
  const c = tone === "orange" ? "#FC5C02" : "#B6FF00";
  return (
    <span
      className="inline-flex items-center font-mono text-[10px] md:text-[11px] font-bold uppercase tracking-[0.16em] px-2.5 py-1 rounded-md"
      style={{ color: c, background: `${c}14`, border: `1px solid ${c}44` }}
    >
      {label}
    </span>
  );
}

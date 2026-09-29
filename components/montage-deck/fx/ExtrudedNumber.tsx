"use client";

/** Огромная объёмная цифра с докруткой — для результатов и доказательств. value — уже отформатированная строка («107 237»). ЗАГЛУШКА — настоящую версию делает Claude, API не менять. */
export function ExtrudedNumber({ value, label, accent = "#B6FF00", size = "9cqw" }: { value: string; label?: string; accent?: string; size?: string }) {
  return (
    <div className="flex flex-col">
      <b style={{ fontSize: size, lineHeight: 0.9, color: accent, fontVariantNumeric: "tabular-nums" }}>{value}</b>
      {label && <span style={{ fontSize: "1cqw", opacity: 0.7, marginTop: "0.8cqw" }}>{label}</span>}
    </div>
  );
}

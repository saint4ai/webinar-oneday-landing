import { T } from "./theme";

/** Фон темы: молочная бумага + сетка «рыбий глаз» (маской, в цвет какао) + засветка к краям. */
export function MontageBg({ tone = "paper" }: { tone?: "paper" | "soft" | "ink" }) {
  const base = tone === "soft" ? T.soft : tone === "ink" ? T.ink : T.paper;
  const gridColor = tone === "ink" ? T.gold2 : T.accent;
  return (
    <div className="absolute inset-0" style={{ background: base }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: gridColor,
          opacity: tone === "ink" ? 0.12 : 0.16,
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
        style={{ background: `radial-gradient(ellipse at 45% 45%, transparent 35%, ${base} 92%)` }}
      />
    </div>
  );
}

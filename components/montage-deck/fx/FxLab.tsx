"use client";

import { useEffect, useState } from "react";
import { ReelTunnel3D, VoxelField, ExtrudedNumber, ScreenStage3D, LeadFunnel3D, CostDrop3D } from ".";

/** Стенд эффектов: /montage-fx?fx=tunnel|voxel|number|screen|funnel|cost. Кадр 16:9, пунктир — граница зоны спикера (60%).
 *  Цифры воронки здесь выдуманы для проверки вида — в деку их не переносить. */
const REELS = ["mcp", "papka", "google10", "podarok", "zashita"].map((r) => ({ poster: `/montage/reels/${r}.jpg` }))
  .concat(["apple", "expert", "glass", "orbit", "podcast", "portrait", "prism", "pulse"].map((s) => ({ poster: `/montage/styles/${s}.jpg` })));

export function FxLab() {
  const [fx, setFx] = useState("");
  useEffect(() => setFx(new URLSearchParams(location.search).get("fx") ?? "tunnel"), []);
  const title = (t: string) => (
    <div className="absolute" style={{ left: "5cqw", top: "34cqh", width: "48cqw", color: "#fff", fontFamily: "var(--font-inter-tight)", fontWeight: 800, fontSize: "4.4cqw", lineHeight: 1.02, letterSpacing: "-.03em" }}>{t}</div>
  );
  return (
    <div style={{ background: "#000", minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div className="relative overflow-hidden" style={{ width: "100vw", aspectRatio: "16 / 9", maxHeight: "100vh", containerType: "size", background: "#050505" }}>
        {fx === "tunnel" && <><ReelTunnel3D reels={REELS} />{title("Рилсы без знаний монтажа")}</>}
        {fx === "voxel" && <><VoxelField />{title("Урок 1. Рилс без знаний монтажа")}</>}
        {fx === "number" && <div className="absolute" style={{ left: "6cqw", top: "22cqh" }}><ExtrudedNumber value="107 237" label="просмотров · смонтировал агент" /></div>}
        {fx === "screen" && <>
          <div className="absolute" style={{ left: "4cqw", top: "14cqh", width: "30cqw", height: "34cqw" }}><ScreenStage3D src="/montage/profile.jpg" alt="Профиль" empty="" /></div>
          <div className="absolute" style={{ left: "38cqw", top: "14cqh", width: "20cqw", height: "34cqw" }}><ScreenStage3D alt="" empty="Сюда скрин заявок из amoCRM за сентябрь: public/montage/results/blog-leads.png" /></div>
        </>}
        {fx === "funnel" && <div className="absolute" style={{ left: "3cqw", top: "6cqh", width: "56cqw", height: "46cqw" }}>
          <LeadFunnel3D stages={[{ label: "просмотров рилса", value: "107 237" }, { label: "написали кодовое слово", value: "1 840" }, { label: "поговорили с ботом", value: "620" }, { label: "заявок менеджеру", value: "94" }]} />
        </div>}
        {fx === "cost" && <div className="absolute" style={{ left: "8cqw", top: "10cqh" }}><CostDrop3D from={{ value: "300 000 ₸", label: "монтажёр, 30 роликов в месяц" }} to={{ value: "~50 000 ₸", label: "Claude, те же 30 роликов" }} /></div>}
        <div className="pointer-events-none absolute inset-y-0" style={{ left: "60%", borderLeft: "1px dashed rgba(255,255,255,.25)" }} />
      </div>
    </div>
  );
}

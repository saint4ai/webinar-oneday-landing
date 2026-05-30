"use client";

import { SlideDeck } from "../SlideDeck";
import { EditorialSlide } from "./EditorialSlide";
import { KineticSlide } from "./KineticSlide";
import { SplitScreenSlide } from "./SplitScreenSlide";

/**
 * FormatsShowcase — витрина 3 новых форматов в существующем SlideDeck-оркестраторе.
 * Демонстрирует каждый формат на реальном контенте из STRUCTURE (Часть IV — превью).
 * Навигация: ← → / SPACE / F / S / Home / End (как в основном деке).
 */
export function FormatsShowcase() {
  const slides = [
    // --- Формат 1: Editorial ---
    <EditorialSlide
      key="ed"
      bgNumber="02"
      kicker="// ФОРМАТ 1 · EDITORIAL"
      verticalLabel="onAI · vibecoding workshop"
      title={
        <>
          СВОЙ СЕРВИС
          <br />
          ДЛЯ <span style={{ color: "#B6FF00" }}>БИЗНЕСА</span>
        </>
      }
      lead="Сильная типографика, outline-номер на фоне, blueprint-грид. Без glassmorphism и сфер."
    >
      <div className="flex gap-3 flex-wrap">
        {["CRM", "дашборды", "автоотчёты", "боты"].map((t) => (
          <span
            key={t}
            className="font-mono text-xs uppercase tracking-[0.1em] px-3 py-1.5 rounded-full"
            style={{ border: "1px solid rgba(182,255,0,0.3)", color: "#B6FF00" }}
          >
            {t}
          </span>
        ))}
      </div>
    </EditorialSlide>,

    // --- Формат 2: Kinetic ---
    <KineticSlide
      key="kin"
      kicker="// ФОРМАТ 2 · KINETIC TYPOGRAPHY"
      align="center"
      words={[
        { text: "ОДИН" },
        { text: "ЧЕЛОВЕК" },
        { text: "=" },
        { text: "ЦЕЛАЯ", accent: true },
        { text: "СТУДИЯ", accent: true },
      ]}
      sub="Слова выезжают из-под маски со stagger. Чистый motion на чёрном — никаких фонов."
    />,

    // --- Формат 3: Split-screen + code ---
    <SplitScreenSlide
      key="split"
      kicker="// ФОРМАТ 3 · SPLIT + CODE"
      title={
        <>
          ОПИСЫВАЕШЬ СЛОВАМИ —
          <br />
          AI <span style={{ color: "#B6FF00" }}>ПИШЕТ КОД</span>
        </>
      }
      lead="Асимметричная сетка 1.15/0.85. Справа — data-inspired редактор с diff-подсветкой."
      panelTitle="dashboard/page.tsx"
      codeLines={[
        { text: "// промпт: дашборд аналитики", kind: "comment" },
        { text: "export function Dashboard() {", kind: "default" },
        { text: "  const data = useAnalytics()", kind: "add" },
        { text: "  return <Charts data={data} />", kind: "add" },
        { text: "  // старый ручной код", kind: "del" },
        { text: "}", kind: "default" },
      ]}
    />,
  ];

  return <SlideDeck slides={slides} />;
}

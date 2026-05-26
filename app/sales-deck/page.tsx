import { SalesDeck } from "@/components/sales-deck/SalesDeck";

export const metadata = {
  title: "Vibe Coding PRO · Sales Deck",
  robots: { index: false, follow: false },
};

/**
 * /sales-deck — продающая презентация для живого эфира.
 * Не индексируется. Используется локально или для эфирной демонстрации.
 *
 * Управление:
 *   ← → / SPACE — навигация
 *   F — fullscreen
 *   S — toggle speaker-zone (LIVE 30% ↔ PREVIEW)
 */
export default function SalesDeckPage() {
  return <SalesDeck />;
}

import { Deck60 } from "@/components/sales-deck/Deck60";

export const metadata = {
  title: "Vibe Coding · Часовой воркшоп",
  robots: { index: false, follow: false },
};

/**
 * /webinar-60 — часовая версия воркшопа (~100 слайдов).
 * Оригинальная трёхчасовая дека живёт отдельно на /sales-deck и не затронута.
 *
 * Управление: ← → / SPACE — навигация, F — fullscreen, S — зона спикера
 */
export default function Webinar60Page() {
  return <Deck60 />;
}

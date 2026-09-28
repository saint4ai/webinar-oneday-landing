import { MontageDeck } from "@/components/montage-deck/MontageDeck";

export const metadata = {
  title: "Vibe Production · эфир",
  description: "Рилсы без знаний монтажа: эфир 1 октября, 20:00 по Алматы.",
  robots: { index: false, follow: false },
  // Своя карточка ссылки вместо обложки воркшопа из корневого layout
  openGraph: { title: "Vibe Production · эфир 1 октября", description: "Рилсы без знаний монтажа.", images: [{ url: "/montage/og.jpg", width: 1200, height: 630 }] },
};

/** /montage — эфир Vibe Production. Управление: ← → / SPACE, F — во весь экран, S — зона спикера. */
export default function MontagePage() {
  return <MontageDeck />;
}

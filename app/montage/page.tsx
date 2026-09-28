import { MontageDeck } from "@/components/montage-deck/MontageDeck";

export const metadata = {
  title: "Vibe Production · эфир",
  robots: { index: false, follow: false },
};

/** /montage — эфир Vibe Production. Управление: ← → / SPACE, F — во весь экран, S — зона спикера. */
export default function MontagePage() {
  return <MontageDeck />;
}

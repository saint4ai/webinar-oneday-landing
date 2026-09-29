import { existsSync } from "node:fs";
import { join } from "node:path";
import { MontageDeck } from "@/components/montage-deck/MontageDeck";
import { RESULTS } from "@/components/montage-deck/results";

export const metadata = {
  title: "Vibe Production · эфир",
  description: "Рилсы без знаний монтажа: эфир 1 октября, 20:00 по Алматы.",
  robots: { index: false, follow: false },
  // Своя карточка ссылки вместо обложки воркшопа из корневого layout
  openGraph: { title: "Vibe Production · эфир 1 октября", description: "Рилсы без знаний монтажа.", images: [{ url: "/montage/og.jpg", width: 1200, height: 630 }] },
};

/** Скриншот результатов показываем, только если файл уже лежит в public/montage/results/ — иначе на слайде пунктирное место. */
const resultShot = (file: string) => (existsSync(join(process.cwd(), "public/montage/results", file)) ? `/montage/results/${file}` : undefined);

/** /montage — эфир Vibe Production. Управление: ← → / SPACE, F — во весь экран, S — зона спикера. */
export default function MontagePage() {
  return <MontageDeck shots={{ bot: resultShot(RESULTS.bot.screenshot), blog: resultShot(RESULTS.blog.screenshot) }} />;
}

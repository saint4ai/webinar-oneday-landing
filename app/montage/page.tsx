import { existsSync } from "node:fs";
import { join } from "node:path";
import { MontageDeck } from "@/components/montage-deck/MontageDeck";
import { RESULTS } from "@/components/montage-deck/results";

export const metadata = {
  title: "Vibe Production · эфир",
  description: "Рилсы без знаний монтажа: эфир сегодня в 20:00 по Алматы.",
  robots: { index: false, follow: false },
  // Своя карточка ссылки вместо обложки воркшопа из корневого layout; без конкретной даты (Александр 06.10)
  openGraph: { title: "Vibe Production · эфир сегодня в 20:00", description: "Рилсы без знаний монтажа.", images: [{ url: "/montage/og.jpg", width: 1200, height: 630 }] },
};

/** Скриншот результатов показываем, только если файл уже лежит в public/montage/results/ — иначе на слайде пунктирное место. Расширение любое из списка. */
const resultShot = (name: string) => {
  const ext = [".png", ".jpg", ".jpeg", ".webp", ".PNG", ".JPG"].find((e) => existsSync(join(process.cwd(), "public/montage/results", name + e)));
  return ext ? `/montage/results/${name}${ext}` : undefined;
};

/** /montage — эфир Vibe Production. Управление: ← → / SPACE, F — во весь экран, S — зона спикера, Enter на слайде 00 — интро-ролик. */
export default function MontagePage() {
  const intro = existsSync(join(process.cwd(), "public/montage/intro.mp4")) ? "/montage/intro.mp4" : undefined;
  return (
    <MontageDeck shots={{
      intro,
      doc: resultShot("doc-example"),
      growth: RESULTS.growth.platforms.map((p) => resultShot(p.file)),
      viral: RESULTS.viral.map((r) => resultShot(r.file)),
    }} />
  );
}

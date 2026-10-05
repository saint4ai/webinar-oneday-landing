"use client";

import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { CoverTunnel } from "../CoverTunnel";
import { Logo } from "../Logo";
import { MontageBg } from "../MontageBg";
import { T } from "../theme";
import { Chip, Em, H, Kicker, Lead, Rise, STEP } from "../ui";

/** Постеры тоннеля: рилсы, смонтированные агентом, и девять стилей монтажа. */
export const TUNNEL_REELS = ["mcp", "papka", "google10", "podarok", "zashita"].map((r) => ({ poster: `/montage/reels/${r}.jpg` }))
  .concat(["prism", "orbit", "trace", "pulse", "glass", "portrait", "apple", "podcast", "expert"].map((s) => ({ poster: `/montage/styles/${s}.jpg` })));

/**
 * Карточки обложки (правка Александра 05.10.2026): свежие скрины его рилсов со счётчиками просмотров
 * (`public/montage/cover/s01–s10`), через одну — видео залетевших рилсов (`v01–v07`, петли 4 с).
 */
const SHOTS = Array.from({ length: 10 }, (_, i) => `/montage/cover/s${String(i + 1).padStart(2, "0")}.jpg`);
const VIDEOS = Array.from({ length: 7 }, (_, i) => `/montage/cover/v${String(i + 1).padStart(2, "0")}`);
export const COVER_CARDS = SHOTS.flatMap((poster, i) => {
  const v = VIDEOS[i % VIDEOS.length];
  return [{ poster }, { poster: `${v}.jpg`, video: `${v}.mp4` }];
});

/**
 * 1 ✦ Обложка, ночная: фоном тоннель из скринов и видео рилсов (сам гаснет к зоне камеры), слева на тёмном поле —
 * крупный заголовок, строка про агента и менеджера и чипы даты. Счётчик 107 237 живёт на слайде 30.
 */
export function M_Cover() {
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="night"><CoverTunnel cards={COVER_CARDS} /></MontageBg>}>
      <div style={{ maxWidth: "31cqw" }}>
        <Rise><Logo night height="1.8cqw" style={{ marginBottom: "3cqw" }} /></Rise>
        <Rise delay={STEP}><Kicker color={T.gold}>Эфир · Vibe Production</Kicker></Rise>
        <Rise delay={STEP * 2}><H size="4.6cqw" color={T.nightText} style={{ lineHeight: 1.04 }}>Рилсы без знаний <Em night>монтажа</Em></H></Rise>
        <Rise delay={STEP * 3}><Lead color={T.nightMuted} style={{ marginTop: "1.8cqw", fontSize: "1.35cqw" }}>Монтирует ИИ-агент по вашему голосу. Презентации и сайты — тоже ИИ.</Lead></Rise>
        <Rise delay={STEP * 4} className="flex flex-wrap gap-[0.6cqw]" style={{ marginTop: "2.4cqw" }}>
          {/* без конкретной даты: Александр 06.10 «просто сегодня в 20:00» */}
          <Chip gold>Сегодня в 20:00</Chip><Chip night>3 практики за вечер</Chip>
        </Rise>
      </div>
    </SlideLayout>
  );
}

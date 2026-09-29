"use client";

import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { ReelTunnel3D } from "../fx";
import { Logo } from "../Logo";
import { MontageBg } from "../MontageBg";
import { T } from "../theme";
import { Chip, Em, H, Kicker, Lead, Rise, STEP } from "../ui";

/** Постеры тоннеля: рилсы, смонтированные агентом, и девять стилей монтажа. */
export const TUNNEL_REELS = ["mcp", "papka", "google10", "podarok", "zashita"].map((r) => ({ poster: `/montage/reels/${r}.jpg` }))
  .concat(["prism", "orbit", "trace", "pulse", "glass", "portrait", "apple", "podcast", "expert"].map((s) => ({ poster: `/montage/styles/${s}.jpg` })));

/**
 * 1 ✦ Обложка, ночная: фоном тоннель из рилсов (сам гаснет к зоне камеры), слева на тёмном поле —
 * крупный заголовок, строка про агента и менеджера и чипы даты. Счётчик 107 237 живёт на слайде 30.
 */
export function M_Cover() {
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="night"><ReelTunnel3D reels={TUNNEL_REELS} /></MontageBg>}>
      <div style={{ maxWidth: "31cqw" }}>
        <Rise><Logo night height="1.8cqw" style={{ marginBottom: "3cqw" }} /></Rise>
        <Rise delay={STEP}><Kicker color={T.gold}>Эфир · Vibe Production</Kicker></Rise>
        <Rise delay={STEP * 2}><H size="4.6cqw" color={T.nightText} style={{ lineHeight: 1.04 }}>Рилсы без знаний <Em night>монтажа</Em></H></Rise>
        <Rise delay={STEP * 3}><Lead color={T.nightMuted} style={{ marginTop: "1.8cqw", fontSize: "1.35cqw" }}>Монтирует ИИ-агент по вашему голосу. Заявки с рилсов обрабатывает ИИ-менеджер.</Lead></Rise>
        <Rise delay={STEP * 4} className="flex flex-wrap gap-[0.6cqw]" style={{ marginTop: "2.4cqw" }}>
          <Chip night>Четверг, 1 октября</Chip><Chip gold>20:00</Chip><Chip night>3 урока за вечер</Chip>
        </Rise>
      </div>
    </SlideLayout>
  );
}

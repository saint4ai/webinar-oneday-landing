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
        {/* 08.10 Александр: воркшоп только про AI-монтаж, акцент на блог без лица (раньше здесь были презентация и сайт) */}
        <Rise delay={STEP * 3}><Lead color={T.nightMuted} style={{ marginTop: "1.8cqw", fontSize: "1.35cqw" }}>
          <span style={{ color: T.nightText }}>ИИ-агент монтирует рилсы по вашему голосу.</span> Можно без монтажёра и без лица в кадре.
        </Lead></Rise>
        <Rise delay={STEP * 4} className="flex flex-wrap gap-[0.6cqw]" style={{ marginTop: "2cqw" }}>
          {/* без конкретной даты: Александр 06.10 «просто сегодня в 20:00» */}
          <Chip gold>Сегодня в 20:00</Chip><Chip night>Весь путь рилса за вечер</Chip>
        </Rise>
        {/* Призыв к действию, пока зрители подключаются: что сделать сейчас и зачем оставаться до конца (гайды — слайд 58, скидка — 57g) */}
        <Rise delay={STEP * 5} style={{ marginTop: "1.6cqw", borderRadius: 18, padding: "1cqw 1.2cqw", background: "rgba(251,243,228,.06)", border: `1px solid ${T.nightLine}`,
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
          <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.78cqw", letterSpacing: ".14em", textTransform: "uppercase", color: T.gold }}>Что сделать сейчас</div>
          {["Напишите в чат «+» и свою нишу", "Останьтесь до конца: 3 гайда и скидка участникам эфира"].map((t, i) => (
            <div key={t} className="flex items-baseline" style={{ gap: "0.7cqw", marginTop: "0.55cqw", fontFamily: "var(--font-manrope)", fontWeight: 600, fontSize: "1.05cqw", color: T.nightText }}>
              <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, color: T.gold }}>{i + 1}</span>{t}
            </div>
          ))}
        </Rise>
      </div>
    </SlideLayout>
  );
}

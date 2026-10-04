"use client";

import { useEffect, useRef, useState } from "react";
import { MontageBg } from "../MontageBg";
import { Statement } from "../Statement";
import { T } from "../theme";
import { Fill, Note } from "../ui";

/**
 * 00 · Интро-ролик до 2 минут: открывает эфир до обложки. Файл — public/montage/intro.mp4 (page.tsx проверяет, лежит ли он).
 * Старт со звуком — Enter или клик по видео: нажатие считается жестом пользователя, браузер разрешает звук.
 * Пробел и стрелки листают слайды, как везде. Нет файла — ночная заглушка с подсказкой.
 */
export function M_IntroVideo({ src }: { src?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  useEffect(() => {
    if (!src) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); toggle(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [src]);

  if (!src) {
    return (
      <Statement tone="night" kicker="Интро · до 2 минут" title="Здесь откроется ролик, который смонтировал ИИ" size="2.8cqw"
        lead={<>Положите файл в <span style={{ color: T.gold }}>public/montage/intro.mp4</span>. Старт со звуком — Enter или клик по видео.</>}>
        <Note color={T.nightMuted}>На время ролика камеру в OBS скрыть: ролик идёт на весь кадр. <Fill>подтвердить сцену OBS</Fill></Note>
      </Statement>
    );
  }

  return (
    <div className="absolute inset-0" style={{ background: "#000" }}>
      <MontageBg tone="night" />
      <video ref={ref} src={src} preload="auto" playsInline onClick={toggle}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        className="absolute inset-0 pointer-events-auto" style={{ width: "100%", height: "100%", objectFit: "contain", cursor: "pointer", background: "#000" }} />
      <div className="absolute pointer-events-none transition-opacity duration-500"
        style={{ left: "3cqw", bottom: "2.6cqw", opacity: playing ? 0 : 1, fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.9cqw",
          letterSpacing: ".12em", textTransform: "uppercase", color: T.nightMuted }}>
        Enter — старт ролика
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import ThankYouClient from "./ThankYouClient";
import { apiUrl } from "@/lib/api-url";

/**
 * Thank You — клиентский компонент.
 * После сабмита формы ведёт лида в закрытое WhatsApp-СООБЩЕСТВО воркшопа
 * (там ссылка на живой эфир + бонусы).
 *
 * Страница раздаётся статикой (nginx), поэтому актуальную ссылку берём у
 * микросервиса form-api — он читает рантайм-файл, управляемый Telegram-ботом.
 * До ответа показываем боевой фолбэк: страница не мигает и работает даже
 * если сервис недоступен.
 */
const FALLBACK = "https://chat.whatsapp.com/IfLyJvWLo7HDq5yleoKCzz";

export default function ThankYouPage() {
  const [communityHref, setCommunityHref] = useState(FALLBACK);

  useEffect(() => {
    let alive = true;
    fetch(apiUrl("/api/whatsapp-link"), { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { link?: string }) => {
        if (alive && d?.link) setCommunityHref(d.link);
      })
      .catch(() => {}); // сервис недоступен — остаёмся на фолбэке
    return () => {
      alive = false;
    };
  }, []);

  return <ThankYouClient communityHref={communityHref} />;
}

"use client";

import { useCallback, type ComponentProps, type MutableRefObject, type Ref } from "react";

/**
 * Освобождает видео при уходе со слайда. Снятый с страницы <video> сам по себе только ставится на паузу: декодер, буфер и сетевое
 * соединение держатся, пока не пройдёт сборка мусора (замер docs/reports/deck_perf_1009.md: 17 роликов обложки висели отсоединёнными).
 * Здесь: пауза, снять src, load(): браузер сразу бросает загрузку и декодер.
 * Освобождаем с задержкой в один тик и только если элемент уже вне документа: в dev-режиме React на секунду «размонтирует» и
 * снова монтирует тот же узел (StrictMode), тогда видео освобождать нельзя.
 */
export function releaseVideo(v: HTMLVideoElement | null | undefined) {
  if (!v) return;
  try {
    v.pause();
    v.removeAttribute("src");
    v.load();
  } catch {
    /* элемент уже разобран браузером */
  }
}

function assign<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") ref(value);
  else (ref as MutableRefObject<T | null>).current = value;
}

/** Обычный <video> с освобождением при снятии со страницы. videoRef: внешний ref, если нужен (пауза и запуск по клику). */
export function SlideVideo({ videoRef, ...props }: ComponentProps<"video"> & { videoRef?: Ref<HTMLVideoElement> }) {
  const set = useCallback(
    (el: HTMLVideoElement | null) => {
      assign(videoRef, el);
      // Декоративные ролики без звука (петли обложки, телефоны): пока вкладка скрыта, ставим на паузу и не гоним декодер. Ролики со звуком
      // и запускаемые кликом (видеоурок, рилсы) не трогаем: ведущий мог закрыть окно другим, а звук урока должен идти.
      // «Декоративный» проверяем в момент скрытия: если ведущий включил звук (клик по ролику), ролик не трогаем.
      const decor = !!el && el.autoplay;
      let wasPlaying = false;
      const onVis = () => {
        if (!el) return;
        if (document.hidden) { if (!el.muted) return; wasPlaying = !el.paused; if (wasPlaying) el.pause(); }
        else if (wasPlaying) { wasPlaying = false; el.play().catch(() => {}); }
      };
      if (decor) document.addEventListener("visibilitychange", onVis);
      return () => {
        if (decor) document.removeEventListener("visibilitychange", onVis);
        assign(videoRef, null);
        if (el) setTimeout(() => { if (!el.isConnected) releaseVideo(el); }, 0);
      };
    },
    [videoRef],
  );
  // eslint-disable-next-line jsx-a11y/media-has-caption
  return <video {...props} ref={set} />;
}

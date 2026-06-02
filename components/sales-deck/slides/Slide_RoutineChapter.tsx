"use client";

import { CyberpunkChapter } from "../CyberpunkChapter";

/**
 * Chapter — Claude Code для оптимизации рабочей рутины.
 * Вставлен ПЕРЕД Slide_81_RoutineTransition (R3-84): обозначает новую главу, потом слайд вводит в тему.
 * Cyberpunk glitch-заход (memory/feedback_chapter_screen_cyberpunk_animation.md).
 */
export function Slide_RoutineChapter() {
  return (
    <CyberpunkChapter
      chapterNumber="ЕЩЁ НЕ ВСЁ"
      subtitle="Обучение — это навык собирать сервисы на продажу. Но тот же Claude Code закрывает до 70% твоей собственной рутины уже сейчас: отчёты, КП, аналитика, переписки. Сейчас покажу как"
    />
  );
}

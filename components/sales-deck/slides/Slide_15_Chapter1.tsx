"use client";

import { CyberpunkChapter } from "../CyberpunkChapter";
import { ClaudeCodeTerminal } from "../ClaudeCodeTerminal";

/**
 * Слайд 15 · Chapter screen — «ГЛАВА 1»
 *
 * 📌 ПРАВИЛО: memory/feedback_chapter_screen_cyberpunk_animation.md
 * CYBERPUNK GLITCH-ЗАХОД (1.5-2 сек). Scan lines + RGB-split + 6-8 микро-сдвигов + затухание.
 * → Резкий CUT в Slide 16 без exit-fade.
 *
 * АЛЕКСАНДР: «Большая надпись по центру, ноутбук с кодом справа. (делаем имитацию
 *  claude code terminal в котором циклично делаются запросы в ИИ человеком с анимацией
 *  логотипа человечка claude code вставь анимацию с этого кода
 *  projects/claude_mascot_animations/pixel/mascot.html и печатается исполнение кода
 *  ИИ после запроса типо "напиши мне приложение для дашборда аналитики учёта склада")»
 *
 * Реализация:
 *  - CyberpunkChapter — glitch заголовок + scan lines + water shader на фоне
 *  - ClaudeCodeTerminal справа — typewriter промпта пользователя
 *  - TODO: добавить pixel-маскот как iframe (`/mascot/index.html`)
 */
export function Slide_15_Chapter1() {
  return (
    <CyberpunkChapter
      chapterNumber="ГЛАВА 1"
      subtitle="Что такое вайбкодинг и зачем нам это нужно"
      leftContent={
        <ClaudeCodeTerminal
          prompt="напиши мне приложение для дашборда аналитики учёта склада"
          response="Собираю приложение: экран складских остатков, графики, фильтр по датам. Готово через пару минут..."
          speed={42}
        />
      }
    />
  );
}

"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SlideLayoutProps {
  /** 3D-объект / видео / скриншот / null. Если null — колонка не создаётся. */
  leftObject?: ReactNode;
  /** Контентная зона (текст слайда). */
  children: ReactNode;
  /** Где зона спикера ("right" по умолчанию — Александр стоит справа). */
  speakerSide?: "right" | "left";
  /** Ширина колонки 3D-объекта. По умолчанию 30vw (раньше было 40vw — слишком жадно). */
  objectColumnSize?: string;
  /** Минимальная ширина текстовой колонки в px. По умолчанию 480px. */
  contentMinWidth?: number;
  /** Фоновые элементы — Spotlight'ы, LiquidBackground, scan-lines и т.п. Идут ПОД сеткой. */
  background?: ReactNode;
  className?: string;
  /** Класс контентной колонки (для justify-content и т.п.). */
  contentClassName?: string;
  /** Inline-стили на корневую секцию. */
  style?: React.CSSProperties;
  /**
   * Overflow колонки leftObject. По умолчанию "hidden" (обрезает по границе).
   * Поставь "visible" если glow/тень объекта должны свободно растекаться под
   * текстовую колонку (Slide 4 подарок, Slide 6 вопрос).
   */
  objectOverflow?: "hidden" | "visible";
}

/**
 * SlideLayout — единственный правильный способ верстать слайды презы.
 *
 * Использует CSS Grid с тремя колонками:
 *   [leftObject?] [content (flex)] [speaker | (зона спикера)]
 *
 * Грид сам распределяет ширину — никаких absolute+padding конфликтов.
 * minmax(380px, 1fr) гарантирует что текст НИКОГДА не сплющится меньше 380px.
 *
 * Правило: ВСЕ новые слайды презы делаются ТОЛЬКО через SlideLayout.
 * Подробности: ~/.claude/projects/-Users-miso-Desktop-onAI-Workspace/memory/feedback_slide_layout_grid_rule.md
 *
 * @example
 * <SlideLayout
 *   background={<><Spotlight fill="#B6FF00" /><LiquidBackground variant="mesh" /></>}
 *   leftObject={<BrowserWindow3D>...</BrowserWindow3D>}
 *   speakerSide="right"
 * >
 *   <h1>...</h1>
 *   <p>...</p>
 * </SlideLayout>
 */
export function SlideLayout({
  leftObject,
  children,
  speakerSide = "right",
  objectColumnSize = "30vw",
  contentMinWidth = 480,
  background,
  className,
  contentClassName,
  style,
  objectOverflow = "hidden",
}: SlideLayoutProps) {
  const hasLeft = !!leftObject;
  const objCol = hasLeft ? objectColumnSize : "0px";
  const objOverflowClass = objectOverflow === "visible" ? "overflow-visible" : "overflow-hidden";
  const speakerCol = "var(--sd-speaker-zone, 30vw)";
  const contentCol = `minmax(${contentMinWidth}px, 1fr)`;

  const cols = speakerSide === "right"
    ? `${objCol} ${contentCol} ${speakerCol}`
    : `${speakerCol} ${contentCol} ${objCol}`;

  return (
    <section
      className={cn(
        "relative w-screen h-screen overflow-hidden bg-black",
        className
      )}
      style={style}
    >
      {/* Фоновые элементы — под gridom, не мешают раскладке */}
      {background}

      {/* Grid из 3 колонок — ВСЕГДА 3 div'а (иначе колонки сдвигаются) */}
      <div
        className="relative z-10 grid w-full h-full"
        style={{ gridTemplateColumns: cols }}
      >
        {/* Колонка 1 — leftObject если speakerSide=right, иначе пустая зона спикера */}
        {speakerSide === "right" ? (
          hasLeft ? (
            <div className={cn("relative flex items-center justify-center", objOverflowClass)}>
              {leftObject}
            </div>
          ) : (
            <div />
          )
        ) : (
          <div /> /* speaker zone left */
        )}

        {/* Колонка 2 — контент (центр) */}
        <div
          className={cn(
            "relative flex flex-col justify-center min-w-0",
            contentClassName
          )}
          style={{ padding: "32px 56px" }}
        >
          {children}
        </div>

        {/* Колонка 3 — пустая зона спикера если speakerSide=right, иначе leftObject */}
        {speakerSide === "right" ? (
          <div /> /* speaker zone right */
        ) : hasLeft ? (
          <div className={cn("relative flex items-center justify-center", objOverflowClass)}>
            {leftObject}
          </div>
        ) : (
          <div />
        )}
      </div>
    </section>
  );
}

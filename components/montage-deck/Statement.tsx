"use client";

import { ReactNode } from "react";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { MontageBg, type Tone } from "./MontageBg";
import { T } from "./theme";
import { H, Kicker, Lead, Px, Rise, STEP } from "./ui";

/**
 * Базовый слайд деки: кикер, заголовок, подводка и блок ниже — всё в левых 60%, правые 40% — фон под камеру.
 * tone="night" — ночной слайд сайта (#14100E, текст #FBF3E4, акцент золотом); "ink" — старое имя того же.
 */
export function Statement({ kicker, title, lead, children, tone = "paper", size = "2.9cqw", left, leftSize = "24cqw", leftOverflow = "visible", obj, objSize = "9cqw" }: {
  obj?: string; objSize?: string; kicker?: ReactNode; title: ReactNode; lead?: ReactNode; children?: ReactNode; tone?: Tone | "ink"; size?: string;
  left?: ReactNode; leftSize?: string; leftOverflow?: "hidden" | "visible";
}) {
  const night = tone === "night" || tone === "ink";
  return (
    // contentMinWidth 0: текстовая колонка всегда ровно до границы зоны камеры (60%), в узком окне не вылезает за линию
    <SlideLayout className="bg-transparent" background={<MontageBg tone={tone} />} leftObject={left} objectColumnSize={leftSize} objectOverflow={leftOverflow} contentMinWidth={0}>
      {obj && <Px name={obj} size={objSize} style={{ marginBottom: "0.4cqw", marginLeft: "-0.9cqw" }} />}
      {kicker && <Rise><Kicker color={night ? T.gold : T.accent}>{kicker}</Kicker></Rise>}
      <Rise delay={STEP}><H size={size} color={night ? T.nightText : T.brown}>{title}</H></Rise>
      {lead && <Rise delay={STEP * 2}><Lead color={night ? T.nightMuted : T.muted} style={{ marginTop: "1.3cqw", maxWidth: "46cqw" }}>{lead}</Lead></Rise>}
      {children && <Rise delay={STEP * 3} style={{ marginTop: "2cqw" }}>{children}</Rise>}
    </SlideLayout>
  );
}

"use client";

import { ReactNode } from "react";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { MontageBg } from "./MontageBg";
import { T } from "./theme";
import { H, Kicker, Lead, Px, Rise } from "./ui";

/**
 * Базовый слайд деки: кикер, заголовок, подводка и блок ниже.
 * tone="ink" — тёмный слайд с золотом (цена, решение).
 */
export function Statement({ kicker, title, lead, children, tone = "paper", size = "2.9cqw", left, leftSize = "24cqw", leftOverflow = "visible", obj, objSize = "9cqw" }: {
  obj?: string; objSize?: string; kicker?: ReactNode; title: ReactNode; lead?: ReactNode; children?: ReactNode; tone?: "paper" | "soft" | "ink"; size?: string;
  left?: ReactNode; leftSize?: string; leftOverflow?: "hidden" | "visible";
}) {
  const dark = tone === "ink";
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone={tone} />} leftObject={left} objectColumnSize={leftSize} objectOverflow={leftOverflow}>
      {obj && <Px name={obj} size={objSize} style={{ marginBottom: "0.4cqw", marginLeft: "-0.9cqw" }} />}
      {kicker && <Rise><Kicker color={dark ? T.gold : T.accent}>{kicker}</Kicker></Rise>}
      <Rise delay={0.08}><H size={size} color={dark ? T.paper : T.ink}>{title}</H></Rise>
      {lead && <Rise delay={0.16}><Lead color={dark ? "rgba(251,248,243,.72)" : T.muted} style={{ marginTop: "1.3cqw", maxWidth: "46cqw" }}>{lead}</Lead></Rise>}
      {children && <Rise delay={0.26} style={{ marginTop: "2cqw" }}>{children}</Rise>}
    </SlideLayout>
  );
}

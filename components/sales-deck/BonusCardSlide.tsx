"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SlideBg } from "./SlideBg";
import { SlideLayout } from "./SlideLayout";
import { Gift, Check, ImageIcon } from "lucide-react";
import { BonusPriceReveal } from "./BonusPriceReveal";

/**
 * BonusCardSlide — слайд бонуса за предоплату (Б-1/Б-2/Б-3). DL-7 premium offer.
 * Слева — слот под Higgsfield-карточку (glassmorphism), справа — что внутри + лайм-панч.
 * Higgsfield-карточки генерим позже (см. inline-пометку в слайде).
 */
export interface BonusCardSlideProps {
  badge: string;     // "БОНУС Б-1"
  title: string;     // "КУРС «CLAUDE CODE · БАЗОВЫЙ»"
  sub: string;
  inside: string[];  // что внутри / что забираешь
  limeBlock: string;
  slotLabel: string; // подпись слота под Higgsfield-карточку
  condition?: string; // "за предоплату" | "за полную оплату до конца дня"
  cardImage?: string; // путь к готовой 3D-карточке; задан → рендерим её вместо плейсхолдера + скрываем H1 (заголовок уже на карточке)
  marketPrice?: string; // рыночная цена бонуса → зачёрк → «Бесплатно» (BonusPriceReveal)
}

export function BonusCardSlide({ badge, title, sub, inside, limeBlock, slotLabel, condition = "за предоплату", cardImage, marketPrice }: BonusCardSlideProps) {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="30vw"
      contentMinWidth={480}
      background={<SlideBg theme="dark" variant="climax" />}
      leftObject={
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
          className="relative w-full rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-2 text-center"
          style={{ aspectRatio: "4 / 5", border: cardImage ? "1px solid rgba(182,255,0,0.3)" : "1px dashed rgba(182,255,0,0.32)", background: cardImage ? "#ffffff" : "rgba(182,255,0,0.03)", boxShadow: cardImage ? "0 30px 80px -30px rgba(0,0,0,0.55), 0 0 60px -26px rgba(182,255,0,0.3)" : "none" }}
        >
          {cardImage ? (
            <Image src={cardImage} alt={title} fill sizes="34vw" className="object-cover" priority />
          ) : (
            <>
              <Gift className="w-9 h-9 text-[#B6FF00]/60" strokeWidth={1.6} />
              <span className="text-white/45 text-xs font-mono uppercase tracking-[0.1em] px-4 leading-snug">{slotLabel}</span>
              <span className="text-white/25 text-[13px]">премиум-3D карточка · добавим</span>
            </>
          )}
        </motion.div>
      }
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-3 self-start" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)" }}>
        <Gift className="w-3.5 h-3.5 text-[#B6FF00]" strokeWidth={2.2} />
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] font-bold text-[#B6FF00]">{badge} · {condition}</span>
      </motion.div>
      {!cardImage && (
        <motion.h1
          initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
          className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
          style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 3vw, 44px)" }}
        >
          {title}
        </motion.h1>
      )}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="text-white/65 text-sm md:text-base leading-snug max-w-xl mb-4">
        {sub}
      </motion.div>

      {marketPrice && <BonusPriceReveal marketPrice={marketPrice} />}

      <div className="flex flex-col gap-2 max-w-xl mb-4">
        {inside.map((r, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.5 + i * 0.12 }} className="flex items-start gap-2.5">
            <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#B6FF00]" strokeWidth={2.8} />
            <span className="text-white/80 text-sm md:text-base leading-snug">{r}</span>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.5 + inside.length * 0.12 }} className="inline-block rounded-xl px-4 py-3 max-w-xl" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)", boxShadow: "0 0 50px -18px rgba(182,255,0,0.5)" }}>
        <span className="text-white text-sm md:text-base font-semibold leading-snug">{limeBlock}</span>
      </motion.div>
    </SlideLayout>
  );
}

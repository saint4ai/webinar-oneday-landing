"use client";

import { motion } from "framer-motion";
import { Gift, Star } from "lucide-react";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 7 · Engagement — «КАК ВАМ БОНУСЫ?»
 * Игривый вау-слайд: большой подарок покачивается + конфетти/подарки летят по всему экрану.
 * CTA — написать «хочу» в чат, чтобы забрать бонусы. Без «бонусы за просмотр до конца».
 */
const LIME = "#B6FF00";
const ORANGE = "#FC5C02";

// Конфетти/подарки — фиксированные позиции (детерминизм) + непрерывный дрейф.
const CONFETTI = [
  { left: "5%", top: "16%", s: 22, c: LIME, d: 0.0, t: 3.4, kind: "gift" },
  { left: "17%", top: "64%", s: 13, c: ORANGE, d: 0.5, t: 4.0, kind: "sq" },
  { left: "31%", top: "22%", s: 11, c: LIME, d: 0.9, t: 3.1, kind: "dot" },
  { left: "41%", top: "80%", s: 19, c: ORANGE, d: 0.3, t: 3.7, kind: "star" },
  { left: "53%", top: "12%", s: 12, c: LIME, d: 1.1, t: 4.2, kind: "sq" },
  { left: "64%", top: "72%", s: 17, c: LIME, d: 0.7, t: 3.5, kind: "gift" },
  { left: "73%", top: "20%", s: 10, c: ORANGE, d: 1.3, t: 3.9, kind: "dot" },
  { left: "86%", top: "58%", s: 14, c: ORANGE, d: 0.2, t: 4.1, kind: "star" },
  { left: "91%", top: "32%", s: 12, c: LIME, d: 0.8, t: 3.3, kind: "sq" },
  { left: "47%", top: "47%", s: 9, c: LIME, d: 1.5, t: 3.6, kind: "dot" },
  { left: "25%", top: "40%", s: 10, c: ORANGE, d: 0.6, t: 4.3, kind: "dot" },
  { left: "80%", top: "84%", s: 15, c: LIME, d: 1.0, t: 3.2, kind: "sq" },
];

function Particle({ p }: { p: (typeof CONFETTI)[number] }) {
  let el;
  if (p.kind === "gift") el = <Gift style={{ width: p.s, height: p.s, color: p.c }} strokeWidth={2.2} />;
  else if (p.kind === "star") el = <Star style={{ width: p.s, height: p.s, color: p.c, fill: p.c }} strokeWidth={1} />;
  else if (p.kind === "sq") el = <div style={{ width: p.s, height: p.s, background: p.c, borderRadius: 2 }} />;
  else el = <div style={{ width: p.s, height: p.s, background: p.c, borderRadius: "50%" }} />;
  return (
    <motion.div
      className="absolute"
      style={{ left: p.left, top: p.top, filter: `drop-shadow(0 0 8px ${p.c}66)` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 1], scale: 1, y: [0, -16, 0], rotate: [0, 14, -10, 0] }}
      transition={{
        opacity: { duration: 0.5, delay: 0.2 + p.d * 0.25 },
        scale: { duration: 0.5, delay: 0.2 + p.d * 0.25, ease: [0.34, 1.5, 0.64, 1] },
        y: { duration: p.t, repeat: Infinity, ease: "easeInOut", delay: p.d },
        rotate: { duration: p.t, repeat: Infinity, ease: "easeInOut", delay: p.d },
      }}
    >
      {el}
    </motion.div>
  );
}

export function Slide_06_PollBonus() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="22cqw"
      objectOverflow="visible"
      background={
        <>
          <Spotlight className="-top-40 right-0 md:right-20 md:-top-20" fill="#B6FF00" />
          <Spotlight className="bottom-0 left-[10cqw] md:bottom-[-20cqh]" fill="#FC5C02" />
          <div className="absolute inset-0 pointer-events-none">
            {CONFETTI.map((p, i) => (
              <Particle key={i} p={p} />
            ))}
          </div>
        </>
      }
      leftObject={
        <div className="relative flex items-center justify-center w-full h-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.4, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.34, 1.5, 0.64, 1] }}
          >
            <motion.div
              animate={{ rotate: [0, -6, 6, -3, 0], y: [0, -12, 0] }}
              transition={{
                rotate: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <Gift
                style={{ width: "clamp(150px, 19cqw, 300px)", height: "auto", color: LIME, filter: "drop-shadow(0 0 55px rgba(182,255,0,0.55))" }}
                strokeWidth={1.4}
              />
            </motion.div>
          </motion.div>
        </div>
      }
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#FC5C02] mb-4">
        // ну что, зашло?
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, scale: 0.82 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 190, damping: 12, delay: 0.2 }}
        className="font-bold uppercase text-white leading-[0.95] tracking-[-0.03em] mb-6"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(32px, 4.0cqw, 74px)" }}
      >
        КАК ВАМ
        <br />
        <span className="text-[#B6FF00]">БОНУСЫ?</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="text-white/80 text-lg md:text-2xl leading-snug max-w-xl">
        Напиши{" "}
        <motion.span
          animate={{ scale: [1, 1.07, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block font-bold text-black px-[0.3em] py-[0.04em] rounded-lg"
          style={{ background: "#B6FF00", boxShadow: "0 0 30px rgba(182,255,0,0.5)", fontFamily: "var(--font-benzin), system-ui" }}
        >
          ХОЧУ
        </motion.span>{" "}
        в чат — и заберёшь все три.
      </motion.div>
    </SlideLayout>
  );
}

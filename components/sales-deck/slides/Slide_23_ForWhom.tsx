"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 27 · Это для кого — «КОМУ ВАЙБКОДИНГ ПОДХОДИТ».
 * 5 LEGO-человечков (Higgsfield nano_banana_2 Pro, глянцевый ABS) по ролям + подпись.
 */
const ROLES = [
  { img: "/cards-gifs-screenshots/roles/entrepreneur.png", t: "Предпринимателю", s: "с идеей сервиса" },
  { img: "/cards-gifs-screenshots/roles/marketer.png", t: "Маркетологу", s: "для работы и своих продуктов" },
  { img: "/cards-gifs-screenshots/roles/office.png", t: "Офисному сотруднику", s: "с рабочей рутиной" },
  { img: "/cards-gifs-screenshots/roles/designer.png", t: "Дизайнеру", s: "добавить разработку" },
  { img: "/cards-gifs-screenshots/roles/enthusiast.png", t: "Энтузиасту", s: "кто хочет свой продукт" },
];

export function Slide_23_ForWhom() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={900}
      background={<Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />}
      contentClassName="justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // ДЛЯ КОГО
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-6"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.4cqw, 50px)" }}
      >
        КОМУ ВАЙБКОДИНГ <span className="text-[#B6FF00]">ПОДХОДИТ</span>
      </motion.h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "14px" }} className="w-full max-w-[1120px]">
        {ROLES.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.45 + i * 0.12, ease: [0.34, 1.3, 0.64, 1] }}
            className="flex flex-col"
          >
            <div
              className="relative w-full rounded-2xl overflow-hidden"
              style={{ aspectRatio: "4 / 5", background: "#0d0f0a", border: "1px solid rgba(182,255,0,0.18)", boxShadow: "0 20px 50px -28px rgba(0,0,0,0.7), 0 0 40px -24px rgba(182,255,0,0.35)" }}
            >
              <Image src={r.img} alt={r.t} fill sizes="18cqw" className="object-cover" priority={i < 3} />
            </div>
            <div className="mt-2.5 text-center px-1">
              <div className="text-white font-semibold text-[13px] md:text-[15px] leading-tight">{r.t}</div>
              <div className="text-white/50 text-[11px] md:text-[13px] leading-snug mt-0.5">{r.s}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </SlideLayout>
  );
}

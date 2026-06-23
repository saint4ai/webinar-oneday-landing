"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

/**
 * IPhoneCarousel — рамка iPhone с авто-свайп каруселью скринов приложения внутри.
 * Под кейс Amana BURAQ (демо-MVP инвест-приложения). Экраны 1284×2580 (9:19.5), object-cover.
 */
export function IPhoneCarousel({ images, interval = 1800 }: { images: string[]; interval?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % images.length), interval);
    return () => clearInterval(id);
  }, [images.length, interval]);

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center gap-3">
      {/* Рамка iPhone */}
      <div
        className="relative h-[78cqh] aspect-[9/19.5] rounded-[3rem] p-[10px]"
        style={{ background: "linear-gradient(160deg,#1c1c1f,#0a0a0b)", boxShadow: "0 40px 90px -30px rgba(0,0,0,0.8), 0 0 0 2px rgba(255,255,255,0.06), inset 0 0 2px rgba(255,255,255,0.2)" }}
      >
        {/* Экран */}
        <div className="relative h-full w-full rounded-[2.3rem] overflow-hidden" style={{ background: "#000" }}>
          <AnimatePresence>
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 44 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -44 }}
              transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0"
            >
              <Image src={images[i]} alt={`Экран приложения ${i + 1}`} fill sizes="28cqw" className="object-cover" priority={i === 0} />
            </motion.div>
          </AnimatePresence>
          {/* Dynamic Island */}
          <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[34%] h-[3.2%] rounded-full z-10" style={{ background: "#000" }} />
        </div>
      </div>

      {/* Точки-индикаторы */}
      <div className="flex items-center gap-1.5">
        {images.map((_, idx) => (
          <div key={idx} className="rounded-full transition-all duration-300" style={{ width: idx === i ? 18 : 6, height: 6, background: idx === i ? "#B6FF00" : "rgba(255,255,255,0.25)" }} />
        ))}
      </div>
    </div>
  );
}

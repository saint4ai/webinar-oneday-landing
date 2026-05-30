"use client";

import { motion } from "framer-motion";

/**
 * GiftBox3D — изометрический подарок: тёмная коробка + лайм-ленты + бант + glow.
 * SVG-рендер (легковесно, контролируемо, без зависимости от Higgsfield-ассетов).
 *
 * Used by: Slide_04_BonusAnnounce.
 */
export function GiftBox3D({ size = 360 }: { size?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
      style={{ width: size, height: size, perspective: "1400px" }}
      className="relative"
    >
      {/* Лайм-glow за подарком — компактный, не вылазит за пределы контейнера */}
      <div
        className="absolute inset-[20%] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(182,255,0,0.25) 0%, transparent 70%)",
          filter: "blur(32px)",
        }}
      />

      {/* Плавающий float + лёгкий tilt по Y */}
      <motion.div
        animate={{
          y: [0, -14, 0],
          rotateY: [-6, 6, -6],
        }}
        transition={{
          y: { duration: 4.5, ease: "easeInOut", repeat: Infinity },
          rotateY: { duration: 7, ease: "easeInOut", repeat: Infinity },
        }}
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        <svg
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_30px_60px_rgba(182,255,0,0.45)]"
        >
          <defs>
            {/* Тёмная подложка коробки */}
            <linearGradient id="boxFront" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1a1a" />
              <stop offset="100%" stopColor="#0a0a0a" />
            </linearGradient>
            <linearGradient id="boxTop" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#262626" />
              <stop offset="100%" stopColor="#131313" />
            </linearGradient>
            <linearGradient id="boxSide" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0d0d0d" />
              <stop offset="100%" stopColor="#1f1f1f" />
            </linearGradient>
            {/* Лайм-ленты */}
            <linearGradient id="ribbonLime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D7FF4D" />
              <stop offset="50%" stopColor="#B6FF00" />
              <stop offset="100%" stopColor="#86C200" />
            </linearGradient>
            <linearGradient id="ribbonHighlight" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <filter id="bowGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {/* === КОРОБКА (нижняя часть) === */}
          {/* Боковая грань */}
          <path d="M 90 200 L 90 320 L 220 360 L 220 240 Z" fill="url(#boxSide)" />
          {/* Передняя грань */}
          <path d="M 220 240 L 220 360 L 360 320 L 360 200 Z" fill="url(#boxFront)" />
          {/* Верхняя грань (крышка) */}
          <path d="M 90 200 L 220 240 L 360 200 L 230 160 Z" fill="url(#boxTop)" />

          {/* === КРЫШКА (lift slightly) === */}
          <path d="M 80 195 L 75 215 L 220 255 L 220 235 Z" fill="#1f1f1f" />
          <path d="M 220 235 L 220 255 L 370 215 L 370 195 Z" fill="#141414" />
          <path d="M 80 195 L 220 235 L 370 195 L 230 155 Z" fill="#2a2a2a" />

          {/* === ЛЕНТЫ === */}
          {/* Вертикальная лента (фронт + крышка) */}
          <path d="M 200 240 L 200 360 L 240 351 L 240 245 Z" fill="url(#ribbonLime)" />
          <path d="M 200 240 L 240 245 L 250 211 L 210 200 Z" fill="url(#ribbonLime)" opacity="0.95" />

          {/* Горизонтальная лента — пересекает фронт */}
          <path d="M 220 275 L 220 305 L 360 270 L 360 240 Z" fill="url(#ribbonLime)" />
          <path d="M 90 235 L 90 265 L 220 305 L 220 275 Z" fill="url(#ribbonLime)" opacity="0.9" />

          {/* Подсветка по центру ленты */}
          <rect x="207" y="240" width="26" height="120" fill="url(#ribbonHighlight)" opacity="0.25" />

          {/* === БАНТ === */}
          <g filter="url(#bowGlow)" opacity="0.35">
            <circle cx="220" cy="155" r="50" fill="#B6FF00" />
          </g>
          {/* Левая петля банта */}
          <path
            d="M 220 175 Q 170 145 165 110 Q 165 90 195 100 Q 215 115 220 145 Z"
            fill="url(#ribbonLime)"
            stroke="#D7FF4D"
            strokeWidth="1"
          />
          {/* Правая петля банта */}
          <path
            d="M 220 175 Q 270 145 275 110 Q 275 90 245 100 Q 225 115 220 145 Z"
            fill="url(#ribbonLime)"
            stroke="#D7FF4D"
            strokeWidth="1"
          />
          {/* Центральный узел банта */}
          <ellipse cx="220" cy="160" rx="14" ry="18" fill="#86C200" />
          <ellipse cx="220" cy="155" rx="10" ry="14" fill="#B6FF00" />
          {/* Хвостики ленты вниз */}
          <path
            d="M 215 178 Q 200 200 205 230 L 218 233 Q 220 205 220 180 Z"
            fill="url(#ribbonLime)"
            opacity="0.95"
          />
          <path
            d="M 225 178 Q 240 200 235 230 L 222 233 Q 220 205 220 180 Z"
            fill="url(#ribbonLime)"
            opacity="0.95"
          />

          {/* Блик на коробке (отражение света) */}
          <path
            d="M 220 245 L 240 248 L 250 215 L 230 210 Z"
            fill="rgba(255,255,255,0.06)"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}

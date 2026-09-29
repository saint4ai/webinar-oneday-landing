"use client";

import { useReducedMotion } from "framer-motion";
import { B, MANROPE } from "./brand";

/**
 * Скриншот-доказательство на объёмной белой плите, как карточки сайта: въезжает из глубины с разворотом,
 * по плите проходит золотой блик, под ней — тёплая тень и золотой свет. Потом плита еле заметно парит.
 * Нет src — та же плита с пунктирным местом и подписью empty: видно, куда ляжет скрин.
 * Занимает весь родитель; картинка вписывается целиком (contain), ничего не обрезается.
 */
export function ScreenStage3D({ src, alt, empty }: { src?: string; alt: string; empty: string }) {
  const reduce = useReducedMotion();
  const plate = (
    <div className="absolute inset-0 overflow-hidden" style={{
      borderRadius: "1.2cqw", background: `linear-gradient(160deg, ${B.paper} 55%, ${B.card})`,
      boxShadow: `0 0 0 1px ${B.line}, inset 0 1px 0 ${B.paper}`,
    }}>
      {src ? (
        <img src={src} alt={alt} draggable={false} style={{ position: "absolute", inset: "4%", width: "92%", height: "92%", objectFit: "contain" }} />
      ) : (
        <div className="absolute flex items-center justify-center text-center" style={{
          inset: "6%", border: `2px dashed ${B.brownLt}8C`, borderRadius: "0.8cqw", padding: "2cqw", background: `${B.card}99`,
          fontFamily: MANROPE, fontWeight: 600, fontSize: "0.95cqw", lineHeight: 1.5, color: B.muted,
        }}>{empty}</div>
      )}
      {!reduce && <div className="absolute inset-0" style={{
        background: `linear-gradient(105deg, transparent 30%, ${B.gold}38 45%, transparent 60%)`,
        backgroundSize: "250% 100%", backgroundRepeat: "no-repeat", animation: "ss-glare 1.8s ease-out 0.9s both",
      }} />}
    </div>
  );

  return (
    <div className="relative h-full w-full">
      <style>{`
        @keyframes ss-in { from { transform: rotateY(-38deg) rotateX(14deg) translateZ(-18cqw); opacity: 0; } to { transform: rotateY(-12deg) rotateX(5deg); opacity: 1; } }
        @keyframes ss-float { 0%, 100% { translate: 0 0; } 50% { translate: 0 -0.5cqw; } }
        @keyframes ss-glare { from { background-position: 160% 0; } to { background-position: -60% 0; } }
      `}</style>
      {/* Золотой свет и тёплая тень под плитой */}
      <div className="absolute" style={{
        left: "4%", right: "4%", bottom: "-8%", height: "16%", filter: "blur(2cqw)",
        background: `radial-gradient(closest-side, ${B.gold}73, transparent)`,
      }} />
      <div className="absolute" style={{
        left: "10%", right: "10%", bottom: "-3%", height: "8%", filter: "blur(1.2cqw)",
        background: "radial-gradient(closest-side, rgba(42,33,28,.28), transparent)",
      }} />
      <div className="absolute inset-0" style={{ perspective: "80cqw", animation: reduce ? undefined : "ss-float 6s ease-in-out 1.4s infinite" }}>
        <div className="absolute inset-0" style={{
          transformStyle: "preserve-3d", transformOrigin: "40% 50%", transform: "rotateY(-12deg) rotateX(5deg)",
          animation: reduce ? undefined : "ss-in 1.2s cubic-bezier(0.23, 1, 0.32, 1) both",
        }}>
          {/* Толщина плиты: три слоя за лицевой стороной, задний — золотой кант */}
          {[3, 2, 1].map((k) => (
            <div key={k} className="absolute inset-0" style={{
              borderRadius: "1.2cqw", transform: `translateZ(${-k * 0.35}cqw)`,
              background: k === 3 ? B.gold2 : B.card, boxShadow: `0 0 0 1px ${B.line}${k === 3 ? ", 0 2.4cqw 4cqw -1.6cqw rgba(42,33,28,.38)" : ""}`,
            }} />
          ))}
          {plate}
        </div>
      </div>
    </div>
  );
}

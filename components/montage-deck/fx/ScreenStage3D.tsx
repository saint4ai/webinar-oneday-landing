"use client";

import { useReducedMotion } from "framer-motion";

/**
 * Скриншот-доказательство на объёмной стеклянной плите: въезжает из глубины с разворотом,
 * по стеклу проходит блик, под плитой — отражение и свет. Потом плита еле заметно парит.
 * Нет src — та же плита с пунктирным местом и подписью empty: видно, куда ляжет скрин.
 * Занимает весь родитель; картинка вписывается целиком (contain), ничего не обрезается.
 */
export function ScreenStage3D({ src, alt, empty }: { src?: string; alt: string; empty: string }) {
  const reduce = useReducedMotion();
  const plate = (
    <div className="absolute inset-0 overflow-hidden" style={{
      borderRadius: "1.2cqw", background: "linear-gradient(160deg, #161616, #0b0b0b)",
      boxShadow: "0 0 0 1px rgba(255,255,255,.12), inset 0 1px 0 rgba(255,255,255,.18)",
    }}>
      {src ? (
        <img src={src} alt={alt} draggable={false} style={{ position: "absolute", inset: "4%", width: "92%", height: "92%", objectFit: "contain" }} />
      ) : (
        <div className="absolute flex items-center justify-center text-center" style={{
          inset: "6%", border: "2px dashed rgba(182,255,0,.45)", borderRadius: "0.8cqw", padding: "2cqw",
          fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "0.95cqw", lineHeight: 1.5, color: "#A1A1AA",
        }}>{empty}</div>
      )}
      {!reduce && <div className="absolute inset-0" style={{
        background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,.16) 45%, transparent 60%)",
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
      <div className="absolute inset-0" style={{ perspective: "80cqw", animation: reduce ? undefined : "ss-float 6s ease-in-out 1.4s infinite" }}>
        <div className="absolute inset-0" style={{
          transformStyle: "preserve-3d", transformOrigin: "40% 50%", transform: "rotateY(-12deg) rotateX(5deg)",
          animation: reduce ? undefined : "ss-in 1.2s cubic-bezier(0.23, 1, 0.32, 1) both",
        }}>
          {/* Толщина плиты: три слоя за стеклом */}
          {[3, 2, 1].map((k) => (
            <div key={k} className="absolute inset-0" style={{
              borderRadius: "1.2cqw", transform: `translateZ(${-k * 0.35}cqw)`,
              background: k === 3 ? "rgba(182,255,0,.18)" : "#0e0e0e", boxShadow: "0 0 0 1px rgba(255,255,255,.06)",
            }} />
          ))}
          {plate}
        </div>
      </div>
      {/* Свет и отражение под плитой */}
      <div className="absolute" style={{
        left: "8%", right: "8%", bottom: "-7%", height: "12%", filter: "blur(2cqw)",
        background: "radial-gradient(closest-side, rgba(182,255,0,.25), transparent)",
      }} />
    </div>
  );
}

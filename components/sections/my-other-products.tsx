"use client";
import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, BarChart3, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Highlighted } from "@/components/ui/highlighted";
import { GlowingCard } from "@/components/ui/glowing-card";

/**
 * Мои другие продукты — компактные карточки-ссылки на живые SaaS.
 * Только 2 проекта: OmniDash + AI-Таргетолог. Клиентские кейсы здесь не показываем.
 */

type Product = {
  Icon: typeof BarChart3;
  name: string;
  tagline: string;
  description: string;
  meta: { label: string; value: string }[];
  url: string;
  domain: string;
};

const PRODUCTS: Product[] = [
  {
    Icon: BarChart3,
    name: "OmniDash",
    tagline: "сквозная аналитика для бизнеса",
    description:
      "Собирает данные из рекламных кабинетов, CRM и платежей в один дашборд. Бизнес видит реальную прибыль по каждому каналу — без отчётов в Excel.",
    meta: [
      { label: "подписка", value: "150 000 ₸/мес" },
      { label: "клиенты", value: "17 попробовали*" },
    ],
    url: "https://omnidash.kz",
    domain: "omnidash.kz",
  },
  {
    Icon: Megaphone,
    name: "AI-Таргетолог",
    tagline: "автоматизация рекламы + AI-рекомендации",
    description:
      "Самостоятельно запускает рекламные кампании, анализирует метрики и шлёт отчёты в Telegram. Заменяет дорогого таргетолога — подписка вместо ставки.",
    meta: [
      { label: "подписка", value: "49 990 – 99 990 ₸/мес" },
      { label: "клиенты", value: "60+ платящих*" },
    ],
    url: "https://app.aoneagency.kz",
    domain: "app.aoneagency.kz",
  },
];

export const MyOtherProducts = () => {
  return (
    <section
      id="my-products"
      className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-6 pb-8 sm:pb-12"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <div className="section-divider">мои собственные SaaS</div>

        <div className="mt-4 mb-8 sm:mb-12 max-w-2xl">
          <h2
            className="uppercase text-white"
            style={{
              fontFamily:
                "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(22px, 3vw, 40px)",
              lineHeight: 1.4,
              letterSpacing: "-0.01em",
            }}
          >
            Что ещё я собрал{" "}
            <Highlighted
              delay={0.5}
              duration={0.7}
              color="#fc5c02"
              glowRgb="252, 92, 2"
            >
              на вайбкоде
            </Highlighted>
          </h2>
          <p className="mt-4 text-white/65 text-[14px] sm:text-[16px] leading-relaxed">
            Два живых SaaS-сервиса, которые работают в проде прямо сейчас.
            Каждый можно открыть в браузере и потрогать.
          </p>
        </div>

        {/* Карточки-ссылки */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {PRODUCTS.map((p) => (
            <ProductCard key={p.name} product={p} />
          ))}
        </div>
      </motion.div>
    </section>
  );
};

const ProductCard = ({ product }: { product: Product }) => {
  const { Icon, name, tagline, description, meta, url, domain } = product;

  return (
    <GlowingCard className="group">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "relative block p-6 sm:p-8 rounded-[22px] bg-[#0a0a0c]",
          "transition-colors duration-300"
        )}
      >
        {/* Шапка карточки */}
        <div className="flex items-start justify-between gap-4">
          <div className="inline-flex w-11 h-11 rounded-xl bg-[#cdeb52]/10 items-center justify-center border border-[#cdeb52]/15">
            <Icon size={20} strokeWidth={2} className="text-[#cdeb52]" />
          </div>

          <GlowingOpenButton />
        </div>

        {/* Название */}
        <h3
          className="mt-6 uppercase text-white"
          style={{
            fontFamily:
              "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(22px, 2.4vw, 32px)",
            letterSpacing: "-0.01em",
            lineHeight: 1,
          }}
        >
          {name}
        </h3>

        {/* Tagline */}
        <p className="mt-2 text-[13px] sm:text-[14px] text-[#cdeb52]/85 font-mono uppercase tracking-[0.06em]">
          {tagline}
        </p>

        {/* Описание */}
        <p className="mt-4 text-[14px] sm:text-[15px] text-white/65 leading-relaxed">
          {description}
        </p>

        {/* Мета */}
        <div className="mt-5 pt-5 border-t border-white/[0.06] flex flex-wrap gap-x-6 gap-y-3">
          {meta.map((m) => (
            <div key={m.label}>
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
                {m.label}
              </div>
              <div className="text-[13px] sm:text-[14px] font-bold text-white mt-1">
                {m.value}
              </div>
            </div>
          ))}
        </div>

        {/* Домен */}
        <div className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] text-white/40 group-hover:text-white/70 transition-colors">
          <span>→</span>
          <span className="underline underline-offset-4 decoration-white/20 group-hover:decoration-[#cdeb52]">
            {domain}
          </span>
        </div>
      </a>
    </GlowingCard>
  );
};

/* Glowing «открыть» pill — отдельный glow на кнопке */
const GlowingOpenButton = () => (
  <>
    <style jsx>{`
      .gop {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        border-radius: 9999px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        transition: all 0.3s ease;
        z-index: 1;
      }

      .gop::before {
        content: "";
        position: absolute;
        inset: -1.5px;
        border-radius: 9999px;
        background: linear-gradient(
          120deg,
          #fc5c02 0%,
          #ff7424 30%,
          #cdeb52 70%,
          #fc5c02 100%
        );
        background-size: 200% 200%;
        z-index: -1;
        opacity: 0;
        transition: opacity 0.3s ease;
        filter: blur(6px);
        animation: gop-shift 4s linear infinite;
      }

      .gop::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 9999px;
        background: rgba(252, 92, 2, 0.12);
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: -1;
      }

      .group:hover .gop {
        border-color: rgba(252, 92, 2, 0.5);
        background: rgba(252, 92, 2, 0.1);
      }

      .group:hover .gop::before {
        opacity: 0.9;
      }

      .group:hover .gop::after {
        opacity: 1;
      }

      @keyframes gop-shift {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }
    `}</style>
    <span className="gop">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/65 group-hover:text-white">
        открыть
      </span>
      <ArrowUpRight
        size={13}
        strokeWidth={2.5}
        className="text-white/65 group-hover:text-white group-hover:rotate-12 transition-all"
      />
    </span>
  </>
);

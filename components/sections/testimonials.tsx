"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  ImageIcon,
  AlertTriangle,
  Server,
  Dumbbell,
} from "lucide-react";
import { Highlighted } from "@/components/ui/highlighted";
import { withBase } from "@/lib/api-url";

/**
 * Отзывы учеников onAI.academy — реальные проекты в проде.
 * Hormozi-стиль копи: специфика, before/after, конкретный outcome.
 */

type Testimonial = {
  name: string;
  role: string;
  before: string;
  after: string;
  outcome: string;
  full: string;
  screenshot?: string;
  video?: string;
  poster?: string;
  customMedia?: React.ReactNode;
  link?: { label: string; url: string };
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Айдос",
    role: "3 проекта на US-компанию",
    before: "Не писал кода руками.",
    after: "Сдаёт 3 продакшен-проекта американской компании.",
    outcome: "AI PM для Asana + Mining Bot + фитнес-app",
    full:
      "Собрал AI PM для Asana — система сама пишет напоминания, считает KPI и кидает алёрты в Telegram, если просрочки > 50%. Параллельно — GDA Mining Bot на Hexa API с фильтрацией по 10 фермам и зонам. И свой проект — фитнес-app с AI-генерацией 12-недельной программы + Computer Vision для анализа техники через камеру. Стек: Antigravity, Claude Code, n8n MCP.",
    customMedia: <AidosDashboard />,
  },
  {
    name: "Ренат",
    role: "AI-tracker для тренировок",
    before: "Идея сидела в голове.",
    after: "Веб-платформа + Telegram-app в проде.",
    outcome: "Один продукт — два канала входа",
    full:
      "Собрал AI-платформу для отслеживания тренировок. Зашил её в Telegram App, чтобы пользователи могли работать прямо из мессенджера. Параллельно — web-версия для тех, кому удобнее с ПК. Один продукт, два канала входа.",
    screenshot: "/testimonials/renat.avif",
  },
  {
    name: "Мерей",
    role: "CRM для фитнес-тренеров",
    before: "Тренеры держали клиентов в заметках телефона.",
    after: "Запустила GymTrainer — CRM с AI-конструктором программ.",
    outcome: "Календарь + AI-программы + LTV-аналитика",
    full:
      "GymTrainer избавляет тренера от хаоса в заметках и собирает всё управление клиентами в одном месте. Умный календарь с загруженностью, конструктор программ через AI-ассистента, база клиентов с историей и прогрессом, аналитика по LTV / удержанию / новым клиентам.",
    video: "/testimonials/merey.mp4",
    poster: "/testimonials/merey.avif",
  },
  {
    name: "Владислав",
    role: "SaaS для экспедиторов KZ",
    before: "Экспедиторы считали прибыль в Excel — невидно реальной маржи.",
    after: "Запустил SaaS с авто-конвертацией USD по курсу НБ РК.",
    outcome: "Прозрачность реальной прибыли по каждой перевозке",
    full:
      "SaaS-система управления для экспедиторских компаний Казахстана. Закрывает дыру, которую не решают ни Excel, ни общие CRM: прозрачность реальной прибыли по каждой перевозке с автоматическим пересчётом в USD по курсу НБ РК.",
    screenshot: "/testimonials/vladislav-1.avif",
  },
];

export const Testimonials = () => {
  return (
    <section
      id="testimonials"
      className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-6 pb-8 sm:pb-12"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <div className="section-divider">кейсы учеников</div>

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
            Что собирают{" "}
            <Highlighted delay={0.5} duration={0.7}>
              мои ученики
            </Highlighted>
          </h2>
          <p className="mt-4 text-white/65 text-[14px] sm:text-[16px] leading-relaxed">
            Реальные продукты в проде — собрали сами, без команды
            разработчиков.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
          {TESTIMONIALS.map((t, idx) => (
            <TestimonialCard key={t.name} testimonial={t} index={idx} />
          ))}
        </div>
      </motion.div>
    </section>
  );
};

const TestimonialCard = ({
  testimonial,
  index,
}: {
  testimonial: Testimonial;
  index: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const {
    name,
    role,
    before,
    after,
    outcome,
    full,
    screenshot,
    video,
    poster,
    customMedia,
  } = testimonial;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.08 }}
      className="rounded-[22px] bg-[#0a0a0c] border border-white/[0.06] overflow-hidden flex flex-col"
    >
      {/* Media-блок: высота = aspect самого скриншота/видео.
       * Никаких фикс aspect-ratio — карточки разной высоты по контенту.
       */}
      <div className="relative bg-[#050507] border-b border-white/[0.04] overflow-hidden">
        {video ? (
          <video
            src={withBase(video)}
            poster={poster ? withBase(poster) : undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="block w-full h-auto"
            aria-label={`Демо — ${name}`}
          />
        ) : screenshot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={withBase(screenshot)}
            alt={`Проект — ${name}`}
            className="block w-full h-auto"
          />
        ) : customMedia ? (
          customMedia
        ) : (
          <div className="aspect-[4/3] flex flex-col items-center justify-center gap-2 text-white/20">
            <ImageIcon size={28} strokeWidth={1.5} />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
              описание проекта
            </span>
          </div>
        )}

        {/* Decor lime dot */}
        <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-[#cdeb52]/60 z-10" />
      </div>

      <div className="p-5 sm:p-6 flex flex-col gap-4 flex-1">
        {/* Имя + роль */}
        <div>
          <div
            className="uppercase text-white text-[13px] sm:text-[14px] tracking-wider"
            style={{
              fontFamily:
                "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 700,
            }}
          >
            {name}
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/40 mt-1">
            {role}
          </div>
        </div>

        {/* Hormozi: было / стало */}
        <div className="grid grid-cols-2 gap-3 text-[12px] sm:text-[13px]">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
              было
            </div>
            <p className="text-white/55 mt-1.5 leading-snug">{before}</p>
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#cdeb52]/70">
              стало
            </div>
            <p className="text-white/85 mt-1.5 leading-snug">{after}</p>
          </div>
        </div>

        {/* Outcome — конкретная цифра/факт. break-words чтобы не overflow на mobile */}
        <div className="px-3 py-2 rounded-lg bg-[#cdeb52]/[0.07] border border-[#cdeb52]/15 text-[12px] sm:text-[13px] text-[#cdeb52] font-mono leading-snug break-words">
          → {outcome}
        </div>

        {/* Expand button */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-auto inline-flex items-center gap-1.5 text-[11px] sm:text-[12px] font-mono uppercase tracking-[0.14em] text-white/45 hover:text-white transition-colors self-start"
          aria-expanded={expanded}
        >
          {expanded ? "свернуть" : "развернуть"}
          {expanded ? (
            <ChevronUp size={14} strokeWidth={2} />
          ) : (
            <ChevronDown size={14} strokeWidth={2} />
          )}
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="full"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <p className="text-[13px] sm:text-[14px] text-white/65 leading-relaxed pt-2 border-t border-white/[0.06] mt-2">
                {full}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
};

/**
 * Композитный «дашборд» для карточки Айдоса — без реальных скриншотов.
 * 3 мини-блока на 3 его проекта: AI PM Asana / GDA Mining / Fitness AI.
 * Tech-style: mono-шрифты, bento-layout, lime/orange акценты.
 */
function AidosDashboard() {
  return (
  <div className="w-full bg-gradient-to-br from-[#0c0c10] via-[#0a0a0c] to-[#080809] p-4 sm:p-5 font-mono text-[10px] text-white/80">
    {/* Header — tab-bar style */}
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-[#fc5c02]/60" />
        <div className="w-2 h-2 rounded-full bg-[#cdeb52]/60" />
        <div className="w-2 h-2 rounded-full bg-white/15" />
      </div>
      <div className="text-[9px] uppercase tracking-[0.16em] text-white/35 ml-2">
        production / ~/ai-pm
      </div>
    </div>

    {/* Block 1: AI PM для Asana */}
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#cdeb52] text-[10px] uppercase tracking-[0.14em] font-bold">
          ai pm · asana
        </span>
        <span className="text-white/35 text-[9px]">2×/нед · n8n</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-[10px]">
          <AlertTriangle size={11} className="text-[#fc5c02] shrink-0" />
          <span className="text-white/65 truncate">
            просрочки 50%+ → tg alert
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-white/45">KPI / неделя</span>
          <span className="text-[#cdeb52]">87% in-time</span>
        </div>
        <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#cdeb52] to-[#fc5c02]"
            style={{ width: "87%" }}
          />
        </div>
      </div>
    </div>

    {/* Block 2: GDA Mining */}
    <div className="mb-4 pt-3 border-t border-white/[0.04]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#cdeb52] text-[10px] uppercase tracking-[0.14em] font-bold">
          gda mining · 10 ферм
        </span>
        <Server size={11} className="text-white/35" />
      </div>
      <div className="grid grid-cols-5 gap-1 mb-2">
        {["Andy", "Caliche", "Cholla", "Harris", "IWS", "Pacolet", "Ringo", "Union", "Vernon", "Cart."].map(
          (farm, i) => (
            <div
              key={farm}
              className={`text-[8px] text-center py-1 rounded ${i < 8 ? "bg-[#cdeb52]/[0.08] text-[#cdeb52]/80" : "bg-[#fc5c02]/[0.08] text-[#fc5c02]/80"}`}
              title={farm}
            >
              {farm.slice(0, 3)}
            </div>
          ),
        )}
      </div>
      <div className="text-[9px] text-white/40">
        → зона B1 S1 · 24 майнера активны
      </div>
    </div>

    {/* Block 3: Fitness AI */}
    <div className="pt-3 border-t border-white/[0.04]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#cdeb52] text-[10px] uppercase tracking-[0.14em] font-bold">
          fitness ai · week 4/12
        </span>
        <Dumbbell size={11} className="text-white/35" />
      </div>
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-sm ${i < 4 ? "bg-[#cdeb52]" : "bg-white/[0.06]"}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[9px]">
        <span className="text-white/40">фаза</span>
        <span className="text-white/85">адаптация → гипертрофия</span>
      </div>
    </div>
  </div>
  );
}


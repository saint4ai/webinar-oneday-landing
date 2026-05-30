"use client";

import { MessageSquare, LayoutDashboard, FileText, Settings2, Bell, Sparkles, Check, Calculator, BookOpen, Clock, TrendingUp, Zap } from "lucide-react";

/**
 * AzimAppMockup — экран приложения «AlemAI» (AI-помощник для бухгалтеров KZ).
 *
 * Это ДАШБОРД (не чат): бухгалтер открывает прилу и сразу видит сводку —
 * что под контролем, что горит, сколько сэкономил. Объясняет ЦЕННОСТЬ.
 *
 * Структура (заполняет ВЕСЬ экран, flex-распределение):
 *  1. Header + приветствие
 *  2. Пояснение «что это» (1 строка — зачем бухгалтеру)
 *  3. Сводка 2×2: вопросов / часов сэкономлено / дней до сдачи / точность
 *  4. Главный дедлайн (оранж, со штрафом) — защита от штрафа
 *  5. Последний AI-ответ со ссылкой на статью НК РК — суть продукта
 *  6. Инструменты (3 чипа)
 *  7. Bottom nav: ДАШБОРД (active) · Чат · Документы · Настр.
 *
 * Бренд: чёрный #000 / лайм #B6FF00 / оранж #FC5C02. Шрифт JetBrains Mono.
 */
const LIME = "#B6FF00";
const ORANGE = "#FC5C02";

export function AzimAppMockup() {
  return (
    <div
      className="w-full h-full flex flex-col text-white"
      style={{
        background: "radial-gradient(120% 70% at 50% 0%, #0d140d 0%, #060806 40%, #000 100%)",
        fontFamily: "var(--font-jetbrains-mono), system-ui, sans-serif",
      }}
    >
      {/* === STATUS BAR === */}
      <div className="flex items-center justify-between px-[7%] pt-[3.5%] pb-[1%] text-[8px] font-medium text-white/90 shrink-0">
        <span>9:41</span>
        <div className="flex items-center gap-[3px]">
          <div className="flex items-end gap-[1px]">
            <div className="w-[2px] h-[3px] bg-white rounded-[1px]" />
            <div className="w-[2px] h-[4px] bg-white rounded-[1px]" />
            <div className="w-[2px] h-[5px] bg-white rounded-[1px]" />
            <div className="w-[2px] h-[6px] bg-white rounded-[1px]" />
          </div>
          <svg viewBox="0 0 16 16" className="w-[10px] h-[10px] fill-white"><path d="M8 3.5c2.5 0 4.8.9 6.6 2.4l-1.2 1.3c-1.5-1.3-3.4-2-5.4-2s-3.9.7-5.4 2L1.4 5.9C3.2 4.4 5.5 3.5 8 3.5zm0 3c1.7 0 3.3.6 4.5 1.7l-1.2 1.3c-.9-.8-2.1-1.2-3.3-1.2s-2.4.4-3.3 1.2L3.5 8.2C4.7 7.1 6.3 6.5 8 6.5zm0 3c.9 0 1.8.3 2.5.9L8 13l-2.5-2.6c.7-.6 1.6-.9 2.5-.9z"/></svg>
          <div className="ml-[2px] w-[15px] h-[7px] rounded-[2px] border border-white/80 relative">
            <div className="absolute inset-[1px] rounded-[1px] bg-white" style={{ width: "75%" }} />
            <div className="absolute -right-[2px] top-1/2 -translate-y-1/2 w-[1px] h-[3px] bg-white/80 rounded-r-sm" />
          </div>
        </div>
      </div>

      {/* === HEADER === */}
      <div className="flex items-center justify-between px-[7%] pt-[3%] pb-[2%] shrink-0">
        <div className="flex items-center gap-[7px]">
          <div className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${LIME} 0%, #86c200 100%)` }}>
            <span className="text-black font-bold text-[11px]">A</span>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.04em] leading-none">
              ALEM<span style={{ color: LIME }}>AI</span>
            </div>
            <div className="text-[6.5px] text-white/45 uppercase tracking-[0.1em] leading-tight mt-[2px]">бухгалтер · Алматы</div>
          </div>
        </div>
        <div className="flex items-center gap-[8px]">
          <div className="relative">
            <Bell className="w-[13px] h-[13px] text-white/65" />
            <div className="absolute -top-[1px] -right-[1px] w-[5px] h-[5px] rounded-full" style={{ background: ORANGE, boxShadow: `0 0 6px ${ORANGE}` }} />
          </div>
          <div className="w-[22px] h-[22px] rounded-full bg-white/8 border border-white/12 flex items-center justify-center">
            <span className="text-[9px] text-white/70 font-medium">А</span>
          </div>
        </div>
      </div>

      {/* === CONTENT (flex-1, заполняет весь экран) === */}
      <div className="flex-1 min-h-0 flex flex-col px-[5%] gap-[3.5%] pt-[2%] pb-[2%]">

        {/* Приветствие + зачем прила */}
        <div className="shrink-0">
          <div className="flex items-baseline justify-between">
            <span className="text-[15px] font-bold text-white leading-none">Дашборд</span>
            <span className="text-[7.5px] text-white/40 uppercase tracking-[0.1em]">ноябрь 2026</span>
          </div>
          <div className="text-[7.5px] text-white/50 leading-snug mt-[5px]">
            AI отвечает по Налоговому кодексу РК и держит под контролем сроки сдачи.
          </div>
        </div>

        {/* Сводка 2×2 */}
        <div className="grid grid-cols-2 gap-[3%] shrink-0">
          {[
            { icon: Sparkles, val: "247", unit: "вопросов", sub: "ответил AI", color: LIME },
            { icon: Clock, val: "38", unit: "часов", sub: "сэкономлено", color: LIME },
            { icon: Zap, val: "12", unit: "дней", sub: "до сдачи 300.00", color: ORANGE },
            { icon: TrendingUp, val: "97", unit: "%", sub: "точность по НК", color: LIME },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="rounded-[12px] p-[5%] flex flex-col gap-[5px]"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <Icon className="w-[11px] h-[11px]" style={{ color: s.color }} />
                <div className="flex items-baseline gap-[3px]">
                  <span className="font-bold leading-none" style={{ color: s.color, fontSize: "20px", textShadow: `0 0 16px ${s.color}40` }}>{s.val}</span>
                  <span className="text-[7px] text-white/55">{s.unit}</span>
                </div>
                <span className="text-[6.5px] text-white/40 uppercase tracking-[0.06em] leading-tight">{s.sub}</span>
              </div>
            );
          })}
        </div>

        {/* Главный дедлайн — защита от штрафа */}
        <div
          className="rounded-[12px] px-[4%] py-[3.5%] flex items-center gap-[10px] shrink-0"
          style={{ background: `linear-gradient(90deg, ${ORANGE}14 0%, ${ORANGE}03 100%)`, border: `1px solid ${ORANGE}30` }}
        >
          <div className="relative shrink-0" style={{ width: "32px", height: "32px" }}>
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke={`${ORANGE}22`} strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke={ORANGE} strokeWidth="3.5" strokeDasharray="65 35" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold leading-none" style={{ color: ORANGE }}>12</span>
              <span className="text-[4px] text-white/50 uppercase">дней</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-bold uppercase text-white tracking-[0.03em] leading-tight">До сдачи 300.00 (НДС)</div>
            <div className="text-[6.5px] text-white/55 leading-tight mt-[2px]">до 15 мая · иначе штраф <span style={{ color: ORANGE }} className="font-semibold">78 740 ₸</span></div>
          </div>
        </div>

        {/* Последний AI-ответ — суть продукта */}
        <div
          className="rounded-[12px] p-[4%] shrink-0"
          style={{ background: "rgba(182,255,0,0.05)", border: "1px solid rgba(182,255,0,0.15)" }}
        >
          <div className="flex items-center gap-[5px] mb-[6px]">
            <div className="w-[16px] h-[16px] rounded-[5px] flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${LIME} 0%, #86c200 100%)` }}>
              <Sparkles className="w-[8px] h-[8px] text-black" />
            </div>
            <span className="text-[6.5px] uppercase tracking-[0.12em] text-white/45">последний ответ</span>
          </div>
          <div className="text-[8.5px] text-white leading-relaxed">
            Срок сдачи 300.00 — до <span style={{ color: LIME }} className="font-semibold">15 мая 2026</span>. Подаётся ежеквартально.
          </div>
          <div className="flex items-center gap-[5px] mt-[6px]">
            <div className="flex items-center gap-[3px] rounded-md px-[5px] py-[2px]" style={{ background: "rgba(182,255,0,0.12)", border: "1px solid rgba(182,255,0,0.3)" }}>
              <Check className="w-[7px] h-[7px]" style={{ color: LIME }} />
              <span className="text-[6.5px] font-semibold" style={{ color: LIME }}>ст. 424 НК РК</span>
            </div>
            <span className="text-[6px] text-white/35">источник проверен</span>
          </div>
        </div>

        {/* Инструменты — растягиваются, прижаты к низу контентной зоны */}
        <div className="flex-1 min-h-0 flex flex-col justify-end">
          <div className="text-[6.5px] uppercase tracking-[0.12em] text-white/40 mb-[6px]">Быстрый доступ</div>
          <div className="grid grid-cols-3 gap-[3%]">
            {[
              { icon: Calculator, label: "Калькулятор\nналогов", accent: true },
              { icon: BookOpen, label: "База\nНК РК", accent: false },
              { icon: FileText, label: "Шпаргалки\nпроводок", accent: false },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="rounded-[10px] p-[7%] flex flex-col gap-[5px]"
                  style={{
                    background: f.accent ? "rgba(182,255,0,0.07)" : "rgba(255,255,255,0.03)",
                    border: f.accent ? "1px solid rgba(182,255,0,0.2)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <Icon className="w-[12px] h-[12px]" style={{ color: f.accent ? LIME : "rgba(255,255,255,0.6)" }} />
                  <span className="text-[6.5px] text-white/80 uppercase tracking-[0.04em] leading-tight whitespace-pre-line">{f.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* === BOTTOM NAV — первая вкладка ДАШБОРД активна === */}
      <div
        className="flex items-center justify-around px-[5%] py-[3%] border-t shrink-0"
        style={{ background: "rgba(0,0,0,0.4)", borderColor: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}
      >
        <div className="flex flex-col items-center gap-[2.5px]" style={{ color: LIME }}>
          <LayoutDashboard className="w-[11px] h-[11px]" />
          <span className="text-[6px] font-medium uppercase tracking-[0.05em]">Дашборд</span>
        </div>
        <div className="flex flex-col items-center gap-[2.5px] text-white/35">
          <MessageSquare className="w-[11px] h-[11px]" />
          <span className="text-[6px] uppercase tracking-[0.05em]">Чат</span>
        </div>
        <div className="flex flex-col items-center gap-[2.5px] text-white/35">
          <FileText className="w-[11px] h-[11px]" />
          <span className="text-[6px] uppercase tracking-[0.05em]">Документы</span>
        </div>
        <div className="flex flex-col items-center gap-[2.5px] text-white/35">
          <Settings2 className="w-[11px] h-[11px]" />
          <span className="text-[6px] uppercase tracking-[0.05em]">Настр.</span>
        </div>
      </div>

      <div className="flex justify-center pb-[1.5%] pt-[1%] shrink-0">
        <div className="w-[28%] h-[3px] rounded-full bg-white/55" />
      </div>
    </div>
  );
}

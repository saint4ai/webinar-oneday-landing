"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { MontageBg } from "../MontageBg";
import { Statement } from "../Statement";
import { Logo as BrandLogo } from "../Logo";
import { T, glass } from "../theme";
import { Arrow, Card, EASE, H, Lead, Note, Px, Rise, nb } from "../ui";

const txt: React.CSSProperties = { fontFamily: "var(--font-manrope)", fontWeight: 600, fontSize: "1.05cqw", lineHeight: 1.4, color: T.ink };
const Stagger = ({ i, children, style, className }: { i: number; children: React.ReactNode; style?: React.CSSProperties; className?: string }) => (
  <motion.div className={className} style={style} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.08, duration: 0.45, ease: EASE }}>{children}</motion.div>
);
const Logo = ({ name }: { name: string }) => <img src={`/montage/logos/${name}.svg`} alt="" style={{ width: "1.4cqw", height: "1.4cqw" }} />;

/** 43 · Просмотры есть, заявок нет. */
export function M_ViewsNoLeads() {
  const path = ["Посмотрел", "Лайкнул", "Ушёл"];
  return (
    <Statement obj="lg-s43-leaving" kicker="Урок 3 · Проблема" title="Просмотры есть. Заявок нет" size="3cqw" lead="Человек посмотрел ролик, поставил лайк и ушёл. Здесь теряется больше всего.">
      <div className="flex items-center gap-[1cqw]">
        {path.map((p, i) => (
          <div key={p} className="flex items-center gap-[1cqw]">
            <Stagger i={i * 2} style={{ ...glass, borderRadius: 999, padding: "0.8cqw 1.6cqw", ...txt, fontSize: "1.15cqw", ...(i === 2 ? { opacity: 0.45, borderStyle: "dashed", borderColor: T.accent } : null) }}>{p}</Stagger>
            {i < 2 && <Stagger i={i * 2 + 1}><Arrow /></Stagger>}
          </div>
        ))}
      </div>
    </Statement>
  );
}

/** 44 ✦ · Комментарий → директ → Telegram: цепочка собирается по очереди, линия бежит между узлами. */
export function M_CodeWordFlow() {
  const nodes = [
    { logo: "instagram", head: "Комментарий", body: "МОНТАЖ" },
    { logo: "instagram", head: "Директ от бота", body: "Держите гайд, ловите ссылку" },
    { logo: "telegram", head: "Вам в Telegram", body: "Новый контакт из рилса" },
  ];
  return (
    <Statement obj="lg-s44-codeword" kicker="Кодовое слово" title="Кодовое слово превращает зрителя в контакт" size="2.6cqw">
      <div className="flex items-stretch gap-[0.8cqw]" style={{ maxWidth: "56cqw" }}>
        {nodes.map((n, i) => (
          <div key={n.head} className="flex items-center gap-[0.8cqw]" style={{ flex: 1 }}>
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.4 + i * 0.7, duration: 0.5, ease: EASE }}
              style={{ ...glass, borderRadius: 20, padding: "1.1cqw 1.2cqw", flex: 1, ...(i === 2 ? { border: `1.5px solid ${T.gold2}` } : null) }}>
              <div className="flex items-center gap-[0.5cqw]"><Logo name={n.logo} /><span style={{ ...txt, fontSize: "0.85cqw", color: T.muted }}>{n.head}</span></div>
              <div style={{ ...txt, fontWeight: 700, fontSize: i === 0 ? "1.5cqw" : "1.05cqw", marginTop: "0.6cqw", fontFamily: i === 0 ? "var(--font-unbounded)" : undefined, color: i === 0 ? T.accent : T.ink }}>{n.body}</div>
            </motion.div>
            {i < nodes.length - 1 && (
              <div className="relative" style={{ width: "2.4cqw", height: 2, background: "rgba(139,94,60,.18)" }}>
                <motion.div className="absolute left-0 top-0 h-full" style={{ background: T.gold2 }} initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: 0.8 + i * 0.7, duration: 0.4 }} />
              </div>
            )}
          </div>
        ))}
      </div>
      <Stagger i={24} style={{ marginTop: "1.8cqw" }}>
        <div style={{ ...txt, fontSize: "1.25cqw" }}>Рилс про агента: <span style={{ color: T.accent, fontWeight: 700 }}>68 комментариев</span> с кодовым словом на {nb("1 773")} просмотра</div>
      </Stagger>
      <Note>Статистика Instagram, сентябрь 2026</Note>
    </Statement>
  );
}

/** Экран переписки в стиле мессенджера. */
const Chat = ({ msgs }: { msgs: { me?: boolean; t: string }[] }) => (
  <div className="grid gap-[0.55cqw]" style={{ ...glass, borderRadius: 24, padding: "1.2cqw", maxWidth: "36cqw" }}>
    {msgs.map((m, i) => (
      <Stagger key={i} i={i * 3} style={{ justifySelf: m.me ? "end" : "start", maxWidth: "85%", padding: "0.8cqw 1.1cqw", ...txt, fontWeight: 500,
        borderRadius: m.me ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.me ? T.ink : "rgba(139,94,60,.08)", color: m.me ? T.paper : T.ink }}>{m.t}</Stagger>
    ))}
  </div>
);

/** 45 · Бот выдаёт материал по кодовому слову. */
export function M_BotGuide() {
  return (
    <Statement kicker="Урок 3.2" title="Бот выдаёт материал по кодовому слову" size="2.6cqw" lead="Как SendPulse, только своё: тексты, материалы и логика ваши.">
      <Chat msgs={[
        { me: true, t: "МОНТАЖ" },
        { t: "Держите гайд: как делать вирусный рилс. Внутри правило первых 3 секунд" },
        { t: "Хотите, подскажу, с какого ролика начать под вашу нишу?" },
      ]} />
    </Statement>
  );
}

/** 46 · ИИ-менеджер и ИИ-РОП. */
export function M_AIManager() {
  return (
    <Statement kicker="Урок 3.2 и 3.3" title="ИИ-менеджер отвечает. ИИ-РОП проверяет переписки" size="2.5cqw" lead="Заявки не теряются ночью и в выходные.">
      <div className="grid grid-cols-2 gap-[1cqw]" style={{ maxWidth: "50cqw" }}>
        <Stagger i={0}><Card icon="lg-i-botchat" no="ИИ-менеджер" title="Отвечает в WhatsApp и Instagram" text="Уточняет задачу клиента и ведёт его к заявке" style={{ height: "100%" }} /></Stagger>
        <Stagger i={1}><Card icon="lg-i-magnifier" no="ИИ-РОП" title="Читает переписки" text="Оценивает работу с клиентом и подсказывает следующий шаг" accent style={{ height: "100%" }} /></Stagger>
      </div>
    </Statement>
  );
}

/** 47 · Отчёт в Telegram. */
export function M_TelegramReport() {
  const rows = [["Новые заявки", "12"], ["Готовы купить", "3"], ["Ждут звонка", "2"]];
  return (
    <Statement kicker="Урок 3.3" title="Отчёт по заявкам приходит в Telegram" size="2.6cqw" lead="Кто написал, кто готов купить, кому звонить. Без захода в CRM.">
      <div style={{ ...glass, borderRadius: 22, padding: "1.2cqw 1.4cqw", maxWidth: "30cqw" }}>
        <div className="flex items-center gap-[0.5cqw]" style={{ marginBottom: "0.8cqw" }}>
          <Logo name="telegram" /><span style={{ ...txt, fontWeight: 700 }}>Отчёт за день</span>
          <span style={{ ...txt, fontSize: "0.75cqw", color: T.muted, marginLeft: "auto" }}>пример</span>
        </div>
        {rows.map(([k, v], i) => (
          <Stagger key={k} i={i} className="flex justify-between" style={{ padding: "0.5cqw 0", borderTop: `1px solid ${T.line}`, ...txt }}>
            <span>{k}</span><span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: i === 1 ? T.accent : T.ink }}>{v}</span>
          </Stagger>
        ))}
      </div>
    </Statement>
  );
}

/** 48 ✦ · Тот же агент собирает не только ролики: карточки влетают по очереди. */
export function M_Builds() {
  const b = ["Презентация и КП", "Сайт", "Приложение"];
  return (
    <Statement kicker="Урок 3.1 и 3.4 · из вайбкодинга" title="Тот же агент собирает не только ролики" size="2.6cqw" lead="Пишете словами, что нужно. Агент собирает.">
      <motion.img src="/montage/obj/s48-builders.webp" alt="Человечки собирают приложение, сайт и презентацию" initial={{ opacity: 0, y: 36, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: EASE }} style={{ width: "44cqw", height: "auto", filter: "drop-shadow(0 26px 36px rgba(42,33,28,.2))" }} />
      <div className="flex gap-[0.6cqw]" style={{ marginTop: "0.8cqw" }}>
        {b.map((t, i) => (
          <Stagger key={t} i={6 + i * 2}><span style={{ display: "inline-block", ...glass, borderRadius: 999, padding: "0.6cqw 1.2cqw", ...txt, fontSize: "0.95cqw", fontWeight: 700 }}>{t}</span></Stagger>
        ))}
      </div>
    </Statement>
  );
}

/** 49 · Контент-завод целиком. */
export function M_FactoryChain() {
  const chain = ["Рилс", "Кодовое слово", "Бот выдаёт гайд", "ИИ-менеджер", "Заявка в CRM", "Отчёт в Telegram"];
  return (
    <Statement kicker="Урок 3.5" title="Контент-завод целиком" size="3cqw" lead="Все три модуля в одной цепочке: ролик приводит человека, система доводит его до заявки.">
      <div className="grid grid-cols-3 gap-x-[0.6cqw] gap-y-[1cqw]" style={{ maxWidth: "52cqw" }}>
        {chain.map((c, i) => (
          <Stagger key={c} i={i * 1.5} className="flex items-center gap-[0.6cqw]">
            <div style={{ ...glass, borderRadius: 16, padding: "0.8cqw 1cqw", flex: 1, ...txt, ...(i === 0 || i === 5 ? { border: `1.5px solid ${T.gold2}` } : null) }}>
              <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.8cqw", color: T.accent, marginRight: "0.6cqw" }}>{i + 1}</span>{c}
            </div>
            {i % 3 !== 2 && <Arrow />}
          </Stagger>
        ))}
      </div>
    </Statement>
  );
}

/** 50 · Схема на 30 роликов в месяц: календарь загорается по дням. */
export function M_Plan30() {
  const rules = ["Каждый день 1 ролик", "Сначала пробным, на неподписчиков", "Через 72 часа: сильный показываем подписчикам", "Залетевший перезаливаем пробным ещё раз"];
  return (
    <Statement obj="lg-s50-plan" kicker="Обещал в начале" title="Схема: 30 роликов в месяц" size="2.9cqw">
      <div className="flex items-start gap-[2cqw]">
        <div className="grid gap-[0.3cqw]" style={{ gridTemplateColumns: "repeat(6, 2.2cqw)" }}>
          {Array.from({ length: 30 }, (_, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.035, duration: 0.25 }}
              className="flex items-center justify-center" style={{ height: "2.2cqw", borderRadius: 8, fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.7cqw",
                background: i === 17 ? `linear-gradient(180deg, ${T.gold}, ${T.gold2})` : "rgba(139,94,60,.12)", color: i === 17 ? T.ink : T.muted }}>{i + 1}</motion.div>
          ))}
        </div>
        <div className="grid gap-[0.5cqw]" style={{ maxWidth: "26cqw" }}>
          {rules.map((r, i) => (
            <Stagger key={r} i={4 + i * 1.5} className="flex gap-[0.7cqw]" style={{ ...txt }}>
              <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.85cqw", color: T.accent, paddingTop: "0.15cqw" }}>{i + 1}</span>{r}
            </Stagger>
          ))}
        </div>
      </div>
      <Note>Полный контент-план на месяц в гайдах, которые выдам в конце</Note>
    </Statement>
  );
}

/** 59 · Спасибо. Без контактов. */
export function M_Thanks() {
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="soft" />}>
      <Rise><BrandLogo style={{ marginBottom: "2.6cqw" }} /></Rise>
      <Rise delay={0.12}><H size="3.6cqw">Спасибо, что пришли</H></Rise>
      <Rise delay={0.24}><Lead style={{ marginTop: "1.2cqw", fontSize: "1.5cqw" }}>Увидимся в следующих эфирах.</Lead></Rise>
      <motion.img src="/montage/lego/lg-s59-desk.webp" alt="" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.9, ease: EASE }}
        style={{ marginTop: "2.4cqw", width: "36cqw", height: "auto", filter: "drop-shadow(0 26px 36px rgba(42,33,28,.2))" }} />
    </SlideLayout>
  );
}

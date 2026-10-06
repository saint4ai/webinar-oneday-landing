"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ReelRail, Views } from "../ReelRail";
import { RESULTS } from "../results";
import { Statement } from "../Statement";
import { T, card, goldButton } from "../theme";
import { EASE, Em, Note, Num, Px, STEP, nb, txt } from "../ui";

/**
 * Финал эфира после продажи обучения, перед «Спасибо» (Александр 06.10): по слайду на каждое направление с QR-кодом.
 * o1 корпоративное обучение · o2 внедрение AI и консультация · o3 игра и комьюнити · o4 блог · o5 Instagram.
 * Офферы и цены — с сайта onai.academy/saint (раздел услуг, 06.10.2026). QR-коды — public/montage/qr-*.svg:
 * на сайт и блог с метками utm_source=webinar&utm_medium=qr&utm_campaign=vibe_production, игра — t.me/tokenrunner_bot, Instagram — @saint4ai.
 * Всё в левых 60% кадра.
 */

const In = ({ i, children, style, className }: { i: number; children: ReactNode; style?: React.CSSProperties; className?: string }) => (
  <motion.div className={className} style={style} initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: 0.3 + i * STEP, duration: 0.45, ease: EASE }}>{children}</motion.div>
);

/** QR в белой карточке, под ним адрес и что будет по ссылке. */
function Qr({ src, alt, caption, sub, i = 6 }: { src: string; alt: string; caption: string; sub: string; i?: number }) {
  return (
    <In i={i} style={{ width: "12.5cqw" }}>
      <motion.div initial={{ rotate: -4, scale: 0.92 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.5 + i * STEP, type: "spring", stiffness: 180, damping: 15 }}
        style={{ ...card, background: T.paper, borderRadius: 22, padding: "0.9cqw", boxShadow: T.shadow }}>
        <img src={src} alt={alt} draggable={false} style={{ display: "block", width: "100%", height: "auto" }} />
      </motion.div>
      <div style={{ ...txt, fontWeight: 700, fontSize: "1.05cqw", color: T.brown, marginTop: "0.8cqw", whiteSpace: "nowrap" }}>{caption}</div>
      <div style={{ ...txt, fontWeight: 500, fontSize: "0.82cqw", color: T.muted, marginTop: "0.25cqw", lineHeight: 1.35 }}>{sub}</div>
    </In>
  );
}

/** Сетка слайда: содержимое слева, QR справа. */
const Row = ({ children, qr }: { children: ReactNode; qr: ReactNode }) => (
  <div className="grid items-center" style={{ gridTemplateColumns: "minmax(0, 1fr) 12.5cqw", gap: "2.4cqw", maxWidth: "54cqw" }}>
    <div className="min-w-0">{children}</div>
    {qr}
  </div>
);

const Chip = ({ children, gold = false }: { children: ReactNode; gold?: boolean }) => (
  <span style={{ display: "inline-block", ...txt, fontWeight: 700, fontSize: "0.85cqw", padding: "0.4cqw 0.85cqw", borderRadius: 999, whiteSpace: "nowrap",
    ...(gold ? goldButton : { background: T.card, border: `1px solid ${T.line}`, color: T.ink }) }}>{children}</span>
);

/** Карточка с заголовком и строкой пояснения. */
const Tile = ({ title, text, icon, i }: { title: ReactNode; text: ReactNode; icon?: string; i: number }) => (
  <In i={i} style={{ ...card, borderRadius: 18, padding: "0.9cqw 1cqw" }}>
    {icon && <Px name={icon} size="2.6cqw" bob={false} delay={0.3 + i * STEP} style={{ marginBottom: "0.4cqw" }} />}
    <div style={{ ...txt, fontWeight: 800, fontSize: "1cqw", color: T.ink }}>{title}</div>
    <div style={{ ...txt, fontWeight: 500, fontSize: "0.82cqw", color: T.muted, marginTop: "0.25cqw", lineHeight: 1.35 }}>{text}</div>
  </In>
);

/** o1 · Корпоративное обучение: форматы, темы программы, цена с сайта и QR на бриф. */
export function M_TeamTraining() {
  return (
    <Statement kicker="Для компаний" title={<>Корпоративное обучение: <Em>AI в ваш бизнес</Em></>} size="2.5cqw"
      lead="Учим команду работать с AI на её задачах и встраиваем решения в процессы и системы компании.">
      <Row qr={<Qr src="/montage/qr-training.svg" alt="QR-код: сайт onai.academy/saint, обучение команды" caption="onai.academy/saint" sub="Бриф из 5 вопросов, программу соберём под вашу команду" />}>
        <div className="grid grid-cols-3" style={{ gap: "0.6cqw" }}>
          <Tile i={0} title="Офлайн" text="Приезжаем в офис в любом городе Казахстана" />
          <Tile i={1} title="Онлайн" text="Живые занятия и платформа onAI с AI-наставником" />
          <Tile i={2} title="Смешанный" text="Старт вживую, дальше сопровождение онлайн" />
        </div>
        <In i={3} className="flex flex-wrap" style={{ gap: "0.4cqw", marginTop: "1cqw" }}>
          {["AI для руководителей", "AI в ежедневной работе", "Контент и реклама", "Продажи и клиенты", "Вайбкодинг для команды"].map((t) => <Chip key={t}>{t}</Chip>)}
        </In>
        <In i={4} className="flex flex-wrap items-center" style={{ gap: "0.8cqw", marginTop: "1.1cqw" }}>
          <Chip gold>{nb("от 700 000 ₸")} за программу</Chip>
          <span style={{ ...txt, fontWeight: 600, fontSize: "0.85cqw", color: T.muted }}>Выступаю на конференциях и стратсессиях</span>
        </In>
      </Row>
    </Statement>
  );
}

/** o2 · Внедрение AI под ваш процесс: четыре направления, бесплатный AI-аудит, консультация, три шага до созвона. */
export function M_ServicesOffer() {
  return (
    <Statement kicker="Услуги onAI" title={<>Внедрим AI <Em>под ваш процесс</Em></>} size="2.5cqw"
      lead="Платформы обучения, AI-ассистенты, звонобот и сквозная аналитика: то, что уже работает у наших клиентов.">
      <Row qr={<Qr src="/montage/qr-services.svg" alt="QR-код: сайт onai.academy/saint, заявка на внедрение AI" caption="Оставить заявку" sub="onai.academy/saint, отвечу лично в течение дня" />}>
        <div className="grid grid-cols-4" style={{ gap: "0.5cqw" }}>
          <Tile i={0} icon="lg-i-botchat" title="Клиенты и продажи" text="Ответы, заявки, CRM" />
          <Tile i={1} icon="lg-i-clapper" title="Контент и реклама" text="Ролики и креативы потоком" />
          <Tile i={2} icon="lg-i-laptopcoins" title="Аналитика и отчёты" text="Реклама, сделки, деньги" />
          <Tile i={3} icon="lg-i-rocket" title="Сайты и платформы" text="Свой продукт с AI" />
        </div>
        <div className="grid grid-cols-2" style={{ gap: "0.6cqw", marginTop: "0.8cqw" }}>
          <In i={4} style={{ ...card, borderRadius: 18, padding: "0.9cqw 1.1cqw", background: `${T.gold}2E`, border: `1px solid ${T.gold2}` }}>
            <div style={{ ...txt, fontWeight: 700, fontSize: "0.8cqw", letterSpacing: ".12em", textTransform: "uppercase", color: T.accent }}>AI-аудит</div>
            <Num size="1.8cqw" color={T.brown}>бесплатно</Num>
            <div style={{ ...txt, fontWeight: 500, fontSize: "0.82cqw", color: T.muted, marginTop: "0.2cqw" }}>Разберём процесс, выберем первую задачу, посчитаем стоимость</div>
          </In>
          <In i={5} style={{ ...card, borderRadius: 18, padding: "0.9cqw 1.1cqw" }}>
            <div style={{ ...txt, fontWeight: 700, fontSize: "0.8cqw", letterSpacing: ".12em", textTransform: "uppercase", color: T.accent }}>Консультация</div>
            <Num size="1.8cqw" color={T.brown}>{nb("$100 за час")}</Num>
            <div style={{ ...txt, fontWeight: 500, fontSize: "0.82cqw", color: T.muted, marginTop: "0.2cqw" }}>Разбор вашего проекта в Claude Code или Codex</div>
          </In>
        </div>
      </Row>
    </Statement>
  );
}

/** o3 · Игра Token Runner как комьюнити вайбкодеров: скидка на обучение и еженедельный приз топ-3. */
export function M_GameCommunity() {
  const podium = [{ n: 2, h: "5cqw" }, { n: 1, h: "7cqw" }, { n: 3, h: "3.8cqw" }];
  return (
    <Statement kicker="Комьюнити вайбкодеров" title={<>Играй и <Em>учись бесплатно</Em></>} size="2.7cqw"
      lead="Token Runner в Telegram: игру мы сделали как комьюнити для вайбкодеров. За игру дают скидку на обучение.">
      <Row qr={<Qr src="/montage/qr-game.svg" alt="QR-код: игра Token Runner в Telegram" caption="t.me/tokenrunner_bot" sub="Игра в Telegram, старт за минуту" />}>
        <div className="grid items-end" style={{ gridTemplateColumns: "15cqw minmax(0, 1fr)", gap: "1.6cqw" }}>
          {/* пьедестал недели: три места, первое золотом */}
          <In i={0} className="flex items-end" style={{ gap: "0.4cqw" }}>
            {podium.map((p, k) => (
              <motion.div key={p.n} initial={{ height: "0cqw" }} animate={{ height: p.h }} transition={{ delay: 0.5 + k * 0.12, duration: 0.6, ease: EASE }}
                className="flex flex-1 items-start justify-center" style={{ borderRadius: "0.8cqw 0.8cqw 0.3cqw 0.3cqw", paddingTop: "0.5cqw", overflow: "hidden",
                  ...(p.n === 1 ? goldButton : { background: T.card, border: `1px solid ${T.line}` }) }}>
                <Num size="1.9cqw" color={p.n === 1 ? T.ink : T.brown}>{p.n}</Num>
              </motion.div>
            ))}
          </In>
          <div className="grid" style={{ gap: "0.5cqw" }}>
            <Tile i={1} title="Каждую неделю топ-3 получают модули бесплатно" text="Трое, кто набрал больше всех баллов" />
            <Tile i={2} title="Нет возможности купить обучение?" text="Играй и забирай его бесплатно" />
          </div>
        </div>
      </Row>
    </Statement>
  );
}

/** o4 · Блог про вайбкодинг: кадр блога в окне браузера и QR на подписку. */
export function M_Blog() {
  return (
    <Statement kicker="Блог про вайбкодинг" title={<>Подкасты, решения <Em>и кейсы</Em></>} size="2.7cqw"
      lead="Новые выпуски о том, как собирать продукты с AI-агентами без программистов в штате.">
      <Row qr={<Qr src="/montage/qr-blog.svg" alt="QR-код: блог onai.academy/blog" caption="onai.academy/blog" sub="Подпишитесь на новые выпуски" />}>
        <In i={0} style={{ ...card, borderRadius: "1.2cqw", overflow: "hidden", background: T.paper, boxShadow: T.shadow }}>
          <div className="flex items-center" style={{ gap: "0.4cqw", padding: "0.55cqw 0.8cqw", borderBottom: `1px solid ${T.line}`, background: T.card }}>
            {[T.gold, T.brownLt, T.line].map((col, k) => <span key={k} style={{ width: "0.55cqw", height: "0.55cqw", borderRadius: 99, background: col }} />)}
            <span style={{ ...txt, fontSize: "0.72cqw", color: T.muted, marginLeft: "0.6cqw" }}>onai.academy/blog</span>
          </div>
          <img src="/montage/blog-shot.webp" alt="Блог saint4ai про vibe coding" draggable={false} style={{ display: "block", width: "100%", aspectRatio: "16 / 10", objectFit: "cover", objectPosition: "top" }} />
        </In>
      </Row>
    </Statement>
  );
}

/** o5 · Instagram @saint4ai: лента рилсов с просмотрами (правило: рилсы только с охватом) и QR на профиль. */
export function M_Instagram() {
  return (
    <Statement kicker="Instagram" title={<>Подписывайтесь <Em>на @saint4ai</Em></>} size="2.7cqw"
      lead="Каждый день рилсы про AI-агентов, вайбкодинг и автоматизации. Материалы по кодовым словам приходят в директ.">
      <Row qr={<Qr src="/montage/qr-instagram.svg" alt="QR-код: Instagram @saint4ai" caption="@saint4ai" sub="instagram.com/saint4ai" />}>
        <In i={0}>
          <ReelRail items={[...RESULTS.appCovers]} itemWidth="7.2cqw" gap={0.12} speed={0.32} render={(c) => (
            <div className="relative" style={{ width: "100%", aspectRatio: "9 / 16", borderRadius: "0.9cqw", overflow: "hidden", boxShadow: `0 0 0 1px ${T.line}, ${T.shadowSm}`, background: T.card }}>
              <img src={`/montage/reels/${c.file}.jpg`} alt={`${c.title}: ${c.views} просмотров`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div className="absolute inset-x-0 bottom-0" style={{ padding: "0.35cqw", background: "linear-gradient(transparent, rgba(10,8,7,.55))" }}><Views value={c.views} size="0.7cqw" /></div>
            </div>
          )} />
          <Note style={{ marginTop: "0.8cqw" }}>{RESULTS.appCoversSource}</Note>
        </In>
      </Row>
    </Statement>
  );
}

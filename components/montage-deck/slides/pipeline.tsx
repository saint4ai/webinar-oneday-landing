"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { MontageBg } from "../MontageBg";
import { NOFACE_REELS } from "../noface-reels";
import { Views } from "../ReelRail";
import { SlideVideo } from "../SlideVideo";
import { Statement } from "../Statement";
import { LT, T, card, goldButton } from "../theme";
import { Arrow, EASE, Em, Kicker, MaskIcon, Note, Num, Px, Stagger, glueNode, nb, txt } from "../ui";
import { BonusCover, Sheen } from "./bonus-fanfare";

/**
 * Слайды воркшопа под AI-монтаж (08.10.2026, ТЗ docs/tasks/deck_ai_montage.md; сценарий урока docs/workshop-v2/videourok-pipeline.md):
 *   nf1 M_NoFaceStory   «Я начинал без лица» (блок «Блог без лица» после 16, дополнение к ТЗ 08.10 вечером);
 *   nf2 M_NoFaceFormats «Если не можете снимать лицо»: два формата, которые придумал Александр;
 *   nf3 M_NoFaceReels   рилсы без лица из noface-reels.ts (с 08.10, 14:30 вне показа: оба рилса без лица теперь внутри слайда 23, код и данные оставлены);
 *   car M_Carousels     «Карусели: ещё один вид контента» (после 23): две настоящие карусели Александра, листаются кликом (08.10, 14:30);
 *   23v M_VoiceNoFace  два способа получить голос для блога без лица;
 *   hf  M_Higgsfield   «Higgsfield прямо из Claude» (после 35, модуль 1), 08.10, 15:00;
 *   bon3 M_Bonus3      третий бонус до конца дня: модуль по рекламе и AI-таргетолог (после 36), 08.10, 15:00;
 *   lv  M_LessonVideo  видеоурок «весь путь рилса» на весь кадр 16:9;
 *   34a M_AgentsSetup  «Научу работать с агентами» (в продаже, после слайда 34);
 *   bon M_Bonus        «Бонус, если купите до конца дня»: модуль 3 AI-креатор и 6 месяцев доступа (после рассрочки 39, перед модулем 3 на слайде 36).
 * Тексты из ТЗ, цены не пишем (ElevenLabs $6 в месяц и 10 000+ голосов: elevenlabs.io/pricing и документация ElevenLabs, 08.10.2026).
 * Всё, кроме lv, в левых 60% кадра: правые 40% под камеру.
 */

/** 23v · Голос без вас: записать самому на телефон или отдать нейросети ElevenLabs. Текст под озвучку готовит Claude. */
export function M_VoiceNoFace() {
  return (
    <Statement kicker="Блог без лица · Голос" title={<>Голос <Em>без вас</Em></>} lead="Лицо не обязательно. Голос можно получить двумя способами." size="3.2cqw">
      <div className="grid grid-cols-2 gap-[1.2cqw]" style={{ maxWidth: "54cqw" }}>
        <Stagger i={0} style={{ height: "100%" }}>
          <div style={{ ...card, borderRadius: 22, padding: "1.4cqw 1.6cqw", height: "100%" }}>
            <Px name="lg-i-phones" size="5cqw" bob={false} delay={0.35} style={{ margin: "-0.3cqw 0 0.6cqw -0.3cqw" }} />
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: T.accent, marginBottom: "0.6cqw" }}>Способ 1</div>
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.4cqw", lineHeight: 1.25 }}>Запишите сами</div>
            <div style={{ ...txt, fontWeight: 500, fontSize: "1.05cqw", color: T.muted, marginTop: "0.5cqw" }}>{glueNode("На телефон. Дальше ролик собирает агент.")}</div>
          </div>
        </Stagger>
        <Stagger i={1} style={{ height: "100%" }}>
          <div style={{ ...card, borderRadius: 22, padding: "1.4cqw 1.6cqw", height: "100%", border: `1.5px solid ${T.gold2}` }}>
            <div className="flex items-center" style={{ gap: "0.8cqw", margin: "0.3cqw 0 1.2cqw" }}>
              <MaskIcon name="elevenlabs" color={T.gold} size="3.2cqw" />
              <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.7cqw", color: T.nightText }}>ElevenLabs</span>
            </div>
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: T.gold2, marginBottom: "0.6cqw" }}>Способ 2</div>
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.4cqw", lineHeight: 1.25 }}>Отдайте нейросети</div>
            <div className="flex items-end" style={{ gap: "1.6cqw", marginTop: "0.9cqw" }}>
              <div>
                <Num size="2.4cqw" color={T.gold}>{nb("$6")}</Num>
                <div style={{ ...txt, fontWeight: 500, fontSize: "0.95cqw", color: T.muted, marginTop: "0.35cqw" }}>подписка от, в месяц</div>
              </div>
              <div>
                <Num size="2.4cqw" color={T.gold}>{nb("10 000+")}</Num>
                <div style={{ ...txt, fontWeight: 500, fontSize: "0.95cqw", color: T.muted, marginTop: "0.35cqw" }}>голосов в библиотеке</div>
              </div>
            </div>
          </div>
        </Stagger>
      </div>
      <Stagger i={3} base={0.4} style={{ ...card, borderRadius: 18, padding: "0.9cqw 1.3cqw", marginTop: "1.2cqw", maxWidth: "54cqw", borderLeft: `0.28cqw solid ${T.gold2}` }}>
        <div className="flex items-center" style={{ gap: "0.9cqw" }}>
          <MaskIcon name="claude" color={T.gold} size="1.8cqw" />
          <span style={{ ...txt, fontWeight: 600, fontSize: "1.15cqw", lineHeight: 1.4 }}>{glueNode("Текст под озвучку готовит Claude: расставляет паузы и ударения, чтобы голос звучал живо.")}</span>
        </div>
      </Stagger>
    </Statement>
  );
}

/** Файл видеоурока кладёт монтажёр («Монтаж Reels»): public/montage/lesson/videourok-pipeline.mp4, 16:9, со звуком. */
const LESSON_SRC = "/montage/lesson/videourok-pipeline.mp4";

/**
 * lv · Видеоурок «Весь путь рилса» на весь кадр 16:9 (единственный слайд колоды, где заняты и правые 40%: видео закрывает камеру).
 * Запуск и пауза по клику, звук включён, автозапуска нет, слайды клик не листает. Пробел и стрелки остаются клавишами листания колоды
 * (SlideDeck ловит их раньше кнопки), поэтому пауза только кликом. Слой слайда пропускает клики насквозь, кнопке возвращаем pointer-events.
 * Пока файла нет (404), метаданные не придут, и слайд остаётся спокойным постером: ночной фон, LEGO-объект и название, кнопки нет.
 * Появился файл (после перезапуска сервера, public читается при старте) — на постере появляется кнопка «Включить видеоурок».
 */
export function M_LessonVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false); // метаданные файла загрузились, значит файл есть
  const [started, setStarted] = useState(false); // урок хотя бы раз включали: постер уходит, видно кадр
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { setStarted(true); v.play().catch(() => {}); }
    else v.pause();
  };
  const face: CSSProperties = { fontFamily: "var(--font-unbounded)", fontWeight: 800, letterSpacing: "-.025em", lineHeight: 1.1 };
  return (
    <SlideLayout className="bg-transparent" contentMinWidth={0}
      background={
        <>
          <MontageBg tone="night" />
          {/* видео на весь кадр лежит под сеткой колонок, постер над ним гаснет, когда урок включили */}
          <div className="absolute inset-0" style={{ opacity: started ? 1 : 0, transition: "opacity .35s", background: "#000" }}>
            <SlideVideo videoRef={ref} src={LESSON_SRC} preload="metadata" playsInline
              onLoadedMetadata={() => setReady(true)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
              onEnded={() => { setPlaying(false); setStarted(false); }}
              className="absolute inset-0 h-full w-full" style={{ objectFit: "contain", background: "#000" }} />
          </div>
          {/* клик по кадру: запуск и пауза; на паузе поверх видео золотая кнопка. Сетка колонок pointer-events не берёт, клик доходит сюда */}
          {ready && (
            <button type="button" aria-label={playing ? "Пауза" : "Воспроизвести видеоурок"} aria-pressed={playing}
              onClick={(e) => { e.stopPropagation(); toggle(); }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ pointerEvents: "auto", cursor: "pointer", border: 0, padding: 0, background: started && !playing ? "rgba(10,8,7,.3)" : "transparent", transition: "background .25s" }}>
              {started && !playing && (
                <span className="flex items-center justify-center" style={{ width: "6cqw", height: "6cqw", borderRadius: 999, ...goldButton, boxShadow: `0 1cqw 2.4cqw -0.8cqw ${T.gold2}` }}>
                  <svg viewBox="0 0 24 24" style={{ width: "2.4cqw", height: "2.4cqw", marginLeft: "0.3cqw" }} fill={LT.ink}><path d="M8 5v14l11-7z" /></svg>
                </span>
              )}
            </button>
          )}
        </>
      }>
      {/* постер: левые 60%, пока урок не включали */}
      <motion.div aria-hidden={started} initial={false} animate={{ opacity: started ? 0 : 1 }} transition={{ duration: 0.35, ease: EASE }}>
        <Px name="lg-i-cards" size="15cqw" delay={0.15} style={{ marginLeft: "-0.6cqw" }} />
        <div style={{ marginTop: "1.6cqw" }}><Kicker color={T.gold}>Практика</Kicker></div>
        <h2 style={{ ...face, fontSize: "3.4cqw", color: T.nightText, maxWidth: "40cqw" }}>{glueNode(<>Видеоурок: весь путь <span style={{ color: T.gold }}>рилса</span></>)}</h2>
        {ready && (
          <div style={{ marginTop: "2.2cqw" }}>
            <span className="inline-flex items-center" style={{ ...goldButton, gap: "0.8cqw", borderRadius: 999, padding: "0.9cqw 1.8cqw", fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.1cqw" }}>
              <svg viewBox="0 0 24 24" style={{ width: "1.4cqw", height: "1.4cqw" }} fill={LT.ink}><path d="M8 5v14l11-7z" /></svg>
              Включить видеоурок
            </span>
          </div>
        )}
      </motion.div>
    </SlideLayout>
  );
}

/** Карточка с иконкой, номером и текстом для 34a. accent — золотая рамка. */
function Pillar({ i, no, icon, title, children, accent }: { i: number; no: string; icon: string; title: ReactNode; children: ReactNode; accent?: boolean }) {
  return (
    <Stagger i={i} style={{ height: "100%" }}>
      <div style={{ ...card, borderRadius: 22, padding: "1.3cqw 1.5cqw", height: "100%", ...(accent ? { border: `1.5px solid ${T.gold2}` } : null) }}>
        <Px name={icon} size="4.8cqw" bob={false} delay={0.3 + i * 0.07} style={{ margin: "-0.3cqw 0 0.5cqw -0.3cqw" }} />
        <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: accent ? T.gold2 : T.accent, marginBottom: "0.6cqw" }}>{no}</div>
        <div style={{ ...txt, fontWeight: 700, fontSize: "1.25cqw", lineHeight: 1.3 }}>{glueNode(title)}</div>
        <div style={{ ...txt, fontWeight: 500, fontSize: "0.98cqw", lineHeight: 1.45, color: T.muted, marginTop: "0.5cqw" }}>{glueNode(children)}</div>
      </div>
    </Stagger>
  );
}

/**
 * 34a · Научу работать с агентами (08.10, продажа Vibe Production): поставить задачу, настроить агентов и готовая архитектура папки проекта.
 * Папка годится и для монтажа, и для вайбкодинга: на ней Александр собирает платформы и IT-решения для компаний (кейсы на слайде 08c).
 */
export function M_AgentsSetup() {
  return (
    <Statement kicker="Vibe Production" title={<>Научу работать <Em>с агентами</Em></>} size="3cqw">
      <div className="grid grid-cols-3 gap-[1cqw]" style={{ maxWidth: "54cqw" }}>
        <Pillar i={0} no="01" icon="lg-i-botchat" title="Говорить с агентами">Правильно ставить задачу, чтобы получать нужный результат.</Pillar>
        <Pillar i={1} no="02" icon="lg-i-robot" title="Настраивать агентов">Чтобы они работали под ваши задачи.</Pillar>
        <Pillar i={2} no="03" icon="lg-i-box" title="Готовая архитектура папки проекта" accent>Работает и для монтажа, и для вайбкодинга. На ней я собираю платформы и <span style={{ whiteSpace: "nowrap" }}>IT-решения</span> для компаний.</Pillar>
      </div>
    </Statement>
  );
}

/** Строка с золотой галочкой для карточки подарка. */
const Tick = ({ children, size = "1.05cqw" }: { children: ReactNode; size?: string }) => (
  <div className="flex items-start" style={{ gap: "0.7cqw" }}>
    <svg viewBox="0 0 24 24" style={{ width: "1.2cqw", height: "1.2cqw", flexShrink: 0, marginTop: "0.18cqw" }} fill="none" stroke={T.gold2} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    <span style={{ ...txt, fontWeight: 600, fontSize: size, lineHeight: 1.4 }}>{glueNode(children)}</span>
  </div>
);

/**
 * bon · Бонус, если купите до конца дня (Александр, 08.10, дополнение и уточнение к ТЗ): модуль 3 «AI-креатор» и 6 месяцев доступа вместо 3.
 * В модуле 3: вирусная реклама для брендов и их продуктов, рекламные ролики на основе продуктов клиента, готовые референсы и показ, как такие
 * ролики создаются. Дальше слайд 36 раскрывает модуль с видеоуроком. Модулей по-прежнему три (число на слайдах 33 и 53 прежнее).
 * С 08.10, 15:00 третий подарок строкой снизу: модуль по рекламе через Claude и скилл AI-таргетолога (раскрывает слайд bon3 после 36).
 * С 09.10 «Подарок 1» герой слайда (ТЗ docs/tasks/deck_bonus_cover_1009.md): сгенерированная обложка модуля крупно (26cqw), золотая плашка «ПОДАРОК»,
 * при входе один раз фанфары (вылет обложки из коробки, вспышка, конфетти и искры, блик по карточке), см. bonus-fanfare.tsx. Подарки 2 и 3 компактнее, тексты прежние.
 */
export function M_Bonus() {
  const label: CSSProperties = { fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw" };
  return (
    <Statement kicker="Vibe Production" title={<>Бонус, если купите <Em>до конца дня</Em></>} size="3cqw">
      <div className="grid gap-[1cqw]" style={{ gridTemplateColumns: "1fr 1fr", maxWidth: "54cqw" }}>
        <Stagger i={0} style={{ gridColumn: "1 / -1" }}>
          <div className="flex items-center" style={{ ...card, borderRadius: 22, padding: "1.1cqw 1.5cqw 1.2cqw 1.3cqw", gap: "1.6cqw", border: `1.5px solid ${T.gold2}`, boxShadow: `${card.boxShadow}, 0 0 3cqw -0.6cqw ${T.gold2}66` }}>
            <BonusCover width="26cqw" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...label, color: T.gold2, marginBottom: "0.6cqw" }}>Подарок 1</div>
              <div style={{ ...txt, fontWeight: 700, fontSize: "1.75cqw", lineHeight: 1.25 }}>Модуль 3 «AI-креатор»</div>
              <div className="grid" style={{ gap: "0.75cqw", marginTop: "1cqw" }}>
                <Tick size="1.1cqw">Как создавать вирусную рекламу для брендов и их продуктов</Tick>
                <Tick size="1.1cqw">Рекламные ролики на основе продуктов клиента</Tick>
                <Tick size="1.1cqw">Готовые референсы от меня и показ, как создаются такие ролики</Tick>
              </div>
            </div>
            <Sheen radius={22} delay={1} />
          </div>
        </Stagger>
        <Stagger i={1} style={{ height: "100%" }}>
          <div style={{ ...card, borderRadius: 22, padding: "1.1cqw 1.4cqw", height: "100%" }}>
            <div className="flex items-center" style={{ gap: "0.8cqw" }}>
              <Px name="lg-s41-deadline" size="3.4cqw" bob={false} delay={0.37} style={{ margin: "-0.2cqw 0 -0.2cqw -0.2cqw" }} />
              <div style={{ ...label, color: T.accent }}>Подарок 2</div>
            </div>
            <div style={{ marginTop: "0.7cqw" }}><Num size="3.2cqw" color={T.gold}>{nb("6 месяцев")}</Num></div>
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.4cqw", lineHeight: 1.3, marginTop: "0.6cqw" }}>доступа к обучению вместо 3</div>
          </div>
        </Stagger>
        {/* подарок 3 (Александр, 08.10, 15:00): коротко, подробности на слайде bon3 после модуля 3 */}
        <Stagger i={2} style={{ height: "100%" }}>
          <div style={{ ...card, borderRadius: 22, padding: "1.1cqw 1.4cqw", height: "100%" }}>
            <div className="flex items-center" style={{ gap: "0.8cqw" }}>
              <Px name="lg-i-phonearrow" size="3.4cqw" bob={false} delay={0.45} style={{ margin: "-0.2cqw 0 -0.2cqw -0.2cqw" }} />
              <div style={{ ...label, color: T.accent }}>Подарок 3</div>
            </div>
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.4cqw", lineHeight: 1.3, marginTop: "0.9cqw" }}>{glueNode("Модуль по рекламе через Claude и скилл AI-таргетолога")}</div>
          </div>
        </Stagger>
      </div>
    </Statement>
  );
}

/** nf1 · Я начинал без лица: история Александра его словами и вывод для зрителя. */
export function M_NoFaceStory() {
  return (
    <Statement kicker="Блог без лица" title={<>Я начинал <Em>без лица</Em></>} size="3.2cqw">
      <div className="flex items-stretch" style={{ maxWidth: "54cqw", gap: "1.1cqw" }}>
        <Stagger i={0} style={{ flex: 1 }}>
          <div style={{ ...card, borderRadius: 22, padding: "1.4cqw 1.6cqw", height: "100%" }}>
            <Px name="lg-i-camera" size="5.2cqw" bob={false} delay={0.3} style={{ margin: "-0.3cqw 0 0.6cqw -0.3cqw" }} />
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: T.accent, marginBottom: "0.6cqw" }}>Сначала</div>
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.35cqw", lineHeight: 1.3 }}>{glueNode("Когда начинал, в основном снимал без лица")}</div>
          </div>
        </Stagger>
        <Stagger i={1} className="flex items-center"><Arrow color={T.gold2} size="1.8cqw" /></Stagger>
        <Stagger i={2} style={{ flex: 1 }}>
          <div style={{ ...card, borderRadius: 22, padding: "1.4cqw 1.6cqw", height: "100%", border: `1.5px solid ${T.gold2}` }}>
            <Px name="lg-s32-hand" size="5.2cqw" bob={false} delay={0.45} style={{ margin: "-0.3cqw 0 0.6cqw -0.3cqw" }} />
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: T.gold2, marginBottom: "0.6cqw" }}>Потом</div>
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.35cqw", lineHeight: 1.3 }}>{glueNode("Постепенно пришла уверенность, и я начал показывать себя")}</div>
          </div>
        </Stagger>
      </div>
      <Stagger i={4} base={0.5} style={{ marginTop: "1.8cqw" }}>
        <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.7cqw", lineHeight: 1.3, color: T.brown, maxWidth: "50cqw" }}>
          {glueNode("Не готовы к камере?")} <Em>{glueNode("Начните без лица")}</Em>
        </div>
      </Stagger>
    </Statement>
  );
}

/** nf2 · Если не можете снимать лицо: два формата, которые придумал Александр. Подробности про голос на слайде 23v. */
export function M_NoFaceFormats() {
  return (
    <Statement kicker="Блог без лица · Форматы" title={<>Если не можете <Em>снимать лицо</Em></>} lead="Два формата, которые я придумал." size="3.2cqw">
      <div className="grid grid-cols-2 gap-[1.2cqw]" style={{ maxWidth: "54cqw" }}>
        <Stagger i={0} style={{ height: "100%" }}>
          <div style={{ ...card, borderRadius: 22, padding: "1.4cqw 1.6cqw", height: "100%" }}>
            <Px name="lg-i-robot" size="5cqw" bob={false} delay={0.35} style={{ margin: "-0.3cqw 0 0.6cqw -0.3cqw" }} />
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: T.accent, marginBottom: "0.6cqw" }}>Формат 1</div>
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.4cqw", lineHeight: 1.25 }}>{glueNode(<>Анимированная <span style={{ whiteSpace: "nowrap" }}>голова-рассказчик</span></>)}</div>
          </div>
        </Stagger>
        <Stagger i={1} style={{ height: "100%" }}>
          <div style={{ ...card, borderRadius: 22, padding: "1.4cqw 1.6cqw", height: "100%", border: `1.5px solid ${T.gold2}` }}>
            <Px name="lg-i-clapper" size="5cqw" bob={false} delay={0.42} style={{ margin: "-0.3cqw 0 0.6cqw -0.3cqw" }} />
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: T.gold2, marginBottom: "0.6cqw" }}>Формат 2</div>
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.4cqw", lineHeight: 1.25 }}>{glueNode("Простой монтаж с закадровым голосом")}</div>
            <div style={{ ...txt, fontWeight: 500, fontSize: "1.05cqw", lineHeight: 1.45, color: T.muted, marginTop: "0.7cqw" }}>
              {glueNode("Голос свой: запишите голосовое на iPhone и отправьте агенту. Или дорожка ElevenLabs.")}
            </div>
          </div>
        </Stagger>
      </div>
    </Statement>
  );
}

/** Телефон с рилсом: запуск и пауза по клику, звук включён, поверх счётчик просмотров. Включённый телефон гасит остальные (active). */
export function ReelPhone({ file, views, width, i, active, setActive }: { file: string; views: string; width: string; i: number; active: number | null; setActive: (n: number | null) => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  // включили другой рилс: этот ставим на паузу
  useEffect(() => { const v = ref.current; if (v && active !== i && !v.paused) v.pause(); }, [active, i]);
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { setActive(i); v.play().catch(() => {}); }
    else { v.pause(); setActive(null); }
  };
  return (
    <div style={{ width, aspectRatio: "9/16", background: T.night, borderRadius: "1.8cqw", padding: "0.25cqw", boxShadow: `0 0 0 1px ${T.nightLine} inset, ${T.shadow}`, flexShrink: 0 }}>
      <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: "1.55cqw", background: T.night2 }}>
        <SlideVideo videoRef={ref} src={`/montage/noface/${file}.mp4`} poster={`/montage/noface/${file}.jpg`} preload="metadata" playsInline
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setActive(null); }}
          className="absolute inset-0 h-full w-full object-cover" />
        {views && <Views value={views} size="0.8cqw" style={{ position: "absolute", left: "0.7cqw", bottom: "0.8cqw" }} />}
        {/* pointer-events: auto — слой слайда в колоде пропускает клики насквозь, кнопке их нужно вернуть */}
        <button type="button" aria-label={playing ? "Пауза" : "Включить рилс со звуком"} aria-pressed={playing}
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: "auto", cursor: "pointer", border: 0, padding: 0, background: playing ? "transparent" : "rgba(10,8,7,.22)", transition: "background .25s" }}>
          {!playing && (
            <span className="flex items-center justify-center" style={{ width: "3.6cqw", height: "3.6cqw", borderRadius: 999, ...goldButton, boxShadow: `0 0.8cqw 1.8cqw -0.6cqw ${T.gold2}` }}>
              <svg viewBox="0 0 24 24" style={{ width: "1.5cqw", height: "1.5cqw", marginLeft: "0.2cqw" }} fill={LT.ink}><path d="M8 5v14l11-7z" /></svg>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * nf3 · Рилсы без лица от начала до конца: по телефону на формат, настоящие видео из public/montage/noface/, данные в noface-reels.ts.
 * Без массива слайд не показываем (условие в MontageDeck.tsx). Телефоны в ряд в левых 60%: до трёх крупные, до пяти мельче.
 * Клик по телефону включает рилс со звуком, второй клик ставит на паузу; включённый рилс гасит остальные.
 */
export function M_NoFaceReels() {
  const reels = NOFACE_REELS;
  const [active, setActive] = useState<number | null>(null);
  const n = reels.length;
  const width = n <= 2 ? "14.5cqw" : n === 3 ? "13cqw" : "9.6cqw";
  const sources = [...new Set(reels.map((r) => r.source))];
  return (
    <Statement kicker="Блог без лица · Примеры" title={<>Рилсы без лица, <Em>целиком</Em></>} size="2.9cqw">
      <div className="flex items-start" style={{ gap: "1.4cqw", maxWidth: "54cqw" }}>
        {reels.map((r, i) => (
          <Stagger key={r.file} i={i} style={{ width }}>
            <ReelPhone file={r.file} views={r.views} width={width} i={i} active={active} setActive={setActive} />
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.8cqw", color: T.gold2, marginTop: "0.9cqw", lineHeight: 1.3 }}>{glueNode(r.format)}</div>
            <div style={{ ...txt, fontWeight: 600, fontSize: "1cqw", lineHeight: 1.3, marginTop: "0.3cqw" }}>{glueNode(r.title)}</div>
          </Stagger>
        ))}
      </div>
      <Note style={{ marginTop: "1.2cqw" }}>{sources.join(". ")}</Note>
    </Statement>
  );
}

/** Две настоящие карусели Александра для car: public/montage/carousels/<base>-1…4.jpg (4:5), цифры Instagram API на 8 октября 2026. */
const CAROUSELS = [
  { base: "chat4", title: "Один чат. 4 канала", views: "4,1 тыс.", saves: "91", savesWord: "сохранение" },
  { base: "lazyweb", title: "Почему AI рисует серенько", views: "3,9 тыс.", saves: "97", savesWord: "сохранений" },
];
const CAROUSEL_SLIDES = 4;

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: "1.25cqw", height: "1.25cqw" }} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12Z" /><circle cx="12" cy="12" r="3.2" />
  </svg>
);
const BookmarkIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: "1.25cqw", height: "1.25cqw" }} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 3.5h12v17l-6-4.6-6 4.6z" />
  </svg>
);

/** Строка счётчика под каруселью: значок, число золотом, подпись. */
const Stat = ({ icon, n, label }: { icon: ReactNode; n: string; label: string }) => (
  <div className="flex items-center" style={{ gap: "0.55cqw" }}>
    <span style={{ display: "flex", color: T.gold2 }}>{icon}</span>
    <Num size="1.2cqw" color={T.gold}>{nb(n)}</Num>
    <span style={{ ...txt, fontWeight: 500, fontSize: "0.95cqw", color: T.muted }}>{label}</span>
  </div>
);

/**
 * Одна карусель: слайды лентой в рамке 4:5, как листают в Instagram (клик по рамке или по точке листает, после четвёртого слайда снова первый).
 * За рамкой выглядывают два следующих слайда, потемнее: стопка. Под рамкой точки, название и счётчики.
 * pointer-events: auto — слой слайда в колоде пропускает клики насквозь, кнопкам их нужно вернуть; stopPropagation не даёт кликом листать колоду.
 */
function CarouselStack({ c }: { c: (typeof CAROUSELS)[number] }) {
  const [n, setN] = useState(0);
  const ks = Array.from({ length: CAROUSEL_SLIDES }, (_, k) => k);
  // облегчённые копии 1080 px (docs/perf/make-small-images.mjs): в рамке 16% ширины кадра хватает с запасом, в памяти в 4 раза легче
  const src = (k: number) => `/montage/carousels/${c.base}-${k + 1}-1080.jpg`;
  const R = "1.3cqw";
  const last = n === CAROUSEL_SLIDES - 1;
  return (
    <div style={{ width: "17.6cqw", flexShrink: 0 }}>
      <div className="relative" style={{ width: "16cqw", aspectRatio: "4/5" }}>
        {[2, 1].map((d) => (
          <div key={d} aria-hidden className="absolute inset-0 overflow-hidden"
            style={{ borderRadius: R, transformOrigin: "left center", transform: `translateX(${d * 1.68}cqw) scale(${1 - d * 0.055})`, filter: `brightness(${1 - d * 0.26})`, boxShadow: T.shadowSm }}>
            <img src={src((n + d) % CAROUSEL_SLIDES)} alt="" draggable={false} className="h-full w-full object-cover" />
          </div>
        ))}
        <button type="button" aria-label={`Карусель «${c.title}»: ${last ? "сначала" : "следующий слайд"}`}
          onClick={(e) => { e.stopPropagation(); setN((v) => (v + 1) % CAROUSEL_SLIDES); }}
          className="absolute inset-0 overflow-hidden"
          style={{ pointerEvents: "auto", cursor: "pointer", border: 0, padding: 0, borderRadius: R, background: T.night2, boxShadow: `0 0 0 1px ${T.nightLine} inset, ${T.shadow}` }}>
          <div className="flex h-full" style={{ width: `${CAROUSEL_SLIDES * 100}%`, transform: `translateX(-${(n * 100) / CAROUSEL_SLIDES}%)`, transition: "transform .55s cubic-bezier(.23,1,.32,1)" }}>
            {ks.map((k) => (
              <img key={k} src={src(k)} alt={`${c.title}, слайд ${k + 1}`} draggable={false} style={{ width: `${100 / CAROUSEL_SLIDES}%`, height: "100%", objectFit: "cover", flexShrink: 0, display: "block" }} />
            ))}
          </div>
          {/* номер слайда, как в Instagram */}
          <span style={{ position: "absolute", top: "0.7cqw", right: "0.7cqw", padding: "0.3cqw 0.7cqw", borderRadius: 999, background: "rgba(10,8,7,.62)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            color: "#fff", fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.8cqw", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{n + 1}/{CAROUSEL_SLIDES}</span>
          {/* стрелка «дальше» на правом краю, на последнем слайде её нет */}
          {!last && (
            <span className="flex items-center justify-center" style={{ position: "absolute", right: "0.6cqw", top: "50%", width: "1.9cqw", height: "1.9cqw", marginTop: "-0.95cqw", borderRadius: 999, background: "rgba(255,255,255,.88)", boxShadow: "0 0.3cqw 0.8cqw rgba(0,0,0,.35)" }}>
              <svg viewBox="0 0 24 24" style={{ width: "1.1cqw", height: "1.1cqw" }} fill="none" stroke="#14100E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
            </span>
          )}
        </button>
      </div>
      <div className="flex items-center justify-center" style={{ width: "16cqw", marginTop: "0.5cqw" }}>
        {ks.map((k) => (
          <button key={k} type="button" aria-label={`Слайд ${k + 1}`} onClick={(e) => { e.stopPropagation(); setN(k); }}
            style={{ pointerEvents: "auto", cursor: "pointer", border: 0, background: "transparent", padding: "0.35cqw 0.18cqw" }}>
            <span style={{ display: "block", width: k === n ? "1.2cqw" : "0.5cqw", height: "0.5cqw", borderRadius: 999, background: k === n ? T.gold : `${T.muted}77`, transition: "width .3s, background .3s" }} />
          </button>
        ))}
      </div>
      <div style={{ ...txt, fontWeight: 700, fontSize: "1.05cqw", lineHeight: 1.3, marginTop: "0.4cqw", maxWidth: "16cqw" }}>{glueNode(c.title)}</div>
      <div className="grid" style={{ gap: "0.35cqw", marginTop: "0.7cqw" }}>
        <Stat icon={<EyeIcon />} n={c.views} label="просмотров" />
        <Stat icon={<BookmarkIcon />} n={c.saves} label={c.savesWord} />
      </div>
    </div>
  );
}

/**
 * car · Карусели: ещё один вид контента (Александр, 08.10, 14:30): карусели тоже контент без лица, в них можно поставить свой видеоряд с монтажом или просто картинки.
 * Две настоящие карусели Александра по 4 слайда (public/montage/carousels), счётчики из Instagram API на 8 октября 2026.
 * Всё в левых 60% кадра. Листание только кликом по рамке или точке: клавиши колоды (стрелки, пробел) заняты листанием слайдов презентации.
 */
export function M_Carousels() {
  return (
    <Statement kicker="Блог без лица · Карусели" title={<>Карусели:<br /><Em>ещё один вид контента</Em></>} lead="Карусели тоже контент без лица." size="3cqw">
      <div className="flex items-start" style={{ maxWidth: "54cqw", gap: "2.2cqw" }}>
        {CAROUSELS.map((c, i) => <Stagger key={c.base} i={i} style={{ flexShrink: 0 }}><CarouselStack c={c} /></Stagger>)}
        <Stagger i={2} style={{ flex: 1, minWidth: 0, alignSelf: "stretch" }}>
          <div className="flex h-full flex-col justify-center" style={{ gap: "0.8cqw", maxHeight: "20cqw" }}>
            <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.85cqw", lineHeight: 1.3, color: T.accent }}>В карусель можно поставить</div>
            <div style={{ ...card, borderRadius: 20, padding: "1cqw 1.2cqw", border: `1.5px solid ${T.gold2}` }}>
              <Px name="lg-i-laptopfilm" size="3.8cqw" bob={false} delay={0.5} style={{ margin: "-0.3cqw 0 0.4cqw -0.3cqw" }} />
              <div style={{ ...txt, fontWeight: 700, fontSize: "1.15cqw", lineHeight: 1.3 }}>{glueNode("Свой видеоряд с монтажом")}</div>
            </div>
            <div style={{ ...card, borderRadius: 20, padding: "1cqw 1.2cqw" }}>
              <Px name="lg-i-box" size="3.8cqw" bob={false} delay={0.57} style={{ margin: "-0.3cqw 0 0.4cqw -0.3cqw" }} />
              <div style={{ ...txt, fontWeight: 700, fontSize: "1.15cqw", lineHeight: 1.3 }}>{glueNode("Просто картинки")}</div>
            </div>
          </div>
        </Stagger>
      </div>
      <Note style={{ marginTop: "0.8cqw" }}>Просмотры и сохранения: Instagram API, 8 октября 2026</Note>
    </Statement>
  );
}

/**
 * hf · Higgsfield прямо из Claude (Александр, 08.10, 15:00; после слайда 35, модуль 1): через Higgsfield MCP агент в Claude генерирует объекты для монтажа,
 * картинки для каруселей и связки (картинка в ролик, объект в кадр). Логотип: public/montage/logos/higgsfield.png (иконка приложения, 192×192),
 * слева настоящий скрин страницы Higgsfield про подключение к Claude (public/screenshots/higgsfield_claude_mcp.png).
 * LEGO-объекты колоды как «примеры сгенерированного» не показываем: они сделаны в gpt-image, не в Higgsfield, поэтому подписи «сделано в Higgsfield» им нельзя.
 */
export function M_Higgsfield() {
  const uses: [string, string, string][] = [
    ["lg-i-clapper", "Объекты для монтажа", "Предметы, которые встают в кадр рилса"],
    ["lg-i-cards", "Картинки для каруселей", "Агент рисует их прямо в разговоре"],
    ["lg-i-laptopfilm", "Связки", "Картинка в ролик, объект в кадр"],
  ];
  return (
    <Statement kicker="Модуль 1 · Higgsfield" title={<>Higgsfield <Em>прямо из Claude</Em></>} lead="На обучении покажу, как с ним работать. Через Higgsfield MCP агент генерирует прямо в разговоре." size="3.2cqw">
      <Stagger i={0} className="flex items-center" style={{ gap: "0.9cqw", marginBottom: "1.2cqw" }}>
        <span className="inline-flex items-center" style={{ ...card, borderRadius: 999, padding: "0.5cqw 1.1cqw 0.5cqw 0.8cqw", gap: "0.6cqw" }}>
          <MaskIcon name="claude" color={T.gold} size="1.6cqw" />
          <span style={{ ...txt, fontWeight: 700, fontSize: "1.1cqw" }}>Claude</span>
        </span>
        <Arrow color={T.gold2} size="1.5cqw" />
        <span className="inline-flex items-center" style={{ ...card, borderRadius: 999, padding: "0.5cqw 1.1cqw 0.5cqw 0.5cqw", gap: "0.6cqw" }}>
          <img src="/montage/logos/higgsfield.png" alt="Higgsfield" style={{ width: "2cqw", height: "2cqw", borderRadius: "0.45cqw", display: "block" }} />
          <span style={{ ...txt, fontWeight: 700, fontSize: "1.1cqw" }}>Higgsfield MCP</span>
        </span>
      </Stagger>
      <div className="flex items-start" style={{ maxWidth: "54cqw", gap: "1.6cqw" }}>
        <Stagger i={1} style={{ width: "26cqw", flexShrink: 0 }}>
          <div style={{ ...card, borderRadius: 20, padding: "0.5cqw" }}>
            {/* скрин увеличен в 1,5 раза и обрезан по заголовку: иначе мелкий текст страницы не читается */}
            <div className="relative" style={{ width: "100%", aspectRatio: "16/8", overflow: "hidden", borderRadius: "1.5cqw", background: "#000" }}>
              <img src="/screenshots/higgsfield_claude_mcp.png" alt="Страница Higgsfield: подключение к Claude" style={{ display: "block", width: "150%", maxWidth: "none", marginLeft: "-25%", marginTop: "-4%" }} />
              {/* нижняя половина страницы (вкладки и шаги установки) растворяется: на слайде нужен только заголовок */}
              <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 48%, #000 80%)" }} />
            </div>
          </div>
          <Note style={{ marginTop: "0.6cqw" }}>Страница Higgsfield: подключение к Claude</Note>
        </Stagger>
        <div className="grid" style={{ flex: 1, minWidth: 0, gap: "0.8cqw" }}>
          {uses.map(([ic, t, d], i) => (
            <Stagger key={t} i={2 + i}>
              <div className="flex items-center" style={{ ...card, borderRadius: 20, padding: "0.7cqw 1.2cqw 0.7cqw 0.9cqw", gap: "0.9cqw" }}>
                <div className="flex justify-center" style={{ width: "4.2cqw", flexShrink: 0 }}><Px name={ic} size="3.4cqw" bob={false} delay={0.4 + i * 0.07} /></div>
                <div>
                  <div style={{ ...txt, fontWeight: 700, fontSize: "1.1cqw", lineHeight: 1.3 }}>{glueNode(t)}</div>
                  <div style={{ ...txt, fontWeight: 500, fontSize: "0.9cqw", lineHeight: 1.35, color: T.muted, marginTop: "0.2cqw" }}>{glueNode(d)}</div>
                </div>
              </div>
            </Stagger>
          ))}
        </div>
      </div>
    </Statement>
  );
}

/**
 * bon3 · Третий бонус за покупку до конца дня (Александр, 08.10, 15:00; после 36): бонусный модуль по запуску рекламы через Claude и скилл AI-таргетолога.
 * Площадки модуля: Facebook, Instagram, YouTube, TikTok. Честная подпись: скилл работает с Facebook и Instagram.
 * Текст слов Александра из ТЗ. Логотипы: public/montage/logos (brand-logos и workshop-montazh/assets/logos).
 */
export function M_Bonus3() {
  const platforms: [string, string][] = [["Facebook", "facebook"], ["Instagram", "instagram"], ["YouTube", "youtube"], ["TikTok", "tiktok"]];
  return (
    <Statement obj="lg-i-rocket" objSize="8cqw" kicker="Бонус 3, если купите до конца дня" title={<>Модуль по рекламе и мой <Em><span style={{ whiteSpace: "nowrap" }}>AI-таргетолог</span></Em></>} size="3cqw">
      {/* три коротких тезиса вместо абзаца (Александр, 09.10): по одному в строку, номер в золотом кружке */}
      <div className="grid" style={{ ...card, borderRadius: 22, padding: "1.3cqw 1.6cqw", maxWidth: "54cqw", borderLeft: `0.28cqw solid ${T.gold2}`, gap: "1.1cqw" }}>
        {([
          "Вас на этот воркшоп привела моя реклама",
          "Её запускает и ведёт мой AI-таргетолог",
          <>Хотите такого же? <Em>Даю его бонусом к обучению по AI-монтажу</Em></>,
        ] as ReactNode[]).map((t, k) => (
          <Stagger key={k} i={k} base={0.3}>
            <div className="flex items-center" style={{ gap: "1.2cqw" }}>
              <span className="flex items-center justify-center" style={{ ...goldButton, width: "2.7cqw", height: "2.7cqw", borderRadius: 999, flexShrink: 0, fontFamily: "var(--font-unbounded)", fontWeight: 800, fontSize: "1.25cqw", lineHeight: 1 }}>{k + 1}</span>
              <span style={{ ...txt, fontWeight: 700, fontSize: "1.75cqw", lineHeight: 1.3, textWrap: "pretty" }}>{glueNode(t)}</span>
            </div>
          </Stagger>
        ))}
      </div>
      <Stagger i={3} style={{ marginTop: "1.6cqw" }}>
        <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.85cqw", color: T.accent, marginBottom: "0.7cqw" }}>Площадки модуля</div>
        <div className="flex" style={{ gap: "0.8cqw" }}>
          {platforms.map(([name, file], i) => (
            <Stagger key={file} i={4 + i}>
              <div className="flex items-center" style={{ ...card, borderRadius: 18, padding: "0.8cqw 1.2cqw", gap: "0.7cqw" }}>
                <MaskIcon name={file} color={T.gold} size="1.9cqw" />
                <span style={{ ...txt, fontWeight: 700, fontSize: "1.1cqw" }}>{name}</span>
              </div>
            </Stagger>
          ))}
        </div>
      </Stagger>
      <Note style={{ marginTop: "1cqw" }}>Скилл AI-таргетолога работает с Facebook и Instagram</Note>
    </Statement>
  );
}

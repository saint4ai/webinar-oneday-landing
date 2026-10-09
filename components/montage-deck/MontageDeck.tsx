"use client";

/**
 * MontageDeck — эфир Vibe Production. Показ 6 октября 2026, 20:00 (до этого — 1 октября). На слайдах дату не пишем: «сегодня в 20:00».
 * Бренд-код сайтов onai.academy (theme.ts ← fx/brand.ts). Правые 40% кадра — зона камеры: только фон слайда (кроме lv: видеоурок на весь кадр).
 * 08.10.2026 (решение Александра, ТЗ docs/tasks/deck_ai_montage.md): воркшоп только про AI-монтаж. Порядок: вступление (обложка, опросы, программа,
 * обещание) → обо мне и доказательства (кейсы 08c, результаты) → проблема монтажа и блог без лица (11–16, nf1, nf2, 23, car, 23v) → практика: подводка pr и видеоурок lv
 * «весь путь рилса» (его монтирует «Монтаж Reels», сценарий docs/workshop-v2/videourok-pipeline.md) → после урока (22, 22r, 44, 50, 30–32) →
 * продажа только Vibe Production (33, 34, 34a «Научу работать с агентами», 35, hf «Higgsfield прямо из Claude», 37, 37w, 37v, 38, 39a, 39, bon «Бонус до конца дня», 36 «AI-креатор», bon3 «Третий бонус: реклама и AI-таргетолог», 41, оплата pay1)
 * → окно продаж 2 (51–55, 57g, оплата pay3) → финал.
 * Практики «презентация по брифу» и «приложение из описания», блок Vibe Coding PRO и пакет двух курсов 390 000 ₸ из показа убраны (ключи — в комментариях ниже).
 * Слайды оплаты — slides/pay.tsx (два QR: Kaspi и карты СНГ/мира), в показе варианты production и final.
 * Прежняя раскладка 07.10 вечером: контент → подводка к практике (pr: Александр в OBS проводил три практики) → продажа → Vibe Coding PRO и кейсы → оффер 390 000 ₸ → финал.
 * План: projects/ai_montage_webinar/РЕЖИССУРА_воркшоп_06-10.md. Режиссура v2: docs/deck-v2/РЕЖИССУРА.md.
 * Слайд 00: Enter — старт интро-ролика со звуком. Слайд 56 (клавиши 0–5, «осталось N из 5») с 08.10 вне показа.
 * [Скобки] на слайдах — пропуски, их дописывает Александр до эфира. На 07.10 в показе их нет (ревью deck-review-0710.md).
 * Слова в чат: ГАЙД (07, 58), МОНТАЖ. Слова ПРО и ДВА (слайд 57, блок v1–v5) с 08.10 не в показе.
 * 10v, 10g, 10i, 22r — результаты: цифры в results.ts, скрины в public/montage/results/ (shots — какие файлы уже лежат).
 */
import { SlideDeck } from "@/components/sales-deck/SlideDeck";
import { unbounded, manrope } from "./fonts";
import { GLASS } from "./theme";
import { M_Chapter } from "./slides/M_Chapter";
import { M_Check, M_Poll, M_Program, M_Promise, M_Guides, M_About, M_CostStory, M_Proof15 } from "./slides/start";
import { M_Bottleneck, M_Vacancy, M_ThreeSeconds, M_OnePhrase, M_OneOf14, M_AgentOnPC, M_FiveSteps, M_StepVoice, M_Styles, M_StepAssemble, M_ReadyReel, M_NoFace } from "./slides/lesson1";
import { M_Case107, M_Want, M_WhoFirst, M_CostNow, M_NotCourse, M_Anchor, M_Installments, M_Discount, M_SixMonths, M_HowToBook, M_Inaction, M_OneScreen, M_Doubts, M_Subscriptions, M_Slots, M_FinalCTA, M_GameBonus } from "./slides/sale";
import { M_ShopReel, M_ReelProgram, M_ShopAd, M_ShopLead, M_ForYou, M_SoloVsCourse } from "./slides/directions";
import { M_MyPath } from "./slides/warmup";
import { M_Cases, M_Platform, M_CasePages } from "./slides/cases";
import { M_ResultMontage, M_ViralReels, M_Growth30, M_Inquiries } from "./slides/results";
import { M_CodeWordFlow, M_Plan30, M_Thanks } from "./slides/lesson3";
import { M_Blog, M_GameCommunity, M_Instagram, M_ServicesOffer, M_TeamTraining } from "./slides/outro";
import { M_Cover } from "./slides/M_Cover";
import { M_ToPractice } from "./slides/handoff";
import { M_PayQR } from "./slides/pay";
import { M_DocsHow, M_DocsLive, M_AppsBuilds, M_AIStudio, M_AppBrief, M_AppStart, M_AppNext, M_WebApps, M_MainConclusion, M_DeckByAgent } from "./slides/practice";
import { M_VcWho, M_VcProgram, M_VcTariffs, M_VcBundle, M_VcChoose, M_VcBook } from "./slides/vcpro";
import { M_VoiceNoFace, M_LessonVideo, M_AgentsSetup, M_Bonus, M_Bonus3, M_Higgsfield, M_NoFaceStory, M_NoFaceFormats, M_NoFaceReels, M_Carousels } from "./slides/pipeline";

/** Файлы из public/montage/, которые page.tsx нашёл на диске. Нет файла — на слайде пунктирное место. */
export type Shots = { intro?: string; doc?: string; growth?: (string | undefined)[]; viral?: (string | undefined)[] };

export function MontageDeck({ shots = {} }: { shots?: Shots }) {
  const slides = [
    // Интро-заглушка «Здесь откроется ролик…» (M_IntroVideo) убрана 07.10 вечером по решению Александра: колода начинается с обложки.
    // Вернуть: вставить M_IntroVideo с нулевым ключом и src={shots.intro} перед обложкой. Ключи в комментариях буквально не писать (shoot-offline.mjs).
    // Старт · 5 мин
    <M_Cover key="01" />,
    <M_Check key="02" />,
    <M_Poll key="03" kicker="Знакомимся" title="Кто вы?" lead="Напишите цифру в чат."
      options={["Эксперт, у меня свой продукт", "Не хочу сниматься сам", "SMM, делаю рилсы для клиентов", "Хочу брать заказы на монтаж"]}
      icons={["lg-i-stall", "lg-i-camera", "lg-i-phones", "lg-i-laptopcoins"]} />,
    <M_Poll key="04" kicker="Ещё вопрос" title="Сколько роликов вы выпустили за последний месяц?" lead="Ответ цифрой в чат."
      options={["Ни одного", "От 1 до 3", "От 4 до 10", "Больше 10"]} icons={["lg-i-hourglass", "lg-i-clapper", "lg-i-calfilm", "lg-i-rocket"]} />,
    <M_Program key="05" />,
    <M_Promise key="06" />,
    <M_Guides key="07" kicker="Бонус за досмотр" title={"Досмотрите до конца: три гайда"} lead="Выдам в конце эфира по слову ГАЙД." />,
    // Кто я, хронология и результаты · 7 мин
    <M_About key="08" />,
    <M_MyPath key="08w" />,
    // Три платформы обучения 08p1, 08p2, 08p3 (M_Platform, данные PLATFORMS в cases.ts) и страницы кейсов на сайте 08cs (M_CasePages) убраны 08.10:
    // карусель кейсов 08c одна показывает, что Александр собирает платформы и IT-решения для компаний.
    // Вернуть: вставить M_Platform с ключами 08p1, 08p2, 08p3 (проп i от 0 до 2) перед 08c и M_CasePages с ключом 08cs после неё (импорты уже есть)
    <M_Cases key="08c" />,
    <M_CostStory key="09" />,
    <M_Proof15 key="10" />,
    <M_ViralReels key="10v" shots={shots.viral} />,
    <M_Growth30 key="10g" shots={shots.growth} />,
    <M_Inquiries key="10i" />,
    // Проблема монтажа и блог без лица · 12 мин
    <M_Chapter key="11" big="7" obj="lg-ch1-clapper" kicker="Практика" title="Весь путь рилса" sub="7 шагов от идеи до заявки клиента: проблема монтажа, блог без лица и видеоурок" />,
    <M_Bottleneck key="12" />,
    <M_Vacancy key="13" />,
    <M_ThreeSeconds key="14" />,
    <M_OnePhrase key="15" />,
    <M_OneOf14 key="16" />,
    // Блок «Блог без лица» (Александр 08.10 вечером, вместо слайдов про вайбкодинг и три практики): nf1 история «я начинал без лица»,
    // nf2 два формата для тех, кто не может снимать лицо, 23 четыре формата с рилсами целиком (телефон, клик со звуком), car карусели, 23v голос.
    // nf3 (M_NoFaceReels, рилсы без лица рядом) убран из показа 08.10, 14:30: оба рилса без лица теперь внутри слайда 23, повтор не нужен.
    // Вернуть: вставить M_NoFaceReels с ключом nf3 после nf2 (импорт уже есть, данные в noface-reels.ts остались).
    <M_NoFaceStory key="nf1" />,
    <M_NoFaceFormats key="nf2" />,
    <M_NoFace key="23" />,
    // car · Карусели: ещё один вид контента (08.10, 14:30). Две настоящие карусели Александра в public/montage/carousels/, цифры из Instagram API на 08.10
    <M_Carousels key="car" />,
    <M_VoiceNoFace key="23v" />,
    // Практика: видеоурок «весь путь рилса» (решение Александра 08.10). pr — семь шагов пути, lv — видео на весь кадр.
    // Файл public/montage/lesson/videourok-pipeline.mp4 кладёт монтажёр «Монтаж Reels»; пока его нет, lv показывает постер.
    // p3h M_MainConclusion («Приложение и сайт собираются из описания») убран 08.10: он про приложения, а не про монтаж. Вернуть: вставить M_MainConclusion с ключом p3h перед pr (импорт уже есть)
    <M_ToPractice key="pr" />,
    <M_LessonVideo key="lv" />,
    // Шаги 17–21 (монтажёр на вашем компьютере, пять шагов, голос, стили, сборка) теперь внутри видеоурока, из показа убраны 08.10.
    // Вернуть: вставить M_AgentOnPC, M_FiveSteps, M_StepVoice, M_Styles, M_StepAssemble с ключами 17, 18, 19, 20, 21 после 16 (импорты уже есть)
    // После урока
    <M_ReadyReel key="22" />,
    // 22r M_ResultMontage («За месяц: что смонтировал», 927 тыс.) убран 09.10: повторял слайд 10 M_Proof15 (Александр: «зачем повторяется, он уже был»). Вернуть: вставить M_ResultMontage с ключом 22r после 22
    <M_CodeWordFlow key="44" />,
    <M_Plan30 key="50" />,
    // Переход к продаже · 3 мин
    <M_Case107 key="30" />,
    <M_Want key="31" />,
    <M_WhoFirst key="32" />,
    <M_CostNow key="cost" />,
    // Практика 2 (презентация по брифу: p2, p2a, p2c) и практика 3 (приложение и сайт: p3, p3a, p3b, p3c, p3e, p3i) убраны 08.10 по решению Александра:
    // воркшоп только про AI-монтаж. Компоненты живут в slides/practice.tsx, импорты в начале файла остались.
    // Вернуть: вставить M_Chapter с ключами p2 и p3 (big 2 и 3, kicker «Практика 2 из 3» и «Практика 3 из 3») и по порядку M_DocsHow p2a, M_DocsLive p2c,
    // M_AppsBuilds p3a, M_AIStudio p3b, M_AppBrief p3c, M_AppNext p3e, M_DeckByAgent p3i между 32 и 33.
    // Ранее убраны 07.10: p2b M_DocsExample (нет скрина doc-example.png), p3f «Сколько такое стоит» (цены без источника), p3g M_WebApps, M_AppStart.
    // Окно продаж 1 · 10 мин: после видеоурока. Продаём только Vibe Production
    <M_Chapter key="33" big="Обучение" bigSize="9cqw" kicker="Vibe Production" title={"3 модуля, 15 уроков, 1 месяц"} sub="Доступ к урокам 3 месяца" />,
    <M_NotCourse key="34" />,
    // 34a · Научу работать с агентами (новый 08.10): правильно ставить задачу, настраивать агентов, готовая архитектура папки проекта
    <M_AgentsSetup key="34a" />,
    // 35 (модуль 1, AI-монтаж), 37 (модуль 2, ассистенты и автоматизация), потом опрос 03 переворачивается (37w) и «сами или с обучением» (37v).
    // Режиссура: docs/tasks/deck_wave4_directions.md. Порядок модулей с 08.10: 1 AI-монтаж (35), 2 ассистенты и автоматизация (37), 3 AI-креатор (36, он же бонус).
    <M_ShopReel key="35" />,
    // 35p · программа модуля 1: что входит в 5 уроков и бонус (Александр, 09.10)
    <M_ReelProgram key="35p" />,
    // hf · Higgsfield прямо из Claude (Александр 08.10, 15:00): как с ним работать на обучении, сразу после модуля 1
    <M_Higgsfield key="hf" />,
    <M_ShopLead key="37" />,
    <M_ForYou key="37w" />,
    <M_SoloVsCourse key="37v" />,
    <M_Anchor key="38" />,
    <M_Discount key="39a" />,
    <M_Installments key="39" />,
    // Бонус за покупку до конца дня (Александр 08.10): bon — модуль 3 AI-креатор, 6 месяцев доступа и модуль по рекламе (третий подарок), 36 — раскрытие модуля 3 с видеоуроком (раньше модуль 2 перед 37)
    <M_Bonus key="bon" />,
    <M_ShopAd key="36" />,
    // bon3 · третий бонус до конца дня (08.10, 15:00): модуль по рекламе через Claude и скилл AI-таргетолога, после раскрытия модуля 3
    <M_Bonus3 key="bon3" />,
    // 40 M_SixMonths («6 месяцев вместо 3») убран 08.10: то же самое говорит первый подарок на bon. Вернуть: вставить M_SixMonths с ключом 40 после 36 (импорт уже есть)
    <M_HowToBook key="41" />,
    // Оплата Vibe Production: два QR (Kaspi и карты СНГ/мира), текст над ними с ценой 150 000 ₸ (slides/pay.tsx)
    <M_PayQR key="pay1" variant="production" />,
    // Блок Vibe Coding PRO (v1 M_VcWho, v2 M_VcProgram, v3 M_VcTariffs), кейсы второй раз (08c2: M_Cases с кикером «Это я собрал сам»), оффер 390 000 ₸
    // (v4 M_VcBundle, v5 M_VcChoose) и оплата пакета (pay2: M_PayQR с variant bundle) убраны 08.10: продаём только Vibe Production.
    // Цены PRO и пакета остались в prices.ts. Вернуть: вставить в этом порядке v1, v2, v3, 08c2, v4, v5, pay2 после pay1 (импорты уже есть). Тексты: docs/copy/deck-block-vcpro.md
    // v6 M_VcBook («как занять место») убран ещё 07.10 вечером: его заменяют слайды оплаты. Вернуть: вставить M_VcBook с ключом v6 после v5
    // Окно продаж 2 · 8 мин
    <M_Chapter key="51" big="Решение" bigSize="9cqw" kicker="Vibe Production" title="Остался один шаг" sub="Коротко повторю главное и отвечу на сомнения" />,
    <M_Inaction key="52" />,
    <M_OneScreen key="53" />,
    <M_Doubts key="54" />,
    <M_Subscriptions key="55" />,
    // 56 M_Slots («Осталось N из 5», доступ 6 месяцев первым 5 броням) убран 08.10: условие заменил бонус «до конца дня» (слайд bon).
    // Вернуть: вставить M_Slots с ключом 56 после 54 (импорт уже есть), текст слайда сначала переписать под новое условие
    // 57 M_FinalCTA убран 07.10 вечером: его заменяет последний слайд оплаты. Вернуть: вставить M_FinalCTA с ключом 57 после слота мест (импорт уже есть).
    // Внимание: в нём слова ПРО и ДВА про Vibe Coding PRO и пакет двух курсов, перед возвратом их убрать
    <M_GameBonus key="57g" />,
    <M_PayQR key="pay3" variant="final" />,
    // Финал · 2 мин
    <M_Guides key="58" kicker="Обещанное" title="Забирайте три гайда" lead="Напишите ГАЙД менеджеру в WhatsApp." contact />,
    // Финал перед прощанием (Александр 06.10, порядок 07.10 вечером): обучение для компаний, внедрение, блог, Instagram, игра — у каждого свой QR.
    // Игра последняя содержательная: на ней прощание, потом последний экран «Спасибо, что пришли»
    <M_TeamTraining key="o1" />,
    <M_ServicesOffer key="o2" />,
    <M_Blog key="o4" />,
    <M_Instagram key="o5" />,
    <M_GameCommunity key="o3" />,
    <M_Thanks key="59" />,
  ];
  // Вне показа 6 октября (компоненты в slides/, вернуть — импортировать и вставить в массив):
  // 23w M_MyMontage, 24–29 урок «AI-креатор» (lesson2.tsx), 41w M_MyAutomation, 42 глава урока 3, 43, 45–49 (lesson3.tsx), 46r M_ResultBot, 47r M_ResultBlog.
  return (
    <div className={`montage-deck ${unbounded.variable} ${manrope.variable}`}>
      {/* Номер слайда общего SlideDeck перенесён из правого нижнего угла в левый:
          справа зона камеры, там только фон. Номер совпадает с #N в адресной строке. */}
      <style>{`.montage-deck .bottom-4.right-5.z-30 { right: auto; left: 1.25rem; }${GLASS ? `
        /* поля вокруг кадра 16:9 на нестандартном окне: бежевый #EFE6DA общего SlideDeck рядом с тёмным стеклом выглядит дёшево */
        .montage-deck > div.fixed { background: #0F0B09 !important; }` : ""}`}</style>
      <SlideDeck slides={slides} theme="cacao" />
    </div>
  );
}

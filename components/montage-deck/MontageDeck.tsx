"use client";

/**
 * MontageDeck — эфир Vibe Production. Показ 6 октября 2026, 20:00 (до этого — 1 октября). На слайдах дату не пишем: «сегодня в 20:00».
 * Бренд-код сайтов onai.academy (theme.ts ← fx/brand.ts). Правые 40% кадра — зона камеры: только фон слайда.
 * Порядок с 07.10 вечером (решение Александра): контент (старт, хронология, три платформы, кейсы, результаты) →
 * подводка к практике (практика 1 монтаж, переход к продаже, подводки практик 2 и 3, слайд pr: дальше Александр в OBS проводит три практики одним видео) →
 * продажа Vibe Production и оплата → Vibe Coding PRO и кейсы ещё раз → оффер 390 000 ₸ (два курса, оплата пакета, окно продаж 2, последняя оплата) → финал.
 * Слайды оплаты — slides/pay.tsx (два QR: Kaspi и карты СНГ/мира), три варианта текста.
 * План: projects/ai_montage_webinar/РЕЖИССУРА_воркшоп_06-10.md. Режиссура v2: docs/deck-v2/РЕЖИССУРА.md.
 * Слайд 56: клавиши 0–5 — сколько мест из пяти уже занято. Слайд 00: Enter — старт интро-ролика со звуком.
 * [Скобки] на слайдах — пропуски, их дописывает Александр до эфира. На 07.10 в показе их нет (ревью deck-review-0710.md).
 * 07.10: блок Vibe Coding PRO v1–v5 (slides/vcpro.tsx, цены в prices.ts) разбит кейсами 08c2; слова в чат: ГАЙД (07, 58), МОНТАЖ, ПРО, ДВА.
 * 10v, 10g, 10i, 22r — результаты: цифры в results.ts, скрины в public/montage/results/ (shots — какие файлы уже лежат).
 */
import { SlideDeck } from "@/components/sales-deck/SlideDeck";
import { unbounded, manrope } from "./fonts";
import { GLASS } from "./theme";
import { M_Chapter } from "./slides/M_Chapter";
import { M_Check, M_Poll, M_Program, M_Promise, M_Guides, M_About, M_CostStory, M_Proof15 } from "./slides/start";
import { M_Bottleneck, M_Vacancy, M_ThreeSeconds, M_OnePhrase, M_OneOf14, M_AgentOnPC, M_FiveSteps, M_StepVoice, M_Styles, M_StepAssemble, M_ReadyReel, M_NoFace } from "./slides/lesson1";
import { M_Case107, M_Want, M_WhoFirst, M_NotCourse, M_Anchor, M_Installments, M_Discount, M_SixMonths, M_HowToBook, M_Inaction, M_OneScreen, M_Doubts, M_Subscriptions, M_Slots, M_FinalCTA, M_GameBonus } from "./slides/sale";
import { M_ShopReel, M_ShopAd, M_ShopLead, M_ForYou, M_SoloVsCourse } from "./slides/directions";
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
    <M_Guides key="07" kicker="Бонус за досмотр" title={"Досмотрите до конца: три\u00A0гайда"} lead="Выдам в конце эфира по слову ГАЙД." />,
    // Кто я, хронология и результаты · 7 мин
    <M_About key="08" />,
    <M_MyPath key="08w" />,
    // 08p1–08p3: три платформы обучения (The One System, Erickson Central Asia, onAI Academy), данные PLATFORMS в cases.ts. 08cs: страницы кейсов на сайте.
    <M_Platform key="08p1" i={0} />,
    <M_Platform key="08p2" i={1} />,
    <M_Platform key="08p3" i={2} />,
    <M_Cases key="08c" />,
    <M_CasePages key="08cs" />,
    <M_CostStory key="09" />,
    <M_Proof15 key="10" />,
    <M_ViralReels key="10v" shots={shots.viral} />,
    <M_Growth30 key="10g" shots={shots.growth} />,
    <M_Inquiries key="10i" />,
    // Практика 1 · AI-монтаж · 20 мин
    <M_Chapter key="11" big="1" obj="lg-ch1-clapper" kicker="Практика 1 из 3" title="Рилс без знаний монтажа" sub="Проблема, первые 3 секунды и монтаж вживую в настроенном чате" />,
    <M_Bottleneck key="12" />,
    <M_Vacancy key="13" />,
    <M_ThreeSeconds key="14" />,
    <M_OnePhrase key="15" />,
    <M_OneOf14 key="16" />,
    <M_AgentOnPC key="17" />,
    <M_FiveSteps key="18" />,
    <M_StepVoice key="19" />,
    <M_Styles key="20" />,
    <M_StepAssemble key="21" />,
    <M_ReadyReel key="22" />,
    <M_ResultMontage key="22r" />,
    <M_NoFace key="23" />,
    <M_CodeWordFlow key="44" />,
    <M_Plan30 key="50" />,
    // Переход к продаже · 3 мин
    <M_Case107 key="30" />,
    <M_Want key="31" />,
    <M_WhoFirst key="32" />,
    // Практика 2 · презентация по брифу · 10 мин. Практики 2 и 3 на слайдах — подводка (решение Александра 07.10 вечером):
    // основную практику он проводит вживую в OBS после слайда pr, а продажи идут уже после неё
    <M_Chapter key="p2" big="2" obj="lg-i-cards" kicker="Практика 2 из 3" title="Презентация по брифу" sub="Бриф словами, на выходе презентация в вашем стиле" />,
    <M_DocsHow key="p2a" />,
    // p2b M_DocsExample убран 07.10 (ревью А3): скрина public/montage/results/doc-example.png нет, на слайде была бы пустая плита.
    // Вернуть: импортировать M_DocsExample и вставить его с ключом p2b и пропом shot={shots.doc} после p2a
    <M_DocsLive key="p2c" />,
    // Практика 3 · сайты и приложения (из прошлого воркшопа) · 12 мин
    <M_Chapter key="p3" big="3" obj="lg-i-phones" kicker="Практика 3 из 3" title="Приложение и сайт из описания" sub="Google AI Studio и Claude Code: покажу, как это собирается" />,
    <M_AppsBuilds key="p3a" />,
    <M_AIStudio key="p3b" />,
    <M_AppBrief key="p3c" />,
    <M_AppStart key="p3d" />,
    <M_AppNext key="p3e" />,
    // p3f «Сколько такое стоит» убран 07.10 (ревью А4): цены без источника, заглушки в скобках, противоречит «Доход не обещаю» на 37w
    // p3g M_WebApps убран 07.10 вечером по решению Александра («не нужен»). Вернуть: вставить M_WebApps с ключом p3g перед p3h (импорт уже есть)
    <M_MainConclusion key="p3h" />,
    <M_DeckByAgent key="p3i" />,
    // Подводка к живой практике: на этом слайде Александр переключает экран в OBS и проводит три практических урока одним видео
    <M_ToPractice key="pr" />,
    // Окно продаж 1 · 10 мин: после живой практики
    <M_Chapter key="33" big="Обучение" bigSize="9cqw" kicker="Vibe Production" title={"3 модуля, 15 уроков, 1\u00A0месяц"} sub="Доступ к урокам 3 месяца" />,
    <M_NotCourse key="34" />,
    // 35–37v · Обучение как экскурсия по контент-заводу со слайда 34: цеха «Ролик», «Реклама», «Заявка», потом опрос 03 переворачивается
    // и «сами или с обучением». Режиссура: docs/tasks/deck_wave4_directions.md
    <M_ShopReel key="35" />,
    <M_ShopAd key="36" />,
    <M_ShopLead key="37" />,
    <M_ForYou key="37w" />,
    <M_SoloVsCourse key="37v" />,
    <M_Anchor key="38" />,
    <M_Discount key="39a" />,
    <M_Installments key="39" />,
    <M_SixMonths key="40" />,
    <M_HowToBook key="41" />,
    // Оплата Vibe Production: два QR (Kaspi и карты СНГ/мира), текст над ними с ценой 150 000 ₸ (slides/pay.tsx)
    <M_PayQR key="pay1" variant="production" />,
    // Блок Vibe Coding PRO · для кого, программа, тарифы (07.10). Слова в чат: МОНТАЖ, ПРО, ДВА. Цены в prices.ts: PRO_PRICE меняется одной строкой.
    // Тексты: docs/copy/deck-block-vcpro.md
    <M_VcWho key="v1" />,
    <M_VcProgram key="v2" />,
    <M_VcTariffs key="v3" />,
    // Кейсы второй раз (Александр 07.10 вечером): «какие проекты я уже сделал сам», та же карусель с другим кикером и заголовком
    <M_Cases key="08c2" kicker="Это я собрал сам" title="Какие проекты я уже сделал" />,
    // Оффер 390 000 ₸: два курса вместе, что выбрать, оплата пакета
    <M_VcBundle key="v4" />,
    <M_VcChoose key="v5" />,
    // v6 M_VcBook («как занять место») убран 07.10 вечером: его заменяют слайды оплаты. Вернуть: вставить M_VcBook с ключом v6 после v5 (импорт уже есть)
    <M_PayQR key="pay2" variant="bundle" />,
    // Окно продаж 2 · 8 мин
    <M_Chapter key="51" big="Решение" bigSize="9cqw" kicker="Vibe Production" title="Остался один шаг" sub="Коротко повторю главное и отвечу на сомнения" />,
    <M_Inaction key="52" />,
    <M_OneScreen key="53" />,
    <M_Doubts key="54" />,
    <M_Subscriptions key="55" />,
    <M_Slots key="56" />,
    // 57 M_FinalCTA убран 07.10 вечером: его заменяет последний слайд оплаты. Вернуть: вставить M_FinalCTA с ключом 57 после слота мест (импорт уже есть)
    <M_GameBonus key="57g" />,
    <M_PayQR key="pay3" variant="final" />,
    // Финал · 2 мин
    <M_Guides key="58" kicker="Обещанное" title="Забирайте три гайда" lead="Напишите ГАЙД в чат." />,
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

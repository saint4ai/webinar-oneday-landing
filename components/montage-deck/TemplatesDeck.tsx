"use client";

/**
 * Витрина шаблонов (/montage/templates): каждый шаблон из templates.tsx с пустыми [полями].
 * Новую деку собирать так: скопировать MontageDeck.tsx, взять нужные Tpl* и вписать свои тексты вместо [скобок].
 */
import { SlideDeck } from "@/components/sales-deck/SlideDeck";
import { unbounded, manrope } from "./fonts";
import { Em } from "./ui";
import {
  Fill, TplBigNumber, TplBigWord, TplCards, TplChain, TplChapter, TplCover, TplGuides, TplInstallments, TplModule,
  TplPath, TplPoll, TplPrice, TplSteps, TplTasks, TplThanks, TplThesis,
} from "./templates";

export function TemplatesDeck() {
  const slides = [
    <TplCover key="cover" kicker="[Эфир · название продукта]" title={<>[Заголовок обложки] <Em night>[слово-акцент]</Em></>} lead="[Одна строка: что будет и для кого]" chips={["[День, дата]", "[20:00]", "[3 урока]"]} goldChip={1} />,
    <TplChapter key="chapter" big="1" obj="lg-ch1-clapper" kicker="[Урок 1 из 3]" title="[Название урока]" sub="[Что внутри урока одной строкой]" />,
    <TplPoll key="poll" kicker="[Знакомимся]" title="[Вопрос залу]" lead="[Ответ цифрой в чат]" options={["[Вариант 1]", "[Вариант 2]", "[Вариант 3]", "[Вариант 4]"]} />,
    <TplThesis key="thesis" kicker="[Проблема]" title={<>[Тезис крупно] <Em>[слово-акцент]</Em></>} lead="[Пояснение в одну-две строки]" obj="lg-i-hook" />,
    <TplCards key="cards" kicker="[Кикер]" title={<>[Заголовок] <Em>[акцент]</Em></>} accent={2}
      cards={[{ no: "[01]", title: "[Карточка 1]", text: "[Пояснение]", icon: "lg-i-camera" }, { no: "[02]", title: "[Карточка 2]", text: "[Пояснение]", icon: "lg-i-box" }, { no: "[03]", title: "[Карточка 3]", text: "[Пояснение]", icon: "lg-i-rocket" }]} />,
    <TplChain key="chain" kicker="[Кикер]" title={<>[Как это работает] <Em>[акцент]</Em></>} lead="[Подводка]" steps={[{ title: "[Шаг 1]", text: "[пояснение]" }, { title: "[Шаг 2]", text: "[пояснение]" }, { title: "[Результат]", text: "[пояснение]" }]} />,
    <TplPath key="path" kicker="[Перед уроком N · мой путь]" title={<>[Как я пришёл] <Em>[к теме]</Em></>} note="[Вывод пути одной строкой]" bridge="[Сейчас покажу, как …]"
      steps={[{ when: "[Год]", what: "[Кем был]", text: "[Что делал]" }, { when: "[Год]", what: "[Переломный момент]", text: <Fill>история</Fill> }, { when: "Сейчас", what: "[Где я сейчас]", text: "[Результат]", now: true }]} />,
    <TplTasks key="tasks" kicker="[Перед уроком N · у меня так]" title={<>[Что это решает] <Em>[у меня]</Em></>} power={<Fill>насколько мощно: цифра до → после</Fill>} bridge="[Урок N: как собрать это у себя]"
      tasks={[{ title: "[Задача 1]", how: "[Как решает]", result: <Fill>результат</Fill> }, { title: "[Задача 2]", how: "[Как решает]", result: <Fill>результат</Fill> }, { title: "[Задача 3]", how: "[Как решает]", result: <Fill>результат</Fill> }, { title: "[Задача 4]", how: "[Как решает]", result: <Fill>результат</Fill> }]} />,
    <TplBigNumber key="number" kicker="[Точка Б]" title="[Что это за цифра]" value="100 000" label="[подпись цифры]" lead="[Как получен результат]" note="[Источник и дата]" />,
    <TplModule key="module" no={1} title="[Название модуля]" result="[Результат модуля]" lessons={["[Урок 1]", "[Урок 2]", "[Урок 3]", "[Урок 4]", "[Урок 5]"]} />,
    <TplPrice key="price" obj="lg-s38-piggy" kicker="[Сколько это стоит]" title={<>[Альтернатива] или <Em>[продукт]</Em></>}
      from={{ label: "[Альтернатива]", value: 300000, prefix: "от ", text: "[Откуда цена]" }} to={{ label: "[Продукт]", value: 150000, text: "[Что входит]" }} />,
    <TplInstallments key="installments" obj="lg-s39-calendar" kicker="[Рассрочка на N месяцев]" title={<>Или от <Em>[сумма]</Em> в месяц</>} lead="[Сколько в день и итог]" months={12} payment="[сумма]" chips={["[Банк 1]", "[Банк 2]"]} />,
    <TplSteps key="steps" obj="lg-s41-deadline" kicker="[Как занять место]" title={<>[Три шага до] <Em>[цели]</Em></>} button="[КОДОВОЕ СЛОВО] в чат"
      steps={[["[Шаг 1]", "[пояснение]"], ["[Шаг 2]", "[пояснение]"], ["[Шаг 3]", "[пояснение]"]]} />,
    <TplGuides key="guides" kicker="[Бонус за досмотр]" title="[Что получит зритель]" lead="[Как получить]" />,
    <TplBigWord key="word" kicker="[Напишите в чат]" word="[СЛОВО]" line={<>[если хотите] <Em>[результат]</Em></>} chips={["[Условие 1]", "[Условие 2]"]} />,
    <TplThanks key="thanks" title={<>Спасибо,<br /><Em night>[что пришли]</Em></>} lead="[Одна строка на прощание]" />,
  ];
  return (
    <div className={`montage-deck ${unbounded.variable} ${manrope.variable}`}>
      <style>{`.montage-deck .bottom-4.right-5.z-30 { display: none; }`}</style>
      <SlideDeck slides={slides} theme="cacao" />
    </div>
  );
}

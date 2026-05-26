import Link from "next/link";
import type { Metadata } from "next";
import { OnAILogo } from "@/components/ui/onai-logo";

export const metadata: Metadata = {
  title: "Политика конфиденциальности · onAI.academy",
  description:
    "Как ТОО «onAI Academy» собирает, хранит и использует персональные данные участников воркшопа.",
  robots: { index: false, follow: false },
};

/**
 * Политика конфиденциальности — короткая, человеческая.
 * Согласно ЗРК «О персональных данных и их защите» от 21 мая 2013 № 94-V.
 */
export default function PrivacyPage() {
  return (
    <main className="relative od-root min-h-screen flex flex-col overflow-x-hidden">
      <div className="od-blob-orange" />
      <div className="od-blob-lime" />
      <div className="od-grid" />
      <div className="od-vignette" />

      <header className="relative z-50 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-4 sm:py-6 flex items-center justify-between gap-3">
        <Link href="/" aria-label="На главную">
          <OnAILogo className="h-6 sm:h-7" />
        </Link>
        <Link
          href="/"
          className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-white/45 hover:text-white transition-colors"
        >
          ← на главную
        </Link>
      </header>

      <section className="relative z-10 max-w-[760px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-12 sm:py-20 flex-1">
        <div className="mono-label !text-[#fc5c02] mb-4">
          правовой документ · 2026
        </div>
        <h1
          className="uppercase text-white mb-6 sm:mb-8"
          style={{
            fontFamily:
              "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(28px, 4vw, 48px)",
            lineHeight: 1.1,
            letterSpacing: "-0.015em",
          }}
        >
          Политика
          <br />
          конфиденциальности
        </h1>

        <div className="prose prose-invert max-w-none text-white/70 text-[14px] sm:text-[15px] leading-relaxed">
          <p className="text-white/55 mb-8">
            Этот документ объясняет, какие данные мы собираем при регистрации на
            бесплатный однодневный воркшоп по vibe-coding, зачем они нам нужны и
            что ты можешь с ними сделать.
          </p>

          {/* 1. Кто оператор */}
          <h2 className="text-white text-[18px] sm:text-[20px] mt-10 mb-3 font-bold">
            1. Кто оператор данных
          </h2>
          <p>
            ТОО «onAI Academy» (далее — «Оператор»).
          </p>
          <ul className="mt-2 space-y-1 text-white/60 text-[13px] sm:text-[14px] font-mono">
            <li>БИН: 250240029481</li>
            <li>Сайт: onai.academy</li>
            <li>Контакт: WhatsApp +7 706 422 7830</li>
          </ul>

          {/* 2. Какие данные */}
          <h2 className="text-white text-[18px] sm:text-[20px] mt-10 mb-3 font-bold">
            2. Какие данные мы собираем
          </h2>
          <p>При регистрации на воркшоп ты передаёшь:</p>
          <ul className="mt-2 space-y-2 list-disc pl-5">
            <li>
              <strong className="text-white">Имя</strong> — чтобы обращаться
              лично в WhatsApp-сообществе.
            </li>
            <li>
              <strong className="text-white">Номер WhatsApp</strong> — чтобы
              добавить тебя в закрытое сообщество воркшопа, прислать ссылку
              на эфир, бонусы и напоминание за час до старта.
            </li>
          </ul>
          <p className="mt-3 text-white/55 text-[13px]">
            Мы также автоматически фиксируем технические данные посещения
            (IP-адрес, тип устройства, источник перехода) через Яндекс.Метрику —
            для аналитики работы сайта.
          </p>

          {/* 3. Зачем */}
          <h2 className="text-white text-[18px] sm:text-[20px] mt-10 mb-3 font-bold">
            3. Зачем нам эти данные
          </h2>
          <ul className="mt-2 space-y-2 list-disc pl-5">
            <li>Добавить тебя в закрытое WhatsApp-сообщество воркшопа.</li>
            <li>Прислать ссылку на живой эфир и обещанные бонусы.</li>
            <li>
              Напомнить о старте эфира и поделиться дополнительными
              материалами по теме воркшопа.
            </li>
          </ul>

          {/* 4. Правовое основание */}
          <h2 className="text-white text-[18px] sm:text-[20px] mt-10 mb-3 font-bold">
            4. На каком основании
          </h2>
          <p>
            Твоё согласие — ты сам отметил галочку при регистрации (ст. 7 ЗРК
            «О персональных данных и их защите» от 21.05.2013 № 94-V).
          </p>

          {/* 5. Кому передаём */}
          <h2 className="text-white text-[18px] sm:text-[20px] mt-10 mb-3 font-bold">
            5. Кому передаём данные
          </h2>
          <p>
            Мы не продаём твои данные. Передаём только тем, без кого сервис не
            работает:
          </p>
          <ul className="mt-2 space-y-2 list-disc pl-5">
            <li>amoCRM — хранение лидов и общение менеджеров.</li>
            <li>
              WhatsApp / WhatsApp Business — закрытое сообщество и личные
              сообщения о воркшопе.
            </li>
            <li>
              Яндекс.Метрика — для веб-аналитики (обезличенные данные о
              посещении).
            </li>
          </ul>

          {/* 6. Хранение */}
          <h2 className="text-white text-[18px] sm:text-[20px] mt-10 mb-3 font-bold">
            6. Сколько храним
          </h2>
          <p>
            До отзыва согласия. Когда ты попросишь удалить данные — удаляем в
            течение 10 рабочих дней из всех систем, кроме случаев, когда закон
            требует хранить дольше.
          </p>

          {/* 7. Твои права */}
          <h2 className="text-white text-[18px] sm:text-[20px] mt-10 mb-3 font-bold">
            7. Что ты можешь сделать со своими данными
          </h2>
          <ul className="mt-2 space-y-2 list-disc pl-5">
            <li>Узнать, какие данные о тебе у нас есть.</li>
            <li>Исправить неточности.</li>
            <li>Удалить данные / отозвать согласие.</li>
            <li>Отписаться от рассылки в один клик.</li>
          </ul>
          <p className="mt-3">
            Для любого из этих действий — напиши в WhatsApp{" "}
            <a
              href="https://wa.me/77064227830"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#cdeb52] underline underline-offset-2 hover:text-white transition-colors"
            >
              +7 706 422 7830
            </a>
            . Ответим в течение 1 рабочего дня.
          </p>

          {/* 8. Безопасность */}
          <h2 className="text-white text-[18px] sm:text-[20px] mt-10 mb-3 font-bold">
            8. Как защищаем данные
          </h2>
          <p>
            Сайт работает по HTTPS. Доступ к CRM и почте — только у Александра
            и команды по паролю с двухфакторной авторизацией. Бэкапы хранятся в
            зашифрованном виде.
          </p>

          {/* 9. Изменения */}
          <h2 className="text-white text-[18px] sm:text-[20px] mt-10 mb-3 font-bold">
            9. Изменения политики
          </h2>
          <p>
            Если поменяем что-то существенное — сообщим в WhatsApp-сообществе
            и поднимем дату обновления в шапке. Дальнейшее использование сайта
            будет означать согласие с новой редакцией.
          </p>

          {/* Реквизиты */}
          <div className="mt-12 pt-8 border-t border-white/[0.08] font-mono text-[12px] text-white/45 space-y-1">
            <div className="text-white/70 font-bold uppercase tracking-wider mb-2 text-[11px]">
              Реквизиты Оператора
            </div>
            <div>ТОО «onAI Academy»</div>
            <div>БИН 250240029481</div>
            <div>АО «Kaspi Bank» · БИК CASPKZKA · КБе 17</div>
            <div>Счёт: KZ17722S000044026963</div>
            <div className="pt-2 text-white/30">
              Редакция от 25 мая 2026 г.
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-4 text-white/25 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-center">
        onAI.academy · 2026
      </footer>
    </main>
  );
}

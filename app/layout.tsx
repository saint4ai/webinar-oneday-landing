import type { Metadata } from "next";
import Script from "next/script";
import {
  Inter_Tight,
  Instrument_Serif,
  JetBrains_Mono,
  Space_Grotesk,
} from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Yandex Metrika ID — тот же что на основном onai.academy
const YM_ID = 109147153;

// edbot.me chatbot ID — наш WhatsApp-бот платформы edbot.
// Скрипт сам подцепит этот id и будет трекать визиты + re-engagement
// тех, кто оставил форму, но не написал в WhatsApp.
const EDBOT_CHATBOT_ID = "db343b5679ddf774530a60172b35bda8";

// BENZIN — display шрифт для H1 (личный шрифт Александра)
const benzin = localFont({
  src: [
    {
      path: "../public/fonts/Benzin-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Benzin-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/Benzin-Semibold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/Benzin-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/Benzin-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-benzin",
  display: "swap",
});

// === Стек prod onAI.academy ===
// Inter Tight (display + body) + Instrument Serif italic (editorial-акцент) + JetBrains Mono (tech-метки).
// Эталон: projects/dev_setup_landing + arsenal/_brand/v2_preview.

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  // Instrument Serif — латиница-only display-шрифт (для editorial-акцентов).
  // Кириллицу не поддерживает.
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  // Кириллические глифы в JetBrains Mono есть в файле шрифта,
  // подгружаются автоматически через latin/latin-ext подмножества.
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Space Grotesk — H1 display, как на onai.academy/open-day (.od-h1)
// Точный шрифт прода Александра. Поддерживает кириллицу.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  // Space Grotesk поддерживает кириллицу через latin-ext подмножество.
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// TODO: заменить на реальный домен после деплоя
const SITE_URL = "https://onai.academy/workshop";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title:
    "Стань AI-разработчиком приложений — однодневный воркшоп · onAI.academy",
  description:
    "Собирай сайты, приложения и AI-агентов для бизнеса через диалог с ИИ. За один день узнаешь, как делать IT-решения с чеком 500К–10М ₸ — без программирования и команды.",
  keywords: [
    "вайбкодинг",
    "vibe coding",
    "Claude Code",
    "AI-разработка",
    "AI-агенты",
    "воркшоп по ИИ",
    "обучение ИИ Казахстан",
    "onAI Academy",
    "Alexandr saint4ai",
    "разработка без программирования",
    "MCP",
  ],
  authors: [{ name: "onAI Academy", url: "https://onai.academy" }],
  creator: "onAI Academy",
  publisher: "onAI Academy",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: "onAI Academy",
    title:
      "Стань AI-разработчиком приложений — однодневный воркшоп бесплатно",
    description:
      "За 1 день собери сайт, приложение или AI-агента через диалог с ИИ. Без программирования и команды.",
    // ImageResponse из app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Стань AI-разработчиком приложений — однодневный воркшоп бесплатно",
    description:
      "За 1 день собери сайт, приложение или AI-агента через диалог с ИИ.",
    creator: "@saint4ai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${interTight.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} ${benzin.variable} h-full antialiased`}
    >
      <head>
        {/* Preload hero AVIF — критичный LCP-элемент (фото Александра в hero) */}
        <link
          rel="preload"
          as="image"
          href="/workshop/alex-cutout.avif"
          type="image/avif"
          fetchPriority="high"
        />
        {/* Schema.org Event для индексации воркшопа в Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Event",
              name: "Однодневный воркшоп по вайбкодингу — стань AI-разработчиком приложений",
              description:
                "За 1 день собери сайт, приложение или AI-агента через диалог с ИИ — без программирования и команды.",
              eventStatus: "https://schema.org/EventScheduled",
              eventAttendanceMode:
                "https://schema.org/OnlineEventAttendanceMode",
              startDate: "2026-05-31T20:00:00+05:00",
              endDate: "2026-05-31T22:00:00+05:00",
              location: {
                "@type": "VirtualLocation",
                url: SITE_URL,
              },
              image: [`${SITE_URL}/opengraph-image.png`],
              organizer: {
                "@type": "Organization",
                name: "onAI Academy",
                url: "https://onai.academy",
              },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "KZT",
                availability: "https://schema.org/InStock",
                url: SITE_URL,
                validFrom: "2026-05-01T00:00:00+05:00",
              },
              inLanguage: "ru-RU",
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-black text-white">
        {children}

        {/* edbot.me chatbot — трекинг визитов + re-engagement WhatsApp.
            Скрипт сам подключает себя по id="chatbot_init" с data-chatbotid.
            Загружаем с lazyOnload, чтобы не блокировать LCP. */}
        <Script
          id="chatbot_init"
          src="https://cdn.platform.edbot.me/tilda_scrypt.min.js"
          strategy="lazyOnload"
          data-chatbotid={EDBOT_CHATBOT_ID}
          data-regtype="whatsapp"
        />

        {/* Yandex Metrika — тот же счётчик что на onai.academy */}
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
            ym(${YM_ID}, "init", {
              defer: true,
              clickmap:true,
              trackLinks:true,
              accurateTrackBounce:true,
              webvisor:true
            });
          `}
        </Script>
        <noscript>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://mc.yandex.ru/watch/${YM_ID}`}
              style={{ position: "absolute", left: "-9999px" }}
              alt=""
            />
          </div>
        </noscript>
      </body>
    </html>
  );
}

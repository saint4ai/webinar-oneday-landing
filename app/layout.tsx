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
import { getNextWorkshop } from "@/lib/workshop-date";

// Yandex Metrika ID — тот же что на основном onai.academy
const YM_ID = 109147153;

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
  // display:optional + выровненный fallback — убирает «скачок» заголовков:
  // при swap Benzin подменял Space Grotesk (другие метрики) → reflow. optional
  // не делает поздней подмены (нет прыжка), preload (по умолчанию) почти всегда
  // успевает показать Benzin сразу; на промахе остаётся метрически-близкий fallback.
  fallback: ["Space Grotesk", "system-ui", "sans-serif"],
  display: "optional",
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

// Почасовой ISR: статическая страница перегенерируется раз в час, поэтому
// дата эфира в Schema.org (startDate/endDate) остаётся актуальной без ручных правок.
export const revalidate = 3600;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nextWs = getNextWorkshop();
  return (
    <html
      lang="ru"
      className={`${interTight.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} ${benzin.variable} h-full antialiased`}
    >
      <head>
        {/* LITE-детект — ДО первой отрисовки (синхронный inline-скрипт).
            In-app браузеры (Instagram/Facebook webview) и слабые устройства
            убивают вкладку из-за GPU-тяжёлых слоёв (filter:blur, backdrop-filter,
            mix-blend). Вешаем класс `lite` на <html> → CSS в globals срезает
            эти эффекты. Симптом клиентов: «сайт слетает». Ресёрч: WKWebView
            Jetsam-kill при росте IOSurface от blur/backdrop. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var u=navigator.userAgent||'';var inApp=/Instagram|FBAN|FBAV|FB_IAB/.test(u)||/(iPhone|iPod|iPad)(?!.*Safari)/.test(u)||/; wv\\)/.test(u);var m=navigator.deviceMemory;var c=navigator.hardwareConcurrency;var sd=navigator.connection&&navigator.connection.saveData;if(inApp||(m&&m<=1)||(c&&c<=2)||sd===true){document.documentElement.classList.add('lite');}}catch(e){}})();",
          }}
        />
        {/* Preload hero AVIF — критичный LCP-элемент (фото Александра в hero) */}
        <link
          rel="preload"
          as="image"
          href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/alex-cutout.avif`}
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
              startDate: nextWs.isoStart,
              endDate: nextWs.isoEnd,
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
        {/* Google Tag Manager (noscript) — конверсия Google Ads/YouTube */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TLK5NPZF"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="gtm"
          />
        </noscript>
        {children}

        {/* Google Tag Manager — конверсия Google Ads (новый чистый контейнер
            GTM-TLK5NPZF под воркшоп; старый GTM-5H7FFH9Q не используем).
            Конверсия фаятся по событию `workshop_lead` на сабмит формы. */}
        <Script id="gtm-base" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-TLK5NPZF');`}
        </Script>

        {/* Yandex Metrika — тот же счётчик что на onai.academy */}
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
            ym(${YM_ID}, "init", {
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

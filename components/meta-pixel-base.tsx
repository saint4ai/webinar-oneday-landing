"use client";

import Script from "next/script";
import { META_PIXEL_ID } from "@/lib/meta-pixel";

/**
 * Базовый Meta Pixel + PageView.
 *
 * ⚠️ Подключается ТОЛЬКО на лендинге воркшопа (`/`) и thank-you (`/thank-you`),
 * НЕ в корневом layout — чтобы пиксель НЕ собирал события с /sales-deck,
 * /privacy и прочих страниц (чистота аудитории: только трафик регистрации).
 *
 * Событие Lead шлётся отдельно на сабмит формы (см. lib/meta-pixel.ts) +
 * дублируется server-side через Conversions API в /api/lead (дедуп по event_id).
 */
export function MetaPixelBase() {
  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

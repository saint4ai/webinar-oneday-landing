import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const alt =
  "Собери приложение без программистов — бесплатный воркшоп на вайбкодинге";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Картинка генерируется один раз на сборке — обязательно для output:'export'.
export const dynamic = "force-static";

/**
 * Dynamic OG-image (1200×630).
 * Локальный BENZIN-ExtraBold для кириллического display.
 */
export default async function OpengraphImage() {
  const fontData = fs.readFileSync(
    path.join(process.cwd(), "public/fonts/Benzin-ExtraBold.ttf"),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#070709",
          display: "flex",
          flexDirection: "column",
          padding: "70px 80px",
          position: "relative",
          color: "#fff",
        }}
      >
        {/* Brand glow blobs (single child — без flex) */}
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -180,
            width: 600,
            height: 600,
            background:
              "radial-gradient(circle, rgba(252,92,2,0.55), transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -220,
            left: -220,
            width: 600,
            height: 600,
            background:
              "radial-gradient(circle, rgba(205,235,82,0.32), transparent 70%)",
          }}
        />

        {/* Side accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: 6,
            background: "linear-gradient(180deg, #fc5c02, #cdeb52)",
          }}
        />

        {/* Mono label */}
        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "#cdeb52",
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          // бесплатный воркшоп · 1 час
        </div>

        {/* H1 — single text per div, no nested flex needed */}
        <div
          style={{
            marginTop: 40,
            display: "flex",
            flexDirection: "column",
            textTransform: "uppercase",
            fontSize: 80,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          <div style={{ display: "flex" }}>СОБЕРИ ПРИЛОЖЕНИЕ</div>
          <div
            style={{
              display: "flex",
              marginTop: 6,
              background: "#cdeb52",
              color: "#000",
              padding: "4px 24px 12px",
              borderRadius: 12,
              alignSelf: "flex-start",
            }}
          >
            БЕЗ ПРОГРАММИСТОВ
          </div>
        </div>

        {/* Bottom row */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 24,
              color: "rgba(255,255,255,0.75)",
              maxWidth: 720,
            }}
          >
            <div style={{ display: "flex" }}>
              Час эфира: собираем презентацию, приложение и сайт
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 6,
                color: "rgba(255,255,255,0.45)",
                fontSize: 20,
              }}
            >
              клиентам сделал две платформы — заплатили 6 млн тенге
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 30,
                letterSpacing: -0.5,
              }}
            >
              onAI.academy
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 4,
                fontSize: 14,
                color: "rgba(255,255,255,0.4)",
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              digital academy
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Benzin", data: fontData, weight: 800, style: "normal" },
      ],
    },
  );
}

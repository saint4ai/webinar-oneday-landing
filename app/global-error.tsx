"use client";

/**
 * Global Error Boundary (2026-07-12) — ловит краши в самом root-layout
 * (когда обычный app/error.tsx уже не помогает). Обязан рендерить свои
 * <html>/<body>. Гарантирует, что при любом сбое юзер видит осмысленный
 * экран с кнопкой перезагрузки, а не пустоту.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ru">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: 24,
          background: "#080808",
          color: "#fff",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700 }}>Секунду, страница не догрузилась</div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", maxWidth: 320, lineHeight: 1.5 }}>
          Нажми кнопку ниже. Если не помогло, открой ссылку в Safari или Chrome.
        </div>
        <button
          onClick={reset}
          style={{
            marginTop: 4,
            padding: "14px 32px",
            borderRadius: 999,
            border: "none",
            background: "#cdeb52",
            color: "#000",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Открыть воркшоп
        </button>
      </body>
    </html>
  );
}

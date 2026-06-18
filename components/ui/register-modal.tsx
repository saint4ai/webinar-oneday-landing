"use client";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BrandPhoneInput } from "@/components/ui/phone-input";
import { apiUrl, withBase } from "@/lib/api-url";
import { newEventId, collectMetaClientData, trackLead } from "@/lib/meta-pixel";
import { ymGoal } from "@/lib/analytics/ym";
import { resolveEasybotRedirect } from "@/lib/easybot/redirect";
import { pushWorkshopLead } from "@/lib/gtm";

type Props = {
  open: boolean;
  onClose: () => void;
};

// POST /api/lead создаёт лид в amoCRM воронке «Однодневник» с тегом «Однодневник»
// и нотифицирует edbot для WhatsApp re-engagement.

export const RegisterModal = ({ open, onClose }: Props) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [botDest, setBotDest] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Esc закрывает
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Сброс на закрытии
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setName("");
        setPhone("");
        setAgree(true);
        setSuccess(false);
        setBotDest("");
        setSubmitting(false);
        setError(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  const isValid =
    name.trim().length >= 2 &&
    phone.replace(/\D/g, "").length >= 8 &&
    agree;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    const eventId = newEventId();
    const meta = collectMetaClientData();
    ymGoal("lead_submit"); // Я.Метрика: сабмит формы (момент клика, до ответа API)
    try {
      const res = await fetch(apiUrl("/api/lead"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          source: "landing-hero-modal",
          consent: agree,
          eventId,
          fbp: meta.fbp,
          fbc: meta.fbc,
          eventSourceUrl: meta.eventSourceUrl,
          utm: meta.utm,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Персональная ссылка EasyBot (уникальный код) из ответа; нет — статичный фолбэк.
      const data = await res.json().catch(() => ({}) as { botUrl?: string });
      const dest = resolveEasybotRedirect(data?.botUrl, meta.utm);
      setBotDest(dest);
      // Meta Pixel Lead (дедуп с CAPI) + Я.Метрика конверсия (раньше была на /thank-you)
      trackLead(eventId);
      ymGoal("lead_workshop");
      pushWorkshopLead(phone); // Google Ads конверсия (событие workshop_lead → GTM)
      setSuccess(true); // показывает «сейчас редирект в бота», затем авто-редирект
      setTimeout(() => {
        window.location.href = dest;
      }, 1500);
    } catch (err) {
      console.error("Lead submit failed:", err);
      setError("Что-то пошло не так. Попробуй ещё раз.");
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain"
        >
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            aria-hidden
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.94, y: 20, opacity: 0, filter: "blur(8px)" }}
            animate={{ scale: 1, y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ scale: 0.96, y: 10, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md rounded-3xl overflow-hidden my-auto"
            style={{
              background:
                "linear-gradient(180deg, rgba(15,15,18,0.98) 0%, rgba(10,10,12,0.98) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: `
                0 40px 100px -20px rgba(252,92,2,0.25),
                0 20px 60px -15px rgba(0,0,0,0.9),
                inset 0 1px 0 0 rgba(255,255,255,0.05)
              `,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Закрыть"
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-white/70"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {!success ? (
              <div className="p-6 sm:p-8">
                <div className="mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#cdeb52]">
                    // регистрация
                  </span>
                </div>
                <h2
                  className="uppercase mt-3"
                  style={{
                    fontFamily:
                      "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
                    fontWeight: 800,
                    fontSize: "clamp(22px, 4vw, 32px)",
                    lineHeight: 1.1,
                    letterSpacing: "-0.005em",
                    color: "#fff",
                  }}
                >
                  Запиши себя
                  <br />
                  на воркшоп
                </h2>
                <p className="mt-3 text-[14px] text-white/60 leading-relaxed">
                  Заполни форму — добавлю в закрытое WhatsApp-сообщество с
                  доступом к эфиру и бонусам.
                </p>

                <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3">
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45 block mb-2">
                      имя
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Александр"
                      required
                      minLength={2}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white text-[15px] placeholder:text-white/25 focus:border-[#cdeb52]/60 focus:bg-black/60 focus:outline-none transition-colors"
                    />
                  </label>

                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] block mb-2">
                      <span className="text-white/45">whatsapp</span>
                      <span className="text-white/30"> → </span>
                      <span className="text-[#fc5c02]/90">доступ в сообщество</span>
                    </span>
                    <BrandPhoneInput
                      id="register-modal-phone"
                      value={phone}
                      onChange={setPhone}
                    />
                  </label>

                  <label className="mt-1 flex items-start gap-2.5 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      className="mt-[3px] w-4 h-4 rounded border-white/20 bg-black/40 accent-[#fc5c02] cursor-pointer shrink-0"
                    />
                    <span className="text-[11px] text-white/55 group-hover:text-white/75 leading-snug transition-colors">
                      Согласен с{" "}
                      <a
                        href={withBase("/privacy")}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="underline underline-offset-2 decoration-white/30 hover:decoration-[#fc5c02]"
                      >
                        политикой конфиденциальности
                      </a>{" "}
                      и обработкой персональных данных
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={!isValid || submitting}
                    className={cn(
                      "mt-3 w-full px-6 py-4 rounded-xl font-extrabold uppercase tracking-wider text-sm transition-all",
                      isValid && !submitting
                        ? "bg-[#fc5c02] text-black hover:bg-[#ff6f1a] shadow-[0_15px_40px_-10px_rgba(252,92,2,0.55)]"
                        : "bg-white/5 text-white/30 cursor-not-allowed"
                    )}
                  >
                    {submitting ? "Отправляю…" : "Записаться на воркшоп"}
                  </button>

                  {error && (
                    <p className="text-[12px] text-red-400 text-center mt-2">
                      {error}
                    </p>
                  )}

                  <p className="text-[10px] text-white/35 text-center mt-2 leading-relaxed">
                    Нажимая «Записаться», ты соглашаешься получить ссылку на
                    эфир в WhatsApp.
                  </p>
                </form>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#cdeb52]/15 flex items-center justify-center">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#cdeb52"
                    strokeWidth="3"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h2
                  className="uppercase"
                  style={{
                    fontFamily:
                      "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
                    fontWeight: 800,
                    fontSize: "clamp(20px, 3vw, 28px)",
                    color: "#fff",
                  }}
                >
                  Готово!
                </h2>
                <p className="mt-3 text-white/65 text-[14px] leading-relaxed">
                  Сейчас откроется WhatsApp-бот.
                  <br />
                  <span className="text-[#fc5c02] font-semibold">
                    Отправь боту готовое сообщение — так ты активируешь участие
                    в воркшопе и получишь ссылку на эфир.
                  </span>
                </p>
                <div className="mt-5 flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-[#cdeb52]/30 border-t-[#cdeb52] animate-spin" />
                  переводим в бота…
                </div>
                {botDest && (
                  <a
                    href={botDest}
                    className="mt-3 inline-block text-[#cdeb52] text-[12px] underline underline-offset-2"
                  >
                    Не открывается WhatsApp? Нажми здесь
                  </a>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

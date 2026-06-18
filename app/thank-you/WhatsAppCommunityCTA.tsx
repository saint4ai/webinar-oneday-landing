"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle, ArrowRight, Copy, Check } from "lucide-react";
import {
  extractInviteCode,
  buildWhatsAppAndroidIntent,
  detectEnv,
} from "@/lib/whatsapp-deeplink";

/**
 * MEGA-CTA «Вступить в сообщество» с надёжным диплинком в WhatsApp.
 *
 * Стратегия (проверено ресёрчем):
 *  - База: канонический https://chat.whatsapp.com/<code> как href — открывается
 *    по РЕАЛЬНОМУ тапу (не авто-редирект), same-tab (не _blank — так надёжнее в webview).
 *  - Android внутри встроенного браузера: на тапе форсим intent:// (с веб-фолбэком).
 *  - iOS внутри встроенного браузера: программно никак — показываем нудж «открой в Safari».
 *  - Везде: кнопка «Скопировать ссылку» как гарантированный пол.
 */
export function WhatsAppCommunityCTA({ href }: { href: string }) {
  const reduced = useReducedMotion();
  const [env, setEnv] = useState({
    inApp: false,
    isAndroid: false,
    isIOS: false,
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEnv(detectEnv(navigator.userAgent || ""));
  }, []);

  const code = extractInviteCode(href);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // Android во встроенном браузере: форсим WhatsApp через intent:// (фолбэк на веб встроен).
    if (code && env.isAndroid && env.inApp) {
      e.preventDefault();
      window.location.href = buildWhatsAppAndroidIntent(code);
    }
    // Остальные случаи → штатный переход по href (universal-link).
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard недоступен — пользователь скопирует руками */
    }
  }

  return (
    <>
      <motion.a
        href={href}
        onClick={handleClick}
        rel="noopener"
        whileHover={{ y: -3, scale: 1.02 }}
        whileTap={{ y: 0, scale: 0.99 }}
        animate={
          reduced
            ? {}
            : {
                boxShadow: [
                  "0 20px 50px -10px rgba(205, 235, 82, 0.55), 0 0 0 0 rgba(205, 235, 82, 0.4)",
                  "0 25px 60px -10px rgba(205, 235, 82, 0.75), 0 0 0 16px rgba(205, 235, 82, 0)",
                  "0 20px 50px -10px rgba(205, 235, 82, 0.55), 0 0 0 0 rgba(205, 235, 82, 0.4)",
                ],
              }
        }
        transition={{
          boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        }}
        className="group relative inline-flex items-center justify-center gap-3 bg-[#cdeb52] text-black py-4 px-7 sm:py-5 sm:px-12 rounded-2xl text-[15px] sm:text-[18px] lg:text-[19px] font-bold uppercase tracking-wide w-full sm:w-auto max-w-[620px]"
        style={{
          fontFamily:
            "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 800,
        }}
      >
        <MessageCircle size={22} strokeWidth={2.5} className="shrink-0" />
        <span className="text-center">Вступить в сообщество</span>
        <ArrowRight
          size={22}
          strokeWidth={2.5}
          className="shrink-0 group-hover:translate-x-1 transition-transform"
        />
      </motion.a>

      {/* Помощь — только внутри встроенного браузера (где ссылки WhatsApp глючат) */}
      {env.inApp && (
        <div className="mt-3 flex flex-col items-center gap-2 max-w-[480px] mx-auto">
          <p className="text-white/55 text-[12px] sm:text-[13px] leading-snug text-center">
            WhatsApp не открылся? Нажми <span className="text-white font-semibold">•••</span> вверху и выбери{" "}
            <span className="text-white font-semibold">
              {env.isIOS ? "«Открыть в Safari»" : "«Открыть в браузере»"}
            </span>
            {" "}— потом снова жми кнопку.
          </p>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-[0.12em] text-[#cdeb52]/80 hover:text-[#cdeb52] transition-colors"
          >
            {copied ? (
              <>
                <Check size={13} strokeWidth={2.5} /> ссылка скопирована
              </>
            ) : (
              <>
                <Copy size={13} strokeWidth={2.5} /> скопировать ссылку
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}

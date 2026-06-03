"use client";

import { Landmark } from "lucide-react";

/**
 * PaymentBanks — строка «рассрочка от банков» под QR-слайдами (доверие + варианты оплаты).
 * ⚠ Логотипы банков ЖДУ от Александра (прозрачный PNG/SVG → public/payment/banks/).
 *    Когда файлы придут — проставить logo, и вместо текста отрендерится <img>.
 */
const BANKS: { name: string; logo?: string }[] = [
  { name: "Halyk" },        // logo: "/payment/banks/halyk.png"
  { name: "Kaspi" },        // logo: "/payment/banks/kaspi.png"
  { name: "Home Credit" },  // logo: "/payment/banks/homecredit.png"
];

export function PaymentBanks() {
  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45 flex items-center gap-1.5">
        <Landmark className="w-3.5 h-3.5" strokeWidth={2} /> рассрочка 12–24 мес от банков
      </span>
      {BANKS.map((b) =>
        b.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={b.name} src={b.logo} alt={b.name} className="h-5 w-auto object-contain opacity-90" />
        ) : (
          <span key={b.name} className="rounded-md px-2.5 py-1 text-xs font-semibold text-white/80" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}>
            {b.name}
          </span>
        )
      )}
    </div>
  );
}

"use client";

import { Landmark } from "lucide-react";

/**
 * PaymentBanks — строка «рассрочка от банков» под QR-слайдами (доверие + варианты оплаты).
 * Лого на белых карточках (файлы от Александра): public/payment/banks/{halyk,kaspi,homecredit}.png.
 */
const BANKS = [
  { name: "Halyk", logo: "/payment/banks/halyk.png" },
  { name: "Kaspi", logo: "/payment/banks/kaspi.png" },
  { name: "Home Credit", logo: "/payment/banks/homecredit.png" },
];

export function PaymentBanks() {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45 flex items-center gap-1.5">
        <Landmark className="w-3.5 h-3.5" strokeWidth={2} /> рассрочка 12–24 мес от банков
      </span>
      <div className="flex items-center gap-2.5">
        {BANKS.map((b) => (
          <div
            key={b.name}
            className="flex items-center justify-center rounded-md bg-white px-3"
            style={{ height: 34, minWidth: 66, boxShadow: "0 2px 12px -4px rgba(0,0,0,0.5)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.logo} alt={b.name} className="w-auto object-contain" style={{ maxHeight: 20 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

/**
 * PaymentQRPair — предоплата 10 000 ₸. Только Kaspi-скриншот (KZ).
 * Все остальные QR убраны (правка Александра): для другой карты / других банков / СНГ —
 * оплата по КНОПКЕ ПОД ВИДЕО (в плеере Bizon), не QR.
 */
export function PaymentQRPair({ kaspiMaxH = "48vh" }: { kaspiMaxH?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/payment/kaspi-qr-prepayment.png"
        alt="Kaspi · предоплата 10 000 ₸"
        className="block object-contain rounded-xl"
        style={{ maxWidth: "100%", maxHeight: kaspiMaxH }}
      />
      <div className="text-center max-w-[340px] text-white/75 text-[12px] md:text-sm leading-snug">
        Для оплаты <span className="text-white font-semibold">другой картой</span>, через другие банки или из стран <span className="text-white font-semibold">СНГ</span> — оплатите по кнопке <span className="text-[#B6FF00] font-semibold">под этим видео</span>.
      </div>
    </div>
  );
}

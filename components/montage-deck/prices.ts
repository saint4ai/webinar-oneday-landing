/**
 * Цены эфира 07.10.2026 для блока Vibe Coding PRO (slides/vcpro.tsx) и строк про пакет на слайдах 53 и 57.
 * Всё, что считается (экономия, «по отдельности», половина платежа), считается отсюда: числа руками на слайдах не пишем.
 *
 * PRO_PRICE: цена тарифа «Вайбкодер Pro» с обратной связью. 290 900 ₸ по оферте и сайту onai.academy/obuchenie/.
 * Александр назвал 299 900 ₸, ждём подтверждения. Поменять цену на слайдах = поменять только эту константу.
 */
export const PRODUCTION_PRICE = 150_000; // Vibe Production участникам эфира (перечёркнутая «полная цена» 250 000 ₸ живёт на слайдах 38, 39a)
export const PRO_SOLO_PRICE = 220_000; // Vibe Coding PRO, тариф «Вайб Solo» без обратной связи
export const PRO_PRICE = 290_900; // Vibe Coding PRO, тариф «Вайбкодер Pro» с обратной связью (см. выше)
export const BUNDLE_PRICE = 390_000; // оба курса с обратной связью, только участникам эфира, до 23:59 сегодня
export const BOOKING_PRICE = 10_000; // бронь: одна на любой выбор, входит в цену

/** Оба курса по отдельности: Vibe Production + PRO с обратной связью. */
export const SEPARATE_PRICE = PRODUCTION_PRICE + PRO_PRICE;
/** Сколько экономит пакет. */
export const BUNDLE_SAVING = SEPARATE_PRICE - BUNDLE_PRICE;
/** Половина цены PRO: «можно двумя платежами». */
export const PRO_HALF = PRO_PRICE / 2;

/** 290900 → «290 900 ₸» с неразрывными пробелами: цена не рвётся по строкам. */
export const money = (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₸`;

/**
 * Цены в долларах рядом с тенге (Александр, 07.10: «все цены и в тенге, и в долларах»). Курс как на onai.academy/obuchenie, ≈448 ₸ за доллар.
 * Суммы эфира заданы картой ниже, остальные считаются по курсу и округляются до доллара (меньше $10 до десятых).
 * Подписки на сервисы и консультация уже в долларах, их не пересчитываем.
 */
export const KZT_PER_USD = 448;
const USD_FIXED: Record<number, number> = {
  250_000: 558, 150_000: 335, 220_000: 491, 290_900: 650, 145_450: 325, 390_000: 871, 440_900: 984, 50_900: 114, 140_000: 313, 10_000: 22, 6_250: 14,
};

/** Сумма в долларах числом: 150000 → 335. */
export const usdOf = (n: number) => USD_FIXED[n] ?? (n / KZT_PER_USD < 10 ? Math.round((n / KZT_PER_USD) * 10) / 10 : Math.round(n / KZT_PER_USD));

const NB = String.fromCharCode(160);
/** 150000 → «≈ $335» с неразрывными пробелами; 1562.5 → «≈ $1 563»; меньше десяти — «≈ $0,5». */
export const moneyUsd = (n: number) => `≈${NB}$${String(usdOf(n)).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, NB)}`;

/** 150000 → «150 000 ₸ (≈ $335)»: для текста и мелких строк. Крупные плашки показывают доллары второй строкой через moneyUsd. */
export const moneyBoth = (n: number) => `${money(n)} (${moneyUsd(n)})`;

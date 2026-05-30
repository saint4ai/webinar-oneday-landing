import { FormatsShowcase } from "@/components/sales-deck/formats/FormatsShowcase";

/**
 * /sales-deck/formats — витрина новых дизайн-форматов слайдов.
 * Server Component (по умолчанию) — рендерит client-витрину.
 * Не трогает основной /sales-deck.
 */
export const metadata = {
  title: "Форматы слайдов · onAI",
  robots: { index: false, follow: false },
};

export default function FormatsPage() {
  return <FormatsShowcase />;
}

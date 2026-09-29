import { TemplatesDeck } from "@/components/montage-deck/TemplatesDeck";

export const metadata = { title: "Шаблоны деки · витрина", robots: { index: false, follow: false } };

/** /montage/templates — витрина шаблонов слайдов деки с пустыми [полями]. В эфир не входит. */
export default function MontageTemplatesPage() {
  return <TemplatesDeck />;
}

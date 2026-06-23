import ThankYouClient from "./ThankYouClient";
import { readWhatsAppLink } from "@/lib/whatsapp-link";

/**
 * Thank You — server component.
 * После сабмита формы ведёт лида в закрытое WhatsApp-СООБЩЕСТВО воркшопа
 * (там ссылка на живой эфир + бонусы). Ссылку читаем из рантайм-файла,
 * управляемого Telegram-ботом, и отдаём клиенту пропом. force-dynamic —
 * чтобы новая ссылка подхватывалась без пересборки и страница не кэшировалась.
 */
export const dynamic = "force-dynamic";

export default function ThankYouPage() {
  const communityHref = readWhatsAppLink();
  return <ThankYouClient communityHref={communityHref} />;
}

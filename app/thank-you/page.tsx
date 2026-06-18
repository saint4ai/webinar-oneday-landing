import ThankYouClient from "./ThankYouClient";

/**
 * Thank You — server component.
 * После сабмита формы редиректит лида в WhatsApp-бота EasyBot (там ссылка на
 * эфир + бонусы). Логика редиректа — на клиенте (нужны UTM-метки из браузера),
 * поэтому страница тонкая. force-dynamic оставляем, чтобы не кэшировалась.
 */
export const dynamic = "force-dynamic";

export default function ThankYouPage() {
  return <ThankYouClient />;
}

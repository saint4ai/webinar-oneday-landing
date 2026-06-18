/**
 * GET /api/whatsapp-link — текущая ссылка на WhatsApp-сообщество.
 *
 * Используется как резерв (на случай клиентского чтения); основной путь —
 * server component thank-you, который читает ссылку напрямую из файла.
 * force-dynamic + no-store: всегда свежее значение, без кэша.
 */
import { NextResponse } from "next/server";
import { readWhatsAppLink } from "@/lib/whatsapp-link";

export const dynamic = "force-dynamic";

export async function GET() {
  const link = readWhatsAppLink();
  return NextResponse.json(
    { link },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

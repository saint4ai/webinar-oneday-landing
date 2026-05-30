/**
 * BrandLogo — реальный SVG-логотип бренда из public/logos/.
 * Файлы скачаны (simpleicons / SVGL) и видимы на чёрном фоне:
 * мультиколор-марки сохранены в цвете, чёрные монохром-марки — в белом.
 *
 * Доступные ключи (см. public/logos/): google, claude, cursor, lovable,
 * perplexity, notion, figma, github, slack, miro, googlecalendar, googledrive,
 * asana, outlook, excel, reddit, threads, instagram, telegram.
 * НЕТ лого (оставляем lucide-иконку): higgsfield, yandex, 2gis.
 */
interface BrandLogoProps {
  name: string;
  className?: string;
  alt?: string;
}

export function BrandLogo({ name, className, alt }: BrandLogoProps) {
  return (
    <img
      src={`/logos/${name}.svg`}
      alt={alt ?? name}
      className={className}
      draggable={false}
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}

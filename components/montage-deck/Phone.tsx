import { T } from "./theme";

/** Айфон с рилсом: корпус цвета ночи сайта #14100E, радиус 46, экран 38, поверх — интерфейс Instagram. src — картинка, video — ролик в цикле без звука. */
export function Phone({ src, video, views, author = "saint4ai", caption, width = "19cqw", showTop = true, chrome = true }: {
  src?: string; video?: string; views?: string; author?: string; caption?: string; width?: string; showTop?: boolean; chrome?: boolean;
}) {
  return (
    <div style={{ width, aspectRatio: "9/19", background: T.night, borderRadius: "2.4cqw", padding: "0.52cqw", boxShadow: `0 0 0 1px ${T.nightLine} inset, ${T.shadow}` }}>
      <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: "1.98cqw", background: T.night2 }}>
        {video ? (
          <video key={video} src={video} poster={src} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
        ) : src ? (
          <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : null}
        {chrome && <>
        <div className="absolute inset-x-0 top-0 h-[18%]" style={{ background: "linear-gradient(rgba(20,16,14,.45),transparent)" }} />
        <div className="absolute inset-x-0 bottom-0 h-[34%]" style={{ background: "linear-gradient(transparent,rgba(20,16,14,.6))" }} />
        {showTop && <div className="absolute left-[7%] top-[5.5%]" style={{ color: T.paper, fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.05cqw" }}>Reels</div>}
        <div className="absolute right-[5%] bottom-[20%] flex flex-col items-center gap-[1.1cqw]" style={{ color: T.paper, fontSize: "0.62cqw", fontFamily: "var(--font-manrope)", fontWeight: 600 }}>
          {[
            "M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.2 5 6.7 5c2 0 3.4 1.1 4.3 2.4.9-1.3 2.3-2.4 4.3-2.4 3.5 0 5.5 3.6 4.2 6.8C19.5 16.4 12 21 12 21z",
            "M4 5h16v11H8l-4 4z",
            "M4 12l16-8-6 16-2.5-6.5z",
          ].map((d, i) => (
            <svg key={i} viewBox="0 0 24 24" style={{ width: "1.35cqw", height: "1.35cqw" }} fill="none" stroke={T.paper} strokeWidth="1.8" strokeLinejoin="round"><path d={d} /></svg>
          ))}
        </div>
        <div className="absolute left-[6%] right-[22%] bottom-[5%]" style={{ color: T.paper, fontFamily: "var(--font-manrope)" }}>
          <div style={{ fontWeight: 700, fontSize: "0.72cqw" }}>{author}</div>
          {caption && <div style={{ fontSize: "0.62cqw", opacity: 0.9, marginTop: "0.2cqw" }}>{caption}</div>}
          {views && (
            <div className="flex items-center gap-[0.3cqw]" style={{ fontSize: "0.66cqw", fontWeight: 700, marginTop: "0.35cqw", fontVariantNumeric: "tabular-nums" }}>
              <svg viewBox="0 0 24 24" style={{ width: "0.8cqw", height: "0.8cqw" }} fill={T.paper}><path d="M8 5v14l11-7z" /></svg>
              {views}
            </div>
          )}
        </div>
        </>}
      </div>
    </div>
  );
}

"""Озвучка интро ElevenLabs + тайминги каждой фразы для монтажёра.

Запуск:  python3 make_voice.py            → out/intro_voice_v2.mp3, .srt, .json, .md
         python3 make_voice.py --test     → короткая проверка связки (≈15 символов), файлы не пишет

Правила из официального скилла elevenlabs/skills (text-to-speech):
- голос Nataly Vershinina — профессиональный клон: лучше всего звучит на eleven_v4 (на v3 теряет качество);
- в v4 нет style и speed; паузы — многоточием, тире и переносом строки, теги <break> не работают;
- тайминги берём из /with-timestamps (выравнивание по символам), запасной путь — /forced-alignment.
Ключ — ~/.config/onai/elevenlabs.env (не печатать).
"""
import base64, io, json, subprocess, sys, urllib.request, urllib.error, uuid, wave
from pathlib import Path
from script import lines

HERE = Path(__file__).parent
OUT = HERE / "out"
VERSION = "v5"
VOICE_ID = "BE01v3e9mZOvL75SsISY"  # Nataly Vershinina — Calm & Friendly (профессиональный клон, русский)
MODEL = "eleven_v4"
SETTINGS = {"stability": 0.6, "similarity_boost": 0.75, "use_speaker_boost": True}  # 0.6: ровнее для дикторского текста, но живее пресета narration (0.7) из скилла
FORMAT = "pcm_44100"  # без сжатия, 44,1 кГц 16 бит моно → WAV
FALLBACK_FORMAT = "mp3_44100_192"  # если тариф не пускает pcm_44100: mp3 и перевод в WAV через ffmpeg
# --seed N: номер дубля. Тот же seed и текст дают похожее исполнение — удачный дубль можно повторить
SEED = int(sys.argv[sys.argv.index("--seed") + 1]) if "--seed" in sys.argv else 1


def key():
    for l in (Path.home() / ".config/onai/elevenlabs.env").read_text().splitlines():
        if l.startswith("ELEVENLABS_API_KEY="):
            return l.split("=", 1)[1].strip()
    sys.exit("нет ELEVENLABS_API_KEY в ~/.config/onai/elevenlabs.env")


def post(path, body, headers):
    req = urllib.request.Request("https://api.elevenlabs.io" + path, data=body, method="POST", headers={"xi-api-key": key(), **headers})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return r.read(), dict(r.headers)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{e.code}: {e.read()[:400].decode('utf-8', 'ignore')}")


def build_text(items):
    """Текст для голоса: фразы бита через пробел, биты — через пустую строку (пауза). Возвращает текст и позиции фраз."""
    text, spans, prev_beat = "", [], None
    for beat, shown, voice in items:
        if text:
            text += "\n\n" if beat != prev_beat else " "
        spans.append((beat, shown, len(text), len(text) + len(voice)))
        text += voice
        prev_beat = beat
    return text, spans


def pcm_to_wav(pcm):
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(44100); w.writeframes(pcm)
    return buf.getvalue()


def synth(text):
    """Пробует WAV без сжатия; если тариф не пускает формат — mp3. Возвращает (аудио, начала, концы, заголовки, формат)."""
    try:
        return (*tts_with_timestamps(text, FORMAT), FORMAT)
    except RuntimeError as e:
        if not any(k in str(e).lower() for k in ("format", "tier", "subscription", "403")):
            raise
        print(f"{FORMAT} недоступен на тарифе, беру {FALLBACK_FORMAT}:", str(e)[:120])
        return (*tts_with_timestamps(text, FALLBACK_FORMAT), FALLBACK_FORMAT)


def tts_with_timestamps(text, fmt):
    """Аудио + время начала/конца каждого символа. Если v4 не отдаёт тайминги — синтез и отдельное выравнивание."""
    body = json.dumps({"text": text, "model_id": MODEL, "language_code": "ru", "voice_settings": SETTINGS, "seed": SEED}).encode()
    try:
        raw, h = post(f"/v1/text-to-speech/{VOICE_ID}/with-timestamps?output_format={fmt}", body, {"Content-Type": "application/json"})
        d = json.loads(raw)
        a = d.get("alignment") or d.get("normalized_alignment")
        return base64.b64decode(d["audio_base64"]), a["character_start_times_seconds"], a["character_end_times_seconds"], h
    except RuntimeError as e:
        print("with-timestamps не сработал, иду запасным путём:", str(e)[:160])
    audio, h = post(f"/v1/text-to-speech/{VOICE_ID}?output_format={fmt}", body, {"Content-Type": "application/json"})
    pcm = fmt.startswith("pcm")
    file, name, ctype = (pcm_to_wav(audio), "v.wav", "audio/wav") if pcm else (audio, "v.mp3", "audio/mpeg")
    b = uuid.uuid4().hex
    form = (f"--{b}\r\nContent-Disposition: form-data; name=\"text\"\r\n\r\n{text}\r\n"
            f"--{b}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{name}\"\r\nContent-Type: {ctype}\r\n\r\n").encode() + file + f"\r\n--{b}--\r\n".encode()
    raw, _ = post("/v1/forced-alignment", form, {"Content-Type": f"multipart/form-data; boundary={b}"})
    chars = json.loads(raw)["characters"]
    return audio, [c["start"] for c in chars], [c["end"] for c in chars], h


def ts(sec):
    ms = int(round(sec * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def main():
    test = "--test" in sys.argv
    items = [("тест", "Проверка связи.", "Проверка связи.")] if test else lines()
    text, spans = build_text(items)
    audio, starts, ends, h, fmt = synth(text)
    if len(starts) < len(text):
        print(f"⚠ символов в выравнивании {len(starts)} меньше, чем в тексте {len(text)} — тайминги по ближайшим символам")
    pick = lambda i: min(i, len(starts) - 1)
    rows = []
    for n, (beat, shown, a, b) in enumerate(spans, 1):
        rows.append({"n": n, "beat": beat, "start": round(starts[pick(a)], 2), "end": round(ends[pick(b - 1)], 2), "text": shown})
    total = round(ends[-1], 2)
    print(f"символов списано: {h.get('x-character-count') or h.get('X-Character-Count', '?')} · длина: {total} c · фраз: {len(rows)}")
    if test:
        print(rows)
        return
    OUT.mkdir(exist_ok=True)
    stem = OUT / f"intro_voice_{VERSION}_seed{SEED}"
    wav = stem.with_suffix(".wav")
    if fmt.startswith("pcm"):
        wav.write_bytes(pcm_to_wav(audio))
    else:
        stem.with_suffix(".mp3").write_bytes(audio)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(stem.with_suffix(".mp3")), "-c:a", "pcm_s16le", str(wav)], check=True)
    stem.with_suffix(".json").write_text(json.dumps({"voice": "Nataly Vershinina", "model": MODEL, "duration": total, "lines": rows}, ensure_ascii=False, indent=2))
    stem.with_suffix(".srt").write_text("\n".join(f"{r['n']}\n{ts(r['start'])} --> {ts(r['end'])}\n{r['text']}\n" for r in rows))
    md = [f"# Интро эфира 6 октября — голос и тайминги ({VERSION})", "",
          f"Голос: Nataly Vershinina, ElevenLabs {MODEL}, дубль seed {SEED}. Длина: {total} c. Файлы рядом: `.wav` (44,1 кГц, 16 бит), `.srt` (субтитры), `.json`.", "",
          "| # | Бит | Начало | Конец | Текст |", "|---|---|---|---|---|"]
    md += [f"| {r['n']} | {r['beat']} | {r['start']:.2f} | {r['end']:.2f} | {r['text']} |" for r in rows]
    stem.with_suffix(".md").write_text("\n".join(md) + "\n")
    print(f"готово ({fmt}):", wav)


if __name__ == "__main__":
    main()

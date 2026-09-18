#!/usr/bin/env python3
"""
Собирает 3–4 фото на каждый товар прайса, подписывает названием
и раскладывает по брендам в ~/Desktop/Каталог KORSHOP/Фото.

Порядок поиска: штрихкод (он уникален) → страницы магазинов → их галереи.
Если пусто — поиск по картинкам, в самом крайнем случае — фото из прайса.

  python fetch_photos.py --limit 8        # пилот
  python fetch_photos.py --only ANUA      # один бренд
  python fetch_photos.py                  # всё
"""
import argparse, csv, io, json, os, re, time, unicodedata
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urljoin, urlparse

import requests
from PIL import Image, ImageDraw, ImageFont, ImageStat, ImageFilter
from ddgs import DDGS

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(os.environ.get("KORSHOP_OUT", Path.home() / "Desktop/Каталог KORSHOP/Фото"))
DATA = json.loads((ROOT / "src/data/products.json").read_text(encoding="utf-8"))

UA = {"User-Agent": ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                     "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")}
WANT = 4
MIN_SIDE = 1000        # ниже этого кадр в набор не берём
MIN_SIDE_SOFT = 820   # порог, если крупнее ничего не нашлось
CAND_MAX = 10         # сколько кандидатов качаем, прежде чем выбрать лучшие
BAD_URL = ("logo", "icon", "favicon", "sprite", "placeholder", "banner", "payment",
           "instagram", "facebook", "whatsapp", "telegram", "flag", "badge", "loader",
           "avatar", "thumb-", "/cart", "shipping")
BAD_HOST = ("instagram.com", "lookaside", "pinimg", "pinterest", "fbcdn", "tiktok", "ytimg")
# слова, которые есть у половины косметики — по ним нельзя опознать товар
STOP = {"cream", "serum", "face", "skin", "care", "korean", "korea", "beauty", "ml", "set",
        "toner", "mask", "pack", "sun", "acid", "gel", "oil", "foam", "shop", "buy", "new",
        "official", "product", "cosmetics", "wholesale", "original", "best", "for", "and"}
FONT_B = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_R = "/System/Library/Fonts/Supplemental/Arial.ttf"

# ── вспомогательное ───────────────────────────────────────────────────────
def slug(s: str, limit: int = 70) -> str:
    s = unicodedata.normalize("NFC", s)
    s = re.sub(r"[^\w\s\-А-Яа-яЁё]", "", s, flags=re.U)
    return re.sub(r"\s+", "_", s.strip())[:limit].strip("_")

def key_tokens(p: dict) -> set[str]:
    """Уникальные слова товара — по ним проверяем, что картинка та самая."""
    words = re.findall(r"[A-Za-z]{3,}", f'{p["brand"]} {p["name"]} {p.get("spec") or ""}')
    return {w.lower() for w in words} - STOP

def dhash(im: Image.Image) -> int:
    g = im.convert("L").resize((9, 8), Image.LANCZOS)
    px = list(g.getdata())
    bits = 0
    for r in range(8):
        for c in range(8):
            bits = bits << 1 | (px[r * 9 + c] > px[r * 9 + c + 1])
    return bits

def close(a: int, b: int) -> bool:
    return bin(a ^ b).count("1") <= 6

def full_size(url: str) -> str:
    """CDN магазинов отдают превью — просим оригинал в максимальном размере."""
    url = re.sub(r"-\d{2,4}x\d{2,4}(?=\.(jpg|jpeg|png|webp))", "", url, flags=re.I)
    url = re.sub(r"_(\d{2,4}x\d{0,4}|small|medium|large|compact|grande)(?=\.(jpg|jpeg|png|webp))",
                 "", url, flags=re.I)
    url = re.sub(r"\?.*$", "", url)
    if "/cdn/shop/" in url or "cdn.shopify" in url:      # Shopify отдаёт до 2048
        url += "?width=2048"
    elif "/wp-content/uploads/" in url:
        url = re.sub(r"-scaled(?=\.)", "", url)
    return url

# ── сеть ──────────────────────────────────────────────────────────────────
def ddg_text(q: str, n: int = 8) -> list[dict]:
    for i in range(3):
        try:
            return list(DDGS().text(q, max_results=n))
        except Exception:
            time.sleep(3 + 4 * i)
    return []

def ddg_images(q: str, n: int = 24) -> list[dict]:
    for i in range(2):
        try:
            return list(DDGS().images(q, max_results=n, safesearch="off"))
        except Exception:
            time.sleep(3 + 4 * i)
    return []

def page_images(url: str, want: set[str], strict: bool) -> list[str]:
    """Картинки со страницы товара. Страницу, найденную по штрихкоду, считаем
    своей: берём главное фото и галерею. Найденную по названию — проверяем имена."""
    try:
        h = requests.get(url, headers=UA, timeout=20).text
    except Exception:
        return []

    # заголовок страницы обязан содержать слова товара — иначе это чужая карточка
    title = " ".join(re.findall(r"<title[^>]*>(.*?)</title>", h, re.S | re.I))[:300].lower()
    if sum(1 for t in want if t in title) < 2:
        return []

    main = re.findall(r'property=["\']og:image["\']\s+content=["\']([^"\']+)', h)
    main += re.findall(r'"image":\s*"([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"', h)
    for block in re.findall(r'"image":\s*\[(.*?)\]', h, re.S)[:2]:
        main += re.findall(r'"(https?://[^"]+?\.(?:jpg|jpeg|png|webp)[^"]*)"', block)

    rest = re.findall(r'https?://[^\s"\'<>\\]+?\.(?:jpg|jpeg|png|webp)', h)
    rest += [urljoin(url, u) for u in re.findall(r'src="(/[^"]+?\.(?:jpg|jpeg|png|webp))"', h)]

    out, seen = [], set()
    for u, trusted in [(u, True) for u in main] + [(u, False) for u in rest]:
        low = u.lower()
        if any(b in low for b in BAD_URL) or any(b in low for b in BAD_HOST):
            continue
        name = low.rsplit("/", 1)[-1]
        hits = sum(1 for t in want if t in name)
        if not trusted and (hits < (2 if strict else 1)):
            continue
        u = full_size(u)
        if u in seen:
            continue
        seen.add(u)
        out.append(u)
        if len(out) >= 10:
            break
    return out


def sharpness(im: Image.Image) -> float:
    g = im.convert("L")
    g.thumbnail((400, 400), Image.LANCZOS)
    return ImageStat.Stat(g.filter(ImageFilter.FIND_EDGES)).stddev[0]


def fetch(url: str, floor: int) -> Image.Image | None:
    try:
        r = requests.get(url, headers=UA, timeout=25)
        r.raise_for_status()
        im = Image.open(io.BytesIO(r.content))
        im.load()
        if min(im.size) < floor:
            return None
        w, h = im.size
        if not 0.6 < w / h < 1.7:         # баннеры и длинные простыни отсекаем
            return None
        if im.mode in ("RGBA", "LA", "P"):        # прозрачный фон -> белый, иначе чернота
            im = im.convert("RGBA")
            bg = Image.new("RGBA", im.size, "white")
            im = Image.alpha_composite(bg, im)
        im = im.convert("RGB")
        if max(ImageStat.Stat(im).stddev) < 12:   # однотонная заливка, не фото
            return None
        return im
    except Exception:
        return None

# ── подпись ───────────────────────────────────────────────────────────────
def wrap(draw, text, font, width, max_lines=3):
    lines, cur = [], ""
    for word in text.split():
        probe = f"{cur} {word}".strip()
        if draw.textlength(probe, font=font) <= width:
            cur = probe
        else:
            lines.append(cur); cur = word
            if len(lines) == max_lines:
                return lines
    if cur: lines.append(cur)
    return lines[:max_lines]

def caption(im: Image.Image, p: dict) -> Image.Image:
    """Кадр в исходном разрешении (до 2000 px) + подпись под ним."""
    S = max(1200, min(2000, max(im.size)))
    k = S / 1000                                   # всё масштабируем от базовой сетки
    PAD = int(56 * k)
    f_brand = ImageFont.truetype(FONT_B, int(27 * k))
    f_name = ImageFont.truetype(FONT_B, int(40 * k))
    f_small = ImageFont.truetype(FONT_R, int(25 * k))

    probe = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    text = f'{p["name"]}{" · " + p["spec"] if p.get("spec") else ""}'
    lines = wrap(probe, text, f_name, S - 2 * PAD)
    step = int(50 * k)
    block = int(30 * k) + int(40 * k) + len(lines) * step + int(46 * k)

    canvas = Image.new("RGB", (S, S + block), "white")
    photo = im.copy()
    photo.thumbnail((S - 2 * PAD, S - 2 * PAD), Image.LANCZOS)
    canvas.paste(photo, ((S - photo.width) // 2, (S - photo.height) // 2))

    d = ImageDraw.Draw(canvas)
    y = S
    d.line([(PAD, y), (S - PAD, y)], fill="#e6e0d8", width=max(2, int(2 * k)))
    y += int(26 * k)
    d.text((PAD, y), p["brand"], font=f_brand, fill="#c0563c"); y += int(40 * k)
    for ln in lines:
        d.text((PAD, y), ln, font=f_name, fill="#16130f"); y += step
    tail = " · ".join(filter(None, [p.get("barcode"), p.get("pack"), f'${p["price"]:.2f}']))
    d.text((PAD, y + int(4 * k)), tail, font=f_small, fill="#857d73")
    return canvas


def save(im: Image.Image, path: Path) -> None:
    """JPEG без цветовой субдискретизации — на упаковках не мылятся буквы."""
    im.save(path, quality=95, subsampling=0, optimize=True, progressive=True)


# ── один товар ────────────────────────────────────────────────────────────
def candidates(p: dict) -> list[str]:
    want = key_tokens(p)
    latin = " ".join(re.findall(r"[A-Za-z0-9][A-Za-z0-9\-\.%]*", p["name"])[:8])
    urls: list[str] = []

    # 1. по штрихкоду — самый точный ключ
    if p.get("barcode"):
        for hit in ddg_text(p["barcode"], 8):
            href = hit.get("href") or ""
            if href and not any(b in href for b in BAD_HOST):
                urls += page_images(href, want, strict=False)
            if len(urls) >= WANT * 2:
                return urls

    # 2. по бренду и латинскому названию
    for hit in ddg_text(f'{p["brand"]} {latin}', 6):
        href = hit.get("href") or ""
        if href and not any(b in href for b in BAD_HOST):
            urls += page_images(href, want, strict=True)
        if len(urls) >= WANT * 2:
            return urls

    # 3. поиск по картинкам — только если страниц не нашлось, и с жёсткой проверкой
    if len(urls) < 2:
        for r in ddg_images(f'{p["brand"]} {latin}'):
            u, title = r.get("image") or "", f'{r.get("title","")} {r.get("url","")}'.lower()
            if any(b in u for b in BAD_HOST) or sum(1 for t in want if t in title) < 3:
                continue
            urls.append(u)
    return urls


def collect(p: dict, floor: int) -> list[tuple[float, Image.Image, str]]:
    """Качаем кандидатов параллельно и оцениваем: крупнее и резче — выше."""
    urls = candidates(p)[:CAND_MAX]
    if not urls:
        return []
    got, hashes = [], []
    with ThreadPoolExecutor(max_workers=6) as ex:
        for url, im in zip(urls, ex.map(lambda u: fetch(u, floor), urls)):
            if im is None:
                continue
            sharp = sharpness(im)
            if sharp < 6:                      # мыло или грубый апскейл
                continue
            h = dhash(im)
            if any(close(h, old) for old in hashes):
                continue
            hashes.append(h)
            got.append((min(im.size) * min(sharp, 30), im, url))
    return sorted(got, key=lambda t: -t[0])


def handle(p: dict) -> dict:
    folder = OUT / slug(p["brand"], 40) / f'{p["id"]:04d}_{slug(p["name"])}'
    raw_dir = folder / "без подписи"
    if len(list(folder.glob("*.jpg"))) >= 3:
        return {"id": p["id"], "name": p["full"], "found": WANT, "status": "уже есть", "sources": ""}

    best = collect(p, MIN_SIDE)
    if len(best) < 2:                       # крупного мало — снижаем планку
        best = collect(p, MIN_SIDE_SOFT)

    folder.mkdir(parents=True, exist_ok=True)
    raw_dir.mkdir(exist_ok=True)
    for old in folder.glob("*.jpg"):
        old.unlink()
    for old in raw_dir.glob("*.jpg"):
        old.unlink()

    saved, sources, sizes = 0, [], []
    for _, im, url in best[:WANT]:
        saved += 1
        base = f'{p["id"]:04d}_{slug(p["name"], 60)}_{saved}'
        save(im, raw_dir / f"{base}.jpg")
        save(caption(im, p), folder / f"{base}.jpg")
        sources.append(url)
        sizes.append(f"{im.width}x{im.height}")

    # картинка из прайса — всего ~150 px, поэтому только когда сеть ничего не дала
    if saved == 0 and p.get("img"):
        src = ROOT / "public/img" / p["img"]
        if src.exists():
            im = Image.open(src).convert("RGB")
            saved += 1
            base = f'{p["id"]:04d}_{slug(p["name"], 60)}_{saved}'
            save(im, raw_dir / f"{base}.jpg")
            save(caption(im, p), folder / f"{base}.jpg")
            sources.append("фото из прайса")
            sizes.append(f"{im.width}x{im.height}")

    if saved >= 3:
        status = "ок"
    elif saved and sources[0] == "фото из прайса":
        status = "только прайс"
    elif saved:
        status = "мало"
    else:
        status = "не найдено"
    return {"id": p["id"], "name": p["full"], "found": saved, "status": status,
            "sources": " | ".join(f"{u} [{z}]" for u, z in zip(sources, sizes))}


# ── прогон ────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int)
    ap.add_argument("--only")
    ap.add_argument("--start", type=int, default=0)
    ap.add_argument("--step", type=int, default=1, help="брать каждый N-й (для пилота)")
    ap.add_argument("--workers", type=int, default=4)
    a = ap.parse_args()

    items = DATA["products"]
    if a.only:
        items = [p for p in items if p["brand"].upper() == a.only.upper()]
    items = items[a.start::a.step]
    if a.limit:
        items = items[:a.limit]

    OUT.mkdir(parents=True, exist_ok=True)
    rows, t0 = [], time.time()
    with ThreadPoolExecutor(max_workers=a.workers) as ex:
        for i, row in enumerate(ex.map(handle, items), 1):
            rows.append(row)
            print(f'[{i}/{len(items)}] {row["status"]:>10} · {row["found"]} · {row["name"][:62]}', flush=True)

    rep = OUT.parent / "отчёт-по-фото.csv"
    new = not rep.exists()
    with rep.open("a", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=["id", "name", "found", "status", "sources"], delimiter=";")
        if new: w.writeheader()
        w.writerows(rows)
    ok = sum(1 for r in rows if r["status"] in ("ок", "уже есть"))
    print(f'\n✅ {ok}/{len(rows)} с полным набором · {int(time.time()-t0)} с · отчёт: {rep}')

if __name__ == "__main__":
    main()

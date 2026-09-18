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
import argparse, csv, io, json, re, time, unicodedata
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urljoin, urlparse

import requests
from PIL import Image, ImageDraw, ImageFont, ImageStat
from ddgs import DDGS

ROOT = Path(__file__).resolve().parent.parent
OUT = Path.home() / "Desktop/Каталог KORSHOP/Фото"
DATA = json.loads((ROOT / "src/data/products.json").read_text(encoding="utf-8"))

UA = {"User-Agent": ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                     "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")}
WANT = 4
MIN_SIDE = 640
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
    """WooCommerce/Shopify режут картинку суффиксом — возвращаем оригинал."""
    url = re.sub(r"-\d{2,4}x\d{2,4}(?=\.(jpg|jpeg|png|webp))", "", url, flags=re.I)
    url = re.sub(r"_(\d{2,4}x\d{0,4}|small|medium|large|compact|grande)(?=\.(jpg|jpeg|png|webp))",
                 "", url, flags=re.I)
    return re.sub(r"\?.*$", "", url)

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


def fetch(url: str) -> Image.Image | None:
    try:
        r = requests.get(url, headers=UA, timeout=25)
        r.raise_for_status()
        im = Image.open(io.BytesIO(r.content))
        im.load()
        if min(im.size) < MIN_SIDE:
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
    S, PAD = 1000, 56
    f_brand = ImageFont.truetype(FONT_B, 27)
    f_name = ImageFont.truetype(FONT_B, 40)
    f_small = ImageFont.truetype(FONT_R, 25)

    probe = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    text = f'{p["name"]}{" · " + p["spec"] if p.get("spec") else ""}'
    lines = wrap(probe, text, f_name, S - 2 * PAD)
    block = 30 + 40 + len(lines) * 50 + 46          # линия + бренд + строки + низ

    canvas = Image.new("RGB", (S, S + block), "white")
    photo = im.copy()
    photo.thumbnail((S - 2 * PAD, S - 2 * PAD), Image.LANCZOS)
    canvas.paste(photo, ((S - photo.width) // 2, (S - photo.height) // 2))

    d = ImageDraw.Draw(canvas)
    y = S
    d.line([(PAD, y), (S - PAD, y)], fill="#e6e0d8", width=2)
    y += 26
    d.text((PAD, y), p["brand"], font=f_brand, fill="#c0563c"); y += 40
    for ln in lines:
        d.text((PAD, y), ln, font=f_name, fill="#16130f"); y += 50
    tail = " · ".join(filter(None, [p.get("barcode"), p.get("pack"), f'${p["price"]:.2f}']))
    d.text((PAD, y + 4), tail, font=f_small, fill="#857d73")
    return canvas

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


def handle(p: dict) -> dict:
    folder = OUT / slug(p["brand"], 40) / f'{p["id"]:04d}_{slug(p["name"])}'
    raw_dir = folder / "без подписи"
    if len(list(folder.glob("*.jpg"))) >= 3:
        return {"id": p["id"], "name": p["full"], "found": WANT, "status": "уже есть", "sources": ""}

    saved, sources, hashes = 0, [], []
    folder.mkdir(parents=True, exist_ok=True)
    raw_dir.mkdir(exist_ok=True)

    # фото из прайса — эталон, ставим первым кадром
    price_img = ROOT / "public/img" / (p.get("img") or "")
    if p.get("img") and price_img.exists():
        im = Image.open(price_img).convert("RGB")
        hashes.append(dhash(im))
        saved = 1
        base = f'{p["id"]:04d}_{slug(p["name"], 60)}_1'
        im.save(raw_dir / f"{base}.jpg", quality=92)
        caption(im, p).save(folder / f"{base}.jpg", quality=92)
        sources.append("фото из прайса")

    for url in candidates(p):
        im = fetch(url)
        if im is None:
            continue
        h = dhash(im)
        if any(close(h, old) for old in hashes):      # дубль того же фото
            continue
        hashes.append(h)
        saved += 1
        base = f'{p["id"]:04d}_{slug(p["name"], 60)}_{saved}'
        im.save(raw_dir / f"{base}.jpg", quality=92)
        caption(im, p).save(folder / f"{base}.jpg", quality=92)
        sources.append(url)
        if saved >= WANT:
            break

    status = "ок" if saved >= 3 else ("мало" if saved else "не найдено")
    return {"id": p["id"], "name": p["full"], "found": saved, "status": status,
            "sources": " | ".join(sources)}

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

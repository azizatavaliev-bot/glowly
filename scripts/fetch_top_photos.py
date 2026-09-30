#!/usr/bin/env python3
"""
Догружает фото для товаров витрины (top.json), у которых их нет или мало.
Проверка жёсткая: в имени файла или заголовке должен быть и бренд, и слово из названия,
иначе на витрину из 15 позиций попадёт чужой продукт.

  python scripts/fetch_top_photos.py            # только те, у кого < 2 фото
  python scripts/fetch_top_photos.py --id 33    # конкретный товар
"""
import argparse, io, json, re
from pathlib import Path

import requests
from PIL import Image, ImageStat
from ddgs import DDGS

ROOT = Path(__file__).resolve().parent.parent
PHOTOS = ROOT / "public/photos"
DATA = ROOT / "src/data/products.json"
UA = {"User-Agent": ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                     "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")}
BAD = ("pinimg", "instagram", "lookaside", "tiktok", "fbcdn", "ytimg", "aliexpress")
WANT = 3

# как называть товар в поиске: бренд + короткое английское имя
QUERY = {
    528: "VT Cosmetics Reedle Shot 100 50ml",
    427: "Round Lab Birch Juice Moisturizing Sunscreen 50ml",
    174: "Dr Althea 345 Relief Cream 50ml",
    33: "Anua PDRN Hyaluronic Acid Capsule 100 Serum 30ml",
    475: "SKIN1004 Madagascar Centella Hyalu-Cica Water-Fit Sun Serum",
    534: "VT Cosmetics PDRN Essence 100 30ml",
    32: "Anua Niacinamide 10 TXA 4 Serum 30ml",
    112: "Celimax The Real Noni Energy Ampoule 50ml",
    440: "Round Lab 1025 Dokdo Toner 200ml",
    64: "AXIS-Y Dark Spot Correcting Glow Cream 50ml",
    173: "Dr Althea 147 Barrier Cream 50ml",
    566: "SKIN1004 Madagascar Centella Light Cleansing Oil 200ml",
    510: "VT Cosmetics PDRN Capsule Cream 100 50ml",
    334: "Medipeel Peptide 9 Aqua Essence Toner 250ml",
    102: "Celimax The Vita-A Retinal Shot Tightening Booster",
}

def keywords(q: str) -> tuple[str, list[str]]:
    words = [w.lower() for w in re.findall(r"[A-Za-z0-9]+", q) if len(w) > 2]
    return words[0], words[1:]

def good_image(im: Image.Image) -> bool:
    if min(im.size) < 700:
        return False
    w, h = im.size
    if not 0.65 < w / h < 1.55:
        return False
    return max(ImageStat.Stat(im.convert("RGB")).stddev) >= 14   # не однотонная заглушка

def fetch(pid: int, query: str, need: int) -> list[str]:
    brand, words = keywords(query)
    try:
        results = list(DDGS().images(query, max_results=40, safesearch="off"))
    except Exception as e:
        print("  поиск не удался:", e)
        return []

    saved, seen_hosts = [], set()
    for r in results:
        url = r.get("image") or ""
        text = f"{r.get('title', '')} {url}".lower().replace(" ", "")
        if any(b in url for b in BAD):
            continue
        if brand not in text:                       # бренда нет — почти наверняка чужой товар
            continue
        if sum(1 for w in words if w in text) < 2:  # и хотя бы два слова из названия
            continue
        host = re.sub(r"^https?://", "", url).split("/")[0]
        if host in seen_hosts:
            continue
        try:
            im = Image.open(io.BytesIO(requests.get(url, headers=UA, timeout=20).content))
            im.load()
            if not good_image(im):
                continue
            if im.mode in ("RGBA", "LA", "P"):
                im = Image.alpha_composite(Image.new("RGBA", im.size, "white"), im.convert("RGBA"))
            im = im.convert("RGB")
            im.thumbnail((900, 900), Image.LANCZOS)
        except Exception:
            continue
        seen_hosts.add(host)
        name = f"{pid:04d}_n{len(saved) + 1}.webp"
        im.save(PHOTOS / name, "WEBP", quality=82, method=5)
        saved.append(name)
        print(f"  ✓ {im.size} {url[:70]}")
        if len(saved) >= need:
            break
    return saved

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", type=int)
    a = ap.parse_args()

    data = json.loads(DATA.read_text(encoding="utf-8"))
    top = [t["id"] for t in json.loads((ROOT / "src/data/top.json").read_text())]
    for p in data["products"]:
        if p["id"] not in top or (a.id and p["id"] != a.id):
            continue
        have = p.get("photos", [])
        if len(have) >= WANT and not a.id:
            continue
        need = WANT - len(have)
        print(f'{p["id"]} {p["brand"]} — {p["name"][:48]} · есть {len(have)}, нужно ещё {need}')
        got = fetch(p["id"], QUERY.get(p["id"], f'{p["brand"]} {p["name"]}'), need)
        if got:
            p["photos"] = have + got

    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    left = [p["id"] for p in data["products"] if p["id"] in top and not p.get("photos")]
    print("готово. без фото:", left or "нет")

if __name__ == "__main__":
    main()

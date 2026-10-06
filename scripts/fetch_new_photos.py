#!/usr/bin/env python3
"""
Ищет крупные фото для товаров, у которых есть только превью из прайса (146 px).
Одно название = один поиск: оттенки и объёмы одной позиции получают общие кадры.
чтобы прогон можно было прервать и продолжить; вливает его merge_new_photos.py.
В products.json не пишет — складывает результат в scripts/photos_new.<N>.json.

  python scripts/fetch_new_photos.py
"""
import io, json, re, sys, time
from pathlib import Path

import requests
from PIL import Image, ImageStat
from ddgs import DDGS

ROOT = Path(__file__).resolve().parent.parent
PHOTOS = ROOT / "public/photos"
DATA = ROOT / "src/data/products.json"
# несколько прогонов параллельно: python fetch_new_photos.py 0 3, ... 1 3, ... 2 3
SHARD, SHARDS = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (0, 1)
OUT = ROOT / f"scripts/photos_new.{SHARD}.json"
UA = {"User-Agent": ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                     "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")}
BAD = ("pinimg", "instagram", "lookaside", "tiktok", "fbcdn", "ytimg", "aliexpress", "alicdn")
WANT = 3
# слова, которые есть у половины косметики — товар по ним не опознать
STOP = {"cream", "serum", "face", "skin", "care", "set", "toner", "mask", "pack", "sun", "gel",
        "oil", "foam", "for", "and", "the", "spf", "ml", "new", "plus", "50ml", "30ml", "100ml",
        "150ml", "200ml", "exp"}


def latin(name: str) -> str:
    return " ".join(re.findall(r"[A-Za-z0-9][A-Za-z0-9\-\.%+']*", name))


def good_image(im: Image.Image) -> bool:
    if min(im.size) < 600:
        return False
    w, h = im.size
    if not 0.65 < w / h < 1.55:
        return False
    return max(ImageStat.Stat(im.convert("RGB")).stddev) >= 14


def search(query: str) -> list[dict]:
    for i in range(3):
        try:
            return list(DDGS().images(query, max_results=40, safesearch="off"))
        except Exception:
            time.sleep(6 + 8 * i)
    return []


def fetch(pid: int, brand: str, name: str) -> list[str]:
    q = latin(name)
    btok = re.sub(r"[^a-z0-9]", "", brand.lower())
    words = [w for w in dict.fromkeys(re.findall(r"[a-z0-9]+", q.lower()))
             if len(w) > 2 and w not in STOP and not re.fullmatch(r"\d+(ml|g|ea|pcs)?", w)]
    need = max(2, round(len(words) * 0.6))
    saved, hosts = [], set()
    for r in search(f"{brand} {q}"):
        url = r.get("image") or ""
        text = re.sub(r"[^a-z0-9]", "", f"{r.get('title', '')} {url}".lower())
        if any(b in url for b in BAD) or btok not in text:
            continue
        if sum(1 for w in words if w in text) < min(need, len(words)):
            continue
        host = re.sub(r"^https?://", "", url).split("/")[0]
        if host in hosts:
            continue
        try:
            im = Image.open(io.BytesIO(requests.get(url, headers=UA, timeout=15).content))
            im.load()
            if not good_image(im):
                continue
            if im.mode in ("RGBA", "LA", "P"):
                im = Image.alpha_composite(Image.new("RGBA", im.size, "white"), im.convert("RGBA"))
            im = im.convert("RGB")
            im.thumbnail((900, 900), Image.LANCZOS)
        except Exception:
            continue
        hosts.add(host)
        fname = f"{pid:04d}_n{len(saved) + 1}.webp"
        im.save(PHOTOS / fname, "WEBP", quality=82, method=5)
        saved.append(fname)
        if len(saved) >= WANT:
            break
    return saved


def main() -> None:
    products = json.loads(DATA.read_text(encoding="utf-8"))["products"]
    done = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    groups: dict[str, dict] = {}
    for p in products:
        if not p.get("photos"):
            groups.setdefault(f'{p["brand"]}|{p["name"]}', p)
    mine = [kp for i, kp in enumerate(groups.items()) if i % SHARDS == SHARD]
    todo = [(k, p) for k, p in mine if k not in done]
    print(f"названий без фото: {len(groups)}, осталось: {len(todo)}", flush=True)
    for n, (k, p) in enumerate(todo, 1):
        got = fetch(p["id"], p["brand"], p["name"])
        done[k] = got
        OUT.write_text(json.dumps(done, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f'{n}/{len(todo)} {len(got)} фото · {p["brand"]} — {p["name"][:50]}', flush=True)
        time.sleep(1.2)
    print("ГОТОВО. с фото:", sum(1 for v in done.values() if v), "из", len(done), flush=True)


if __name__ == "__main__":
    main()

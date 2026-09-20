#!/usr/bin/env python3
"""
Ищет видеообзор на YouTube для каждого товара и пишет src/data/videos.json.

Берём только ролики, в заголовке которых есть бренд — иначе в карточку
попадёт случайное видео про уход вообще.

  python scripts/find_videos.py --limit 10     # пилот
  python scripts/find_videos.py                # все товары
"""
import argparse, json, re, time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

import requests

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src/data/products.json"
OUT = ROOT / "src/data/videos.json"
UA = {"User-Agent": ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                     "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"),
      "Accept-Language": "ru,en;q=0.9"}
WANT = 2

def search(query: str) -> list[dict]:
    url = "https://www.youtube.com/results?search_query=" + requests.utils.quote(query)
    try:
        h = requests.get(url, headers=UA, timeout=25).text
    except Exception:
        return []
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", h, re.S)
    if not m:
        return []
    try:
        data = json.loads(m.group(1))
    except Exception:
        return []

    out = []
    def walk(node):
        if isinstance(node, dict):
            if "videoRenderer" in node:
                v = node["videoRenderer"]
                title = "".join(r.get("text", "") for r in v.get("title", {}).get("runs", []))
                ch = "".join(r.get("text", "") for r in v.get("ownerText", {}).get("runs", []))
                length = v.get("lengthText", {}).get("simpleText", "")
                if v.get("videoId"):
                    out.append({"v": v["videoId"], "title": title, "ch": ch, "len": length})
            for val in node.values():
                walk(val)
        elif isinstance(node, list):
            for val in node:
                walk(val)
    walk(data)
    return out

def pick(results: list[dict], brand: str, words: list[str]) -> list[dict]:
    """Оставляем ролики, где заголовок говорит о нужном бренде."""
    brand_key = re.sub(r"[^a-zа-я0-9]", "", brand.lower())
    good, seen = [], set()
    for r in results:
        t = re.sub(r"[^a-zа-я0-9 ]", "", r["title"].lower())
        flat = t.replace(" ", "")
        if brand_key and brand_key not in flat:
            continue
        if r["v"] in seen:
            continue
        # шортсы без длительности пропускаем: у них часто нет обзора по существу
        if not r.get("len"):
            continue
        hits = sum(1 for w in words if w in t)
        if not hits:                    # бренд совпал, а товар — нет: это не обзор нашей позиции
            continue
        seen.add(r["v"])
        good.append((hits, r))
    good.sort(key=lambda x: -x[0])
    return [r for _, r in good[:WANT]]

def handle(p: dict) -> tuple[int, list[dict]]:
    latin = re.findall(r"[A-Za-z][A-Za-z0-9\-]{2,}", p["name"])[:5]
    words = [w.lower() for w in latin]
    query = f'{p["brand"]} {" ".join(latin)} обзор'
    vids = pick(search(query), p["brand"], words)
    if not vids:
        vids = pick(search(f'{p["brand"]} {" ".join(latin)} review'), p["brand"], words)
    time.sleep(0.4)
    return p["id"], vids

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int)
    ap.add_argument("--workers", type=int, default=6)
    a = ap.parse_args()

    products = json.loads(DATA.read_text(encoding="utf-8"))["products"]
    done = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    todo = [p for p in products if str(p["id"]) not in done]
    if a.limit:
        todo = todo[:a.limit]

    found = 0
    with ThreadPoolExecutor(max_workers=a.workers) as ex:
        for i, (pid, vids) in enumerate(ex.map(handle, todo), 1):
            if vids:
                done[str(pid)] = vids
                found += 1
            if i % 20 == 0 or i == len(todo):
                OUT.write_text(json.dumps(done, ensure_ascii=False, indent=1), encoding="utf-8")
                print(f"[{i}/{len(todo)}] с видео: {found}", flush=True)

    OUT.write_text(json.dumps(done, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"✅ видео найдено для {len(done)} товаров из {len(products)}")

if __name__ == "__main__":
    main()

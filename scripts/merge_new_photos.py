#!/usr/bin/env python3
"""
Вливает результат fetch_new_photos.py (scripts/photos_new.*.json) в products.json.
Кадры сортирует по сходству с превью из прайса (цветовая гистограмма): самый похожий — обложка.
Собирает контактные листы /tmp/new_sheet_N.jpg: слева превью из прайса, справа обложка — смотреть глазами.

  python scripts/merge_new_photos.py
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src/data/products.json"
PHOTOS, IMG = ROOT / "public/photos", ROOT / "public/img"


def hist(path: Path) -> list[float]:
    im = Image.open(path).convert("RGB").resize((64, 64))
    h = im.quantize(colors=64, method=Image.Quantize.FASTOCTREE, palette=None).histogram()[:64]
    # своя палитра у каждого кадра несравнима — считаем по грубой сетке RGB 4×4×4
    h = [0] * 64
    for r, g, b in im.getdata():
        h[(r >> 6) * 16 + (g >> 6) * 4 + (b >> 6)] += 1
    return [v / 4096 for v in h]


def sim(a: list[float], b: list[float]) -> float:
    return sum(min(x, y) for x, y in zip(a, b))


def main() -> None:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    found: dict[str, list[str]] = {}
    for f in sorted((ROOT / "scripts").glob("photos_new.*.json")):
        found.update(json.loads(f.read_text(encoding="utf-8")))

    rows = []
    for p in data["products"]:
        if p.get("photos"):
            continue
        shots = [s for s in found.get(f'{p["brand"]}|{p["name"]}', []) if (PHOTOS / s).exists()]
        if not shots:
            continue
        score = {s: 0.0 for s in shots}
        if p.get("img") and (IMG / p["img"]).exists():
            ref = hist(IMG / p["img"])
            score = {s: sim(ref, hist(PHOTOS / s)) for s in shots}
            shots.sort(key=lambda s: -score[s])
        p["photos"] = shots
        rows.append((p, score[shots[0]]))

    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    left = [p for p in data["products"] if not p.get("photos")]
    print(f"✅ фото получили {len(rows)} позиций, без крупных фото осталось {len(left)}")
    for p in left:
        print("  —", p["id"], p["brand"], p["name"][:60])

    # контактные листы: по одной строке на название, сначала самые сомнительные
    uniq, seen = [], set()
    for p, s in sorted(rows, key=lambda r: r[1]):
        if p["photos"][0] not in seen:
            seen.add(p["photos"][0]); uniq.append((p, s))
    cell, cols, per = 150, 6, 48
    for n in range(0, len(uniq), per):
        chunk = uniq[n:n + per]
        sheet = Image.new("RGB", (cols * (cell * 2 + 10), -(-len(chunk) // cols) * (cell + 22)), "white")
        d = ImageDraw.Draw(sheet)
        for i, (p, s) in enumerate(chunk):
            x, y = (i % cols) * (cell * 2 + 10), (i // cols) * (cell + 22)
            for k, path in enumerate([IMG / (p.get("img") or "-"), PHOTOS / p["photos"][0]]):
                if path.exists():
                    im = Image.open(path).convert("RGB"); im.thumbnail((cell, cell))
                    sheet.paste(im, (x + k * cell, y))
            d.text((x + 2, y + cell + 4), f'{p["id"]} {s:.2f} {p["brand"][:10]} {p["name"][-22:]}', fill="black")
        sheet.save(f"/tmp/new_sheet_{n // per + 1}.jpg", quality=85)
    print("листы:", -(-len(uniq) // per))


if __name__ == "__main__":
    main()

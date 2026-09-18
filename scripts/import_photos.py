#!/usr/bin/env python3
"""
Переносит собранные фото (~/Desktop/Каталог KORSHOP/Фото) в сайт:
ужимает до 900 px webp и прописывает пути в products.json.

  python scripts/import_photos.py
"""
import json, re, shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = Path.home() / "Desktop/Каталог KORSHOP/Фото"
OUT = ROOT / "public/photos"
DATA = ROOT / "src/data/products.json"

MAX_SIDE = 900      # для карточки и галереи этого хватает с запасом
QUALITY = 80
PER_ITEM = 3

def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    data = json.loads(DATA.read_text(encoding="utf-8"))
    by_id = {p["id"]: p for p in data["products"]}

    added = 0
    for folder in sorted(SRC.glob("*/*")):
        m = re.match(r"(\d{4})_", folder.name)
        if not m:
            continue
        pid = int(m.group(1))
        product = by_id.get(pid)
        if not product:
            continue

        shots = sorted((folder / "без подписи").glob("*.jpg"))
        # кадры из прайса — те же 146 px, на сайте от них толку нет
        shots = [s for s in shots if min(Image.open(s).size) >= 600][:PER_ITEM]
        names = []
        for i, shot in enumerate(shots, 1):
            im = Image.open(shot).convert("RGB")
            im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
            name = f"{pid:04d}_{i}.webp"
            im.save(OUT / name, "WEBP", quality=QUALITY, method=5)
            names.append(name)
            added += 1
        if names:
            product["photos"] = names

    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    with_photos = sum(1 for p in data["products"] if p.get("photos"))
    size = sum(f.stat().st_size for f in OUT.glob("*.webp")) / 1e6
    print(f"✅ {added} кадров для {with_photos} товаров, {size:.1f} МБ в public/photos")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Сверяет подтянутые из сети фото с эталоном — картинкой из прайса.
Она маленькая (146 px), но это гарантированно тот самый товар,
поэтому по цветовой гистограмме видно, когда в галерею попал чужой продукт.

  python scripts/verify_photos.py            # показать, что отсеется
  python scripts/verify_photos.py --apply    # применить: чистит photos[] и файлы
"""
import argparse, json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PHOTOS = ROOT / "public/photos"
PRICE = ROOT / "public/img"
DATA = ROOT / "src/data/products.json"

THRESHOLD = 0.25     # ниже — на фото точно не этот товар
# остальные кадры не выбрасываем, а сортируем: самый похожий на эталон идёт обложкой
BINS = 6

def hist(im: Image.Image) -> list[float]:
    """Цветовая гистограмма центра кадра, нормированная."""
    im = im.convert("RGB")
    w, h = im.size
    im = im.crop((int(w * .12), int(h * .12), int(w * .88), int(h * .88))).resize((64, 64), Image.LANCZOS)
    buckets = [0.0] * (BINS ** 3)
    for r, g, b in im.getdata():
        # белый фон карточек не несёт информации о товаре
        if r > 235 and g > 235 and b > 235:
            continue
        idx = (r * BINS // 256) * BINS * BINS + (g * BINS // 256) * BINS + (b * BINS // 256)
        buckets[idx] += 1
    total = sum(buckets) or 1
    return [v / total for v in buckets]

def similarity(a: list[float], b: list[float]) -> float:
    """Пересечение гистограмм: 1 — идентичны, 0 — ничего общего."""
    return sum(min(x, y) for x, y in zip(a, b))

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--threshold", type=float, default=THRESHOLD)
    a = ap.parse_args()

    data = json.loads(DATA.read_text(encoding="utf-8"))
    dropped, kept, no_ref = 0, 0, 0

    for p in data["products"]:
        if not p.get("photos"):
            continue
        ref_path = PRICE / (p.get("img") or "")
        if not p.get("img") or not ref_path.exists():
            no_ref += 1
            continue
        ref = hist(Image.open(ref_path))

        good, bad = [], []
        for name in p["photos"]:
            f = PHOTOS / name
            if not f.exists():
                continue
            score = similarity(ref, hist(Image.open(f)))
            (good if score >= a.threshold else bad).append((name, score))

        kept += len(good)
        dropped += len(bad)
        if bad and not a.apply:
            print(f'{p["id"]:04d} {p["full"][:58]}')
            for name, s in bad:
                print(f'      ✗ {name} · сходство {s:.2f}')
        if a.apply:
            good.sort(key=lambda x: -x[1])      # обложкой — самый похожий на эталон
            p["photos"] = [n for n, _ in good]
            if not p["photos"]:
                del p["photos"]
            for name, _ in bad:
                (PHOTOS / name).unlink(missing_ok=True)

    print(f'\nОставляем {kept}, отсеиваем {dropped}, без эталона {no_ref}')
    if a.apply:
        DATA.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        with_photos = sum(1 for p in data["products"] if p.get("photos"))
        print(f'✅ применено · товаров с фото: {with_photos}')

if __name__ == "__main__":
    main()

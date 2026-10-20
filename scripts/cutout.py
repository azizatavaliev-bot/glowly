#!/usr/bin/env python3
"""
Фото товаров без фона для постов Instagram: товар целиком, по центру, без рук, брызг и декора.

1. Из фото товара берём самое «студийное» — то, где края кадра почти белые (рекламные кадры
   с женьшенем, морем и руками так отсеиваются).
2. Если такого нет — ищем снимок на белом фоне в интернете: в заголовке или ссылке должен быть бренд
   и слова из названия, по цвету он должен быть похож на наше фото. Найденное — public/pack/<id>.webp.
3. Вырезаем фон (rembg) → public/cut/<id>.webp, обрезка по товару.

  ~/Documents/CoddingVibe/_workspace/venv-mms/bin/python scripts/cutout.py            # все товары
  ~/Documents/CoddingVibe/_workspace/venv-mms/bin/python scripts/cutout.py 510 528    # выбранные (перезаписать)
"""
import io, json, re, sys, time
from pathlib import Path

import requests
from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parent.parent
PHOTOS, PACK, CUT = ROOT / "public/photos", ROOT / "public/pack", ROOT / "public/cut"
PACK.mkdir(exist_ok=True)
CUT.mkdir(exist_ok=True)
REPORT = ROOT / "scripts/cutout_report.json"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36"}
CLEAN = 0.9          # доля почти белых пикселей по краям кадра, выше — студийный снимок


def clean_score(im: Image.Image) -> float:
    g = im.convert("L")
    w, h = g.size
    b = max(4, int(min(w, h) * .04))
    px = []
    for box in ((0, 0, w, b), (0, h - b, w, h), (0, 0, b, h), (w - b, 0, w, h)):
        px += g.crop(box).tobytes()
    return sum(1 for p in px if p > 232) / len(px)


def hist(im: Image.Image) -> list[float]:
    """Цветовая гистограмма без белого фона — чтобы сравнивать сам товар, а не подложку."""
    im = im.convert("RGB").resize((64, 64))
    h = [0] * 64
    n = 0
    for r, g, b in im.getdata():
        if r > 230 and g > 230 and b > 230:
            continue
        h[(r >> 6) * 16 + (g >> 6) * 4 + (b >> 6)] += 1
        n += 1
    return [v / max(n, 1) for v in h]


def sim(a, b) -> float:
    return sum(min(x, y) for x, y in zip(a, b))


def latin(name: str) -> str:
    return " ".join(re.findall(r"[A-Za-z0-9][A-Za-z0-9\-.%+']*", name))


def web_packshot(p: dict, ref: Image.Image | None) -> Image.Image | None:
    from ddgs import DDGS
    q = f'{p["brand"]} {latin(p["name"])}'
    brand = re.sub(r"[^a-z0-9]", "", p["brand"].lower())
    words = [w for w in re.findall(r"[a-z0-9]+", latin(p["name"]).lower()) if len(w) > 2 and not re.fullmatch(r"\d+(ml|g|ea)?", w)]
    try:
        results = list(DDGS().images(q + " white background", max_results=30))
    except Exception:
        time.sleep(5)
        return None
    ref_h = hist(ref) if ref else None
    best = None
    for r in results:
        text = re.sub(r"[^a-z0-9]", "", f'{r.get("title", "")} {r.get("image", "")}'.lower())
        if brand not in text or sum(1 for w in words if w in text) < min(2, len(words)):
            continue
        try:
            im = Image.open(io.BytesIO(requests.get(r["image"], headers=UA, timeout=15).content))
            im.load()
            if im.mode in ("RGBA", "LA", "P"):
                im = Image.alpha_composite(Image.new("RGBA", im.size, "white"), im.convert("RGBA"))
            im = im.convert("RGB")
        except Exception:
            continue
        if min(im.size) < 500 or not .6 < im.width / im.height < 1.7 or clean_score(im) < .93:
            continue
        s = sim(ref_h, hist(im)) if ref_h else .5
        if s < .35:                      # по цвету не похож на наш товар — скорее всего другой
            continue
        if not best or s > best[0]:
            best = (s, im)
    return best[1] if best else None


def main() -> None:
    products = json.loads((ROOT / "src/data/products.json").read_text(encoding="utf-8"))["products"]
    only = {int(x) for x in sys.argv[1:]}
    report = json.loads(REPORT.read_text()) if REPORT.exists() else {}
    session = new_session("isnet-general-use")
    for p in products:
        pid = p["id"]
        if only and pid not in only or not p.get("photos"):
            continue
        dst = CUT / f"{pid}.webp"
        if dst.exists() and not only:
            continue
        shots = [(clean_score(Image.open(PHOTOS / f)), f) for f in p["photos"]]
        score, name = max(shots)
        src, how = Image.open(PHOTOS / name).convert("RGB"), f"своё фото {name}"
        if score < CLEAN:
            found = web_packshot(p, src)
            if found:
                found.thumbnail((1200, 1200))
                found.save(PACK / f"{pid}.webp", "WEBP", quality=90)
                src, how = found, "из интернета"
            else:
                how = f"своё фото {name}, чистого не нашлось"
        im = remove(src, session=session, post_process_mask=True)
        box = im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox()
        if box:
            pad = 12
            im = im.crop((max(box[0] - pad, 0), max(box[1] - pad, 0), min(box[2] + pad, im.width), min(box[3] + pad, im.height)))
        im.save(dst, "WEBP", quality=88, method=5)
        report[str(pid)] = {"how": how, "clean": round(score, 2)}
        REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=1))
        print(f"{pid} {p['brand']} — {how}", flush=True)
    print("✅ готово")


if __name__ == "__main__":
    main()

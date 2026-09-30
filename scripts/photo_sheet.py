#!/usr/bin/env python3
"""Контактный лист по товарам витрины: все фото каждого товара в ряд — чтобы глазами
поймать чужие кадры. Номер ряда и позиция в ряду печатаются в консоль."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
top = [t["id"] for t in json.loads((ROOT / "src/data/top.json").read_text())]
P = {p["id"]: p for p in json.loads((ROOT / "src/data/products.json").read_text(encoding="utf-8"))["products"]}

rows = [(pid, P[pid]) for pid in top]
W = H = 240
sheet = Image.new("RGB", (W * 3, H * len(rows)), "#e8e4df")
for i, (pid, p) in enumerate(rows):
    shots = p.get("photos", [])
    print(f"ряд {i}: id={pid} {p['brand']} — {p['name'][:46]} · {len(shots)} фото")
    for j, s in enumerate(shots[:3]):
        f = ROOT / "public/photos" / s
        if not f.exists():
            continue
        im = Image.open(f).convert("RGB")
        im.thumbnail((W - 10, H - 10))
        sheet.paste(im, (j * W + (W - im.width) // 2, i * H + (H - im.height) // 2))
sheet.save("/tmp/sheet.jpg", quality=85)
print("лист: /tmp/sheet.jpg")

#!/usr/bin/env python3
"""Crop Concept 1 (The Luminous L) and generate Tauri + web icon sets."""

from __future__ import annotations

import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path("/Users/antonlutsenko/IdeaProjects/Lexora")
SHOWCASE = Path(
    "/Users/antonlutsenko/.gemini/antigravity-ide/brain/"
    "add01ca5-1c10-402a-b148-dc0e82493172/"
    "lexora_branding_showcase_1787315277481.jpg"
)
ICONS_DIR = ROOT / "src-tauri" / "icons"
PUBLIC_DIR = ROOT / "public"

# Column 1 of the 1376×768 showcase: large squircle, inset to drop charcoal padding.
CROP_BOX = (94, 229, 316, 451)  # 222×222

TAURI_SIZES = {
    "32x32.png": (32, 32),
    "128x128.png": (128, 128),
    "128x128@2x.png": (256, 256),
    "icon.png": (512, 512),
    "Square30x30Logo.png": (30, 30),
    "Square44x44Logo.png": (44, 44),
    "Square71x71Logo.png": (71, 71),
    "Square89x89Logo.png": (89, 89),
    "Square107x107Logo.png": (107, 107),
    "Square142x142Logo.png": (142, 142),
    "Square150x150Logo.png": (150, 150),
    "Square284x284Logo.png": (284, 284),
    "Square310x310Logo.png": (310, 310),
    "StoreLogo.png": (50, 50),
}

ICONSET_SIZES = {
    "icon_16x16.png": (16, 16),
    "icon_16x16@2x.png": (32, 32),
    "icon_32x32.png": (32, 32),
    "icon_32x32@2x.png": (64, 64),
    "icon_128x128.png": (128, 128),
    "icon_128x128@2x.png": (256, 256),
    "icon_256x256.png": (256, 256),
    "icon_256x256@2x.png": (512, 512),
    "icon_512x512.png": (512, 512),
    "icon_512x512@2x.png": (1024, 1024),
}

ICO_SIZES = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]


def resize(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    return img.resize(size, Image.Resampling.LANCZOS).convert("RGBA")


def main() -> None:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    ICONS_DIR.mkdir(parents=True, exist_ok=True)

    showcase = Image.open(SHOWCASE).convert("RGBA")
    icon = showcase.crop(CROP_BOX)
    master_1024 = resize(icon, (1024, 1024))

    master_path = PUBLIC_DIR / "lexora_logo_master.png"
    master_1024.save(master_path, "PNG")
    print(f"Saved master logo {master_1024.size} → {master_path}")

    for filename, size in TAURI_SIZES.items():
        resize(icon, size).save(ICONS_DIR / filename, "PNG")

    resize(icon, (512, 512)).save(PUBLIC_DIR / "icon.png", "PNG")
    resize(icon, (64, 64)).save(PUBLIC_DIR / "favicon.png", "PNG")
    resize(icon, (32, 32)).save(PUBLIC_DIR / "favicon.ico", "ICO")

    iconset_dir = Path("/tmp/lexora_luminous_l.iconset")
    iconset_dir.mkdir(exist_ok=True)
    for name, size in ICONSET_SIZES.items():
        resize(icon, size).save(iconset_dir / name, "PNG")

    icns_path = ICONS_DIR / "icon.icns"
    subprocess.run(
        ["iconutil", "-c", "icns", str(iconset_dir), "-o", str(icns_path)],
        check=True,
    )
    print(f"Built {icns_path}")

    master_1024.save(ICONS_DIR / "icon.ico", format="ICO", sizes=ICO_SIZES)
    print("Generated all Tauri and web icons")


if __name__ == "__main__":
    main()

import os
import subprocess
from PIL import Image

SHOWCASE_PATH = "/Users/antonlutsenko/.gemini/antigravity-ide/brain/add01ca5-1c10-402a-b148-dc0e82493172/lexora_branding_showcase_1787315277481.jpg"
ICONS_DIR = "/Users/antonlutsenko/IdeaProjects/Lexora/src-tauri/icons"
PUBLIC_DIR = "/Users/antonlutsenko/IdeaProjects/Lexora/public"

img = Image.open(SHOWCASE_PATH)
width, height = img.size
print(f"Showcase image size: {width}x{height}")

# In the 16:9 showcase board:
# Concept 1 is the first column on the left.
# Let's crop the big squircle icon of Concept 1:
# The 4 columns span horizontally across width.
# Column 1 is roughly x from 0.05 to 0.26, y from 0.20 to 0.60
left = int(width * 0.065)
top = int(height * 0.27)
right = int(width * 0.235)
bottom = int(height * 0.58)

icon_crop = img.crop((left, top, right, bottom))
print(f"Cropped icon size: {icon_crop.size}")

# Square crop
w, h = icon_crop.size
min_dim = min(w, h)
# center square
left_sq = (w - min_dim) // 2
top_sq = (h - min_dim) // 2
square_icon = icon_crop.crop((left_sq, top_sq, left_sq + min_dim, top_sq + min_dim)).convert("RGBA")

# Save master icon in high res
master_path = os.path.join(PUBLIC_DIR, "lexora_logo_master.png")
square_icon.save(master_path, "PNG")
print("Saved master logo to", master_path)

# Generate all Tauri icons
sizes = {
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

for filename, size in sizes.items():
    resized = square_icon.resize(size, Image.Resampling.LANCZOS).convert("RGBA")
    resized.save(os.path.join(ICONS_DIR, filename), "PNG")

# Also public assets
square_icon.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(PUBLIC_DIR, "icon.png"), "PNG")
square_icon.resize((64, 64), Image.Resampling.LANCZOS).save(os.path.join(PUBLIC_DIR, "favicon.png"), "PNG")
square_icon.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(PUBLIC_DIR, "favicon.ico"), "ICO")

# iconset for macOS
iconset_dir = "/tmp/lexora_new.iconset"
os.makedirs(iconset_dir, exist_ok=True)

iconset_sizes = {
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

for name, sz in iconset_sizes.items():
    square_icon.resize(sz, Image.Resampling.LANCZOS).save(os.path.join(iconset_dir, name), "PNG")

try:
    subprocess.run(["iconutil", "-c", "icns", iconset_dir, "-o", os.path.join(ICONS_DIR, "icon.icns")], check=True)
    print("Successfully built icon.icns with Concept 1")
except Exception as e:
    print(f"Error building icns: {e}")

# .ico for Windows
ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
square_icon.save(os.path.join(ICONS_DIR, "icon.ico"), format="ICO", sizes=ico_sizes)
print("Finished building all icons!")

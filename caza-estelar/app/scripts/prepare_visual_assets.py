"""Prepara los recursos de runtime de la PWA a partir de la guía visual 2D.

Uso (desde caza-estelar/app):
    python -I scripts/prepare_visual_assets.py ../../guia-visual-2d public/assets

Solo depende de Pillow. Recorta personajes y caras sobre fondo claro, separa el logo de su
fondo blanco y reescala los escenarios al escenario lógico de 1920x1080. Las guías completas
no se copian al runtime.
"""

import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

STAGE = (1920, 1080)


def dist(a, b):
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) ** 0.5


def cut_out(image, box, tolerance=46, softness=90):
    """Quita el fondo claro conectado con los bordes del recorte y suaviza el contorno."""
    region = image.crop(box).convert("RGB")
    w, h = region.size
    px = region.load()
    bg = px[1, 1]
    transparent = bytearray(w * h)
    queue = deque()
    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h - 1))
    for y in range(h):
        queue.append((0, y))
        queue.append((w - 1, y))
    while queue:
        x, y = queue.popleft()
        i = y * w + x
        if transparent[i] or dist(px[x, y], bg) > tolerance:
            continue
        transparent[i] = 1
        if x > 0: queue.append((x - 1, y))
        if x < w - 1: queue.append((x + 1, y))
        if y > 0: queue.append((x, y - 1))
        if y < h - 1: queue.append((x, y + 1))
    return largest_shape(with_alpha(region, transparent, bg, softness))


def largest_shape(image):
    """Conserva solo la figura conectada más grande (descarta trozos de figuras vecinas)."""
    w, h = image.size
    alpha = image.getchannel("A").load()
    label = [0] * (w * h)
    sizes = {}
    current = 0
    for sy in range(h):
        for sx in range(w):
            if label[sy * w + sx] or alpha[sx, sy] < 40:
                continue
            current += 1
            label[sy * w + sx] = current
            queue = deque([(sx, sy)])
            count = 0
            while queue:
                x, y = queue.popleft()
                count += 1
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h and not label[ny * w + nx] and alpha[nx, ny] >= 40:
                        label[ny * w + nx] = current
                        queue.append((nx, ny))
            sizes[current] = count
    if not sizes:
        return image
    keep = max(sizes, key=sizes.get)
    out = image.copy()
    opx = out.load()
    for y in range(h):
        for x in range(w):
            if label[y * w + x] != keep and alpha[x, y] < 255:
                opx[x, y] = (0, 0, 0, 0)
            elif label[y * w + x] not in (0, keep):
                opx[x, y] = (0, 0, 0, 0)
    return out.crop(out.getbbox())


def sticker(image, width):
    """Contorno blanco alrededor de la figura, como en el logo sobre fondos oscuros."""
    pad = width + 2
    canvas = Image.new("RGBA", (image.width + 2 * pad, image.height + 2 * pad))
    canvas.alpha_composite(image, (pad, pad))
    mask = canvas.getchannel("A").point(lambda a: 255 if a > 60 else 0).filter(ImageFilter.MaxFilter(2 * width + 1))
    mask = mask.filter(ImageFilter.GaussianBlur(0.8))
    outline = Image.new("RGBA", canvas.size, (255, 255, 255, 255))
    outline.putalpha(mask)
    outline.alpha_composite(canvas)
    return outline


def with_alpha(region, transparent, bg, softness):
    w, h = region.size
    px = region.load()
    out = Image.new("RGBA", (w, h))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            i = y * w + x
            c = px[x, y]
            if transparent[i]:
                opx[x, y] = (0, 0, 0, 0)
                continue
            edge = (x > 0 and transparent[i - 1]) or (x < w - 1 and transparent[i + 1]) or \
                   (y > 0 and transparent[i - w]) or (y < h - 1 and transparent[i + w])
            if not edge:
                opx[x, y] = (*c, 255)
                continue
            a = min(1.0, dist(c, bg) / softness)
            if a <= 0.02:
                opx[x, y] = (0, 0, 0, 0)
                continue
            # Separa el color del fondo mezclado en el borde.
            rgb = tuple(max(0, min(255, round((c[k] - (1 - a) * bg[k]) / a))) for k in range(3))
            opx[x, y] = (*rgb, round(a * 255))
    return out.crop(out.getbbox())


def logo_cut_out(image, box):
    """Logo sobre blanco: quita el fondo y los huecos de las letras, conserva las juntas de la "A"."""
    region = image.crop(box).convert("RGB")
    w, h = region.size
    px = region.load()
    white = (255, 255, 255)
    is_white = lambda c: dist(c, white) < 60
    transparent = bytearray(w * h)
    seen = bytearray(w * h)

    def classify(c):
        r, g, b = c
        if b > 200 and r < 150: return "blue"
        if r > 200 and b > 200 and g < 190: return "pink"
        if r > 200 and g > 180 and b < 160: return "yellow"
        if r < 60 and g < 80 and b < 120: return "navy"
        return None

    for sy in range(h):
        for sx in range(w):
            if seen[sy * w + sx] or not is_white(px[sx, sy]):
                continue
            pixels, touches, border = [], set(), False
            queue = deque([(sx, sy)])
            seen[sy * w + sx] = 1
            while queue:
                x, y = queue.popleft()
                pixels.append(y * w + x)
                if x in (0, w - 1) or y in (0, h - 1):
                    border = True
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if not (0 <= nx < w and 0 <= ny < h):
                        continue
                    j = ny * w + nx
                    if seen[j]:
                        continue
                    c = px[nx, ny]
                    if is_white(c):
                        seen[j] = 1
                        queue.append((nx, ny))
                    else:
                        # Mira un poco más allá del antialias para reconocer el color vecino.
                        fx, fy = min(w - 1, max(0, nx + 2 * (nx - x))), min(h - 1, max(0, ny + 2 * (ny - y)))
                        kind = classify(px[fx, fy])
                        if kind: touches.add(kind)
            keep = not border and (len(touches) >= 2 or "pink" in touches or "blue" in touches)
            if not keep:
                for i in pixels:
                    transparent[i] = 1
    return with_alpha(region, transparent, white, 150)


def fit_height(image, height):
    w, h = image.size
    return image.resize((round(w * height / h), height), Image.LANCZOS)


def save_png(image, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)
    print(f"{path}  {image.size}  {path.stat().st_size // 1024} KB")


def save_jpg(image, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").resize(STAGE, Image.LANCZOS).save(path, quality=84, optimize=True, progressive=True)
    print(f"{path}  {STAGE}  {path.stat().st_size // 1024} KB")


def app_icon(isotipo, size, padding):
    icon = Image.new("RGBA", (size, size), (7, 37, 86, 255))
    mark = isotipo.copy()
    mark.thumbnail((size - 2 * padding, size - 2 * padding), Image.LANCZOS)
    icon.alpha_composite(mark, ((size - mark.width) // 2, (size - mark.height) // 2))
    return icon


# Poses recortadas (personajes/poses). Todas comparten la escala del dibujo original, así que se
# reducen con un factor fijo por personaje: la altura de pie coincide con la del sprite base.
POSES = {"celebrando": "celebrating", "corriendo": "running", "ficha": "holding", "pensando": "thinking", "senalando": "pointing"}
POSE_SCALE = {"stella": 540 / 1374, "luma": 520 / 1448}


def prepare_poses(folder, out):
    for source in sorted(folder.glob("*.png")):
        who, rest = source.stem.split("-", 1)
        pose = POSES[rest.split("-")[0]]
        image = Image.open(source).convert("RGBA")
        image = image.crop(image.getbbox())
        size = (round(image.width * POSE_SCALE[who]), round(image.height * POSE_SCALE[who]))
        target = out / f"characters/poses/{who}-{pose}.webp"
        target.parent.mkdir(parents=True, exist_ok=True)
        image.resize(size, Image.LANCZOS).save(target, quality=90, method=6)
        print(f"{target}  {size}  {target.stat().st_size // 1024} KB")


def main(guide, out):
    open_ = lambda rel: Image.open(guide / rel).convert("RGB")

    scenes = {
        "escenarios/observatory-login-stella-luma-v3-2d.webp": "images/bg-observatory.jpg",
        "escenarios/explorax-constellation-stella-luma-v2-2d.png": "images/bg-terrace.jpg",
        "escenarios/level-concept-constellation-celebration-v2-2d.png": "images/bg-celebration.jpg",
        "escenarios/level-observatory-room-v1-2d.webp": "images/bg-level.jpg",
        "historia/comic-intro-v1.webp": "images/comic-intro.jpg",
    }
    for source, target in scenes.items():
        save_jpg(open_(source), out / target)

    presentation = open_("personajes/stella-luma-presentation-v2-2d.png")
    stella_sheet = open_("personajes/stella-model-sheet-v2-2d.png")
    save_png(fit_height(cut_out(stella_sheet, (30, 60, 385, 610)), 640), out / "characters/stella.png")
    save_png(fit_height(cut_out(presentation, (808, 150, 1200, 716)), 640), out / "characters/luma.png")

    faces = ["happy", "joy", "surprised", "sad"]
    for name, x in zip(faces, (52, 372, 680, 982)):
        save_png(fit_height(cut_out(stella_sheet, (x, 625, x + 300, 895)), 220), out / f"characters/stella-{name}.png")
    luma_sheet = open_("personajes/luma-full-moon-model-sheet-v2-2d.png")
    for name, x in zip(faces, (52, 380, 692, 1002)):
        save_png(fit_height(cut_out(luma_sheet, (x, 600, x + 300, 895)), 220), out / f"characters/luma-{name}.png")

    logo = open_("marca/aprendo-logica-logo-v2-2d.png")
    logotype = sticker(logo_cut_out(logo, (110, 55, 1360, 520)), 7)
    save_png(fit_height(logotype, 300), out / "branding/logo.png")
    isotipo = sticker(logo_cut_out(logo, (240, 595, 790, 1050)), 7)
    save_png(fit_height(isotipo, 256), out / "branding/isotipo.png")

    if (guide / "personajes/poses").is_dir():
        prepare_poses(guide / "personajes/poses", out)

    icons = out.parent / "icons"
    save_png(app_icon(isotipo, 192, 26), icons / "icon-192.png")
    save_png(app_icon(isotipo, 512, 70), icons / "icon-512.png")
    save_png(app_icon(isotipo, 512, 112), icons / "icon-maskable-512.png")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(Path(sys.argv[1]), Path(sys.argv[2]))

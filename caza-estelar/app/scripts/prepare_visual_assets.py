"""Prepara los recursos de runtime de la PWA a partir de la guía visual 2D.

Uso (desde caza-estelar/app):
    python -I scripts/prepare_visual_assets.py ../../guia-visual-2d public/assets
    python -I scripts/prepare_visual_assets.py ../../guia-visual-2d public/assets clasificacion

Con `clasificacion` solo se preparan los recursos del kit de CLASIFICACIÓN (fondos, piezas, zonas
y tarjetas), leídos directamente de `assets/assets-y-fondos-clasificacion-v1.zip`, y las poses de
`personajes/poses-clasificacion-v1.zip`.

Solo depende de Pillow. Recorta personajes y caras sobre fondo claro, separa el logo de su
fondo blanco y reescala los escenarios al escenario lógico de 1920x1080. Las guías completas
no se copian al runtime.
"""

import io
import sys
import zipfile
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


# Poses recortadas (personajes/poses). Se reducen con un factor por personaje y luego se igualan
# por el tamaño de la cabeza (ver prepare_poses).
POSES = {
    "celebrando": "celebrating",
    "corriendo": "running",
    "ficha": "holding",
    "pensando": "thinking",
    "senalando": "pointing",
    # Segunda tanda (entregables/assets-stella-luma-nuevas-poses-sin-contorno-v2.zip).
    "aplaudiendo": "clapping",
    "ordenando": "arranging",
    "preguntando": "asking",
    "observando": "observing",
    "presentando": "presenting",
    "saludando": "waving",
}
POSE_SCALE = {"stella": 540 / 1374, "luma": 520 / 1448}
# Tamaño de la cabeza (px de salida) al que se lleva cada pose, para que no cambie de tamaño.
HEAD_SIZE = {"stella": 278, "luma": 230}
# Medición manual donde el brazo toca la cabeza y engaña a la automática.
HEAD_OVERRIDE = {"stella-celebrating": 264, "stella-thinking": 286}


def _alpha_runs(image):
    alpha = image.getchannel("A").point(lambda v: 255 if v > 128 else 0)
    width, height = alpha.size
    px = alpha.load()
    return [{x for x in range(width) if px[x, y]} for y in range(height)], height


def _run_through(row, x):
    if x not in row:
        return None
    left = right = x
    while left - 1 in row:
        left -= 1
    while right + 1 in row:
        right += 1
    return left, right


def measure_head(image, who):
    """Ancho de la cabeza y su centro horizontal, siguiendo la silueta desde la punta superior.

    Luma: la cabeza es un círculo; el radio sale del arco superior (r = (w² + d²) / 2d).
    Stella: la cabeza es una estrella; su ancho es el de las puntas laterales (primer máximo).
    """
    rows, height = _alpha_runs(image)
    top = next(y for y in range(height) if rows[y])
    xs = [x for y in range(top, top + 4) for x in rows[y]]
    center = round(sum(xs) / len(xs))
    profile = []
    for y in range(top, top + int(height * 0.7)):
        run = _run_through(rows[y], center)
        if not run:
            break
        profile.append(run)
        center = (run[0] + run[1]) // 2
    if who == "luma":
        estimates = sorted(((((r - l) / 2) ** 2 + d * d) / (2 * d)) for d, (l, r) in ((d, profile[d]) for d in range(12, 70, 4)))
        left, right = profile[20]
        return 2 * estimates[len(estimates) // 2], (left + right) / 2
    widths = [r - l for l, r in profile]
    best = 0
    for i, width in enumerate(widths):
        if width > widths[best]:
            best = i
        if i > best + 6 and width < widths[best] * 0.8:
            break
    left, right = profile[best]
    return widths[best], (left + right) / 2


BRIDGE_POSES = {
    "stella-cruce/stella-01-preparada.png": "ready",
    "stella-cruce/stella-02-paso-izquierdo.png": "step-left",
    "stella-cruce/stella-03-paso-derecho.png": "step-right",
    "stella-cruce/stella-04-equilibrio.png": "balance",
    "stella-cruce/stella-05-salto.png": "jump",
    "stella-cruce/stella-06-llegada.png": "arrive",
    "luma-apoyo/luma-01-ofrece-pieza.png": "offer",
    "luma-apoyo/luma-02-da-pista.png": "hint",
    "luma-apoyo/luma-03-celebra.png": "cheer",
}


def prepare_poses(folder, out):
    """Todas las poses de un personaje salen en el mismo lienzo: misma escala de cabeza, cabeza
    centrada en horizontal y pies sobre el borde inferior. Así, al cambiar de pose, el personaje
    no cambia de tamaño ni se desplaza (y el reflejo horizontal gira alrededor de la cabeza)."""
    placed = {}
    sources = []
    for source in sorted(folder.glob("*.png")):
        who, rest = source.stem.split("-", 1)
        sources.append((source, who, POSES[rest.split("-")[0]]))
    # Poses del puente de PATRONES (entregables/personajes-patrones-puente-v1.zip).
    bridge = folder.parent / "poses-patrones-puente"
    for relative, pose in BRIDGE_POSES.items():
        if (bridge / relative).is_file():
            sources.append((bridge / relative, relative.split("/")[-1].split("-")[0], pose))
    for source, who, pose in sources:
        image = Image.open(source).convert("RGBA")
        # Recorte por la silueta visible: los píxeles casi transparentes no cuentan (así los pies
        # quedan sobre el borde inferior).
        image = image.crop(image.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox())
        base = POSE_SCALE[who]
        preview = image.resize((round(image.width * base), round(image.height * base)), Image.LANCZOS)
        head, center = measure_head(preview, who)
        head = HEAD_OVERRIDE.get(f"{who}-{pose}", head)
        factor = HEAD_SIZE[who] / head
        sized = image.resize((round(image.width * base * factor), round(image.height * base * factor)), Image.LANCZOS)
        placed.setdefault(who, []).append((pose, sized, center * factor))

    for who, poses in placed.items():
        half = max(max(cx, sized.width - cx) for _, sized, cx in poses)
        canvas_size = (round(2 * half) + 4, max(sized.height for _, sized, _ in poses) + 2)
        for pose, sized, cx in poses:
            canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
            canvas.alpha_composite(sized, (round(canvas_size[0] / 2 - cx), canvas_size[1] - sized.height))
            target = out / f"characters/poses/{who}-{pose}.webp"
            target.parent.mkdir(parents=True, exist_ok=True)
            canvas.save(target, quality=90, method=6)
            print(f"{target}  {canvas_size}  {target.stat().st_size // 1024} KB")


# Baldosas del puente de PATRONES: exactamente las de la guía 2D
# (`assets/patrones-recuadros-uniformes-v2`), sin recolorear. Comparten lienzo, posición y ángulo,
# así que se recortan con el mismo cuadro y siguen alineadas. La cara superior queda en (156, 108)
# de cada imagen de 320 px.
TILE_WIDTH = 320
TILE_BOX = (448, 143, 1242, 798)
PATTERN_TILES = {
    "recuadro-estrella-amarillo": "tile-star-yellow",
    "recuadro-circulo-celeste": "tile-circle-cyan",
    "recuadro-rombo-morado": "tile-gem-purple",
    "recuadro-incompleto-punteado": "tile-hole",
    # Baldosa lisa que completa el puente hasta la isla, después del patrón.
    "recuadro-base-gris": "tile-base",
}


def prepare_pattern_tiles(folder, out):
    target = out / "patterns"
    target.mkdir(parents=True, exist_ok=True)
    for source, name in PATTERN_TILES.items():
        image = Image.open(folder / f"{source}.png").convert("RGBA").crop(TILE_BOX)
        image = image.resize((TILE_WIDTH, round(image.height * TILE_WIDTH / image.width)), Image.LANCZOS)
        image.save(target / f"{name}.webp", quality=90, method=6)
    print(f"{target}: baldosas de patrones")


# Kit de CLASIFICACIÓN (guía 2D `assets/assets-y-fondos-clasificacion-v1.zip`).
SORTING_KIT = "assets/assets-y-fondos-clasificacion-v1.zip"
SORTING_BACKGROUND = "fondos/fondo-clasificacion-plataforma-v1.webp"
# Zonas y tarjetas del kit sin texto: nombre de origen -> (nombre en runtime, ancho). CUMPLE/NO CUMPLE y
# los selectores COLOR/FORMA/TAMAÑO traen el texto en español dentro de la imagen: la app los dibuja.
# Los contenedores y las fichas salen de `SORTING_ART` (versión 2, 2026-10-15).
SORTING_ZONES = {
    "zonas/zona-forma-vacia": ("card-shape", 380),
    "zonas/zona-grupo-vacia": ("card-group", 380),
}
SORT_PIECE_SIZE = 220
# Contenedores y fichas versión 2 (elegidos por el responsable el 2026-10-15), con transparencia:
# tres contenedores en fila y una cuadrícula de fichas (filas: amarillo, celeste, morado; columnas:
# círculo, triángulo, cuadrado, estrella).
SORTING_ART = "assets/clasificacion-v2"
SORT_ART_COLORS = ["yellow", "cyan", "purple"]
SORT_ART_SHAPES = ["circle", "triangle", "square", "star"]


def _alpha_runs_1d(mask, axis):
    """Tramos de columnas (axis=0) o filas (axis=1) con algo opaco."""
    w, h = mask.size
    hits = [i for i in range(w if axis == 0 else h) if mask.crop((i, 0, i + 1, h) if axis == 0 else (0, i, w, i + 1)).getbbox()]
    runs = []
    for i in hits:
        if runs and i == runs[-1][1] + 1:
            runs[-1][1] = i
        else:
            runs.append([i, i])
    return runs


def prepare_sorting_art(folder, out):
    target = out / "sorting"
    bins = Image.open(folder / "contenedores-v2.webp").convert("RGBA")
    solid = bins.getchannel("A").point(lambda v: 255 if v > 60 else 0)
    for color, (left, right) in zip(SORT_ART_COLORS, _alpha_runs_1d(solid, 0)):
        cell = bins.crop((max(0, left - 20), 0, min(bins.width, right + 21), bins.height))
        cell = cell.crop(cell.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox())
        cell.resize((380, round(cell.height * 380 / cell.width)), Image.LANCZOS).save(target / f"bin-{color}.webp", quality=90, method=6)
    pieces = Image.open(folder / "fichas-v2.webp").convert("RGBA")
    solid = pieces.getchannel("A").point(lambda v: 255 if v > 60 else 0)
    columns, rows = _alpha_runs_1d(solid, 0), _alpha_runs_1d(solid, 1)
    # Una sola escala para todas: la celda más grande ocupa 200 de los 220 px del lienzo.
    largest = max(max(r - l for l, r in columns), max(b - t for t, b in rows)) + 1
    scale = 200 / largest
    for color, (top, bottom) in zip(SORT_ART_COLORS, rows):
        for shape, (left, right) in zip(SORT_ART_SHAPES, columns):
            cell = pieces.crop((left, top, right + 1, bottom + 1))
            cell = cell.resize((round(cell.width * scale), round(cell.height * scale)), Image.LANCZOS)
            canvas = Image.new("RGBA", (SORT_PIECE_SIZE, SORT_PIECE_SIZE), (0, 0, 0, 0))
            canvas.alpha_composite(cell, ((SORT_PIECE_SIZE - cell.width) // 2, (SORT_PIECE_SIZE - cell.height) // 2))
            canvas.save(target / f"piece-{shape}-{color}.webp", quality=90, method=6)
    print(f"{target}: contenedores y fichas v2")


def prepare_sorting_kit(zip_path, out):
    kit = zipfile.ZipFile(zip_path)
    names = {Path(name).stem: name for name in kit.namelist() if name.endswith(".png")}
    by_rel = {"/".join(Path(name).parts[-2:])[:-4]: name for name in kit.namelist() if name.endswith(".png")}
    read = lambda name: Image.open(io.BytesIO(kit.read(name))).convert("RGBA")
    # Fondo de los niveles: la plataforma central entre islas que eligió el responsable (2026-10-15),
    # guardada en `fondos/`; los fondos del kit no tienen plataforma.
    platform = zip_path.parent.parent / SORTING_BACKGROUND
    if platform.is_file():
        save_jpg(Image.open(platform), out / "images/bg-sorting.jpg")
    target = out / "sorting"
    target.mkdir(parents=True, exist_ok=True)
    for source, (name, width) in SORTING_ZONES.items():
        matches = [name for rel, name in by_rel.items() if rel == source or rel.startswith(source)]
        image = read(matches[0])
        image = image.crop(image.getbbox())
        image.resize((width, round(image.height * width / image.width)), Image.LANCZOS).save(target / f"{name}.webp", quality=90, method=6)
    print(f"{target}: zonas y tarjetas de clasificación")
    art = zip_path.parent / "clasificacion-v2"
    if art.is_dir():
        prepare_sorting_art(art, out)


# Poses de CLASIFICACIÓN (guía 2D `personajes/poses-clasificacion-v1.zip`): una por nivel y personaje.
SORTING_POSES = "personajes/poses-clasificacion-v1.zip"
SORTING_POSE_NAMES = {
    "01-iguales": "sort-type",
    "02-por-color": "sort-color",
    "03-por-forma": "sort-shape",
    "04-por-tamano": "sort-size",
    "05-dos-reglas": "sort-rule",
    "06-crear-grupos": "sort-discover",
}
# Ancho de cabeza medido a ojo donde la pelota o las tarjetas junto a la cabeza engañan la
# medición automática (px de la vista previa a `POSE_SCALE`). En "04-por-tamano" Stella sostiene una
# estrella gigante: se deja la medición automática, que la deja más pequeña, como en el diseño.
SORTING_POSES_SKIPPED = {"06-crear-grupos-stella"}
# Poses corregidas que reemplazan a las del zip (mismo nombre, en .webp).
SORTING_POSES_FIXED = "poses-clasificacion-ajustes"
SORTING_HEAD_OVERRIDE = {"luma-03-por-forma": 232, "luma-05-dos-reglas": 242, "stella-01-iguales": 270}


def prepare_sorting_poses(zip_path, out):
    """Poses de clasificación con la misma escala de cabeza que las demás, en el mismo lienzo de cada
    personaje (cabeza centrada y pies abajo). Si una pose no cabe, se achica hasta caber."""
    kit = zipfile.ZipFile(zip_path)
    for name in sorted(kit.namelist()):
        if not name.endswith(".png"):
            continue
        stem = Path(name).stem
        # Stella sentada con los grupos deja sus figuras flotando sobre la isla: no se usa.
        if stem in SORTING_POSES_SKIPPED:
            continue
        level, who = stem.rsplit("-", 1)
        canvas_size = Image.open(out / f"characters/poses/{who}-pointing.webp").size
        # Una pose corregida en `poses-clasificacion-ajustes/` reemplaza a la del zip.
        fixed = zip_path.parent / SORTING_POSES_FIXED / f"{stem}.webp"
        image = Image.open(fixed if fixed.is_file() else io.BytesIO(kit.read(name))).convert("RGBA")
        image = image.crop(image.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox())
        base = POSE_SCALE[who]
        preview = image.resize((round(image.width * base), round(image.height * base)), Image.LANCZOS)
        head, center = measure_head(preview, who)
        head = SORTING_HEAD_OVERRIDE.get(f"{who}-{level}", head)
        factor = base * HEAD_SIZE[who] / head
        center = center / base
        # Achica si se sale del lienzo: por arriba, o por un lado (la cabeza va al centro).
        half = canvas_size[0] / 2 - 2
        factor = min(factor, (canvas_size[1] - 2) / image.height, half / center, half / (image.width - center))
        sized = image.resize((round(image.width * factor), round(image.height * factor)), Image.LANCZOS)
        canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
        canvas.alpha_composite(sized, (round(canvas_size[0] / 2 - center * factor), canvas_size[1] - sized.height))
        target = out / f"characters/poses/{who}-{SORTING_POSE_NAMES[level]}.webp"
        canvas.save(target, quality=90, method=6)
        print(f"{target}  {canvas_size}  {target.stat().st_size // 1024} KB")


def main(guide, out):
    open_ = lambda rel: Image.open(guide / rel).convert("RGB")

    scenes = {
        # Fondo limpio (sin personajes) con la zona derecha libre para la tarjeta de acceso.
        "fondos/fondo-observatorio-login-zona-segura-v2-4k.png": "images/bg-login.jpg",
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
    if (guide / "assets/patrones-recuadros-uniformes-v2").is_dir():
        prepare_pattern_tiles(guide / "assets/patrones-recuadros-uniformes-v2", out)
    if (guide / SORTING_KIT).is_file():
        prepare_sorting_kit(guide / SORTING_KIT, out)
    if (guide / SORTING_POSES).is_file():
        prepare_sorting_poses(guide / SORTING_POSES, out)

    icons = out.parent / "icons"
    save_png(app_icon(isotipo, 192, 26), icons / "icon-192.png")
    save_png(app_icon(isotipo, 512, 70), icons / "icon-512.png")
    save_png(app_icon(isotipo, 512, 112), icons / "icon-maskable-512.png")


if __name__ == "__main__":
    if len(sys.argv) == 4 and sys.argv[3] == "clasificacion":
        prepare_sorting_kit(Path(sys.argv[1]) / SORTING_KIT, Path(sys.argv[2]))
        prepare_sorting_poses(Path(sys.argv[1]) / SORTING_POSES, Path(sys.argv[2]))
    elif len(sys.argv) == 3:
        main(Path(sys.argv[1]), Path(sys.argv[2]))
    else:
        sys.exit(__doc__)

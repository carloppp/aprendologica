from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


OUTPUT = Path(__file__).parent / "assets" / "ui"
WIDTH, HEIGHT = 640, 128


def vertical_gradient(size, top, bottom):
    image = Image.new("RGBA", size)
    pixels = image.load()
    for y in range(size[1]):
        t = y / max(1, size[1] - 1)
        color = tuple(round(top[i] * (1 - t) + bottom[i] * t) for i in range(3)) + (255,)
        for x in range(size[0]):
            pixels[x, y] = color
    return image


def button(filename, face_top, face_bottom, edge, outline, pressed=False):
    canvas = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        (14, 18, 626, 119), radius=42, fill=(0, 8, 34, 125)
    )
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(4)))

    top = 15 if pressed else 8
    face_bottom_y = 108 if pressed else 96
    edge_bottom_y = 113

    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle(
        (9, top + 11, 631, edge_bottom_y), radius=44, fill=edge
    )

    mask = Image.new("L", canvas.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (9, top, 631, face_bottom_y), radius=44, fill=255
    )
    gradient = vertical_gradient(canvas.size, face_top, face_bottom)
    canvas.alpha_composite(Image.composite(gradient, Image.new("RGBA", canvas.size), mask))

    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle(
        (9, top, 631, face_bottom_y), radius=44, outline=outline, width=4
    )
    canvas.save(OUTPUT / filename, optimize=True)


button(
    "button-primary-3d.png",
    (58, 203, 236), (15, 124, 194),
    (8, 67, 135, 255), (132, 235, 252, 255),
)
button(
    "button-primary-3d-down.png",
    (29, 154, 210), (10, 91, 157),
    (5, 53, 111, 255), (87, 201, 235, 255), pressed=True,
)
button(
    "button-secondary-3d.png",
    (67, 75, 143), (31, 38, 91),
    (17, 21, 61, 255), (131, 145, 224, 255),
)

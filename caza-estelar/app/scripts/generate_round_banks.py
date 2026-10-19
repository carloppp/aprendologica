"""Genera los bancos de variantes de CONJUNTOS, CLASIFICACIÓN, RELACIONES y PATRONES en `public/content/catalog.json`.

Uso (desde `app/`):  python scripts/generate_round_banks.py public/content/catalog.json

CONJUNTOS y RELACIONES se reescriben con la estructura de niveles acordada el 2026-10-15:
CONJUNTOS = FORMAR CONJUNTOS, ELEMENTOS Y DIAGRAMAS, ENTRE LLAVES, DESCRIBE EL CONJUNTO, CLASES DE
CONJUNTOS y UNIÓN E INTERSECCIÓN; RELACIONES trae por ahora PERTENECE y SUBCONJUNTOS (antes en
CONJUNTOS). PATRONES = REPETIR, ALTERNAR, COMPLETAR, DETECTAR, DESCUBRIR LA UNIDAD y CREAR.
CLASIFICACIÓN = COLOR, FORMA, TAMAÑO, TIPO, DOS CARACTERÍSTICAS y DESCUBRE LA REGLA, con las piezas
del kit (`assets/assets-y-fondos-clasificacion-v1.zip`).

Cada nivel recibe ROUNDS_PER_DIFFICULTY rondas fáciles (1), medias (2) y difíciles (3), y juega
ROUNDS_PER_PLAY por partida, sorteadas de fácil a difícil por el juego (`gameplay/roundPlan.ts`).
La semilla es fija y propia de cada nivel: volver a ejecutar el script produce el mismo catálogo, y
cambiar un nivel no cambia los bancos de los demás. Las reglas de cada
mecánica replican las de `levelValidator.ts`; `npm test` valida el resultado completo.

Tamaños máximos por mesa (lo que cabe en las pantallas de `screens/mechanics/`):
mesa de ELEMENTOS 6 piezas, conjuntos de 2 a 5 elementos, bandeja de INTERSECCIÓN 6 piezas,
cada conjunto de UNIÓN y DIFERENCIA hasta 4 elementos (UNIÓN hasta 5 distintos).
"""

import json
import random
import sys
from pathlib import Path

SEED = 20261014
ROUNDS_PER_DIFFICULTY = 12
ROUNDS_PER_PLAY = 4

SHAPES = ["star", "moon", "gem", "circle"]
COLORS = ["yellow", "cyan", "purple", "blue", "pink"]

# Español: sustantivo plural y género para concordar el color.
SHAPE_ES = {"star": ("estrellas", "f"), "moon": ("lunas", "f"), "gem": ("gemas", "f"), "circle": ("círculos", "m")}
SHAPE_EN = {"star": "stars", "moon": "moons", "gem": "gems", "circle": "circles"}
# Mismos nombres que la app (`ui/pieces.ts`): cyan se dice "celeste" / "light blue".
COLOR_EN = {"yellow": "yellow", "cyan": "light blue", "purple": "purple", "blue": "blue", "pink": "pink"}
COLOR_ES = {
    "yellow": {"f": "amarillas", "m": "amarillos", "lo": "amarillo"},
    "cyan": {"f": "celestes", "m": "celestes", "lo": "celeste"},
    "purple": {"f": "moradas", "m": "morados", "lo": "morado"},
    "blue": {"f": "azules", "m": "azules", "lo": "azul"},
    "pink": {"f": "rosadas", "m": "rosados", "lo": "rosado"},
}


def piece(shape, color):
    return {"shape": shape, "color": color}


def kind(p):
    return (p["shape"], p["color"])


def all_kinds():
    return [piece(s, c) for s in SHAPES for c in COLORS]


def matches(p, target):
    return all(p[k] == v for k, v in target.items())


def distinct(pieces):
    return len({kind(p) for p in pieces}) == len(pieces)


def contains(group, p):
    return kind(p) in {kind(x) for x in group}


def near(p, q):
    """Dos elementos distintos que comparten forma o color (un distractor parecido)."""
    return kind(p) != kind(q) and (p["shape"] == q["shape"] or p["color"] == q["color"])


def select_prompt(target):
    shape, color = target.get("shape"), target.get("color")
    if shape and color:
        noun, gender = SHAPE_ES[shape]
        article = "las" if gender == "f" else "los"
        return {"es": f"Elige {article} {noun} {COLOR_ES[color][gender]}", "en": f"Pick the {COLOR_EN[color]} {SHAPE_EN[shape]}"}
    if shape:
        noun, gender = SHAPE_ES[shape]
        article = "las" if gender == "f" else "los"
        return {"es": f"Elige {article} {noun}", "en": f"Pick the {SHAPE_EN[shape]}"}
    return {"es": f"Elige lo {COLOR_ES[color]['lo']}", "en": f"Pick the {COLOR_EN[color]} ones"}


# --- ELEMENTOS -------------------------------------------------------------------------------

def select_round(rng, difficulty):
    size = 5 if difficulty == 1 else 6
    if difficulty == 1:
        # Una sola propiedad y las demás piezas la tienen distinta: basta con mirar la forma o el color.
        target = {"shape": rng.choice(SHAPES)} if rng.random() < 0.5 else {"color": rng.choice(COLORS)}
        attribute, value = next(iter(target.items()))
        others = [p for p in all_kinds() if p[attribute] != value]
    elif difficulty == 2:
        target = {"color": rng.choice(COLORS)} if rng.random() < 0.6 else {"shape": rng.choice(SHAPES)}
        others = [p for p in all_kinds() if not matches(p, target)]
    else:
        target = {"shape": rng.choice(SHAPES), "color": rng.choice(COLORS)}
        # Distractores parecidos: misma forma u otro color, o mismo color y otra forma.
        others = [p for p in all_kinds() if not matches(p, target) and near(p, piece(target["shape"], target["color"]))]
    hits_pool = [p for p in all_kinds() if matches(p, target)]
    hits = rng.randint(2, 3) if difficulty < 3 else rng.randint(1, 3)
    chosen = [rng.choice(hits_pool) for _ in range(hits)] + [rng.choice(others) for _ in range(size - hits)]
    rng.shuffle(chosen)
    return {"prompt": select_prompt(target), "pieces": chosen, "target": target}


# --- PERTENENCIA -----------------------------------------------------------------------------

def membership_round(rng, difficulty):
    size = {1: 3, 2: 4, 3: 4}[difficulty]
    members = rng.sample(all_kinds(), size)
    if rng.random() < 0.5:
        candidate = rng.choice(members)
    elif difficulty == 1:
        # Fuera y fácil de ver: una forma que no aparece en el conjunto.
        shapes = {p["shape"] for p in members}
        pool = [p for p in all_kinds() if p["shape"] not in shapes]
        if not pool:
            return None
        candidate = rng.choice(pool)
    else:
        # Fuera pero parecida: comparte forma o color con algún elemento (en 3, con dos de ellos).
        need = 1 if difficulty == 2 else 2
        pool = [p for p in all_kinds() if not contains(members, p) and sum(near(p, m) for m in members) >= need]
        if not pool:
            return None
        candidate = rng.choice(pool)
    return {"set": members, "candidate": candidate}


# --- SUBCONJUNTOS ----------------------------------------------------------------------------

def subset_round(rng, difficulty):
    size, groups_count, group_sizes = {1: (4, 2, (1, 2)), 2: (4, 3, (2, 2)), 3: (5, 3, (2, 3))}[difficulty]
    members = rng.sample(all_kinds(), size)
    good = rng.sample(members, rng.randint(*group_sizes))
    groups = [good]
    outside = [p for p in all_kinds() if not contains(members, p)]
    for _ in range(groups_count - 1):
        length = rng.randint(*group_sizes)
        if difficulty == 1:
            # Intruso evidente: una forma que no está en el conjunto.
            shapes = {p["shape"] for p in members}
            intruders = [p for p in outside if p["shape"] not in shapes] or outside
        else:
            # Intruso parecido a un elemento del conjunto.
            intruders = [p for p in outside if any(near(p, m) for m in members)]
        intruder = rng.choice(intruders)
        rest = rng.sample(members, length - 1) if length > 1 else []
        group = rest + [intruder]
        rng.shuffle(group)
        groups.append(group)
    if len({tuple(sorted(map(kind, g))) for g in groups}) != len(groups):
        return None
    rng.shuffle(groups)
    return {"set": members, "groups": groups}


# --- INTERSECCIÓN ----------------------------------------------------------------------------

def intersection_round(rng, difficulty):
    a = {"color": rng.choice(COLORS)}
    b = {"shape": rng.choice(SHAPES)}
    size = 5 if difficulty == 1 else 6
    both = piece(b["shape"], a["color"])
    only_a = [p for p in all_kinds() if matches(p, a) and not matches(p, b)]
    only_b = [p for p in all_kinds() if matches(p, b) and not matches(p, a)]
    neither = [p for p in all_kinds() if not matches(p, a) and not matches(p, b)]
    hits = {1: rng.randint(1, 2), 2: 2, 3: rng.randint(2, 3)}[difficulty]
    chosen = [both] * hits
    # Fácil: también piezas que no cumplen nada. Difícil: solo piezas que cumplen una de las dos.
    near_count = {1: 2, 2: 3, 3: size - hits}[difficulty]
    for i in range(near_count):
        chosen.append(rng.choice(only_a if i % 2 == 0 else only_b))
    while len(chosen) < size:
        chosen.append(rng.choice(neither))
    rng.shuffle(chosen)
    return {"a": a, "b": b, "pieces": chosen}


# --- UNIÓN y DIFERENCIA ----------------------------------------------------------------------

def two_sets(rng, sizes, overlap, near_misses):
    """A y B con `overlap` elementos comunes; con `near_misses`, B trae elementos parecidos a A."""
    size_a, size_b = sizes
    shared = rng.sample(all_kinds(), overlap)
    pool = [p for p in all_kinds() if not contains(shared, p)]
    a = shared + rng.sample(pool, size_a - overlap)
    left = [p for p in all_kinds() if not contains(a, p)]
    if near_misses:
        similar = [p for p in left if any(near(p, x) for x in a if not contains(shared, x))]
        if len(similar) < size_b - overlap:
            return None
        b = shared + rng.sample(similar, size_b - overlap)
    else:
        b = shared + rng.sample(left, size_b - overlap)
    rng.shuffle(a)
    rng.shuffle(b)
    return {"a": a, "b": b}


def union_round(rng, difficulty):
    if difficulty == 1:
        return two_sets(rng, (2, 2), rng.randint(0, 1), False)
    if difficulty == 2:
        return two_sets(rng, rng.choice([(2, 3), (3, 2)]), 1, False)
    return two_sets(rng, (3, 3), rng.randint(1, 2), True)


def difference_round(rng, difficulty):
    if difficulty == 1:
        return two_sets(rng, (3, 2), 1, False)
    if difficulty == 2:
        return two_sets(rng, rng.choice([(3, 3), (4, 3)]), rng.randint(1, 2), False)
    # La zona común del diagrama es angosta: como mucho 2 piezas en el centro.
    return two_sets(rng, (4, 4), 2, True)


# --- FORMAR CONJUNTOS ------------------------------------------------------------------------

OTHER = {"shape": "color", "color": "shape"}
VALUES = {"shape": SHAPES, "color": COLORS}


def group_round(rng, difficulty):
    """Piezas para repartir en 2 o 3 aros; cada grupo comparte forma o color (`by`)."""
    by = rng.choice(["shape", "color"])
    groups, size = {1: (2, rng.randint(4, 5)), 2: (3, 6), 3: (3, rng.randint(7, 8))}[difficulty]
    values = rng.sample(VALUES[by], groups)
    # Cada grupo tiene al menos 2 piezas; en difícil, el otro atributo se repite entre grupos para despistar.
    counts = [2] * groups
    for _ in range(size - 2 * groups):
        counts[rng.randrange(groups)] += 1
    others = rng.sample(VALUES[OTHER[by]], 2) if difficulty == 3 else VALUES[OTHER[by]]
    chosen = []
    for value, count in zip(values, counts):
        for _ in range(count):
            other = rng.choice(others)
            chosen.append(piece(value, other) if by == "shape" else piece(other, value))
    rng.shuffle(chosen)
    return {"pieces": chosen, "by": by}


# --- ELEMENTOS Y DIAGRAMAS -------------------------------------------------------------------

def diagram_round(rng, difficulty):
    if difficulty == 1:
        # Un solo conjunto: dentro lo que cumple A, fuera lo demás.
        a = {"shape": rng.choice(SHAPES)} if rng.random() < 0.5 else {"color": rng.choice(COLORS)}
        attribute, value = next(iter(a.items()))
        inside = [p for p in all_kinds() if p[attribute] == value]
        outside = [p for p in all_kinds() if p[attribute] != value]
        hits = rng.randint(2, 3)
        chosen = rng.sample(inside, hits) + rng.sample(outside, 5 - hits)
        rng.shuffle(chosen)
        return {"a": a, "b": None, "pieces": chosen}
    a = {"color": rng.choice(COLORS)}
    b = {"shape": rng.choice(SHAPES)}

    def region(p):
        return (matches(p, a), matches(p, b))

    keys = [(True, True), (True, False), (False, True), (False, False)]
    pools = {key: [p for p in all_kinds() if region(p) == key] for key in keys}
    size = 5 if difficulty == 2 else rng.randint(6, 7)
    # Una pieza de cada región como mínimo (el centro solo tiene un elemento posible).
    chosen = [pools[(True, True)][0], rng.choice(pools[(True, False)]), rng.choice(pools[(False, True)]), rng.choice(pools[(False, False)])]
    while len(chosen) < size:
        key = rng.choice([(True, False), (False, True)] if difficulty == 3 else keys)
        chosen.append(rng.choice(pools[key]))
    if not distinct(chosen):
        return None
    rng.shuffle(chosen)
    if rng.random() < 0.5:
        a, b = b, a
    return {"a": a, "b": b, "pieces": chosen}


# --- ENTRE LLAVES ----------------------------------------------------------------------------

def braces_round(rng, difficulty):
    elements, repeats, extra = {1: (rng.randint(2, 3), 0, 1), 2: (rng.randint(3, 4), 1, 1), 3: (rng.randint(4, 5), 2, 2)}[difficulty]
    members = rng.sample(all_kinds(), elements)
    # En el diagrama algunas piezas se repiten; entre llaves se escriben una sola vez.
    shown = members + rng.sample(members, repeats)
    rng.shuffle(shown)
    pool = [p for p in all_kinds() if not contains(members, p)]
    if difficulty == 3:
        pool = [p for p in pool if any(near(p, m) for m in members)]
    return {"set": shown, "extra": rng.sample(pool, extra)}


# --- DESCRIBE EL CONJUNTO --------------------------------------------------------------------

def describe_round(rng, difficulty):
    by = rng.choice(["shape", "color"])
    value = rng.choice(VALUES[by])
    target = {by: value}
    size = {1: 3, 2: rng.randint(3, 4), 3: rng.randint(3, 4)}[difficulty]
    if size > len(VALUES[OTHER[by]]):
        return None
    others = rng.sample(VALUES[OTHER[by]], size)
    members = [piece(value, o) if by == "shape" else piece(o, value) for o in others]
    # Distractores: otra propiedad que cumple solo algún elemento.
    present_other = {OTHER[by]: rng.choice(others)}
    same_kind = {by: rng.choice([v for v in VALUES[by] if v != value])}
    combined = {**target, **present_other}
    distractors = {1: [present_other], 2: [present_other, same_kind], 3: [combined, present_other]}[difficulty]
    options = [target] + distractors
    rng.shuffle(options)
    if sum(all(matches(m, o) for m in members) for o in options) != 1:
        return None
    rng.shuffle(members)
    return {"set": members, "options": options}


# --- CLASES DE CONJUNTOS ---------------------------------------------------------------------

def kind_round(rng, difficulty):
    classes = ["empty", "unit", "finite"] if difficulty == 1 else ["empty", "unit", "finite", "infinite"]
    chosen = rng.choice(classes)
    if chosen == "empty":
        return {"set": [], "infinite": False}
    if chosen == "unit":
        return {"set": rng.sample(all_kinds(), 1), "infinite": False}
    if chosen == "finite":
        size = {1: rng.randint(2, 3), 2: rng.randint(3, 5), 3: rng.randint(5, 6)}[difficulty]
        return {"set": rng.sample(all_kinds(), size), "infinite": False}
    # Infinito: las primeras piezas de una serie que sigue sin fin (en difícil se ven pocas).
    return {"set": rng.sample(all_kinds(), {2: rng.randint(3, 4), 3: 2}[difficulty]), "infinite": True}


# --- UNIÓN E INTERSECCIÓN --------------------------------------------------------------------

def operation_round(rng, difficulty):
    op = rng.choice(["union", "intersection"])
    if op == "union":
        sets = union_round(rng, difficulty)
    elif difficulty == 1:
        sets = two_sets(rng, (3, 3), 1, False)
    elif difficulty == 2:
        sets = two_sets(rng, (3, 3), 2, False)
    else:
        sets = two_sets(rng, (4, 3), rng.randint(1, 2), True)
    return {"op": op, **sets} if sets else None


# --- CLASIFICACIÓN --------------------------------------------------------------------------

SORT_SHAPES = ["circle", "triangle", "square", "star"]
# Colores de las fichas v2 (`guia-visual-2d/assets/clasificacion-v2`), los mismos de los contenedores.
SORT_COLORS = ["yellow", "cyan", "purple"]
SORT_SIZES = ["small", "medium", "large"]
SORT_BIN_COLORS = SORT_COLORS
SORT_VALUES = {"shape": SORT_SHAPES, "color": SORT_COLORS, "size": SORT_SIZES}
TYPE_ITEMS = {
    "fruit": ["apple", "banana", "grapes", "strawberry", "pear"],
    "animal": ["dog", "cat", "fish", "rabbit", "turtle"],
    "school": ["pencil", "book", "scissors", "ruler", "backpack"],
    "vehicle": ["car", "bus", "bike", "plane", "boat"],
}


def sort_piece(shape, color, size="medium"):
    return {"shape": shape, "color": color, "size": size}


def sort_kind(p):
    return (p["shape"], p["color"], p["size"])


def by_attribute_round(rng, by, values, groups, size, mix_sizes):
    """Piezas para repartir por `by` en `groups` grupos (al menos 2 piezas por grupo)."""
    chosen_values = rng.sample(values, groups)
    counts = [2] * groups
    for _ in range(size - 2 * groups):
        counts[rng.randrange(groups)] += 1
    pieces_ = []
    for value, count in zip(chosen_values, counts):
        for _ in range(count):
            p = sort_piece(rng.choice(SORT_SHAPES), rng.choice(SORT_COLORS), rng.choice(SORT_SIZES) if mix_sizes else "medium")
            p[by] = value
            pieces_.append(p)
    rng.shuffle(pieces_)
    return {"by": by, "pieces": pieces_}


def sort_color_round(rng, difficulty):
    # Como el montaje de la guía (`assets-nivel-por-color-v1.zip`): siempre los tres contenedores
    # (los únicos colores con contenedor) y hasta 10 fichas; en difícil cambian también de tamaño.
    size, mix = {1: (6, False), 2: (8, False), 3: (10, True)}[difficulty]
    return by_attribute_round(rng, "color", SORT_BIN_COLORS, 3, size, mix)


def sort_shape_round(rng, difficulty):
    groups, size, mix = {1: (2, rng.randint(4, 5), False), 2: (3, 6, True), 3: (3, rng.randint(7, 8), True)}[difficulty]
    return by_attribute_round(rng, "shape", SORT_SHAPES, groups, size, mix)


def sort_size_round(rng, difficulty):
    if difficulty == 1:
        # Pequeño y grande: la diferencia salta a la vista.
        round_ = by_attribute_round(rng, "size", ["small", "large"], 2, rng.randint(4, 5), True)
    else:
        round_ = by_attribute_round(rng, "size", SORT_SIZES, 3, 6 if difficulty == 2 else rng.randint(7, 8), True)
    if difficulty < 3:
        # Fácil y media: todas de la misma forma, así solo cambia el tamaño.
        shape = rng.choice(SORT_SHAPES)
        for p in round_["pieces"]:
            p["shape"] = shape
    return round_


def sort_type_round(rng, difficulty):
    families, size = {1: (2, 4), 2: (3, 6), 3: (3, rng.randint(7, 8))}[difficulty]
    chosen = rng.sample(sorted(TYPE_ITEMS), families)
    counts = [2] * families
    for _ in range(size - 2 * families):
        counts[rng.randrange(families)] += 1
    items = []
    for family, count in zip(chosen, counts):
        items += rng.sample(TYPE_ITEMS[family], count)
    rng.shuffle(items)
    return {"items": items}


def sort_rule_round(rng, difficulty):
    rule = {"shape": rng.choice(SORT_SHAPES), "color": rng.choice(SORT_COLORS)}
    size = {1: 5, 2: 6, 3: 7}[difficulty]
    hits = rng.randint(1, 2) if difficulty == 1 else rng.randint(2, 3)
    pieces_ = [sort_piece(rule["shape"], rule["color"], rng.choice(SORT_SIZES)) for _ in range(hits)]
    while len(pieces_) < size:
        if difficulty == 1:
            # No cumple ninguna de las dos: se ve rápido.
            p = sort_piece(rng.choice([x for x in SORT_SHAPES if x != rule["shape"]]), rng.choice([x for x in SORT_COLORS if x != rule["color"]]), rng.choice(SORT_SIZES))
        else:
            # Cumple solo una de las dos (en media, a veces ninguna).
            if difficulty == 2 and rng.random() < 0.3:
                p = sort_piece(rng.choice([x for x in SORT_SHAPES if x != rule["shape"]]), rng.choice([x for x in SORT_COLORS if x != rule["color"]]), rng.choice(SORT_SIZES))
            elif rng.random() < 0.5:
                p = sort_piece(rule["shape"], rng.choice([x for x in SORT_COLORS if x != rule["color"]]), rng.choice(SORT_SIZES))
            else:
                p = sort_piece(rng.choice([x for x in SORT_SHAPES if x != rule["shape"]]), rule["color"], rng.choice(SORT_SIZES))
        pieces_.append(p)
    rng.shuffle(pieces_)
    return {"rule": rule, "pieces": pieces_}


def shared_attributes(group):
    return [by for by in ("color", "shape", "size") if len({p[by] for p in group}) == 1]


def sort_discover_round(rng, difficulty):
    """DESCUBRE LA REGLA: solo color o forma; todas las piezas medianas, para que el tamaño no despiste."""
    by = rng.choice(["color", "shape"])
    value = rng.choice(SORT_VALUES[by])
    # Con tres colores, un grupo de una misma forma tiene a lo más 3 piezas distintas (4 si es de un color).
    size, others_count = {1: (3, 2), 2: (3, 2), 3: (4 if by == "color" else 3, rng.randint(1, 3))}[difficulty]
    group = []
    for _ in range(size):
        p = sort_piece(rng.choice(SORT_SHAPES), rng.choice(SORT_COLORS))
        p[by] = value
        group.append(p)
    if len({sort_kind(p) for p in group}) != len(group) or [a for a in shared_attributes(group) if a != "size"] != [by]:
        return None
    others = []
    for _ in range(others_count):
        p = dict(rng.choice(group))
        p[by] = rng.choice([v for v in SORT_VALUES[by] if v != value])
        others.append(p)
    return {"group": group, "others": others}


# --- PATRONES --------------------------------------------------------------------------------

# Baldosas del puente (guía 2D `assets/patrones-recuadros-uniformes-v2`): solo estas tres piezas.
PATTERN_PIECES = [piece("star", "yellow"), piece("circle", "cyan"), piece("gem", "purple")]


def pattern_kinds():
    return list(PATTERN_PIECES)


def letters_to_pieces(rng, letters, mode):
    """Una pieza distinta por letra, de las tres baldosas del puente (`mode` ya no cambia nada)."""
    distinct = sorted(set(letters))
    if len(distinct) > len(PATTERN_PIECES):
        return None
    mapping = dict(zip(distinct, rng.sample(PATTERN_PIECES, len(distinct))))
    return [mapping[letter] for letter in letters]


def extras_for(rng, used, count):
    pool = [p for p in pattern_kinds() if not contains(used, p)]
    return rng.sample(pool, count) if count else []


def copy_round(rng, difficulty):
    size, kinds, mode, extra = {1: (rng.randint(3, 4), 2, "clear", 0), 2: (rng.randint(4, 5), 3, "clear", 0), 3: (rng.randint(5, 6), 3, "near", 1)}[difficulty]
    pieces_ = letters_to_pieces(rng, "ABC"[:kinds], mode)
    if not pieces_:
        return None
    sequence = [rng.choice(pieces_) for _ in range(size)]
    if len({kind(p) for p in sequence}) < 2:
        return None
    free = [p for p in PATTERN_PIECES if not contains(sequence, p)]
    return {"sequence": sequence, "extra": rng.sample(free, min(extra, len(free)))}


def fill_round(rng, letters, length, blanks, mode, extra):
    unit = letters_to_pieces(rng, letters, mode)
    if not unit:
        return None
    free = [p for p in PATTERN_PIECES if not contains(unit, p)]
    return {"unit": unit, "length": length, "blanks": sorted(blanks), "extra": rng.sample(free, min(extra, len(free)))}


def alternate_round(rng, difficulty):
    if difficulty == 1:
        return fill_round(rng, "AB", 6, rng.sample(range(2, 6), 1), "clear", 0)
    if difficulty == 2:
        length = rng.randint(7, 8)
        return fill_round(rng, "AB", length, rng.sample(range(2, length), 2), "clear", 1)
    return fill_round(rng, "AB", 8, rng.sample(range(2, 8), 3), rng.choice(["color", "shape"]), rng.randint(1, 2))


def complete_round(rng, difficulty):
    if difficulty == 1:
        letters = rng.choice(["AAB", "ABC"])
        return fill_round(rng, letters, 6, rng.sample(range(3, 6), 2), "clear", 0)
    if difficulty == 2:
        letters = rng.choice(["AAB", "ABB", "ABC"])
        length = rng.randint(7, 9)
        return fill_round(rng, letters, length, rng.sample(range(3, length), 3), "clear", 1)
    letters = rng.choice(["AABC", "ABBC", "ABCC", "AABB"])
    length = rng.randint(8, 9)
    return fill_round(rng, letters, length, rng.sample(range(4, length), rng.randint(3, 4)), rng.choice(["clear", "near"]), rng.randint(1, 2))


def spot_round(rng, difficulty):
    letters, length, mode = {
        1: ("AB", 6, "clear"),
        2: (rng.choice(["ABB", "AAB", "ABC"]), rng.randint(6, 7), "clear"),
        3: (rng.choice(["AB", "ABC", "AAB"]), rng.randint(7, 8), "near"),
    }[difficulty]
    unit = letters_to_pieces(rng, letters, mode)
    if not unit:
        return None
    correct = [unit[i % len(unit)] for i in range(length)]
    mistakes = []
    for index in rng.sample(range(2, length), 2):
        expected = correct[index]
        # Fácil: una pieza que no está en el patrón (si sobra alguna); si no, otra del patrón fuera de lugar.
        outside = [p for p in PATTERN_PIECES if not contains(unit, p)]
        pool = outside if difficulty == 1 and outside else [p for p in PATTERN_PIECES if kind(p) != kind(expected)]
        mistakes.append({"index": index, "piece": rng.choice(pool)})
    return {"unit": unit, "length": length, "mistakes": mistakes}


def unit_round(rng, difficulty):
    """DESCUBRIR LA UNIDAD: el puente completo repite la unidad (la última vez puede quedar a medias)."""
    letters, length = {
        1: ("AB", 6),
        2: (rng.choice(["ABC", "AAB", "ABB"]), rng.randint(6, 7)),
        3: (rng.choice(["AABB", "AABC", "ABCC", "ABBC"]), 8),
    }[difficulty]
    unit = letters_to_pieces(rng, letters, "clear")
    return {"unit": unit, "length": length} if unit else None


def create_round(rng, difficulty):
    length, size = {1: (4, 2), 2: (6, 3), 3: (8, 3)}[difficulty]
    palette = letters_to_pieces(rng, "ABCD"[:size], "clear" if difficulty < 3 else rng.choice(["clear", "near"]))
    if not palette:
        return None
    return {"length": length, "palette": palette}


GENERATORS = {
    "set_select": select_round,
    "set_membership": membership_round,
    "set_subset": subset_round,
    "set_intersection": intersection_round,
    "set_union": union_round,
    "set_difference": difference_round,
    "set_group": group_round,
    "set_diagram": diagram_round,
    "set_braces": braces_round,
    "set_describe": describe_round,
    "set_kind": kind_round,
    "set_operation": operation_round,
    "sort_type": sort_type_round,
    "sort_rule": sort_rule_round,
    "sort_discover": sort_discover_round,
}

# Generador por nivel de PATRONES (varios niveles comparten la mecánica `pattern_fill`).
LEVEL_GENERATORS = {
    "patrones-repetir": copy_round,
    "patrones-alternar": alternate_round,
    "patrones-unidad": unit_round,
    "clasificacion-color": sort_color_round,
    "clasificacion-forma": sort_shape_round,
    "clasificacion-tamano": sort_size_round,
    "patrones-detectar": spot_round,
    "patrones-completar": complete_round,
    "patrones-crear": create_round,
}


def text(es, en):
    return {"es": es, "en": en}


# De qué trata cada nivel, en una frase (se muestra en el panel antes de jugar).
DESCRIPTIONS = {
    "conjuntos-formar": ("Agrupa objetos que tienen algo en común.", "Group objects that have something in common."),
    "conjuntos-diagramas": ("Reconoce elementos y colócalos en diagramas de Venn.", "Spot elements and place them in Venn diagrams."),
    "conjuntos-llaves": ("Escribe un conjunto nombrando sus elementos entre llaves.", "Write a set by listing its elements in braces."),
    "conjuntos-describe": ("Describe un conjunto con la regla que cumplen sus elementos.", "Describe a set by the rule its elements follow."),
    "conjuntos-clases": ("Descubre si un conjunto es vacío, unitario, finito o infinito.", "Find out if a set is empty, a singleton, finite or infinite."),
    "conjuntos-operaciones": ("Junta conjuntos con la unión y busca lo común con la intersección.", "Join sets with union and find what they share with intersection."),
    "relaciones-pertenece": ("Decide si un elemento está o no en un conjunto.", "Decide whether an element is in a set or not."),
    "relaciones-subconjuntos": ("Reconoce cuándo todo un grupo está dentro de otro.", "Spot when a whole group is inside another."),
    "clasificacion-color": ("Agrupa los objetos que tienen el mismo color.", "Group the objects that have the same color."),
    "clasificacion-forma": ("Separa círculos, triángulos, cuadrados y estrellas.", "Sort circles, triangles, squares and stars."),
    "clasificacion-tamano": ("Diferencia lo pequeño, lo mediano y lo grande.", "Tell small, medium and large apart."),
    "clasificacion-tipo": ("Organiza frutas, animales, útiles y vehículos.", "Sort fruit, animals, school things and vehicles."),
    "clasificacion-dos": ("Encuentra lo que cumple dos condiciones a la vez.", "Find what meets two conditions at once."),
    "clasificacion-regla": ("Observa un grupo y descubre con qué regla se formó.", "Look at a group and find the rule that made it."),
    "patrones-repetir": ("Copia un patrón tal como está en el modelo.", "Copy a pattern just like the model."),
    "patrones-alternar": ("Reconoce patrones que se alternan, como AB o AAB.", "Spot patterns that alternate, like AB or AAB."),
    "patrones-unidad": ("Encuentra la parte que se repite en el patrón.", "Find the part that repeats in the pattern."),
    "patrones-detectar": ("Encuentra el camino que sigue el patrón sin errores.", "Find the path that follows the pattern with no mistakes."),
    "patrones-completar": ("Llena los espacios vacíos del patrón.", "Fill the empty spaces in the pattern."),
    "patrones-crear": ("Inventa tu propio patrón y repítelo.", "Make up your own pattern and repeat it."),
}


def with_description(level):
    """Pone la descripción justo después del título, para que el JSON se lea en orden."""
    es, en = DESCRIPTIONS[level["id"]]
    ordered = {}
    for key, value in level.items():
        if key == "description":
            continue
        ordered[key] = value
        if key == "title":
            ordered["description"] = text(es, en)
    return ordered


def round_level(id_, order, title, instruction, mechanic, success, retry):
    return {
        "id": id_,
        "version": 1,
        "order": order,
        "title": title,
        "instruction": instruction,
        "mechanic": {"type": mechanic, "schemaVersion": 1, "config": {"attempts": 2, "successFeedback": success, "retryFeedback": retry, "rounds": []}},
        "unlock": {"prerequisiteLevelIds": []},
        "completion": {"type": "minimum_score", "value": 60},
        "reward": {"experience": 50, "badgeId": None},
    }


def sets_constellation():
    """CONJUNTOS: concepto, representaciones, clases y operaciones (estructura del 2026-10-15)."""
    return {
        "id": "conjuntos",
        "version": 2,
        "order": 1,
        "area": "logic_and_sets",
        "title": text("Conjuntos", "Sets"),
        "description": text("Forma, representa y combina conjuntos.", "Make, represent and combine sets."),
        "visual": {"coverAssetId": None, "accentColor": "#8CCDFD"},
        "levels": [
            round_level("conjuntos-formar", 1, text("Formar conjuntos", "Make sets"),
                        text("Forma conjuntos con las piezas que se parecen", "Make sets with the pieces that look alike"), "set_group",
                        text("¡Formaste los conjuntos!", "You made the sets!"),
                        text("Cada aro junta piezas con algo en común.", "Each ring holds pieces with something in common.")),
            round_level("conjuntos-diagramas", 2, text("Elementos y diagramas", "Elements and diagrams"),
                        text("Pon cada pieza en su lugar del diagrama", "Put each piece in its place in the diagram"), "set_diagram",
                        text("¡Cada elemento en su lugar!", "Every element in its place!"),
                        text("Mira si cumple A, B o los dos.", "Check if it fits A, B or both.")),
            round_level("conjuntos-llaves", 3, text("Entre llaves", "In braces"),
                        text("Escribe el conjunto A entre llaves", "Write set A in braces"), "set_braces",
                        text("¡Así se escribe un conjunto!", "That is how you write a set!"),
                        text("Cada elemento va una sola vez.", "Each element goes only once.")),
            round_level("conjuntos-describe", 4, text("Describe el conjunto", "Describe the set"),
                        text("¿Cómo se describe el conjunto A?", "How do you describe set A?"), "set_describe",
                        text("¡Esa es su regla!", "That is its rule!"),
                        text("Todos los elementos deben cumplirla.", "Every element must fit it.")),
            round_level("conjuntos-clases", 5, text("Clases de conjuntos", "Kinds of sets"),
                        text("¿Qué clase de conjunto es A?", "What kind of set is A?"), "set_kind",
                        text("¡Lo clasificaste bien!", "You sorted it right!"),
                        text("Cuenta sus elementos.", "Count its elements.")),
            round_level("conjuntos-operaciones", 6, text("Unión e intersección", "Union and intersection"),
                        text("Resuelve la unión o la intersección", "Solve the union or the intersection"), "set_operation",
                        text("¡Operación resuelta!", "Operation solved!"),
                        text("∪ junta todo; ∩ solo lo que está en los dos.", "∪ joins everything; ∩ only what is in both.")),
        ],
    }


def sorting_constellation():
    """CLASIFICACIÓN: observar atributos y formar grupos (estructura del 2026-10-15, kit del 2026-10-15)."""
    return {
        "id": "clasificacion",
        "version": 1,
        "order": 2,
        "area": "logic_and_sets",
        "title": text("Clasificación", "Sorting"),
        "description": text("Observa las características y forma grupos.", "Look at features and make groups."),
        "visual": {"coverAssetId": None, "accentColor": "#FF6B6E"},
        "levels": [
            round_level("clasificacion-color", 1, text("Color", "Color"), text("Agrupa por color", "Group by color"), "sort_groups",
                        text("¡Cada color en su lugar!", "Every color in its place!"), text("Mira solo el color.", "Look only at the color.")),
            round_level("clasificacion-forma", 2, text("Forma", "Shape"), text("Agrupa por forma", "Group by shape"), "sort_groups",
                        text("¡Formas bien separadas!", "Shapes well sorted!"), text("Mira solo la forma.", "Look only at the shape.")),
            round_level("clasificacion-tamano", 3, text("Tamaño", "Size"), text("Agrupa por tamaño", "Group by size"), "sort_groups",
                        text("¡Bien medido!", "Well measured!"), text("Compara qué tan grandes son.", "Compare how big they are.")),
            round_level("clasificacion-tipo", 4, text("Tipo", "Kind"), text("Agrupa por tipo", "Group by kind"), "sort_type",
                        text("¡Cada cosa con su familia!", "Everything with its family!"), text("Piensa qué es cada cosa.", "Think about what each thing is.")),
            round_level("clasificacion-dos", 5, text("Dos características", "Two features"), text("Usa las dos reglas", "Use both rules"), "sort_rule",
                        text("¡Cumpliste las dos reglas!", "You used both rules!"), text("Tiene que cumplir las dos.", "It has to meet both.")),
            round_level("clasificacion-regla", 6, text("Descubre la regla", "Find the rule"), text("¿Con qué regla se formó el grupo?", "Which rule made the group?"), "sort_discover",
                        text("¡Descubriste la regla!", "You found the rule!"), text("¿Qué tienen igual todas?", "What do they all share?")),
        ],
    }


def relations_constellation():
    """RELACIONES: por ahora PERTENECE (1) y SUBCONJUNTOS (3), que antes estaban en CONJUNTOS."""
    return {
        "id": "relaciones",
        "version": 1,
        "order": 3,
        "area": "logic_and_sets",
        "title": text("Relaciones", "Relations"),
        "description": text("Relaciona elementos, conjuntos y cantidades.", "Relate elements, sets and amounts."),
        "visual": {"coverAssetId": None, "accentColor": "#4FE36E"},
        "levels": [
            round_level("relaciones-pertenece", 1, text("Pertenece", "Belongs"),
                        text("¿Pertenece al conjunto?", "Does it belong to the set?"), "set_membership",
                        text("¡Correcto! Revisaste el conjunto.", "Correct! You checked the set."),
                        text("Busca la pieza dentro del conjunto.", "Look for the piece inside the set.")),
            round_level("relaciones-subconjuntos", 3, text("Subconjuntos", "Subsets"),
                        text("Coloca el grupo dentro", "Put the group inside"), "set_subset",
                        text("¡Sí! Todo el grupo está en el conjunto.", "Yes! The whole group is in the set."),
                        text("Cada pieza del grupo debe estar en el conjunto.", "Every piece of the group must be in the set.")),
        ],
    }


def patterns_constellation():
    """Constelación PATRONES (guía 2D `navegacion/patrones-constellation-levels-v1`), con la estructura
    del 2026-10-15: REPETIR, ALTERNAR, COMPLETAR, DETECTAR, DESCUBRIR LA UNIDAD y CREAR."""
    def level(order, slug, title, instruction, mechanic, success, retry):
        return {
            "id": f"patrones-{slug}",
            "version": 1,
            "order": order,
            "title": title,
            "instruction": instruction,
            "mechanic": {"type": mechanic, "schemaVersion": 1, "config": {"attempts": 2, "successFeedback": success, "retryFeedback": retry, "rounds": []}},
            "unlock": {"prerequisiteLevelIds": []},
            "completion": {"type": "minimum_score", "value": 60},
            "reward": {"experience": 50, "badgeId": None},
        }

    return {
        "id": "patrones",
        "version": 1,
        "order": 4,
        "area": "logic_and_sets",
        "title": text("Patrones", "Patterns"),
        "description": text("Repite, continúa y crea patrones para cruzar el puente.", "Repeat, continue and create patterns to cross the bridge."),
        "visual": {"coverAssetId": None, "accentColor": "#B56BF5"},
        "levels": [
            level(1, "repetir", text("Repetir", "Repeat"), text("Copia el patrón del modelo", "Copy the model pattern"), "pattern_copy",
                  text("¡Igualito al modelo!", "Just like the model!"), text("Compara cada baldosa con el modelo.", "Compare each tile with the model.")),
            level(2, "alternar", text("Alternar", "Alternate"), text("Completa el puente alternando", "Complete the bridge by alternating"), "pattern_fill",
                  text("¡Uno y otro, muy bien!", "One and then the other, great!"), text("Fíjate qué va después de cada pieza.", "Look at what comes after each piece.")),
            level(3, "completar", text("Completar", "Complete"), text("Repara todos los huecos del puente", "Fix every gap in the bridge"), "pattern_fill",
                  text("¡Puente reparado!", "Bridge fixed!"), text("Algunas piezas no siguen el patrón.", "Some pieces do not follow the pattern.")),
            level(4, "detectar", text("Detectar", "Detect"), text("Elige el camino que sigue el patrón", "Pick the path that follows the pattern"), "pattern_spot",
                  text("¡Ese camino es el correcto!", "That is the right path!"), text("Revisa cada camino con calma.", "Check each path calmly.")),
            level(5, "unidad", text("Descubrir la unidad", "Find the unit"), text("¿Qué parte se repite en el puente?", "Which part repeats on the bridge?"), "pattern_unit",
                  text("¡Esa es la parte que se repite!", "That is the part that repeats!"), text("Busca dónde vuelve a empezar lo mismo.", "Find where the same thing starts again.")),
            level(6, "crear", text("Crear", "Create"), text("Crea tu patrón y repítelo", "Create your pattern and repeat it"), "pattern_create",
                  text("¡Tu patrón abrió el portal!", "Your pattern opened the portal!"), text("Repite tu grupo de piezas en el mismo orden.", "Repeat your group of pieces in the same order.")),
        ],
    }


def canonical(round_):
    return json.dumps(round_, sort_keys=True, ensure_ascii=False)


def bank(rng, generator):
    rounds, seen = [], set()
    for difficulty in (1, 2, 3):
        made = 0
        for _ in range(5000):
            round_ = generator(rng, difficulty)
            if round_ is None:
                continue
            key = canonical(round_)
            if key in seen:
                continue
            seen.add(key)
            rounds.append({**round_, "difficulty": difficulty})
            made += 1
            if made == ROUNDS_PER_DIFFICULTY:
                break
        # Con pocas piezas (PATRONES usa tres) no siempre hay tantas rondas distintas: se queda con las que hay.
        if made < 2:
            raise SystemExit(f"No se pudieron generar rondas distintas de dificultad {difficulty}")
        if made < ROUNDS_PER_DIFFICULTY:
            print(f"  aviso: solo {made} rondas distintas de dificultad {difficulty}")
    return rounds


def main(path):
    catalog_path = Path(path)
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    rebuilt = {
        "conjuntos": sets_constellation(),
        "clasificacion": sorting_constellation(),
        "relaciones": relations_constellation(),
        "patrones": patterns_constellation(),
    }
    catalog["constellations"] = [it for it in catalog["constellations"] if it["id"] not in rebuilt] + list(rebuilt.values())
    if not any(it["id"] == "patrones" for it in catalog["constellations"]):
        catalog["constellations"].append(patterns_constellation())
    catalog["constellations"].sort(key=lambda it: it["order"])
    for constellation in catalog["constellations"]:
        constellation["levels"] = [with_description(level) if level["id"] in DESCRIPTIONS else level for level in constellation["levels"]]
        for level in constellation["levels"]:
            mechanic = level["mechanic"]
            generator = LEVEL_GENERATORS.get(level["id"]) or GENERATORS.get(mechanic["type"])
            if not generator:
                continue
            config = mechanic["config"]
            config["roundsPerPlay"] = ROUNDS_PER_PLAY
            # Semilla propia del nivel (las semillas de texto son estables entre ejecuciones).
            config["rounds"] = bank(random.Random(f"{SEED}:{level['id']}"), generator)
            print(f"{level['id']}: {len(config['rounds'])} rondas, {ROUNDS_PER_PLAY} por partida")
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])

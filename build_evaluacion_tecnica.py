from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_BREAK
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from pathlib import Path

OUT = Path(r"C:\Users\explorax\Documents\Caza Estelar\Evaluacion_tecnica_Caza_Estelar_TypeScript_7.docx")

NAVY = "17365D"
BLUE = "2E74B5"
CYAN = "1E8298"
INK = "1F2937"
MUTED = "5F6B7A"
LIGHT = "F2F4F7"
PALE_BLUE = "E8EEF5"
PALE_GREEN = "E8F3EC"
PALE_GOLD = "FFF4D6"
PALE_RED = "FDECEC"
WHITE = "FFFFFF"
GREEN = "25633B"
GOLD = "7A5A00"
RED = "9B1C1C"

doc = Document()
sec = doc.sections[0]
sec.page_width = Inches(8.5)
sec.page_height = Inches(11)
sec.top_margin = Inches(0.78)
sec.bottom_margin = Inches(0.72)
sec.left_margin = Inches(0.85)
sec.right_margin = Inches(0.85)
sec.header_distance = Inches(0.35)
sec.footer_distance = Inches(0.35)

styles = doc.styles
normal = styles["Normal"]
normal.font.name = "Arial"
normal._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
normal.font.size = Pt(10.5)
normal.font.color.rgb = RGBColor.from_string(INK)
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.line_spacing = 1.1

for name, size, color, before, after in [
    ("Heading 1", 16, BLUE, 12, 6),
    ("Heading 2", 13, BLUE, 10, 5),
    ("Heading 3", 11.5, NAVY, 7, 3),
]:
    s = styles[name]
    s.font.name = "Arial"
    s._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
    s._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
    s.font.size = Pt(size)
    s.font.bold = True
    s.font.color.rgb = RGBColor.from_string(color)
    s.paragraph_format.space_before = Pt(before)
    s.paragraph_format.space_after = Pt(after)
    s.paragraph_format.keep_with_next = True

def shade(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = tcPr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tcPr.append(shd)
    shd.set(qn("w:fill"), fill)

def set_cell_margins(cell, top=80, start=120, bottom=80, end=120):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = tcPr.first_child_found_in("w:tcMar")
    if tcMar is None:
        tcMar = OxmlElement("w:tcMar")
        tcPr.append(tcMar)
    for m, v in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tcMar.find(qn(f"w:{m}"))
        if node is None:
            node = OxmlElement(f"w:{m}")
            tcMar.append(node)
        node.set(qn("w:w"), str(v))
        node.set(qn("w:type"), "dxa")

def set_repeat_table_header(row):
    trPr = row._tr.get_or_add_trPr()
    tblHeader = OxmlElement("w:tblHeader")
    tblHeader.set(qn("w:val"), "true")
    trPr.append(tblHeader)

def set_table_geometry(table, widths_dxa):
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    table.autofit = False
    tblPr = table._tbl.tblPr
    tblW = tblPr.find(qn("w:tblW"))
    if tblW is None:
        tblW = OxmlElement("w:tblW")
        tblPr.append(tblW)
    tblW.set(qn("w:w"), str(sum(widths_dxa)))
    tblW.set(qn("w:type"), "dxa")
    tblInd = tblPr.find(qn("w:tblInd"))
    if tblInd is None:
        tblInd = OxmlElement("w:tblInd")
        tblPr.append(tblInd)
    tblInd.set(qn("w:w"), "120")
    tblInd.set(qn("w:type"), "dxa")
    grid = table._tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for w in widths_dxa:
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(w))
        grid.append(col)
    for row in table.rows:
        for idx, cell in enumerate(row.cells):
            tcPr = cell._tc.get_or_add_tcPr()
            tcW = tcPr.find(qn("w:tcW"))
            if tcW is None:
                tcW = OxmlElement("w:tcW")
                tcPr.append(tcW)
            tcW.set(qn("w:w"), str(widths_dxa[idx]))
            tcW.set(qn("w:type"), "dxa")
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER

def set_cell_text(cell, text, bold=False, color=INK, size=9.2):
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.0
    r = p.add_run(text)
    r.font.name = "Arial"
    r._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
    r._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.color.rgb = RGBColor.from_string(color)

def add_hyperlink(paragraph, text, url):
    part = paragraph.part
    rid = part.relate_to(url, RT.HYPERLINK, is_external=True)
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), rid)
    run = OxmlElement("w:r")
    rPr = OxmlElement("w:rPr")
    color = OxmlElement("w:color")
    color.set(qn("w:val"), BLUE)
    underline = OxmlElement("w:u")
    underline.set(qn("w:val"), "single")
    rPr.append(color)
    rPr.append(underline)
    run.append(rPr)
    t = OxmlElement("w:t")
    t.text = text
    run.append(t)
    hyperlink.append(run)
    paragraph._p.append(hyperlink)

def add_bullet(text, color=None):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.left_indent = Inches(0.5)
    p.paragraph_format.first_line_indent = Inches(-0.25)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.1
    r = p.add_run(text)
    if color:
        r.font.color.rgb = RGBColor.from_string(color)
    return p

def add_number(text):
    p = doc.add_paragraph(style="List Number")
    p.paragraph_format.left_indent = Inches(0.5)
    p.paragraph_format.first_line_indent = Inches(-0.25)
    p.paragraph_format.space_after = Pt(4)
    return p.add_run(text)

def callout(label, text, fill=PALE_BLUE, accent=BLUE):
    t = doc.add_table(rows=1, cols=1)
    set_table_geometry(t, [9360])
    c = t.cell(0,0)
    shade(c, fill)
    c.text = ""
    p = c.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    a = p.add_run(label + "  ")
    a.bold = True
    a.font.color.rgb = RGBColor.from_string(accent)
    b = p.add_run(text)
    b.font.color.rgb = RGBColor.from_string(INK)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)

def add_page_number(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = paragraph.add_run("Página ")
    fldChar1 = OxmlElement("w:fldChar")
    fldChar1.set(qn("w:fldCharType"), "begin")
    instrText = OxmlElement("w:instrText")
    instrText.set(qn("xml:space"), "preserve")
    instrText.text = " PAGE "
    fldChar2 = OxmlElement("w:fldChar")
    fldChar2.set(qn("w:fldCharType"), "end")
    run._r.append(fldChar1)
    run._r.append(instrText)
    run._r.append(fldChar2)

# Running header/footer
header = sec.header
hp = header.paragraphs[0]
hp.text = "CAZA ESTELAR  |  EVALUACIÓN TÉCNICA"
hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
for r in hp.runs:
    r.font.name = "Arial"; r.font.size = Pt(8); r.font.bold = True
    r.font.color.rgb = RGBColor.from_string(MUTED)
footer = sec.footer
fp = footer.paragraphs[0]
fp.text = "Documento de decisión técnica  •  21 de agosto de 2026"
for r in fp.runs:
    r.font.name = "Arial"; r.font.size = Pt(8); r.font.color.rgb = RGBColor.from_string(MUTED)
add_page_number(footer.add_paragraph())

# Masthead
p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(18)
p.paragraph_format.space_after = Pt(3)
r = p.add_run("EVALUACIÓN TÉCNICA")
r.font.name = "Arial"; r.font.size = Pt(11); r.font.bold = True
r.font.color.rgb = RGBColor.from_string(CYAN)

p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(5)
r = p.add_run("Impacto de TypeScript 7 en Caza Estelar")
r.font.name = "Arial"; r.font.size = Pt(25); r.font.bold = True
r.font.color.rgb = RGBColor.from_string(NAVY)

p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(16)
r = p.add_run("Juego Android, consola administrativa, backend, deuda técnica y seguridad de la información")
r.font.name = "Arial"; r.font.size = Pt(12.5)
r.font.color.rgb = RGBColor.from_string(MUTED)

meta = doc.add_table(rows=4, cols=2)
set_table_geometry(meta, [1800, 7560])
for row, (label, value) in zip(meta.rows, [
    ("Proyecto", "Caza Estelar"),
    ("Fecha", "21 de agosto de 2026"),
    ("Alcance", "Evaluación de la noticia compartida y su posible efecto sobre las entregas"),
    ("Estado", "Determinación técnica para la entrega del día"),
]):
    shade(row.cells[0], PALE_BLUE)
    set_cell_text(row.cells[0], label, True, NAVY, 9.5)
    set_cell_text(row.cells[1], value, False, INK, 9.5)

doc.add_paragraph()
callout("DECISIÓN", "La entrega de hoy no está afectada. Se mantiene Kotlin/Java/libGDX en el juego y se entrega la consola actual como prototipo en JavaScript vainilla. No se recomienda una migración reactiva a TypeScript 7.", PALE_GREEN, GREEN)

doc.add_heading("1. Resumen ejecutivo", level=1)
p = doc.add_paragraph()
p.add_run("La afirmación de que “TypeScript ya no es JavaScript” es imprecisa. ").bold = True
p.add_run("Microsoft migró a Go la implementación del compilador y las herramientas de TypeScript 7; no cambió el lenguaje que escriben las aplicaciones. El código TypeScript continúa siendo parte del ecosistema JavaScript y se transforma para ejecutarse en sus entornos habituales.")

add_bullet("El juego Android no depende de TypeScript y no requiere cambios.")
add_bullet("La consola administrativa actual es un prototipo monolítico en HTML, CSS y JavaScript; la noticia no impide su entrega.")
add_bullet("El backend y la consola productiva aún no existen, por lo que la decisión tecnológica puede tomarse con criterios de arquitectura, equipo y seguridad.")
add_bullet("El riesgo prioritario es la integración entre el catálogo v1 del juego y el modelo funcional v2, no el lenguaje del compilador de TypeScript.")

doc.add_heading("2. Hecho técnico evaluado", level=1)
p = doc.add_paragraph()
p.add_run("El 20 de agosto de 2026 se fusionó el PR #63763 del repositorio oficial de TypeScript. ").bold = True
p.add_run("El cambio trasladó el historial y el código de typescript-go al repositorio principal y ubicó el nuevo módulo Go en el subdirectorio tsc. El propio PR indica que dicho módulo aún no exportaba una API versionada en ese momento.")

p = doc.add_paragraph()
p.add_run("Microsoft había explicado previamente que el objetivo del puerto nativo era reducir tiempos de compilación, acelerar el servicio de lenguaje y disminuir el consumo de memoria. ")
p.add_run("También anticipó una transición entre TypeScript 6 y TypeScript 7 para proyectos que dependan de configuraciones o API heredadas.")

p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(4)
p.add_run("Fuentes oficiales: ").bold = True
add_hyperlink(p, "PR #63763 - Migrate repo to TypeScript 7", "https://github.com/microsoft/TypeScript/pull/63763")
p.add_run("  |  ")
add_hyperlink(p, "A 10x Faster TypeScript", "https://devblogs.microsoft.com/typescript/typescript-native-port/")

doc.add_page_break()
doc.add_heading("3. Estado técnico observado en Caza Estelar", level=1)

rows = [
    ("Juego Android", "Kotlin para contratos, servicios y reglas; Java/libGDX en pantallas existentes.", "Base funcional implementada", "Sin impacto"),
    ("Catálogo", "Contrato v1 activo: constelación → temas → misiones.", "Migración a v2 pendiente", "Impacto alto de integración"),
    ("Consola", "Prototipo HTML/CSS/JavaScript con estado local y acciones simuladas.", "Demostración, no producción", "Sin impacto para hoy"),
    ("Backend", "No existe todavía; los clientes HTTPS permanecen desactivados.", "Pendiente", "Decisión futura"),
    ("Seguridad móvil", "HTTPS, Keystore, AES-GCM, SHA-256, límites de tamaño y cola idempotente.", "Diseño avanzado", "Debe conservarse"),
]
t = doc.add_table(rows=1, cols=4)
set_table_geometry(t, [1650, 3880, 1900, 1930])
headers = ["Componente", "Situación observada", "Madurez", "Efecto"]
for i, h in enumerate(headers):
    shade(t.rows[0].cells[i], NAVY); set_cell_text(t.rows[0].cells[i], h, True, WHITE, 9)
set_repeat_table_header(t.rows[0])
for values in rows:
    cells = t.add_row().cells
    for i, value in enumerate(values):
        set_cell_text(cells[i], value, i == 0, NAVY if i == 0 else INK, 8.7)
    if len(t.rows) % 2 == 1:
        for c in cells: shade(c, LIGHT)
set_table_geometry(t, [1650, 3880, 1900, 1930])

doc.add_heading("4. Determinación por componente", level=1)
doc.add_heading("4.1 Juego Android", level=2)
p = doc.add_paragraph()
p.add_run("Decisión: mantener Kotlin y la convivencia temporal con Java/libGDX. ").bold = True
p.add_run("La base existente ya contiene servicios de contenido, autenticación, progreso, sincronización, validación y medios remotos. Sustituirla por JavaScript generaría una reescritura, elevaría el riesgo de regresión y perdería el aprovechamiento directo de Android Keystore.")

doc.add_heading("4.2 Consola administrativa para la entrega", level=2)
p = doc.add_paragraph()
p.add_run("Decisión: entregar el prototipo actual en JavaScript vainilla, claramente identificado como demostración no productiva. ").bold = True
p.add_run("Es suficiente para validar navegación, edición de niveles, mecánicas, revisión y publicación simulada. No debe presentarse como sistema seguro o persistente.")

doc.add_heading("4.3 Consola administrativa productiva", level=2)
p = doc.add_paragraph()
p.add_run("Decisión: posponer la selección definitiva hasta formalizar el contrato v2. ").bold = True
p.add_run("Para producción, TypeScript es la opción preferida en el frontend por sus tipos, refactorización y soporte de contratos. JavaScript modular sigue siendo viable para un alcance pequeño, pero requiere disciplina adicional de validación y pruebas.")

doc.add_heading("4.4 Backend", level=2)
p = doc.add_paragraph()
p.add_run("Decisión: conservar Kotlin como primera opción. ").bold = True
p.add_run("Un backend Kotlin permite mantener coherencia conceptual con las reglas del juego, aprovechar tipado estático y reducir dispersión tecnológica. El frontend web no necesita usar Kotlin/JS para obtener esa ventaja.")

doc.add_page_break()
doc.add_heading("5. Comparación de opciones para la consola", level=1)

options = [
    ("JavaScript vainilla", "Continuidad inmediata; configuración mínima; adecuado para prototipos.", "Menor protección frente a cambios; refactorización riesgosa; deuda rápida en un archivo monolítico.", "Entrega de hoy o piloto pequeño"),
    ("TypeScript", "Tipos para catálogo, mecánicas, roles y API; mejor mantenimiento; herramientas más rápidas con el puerto nativo.", "Compilación y dependencias; transición TS6/TS7; no reemplaza validaciones del servidor.", "Frontend productivo recomendado"),
    ("Kotlin/JS", "Unificación parcial del lenguaje y modelos.", "Ecosistema y contratación más limitados; complejidad que no aporta valor inmediato.", "No recomendado como opción inicial"),
]
t = doc.add_table(rows=1, cols=4)
set_table_geometry(t, [1750, 2860, 2860, 1890])
for i, h in enumerate(["Opción", "Ventajas", "Costos y riesgos", "Uso recomendado"]):
    shade(t.rows[0].cells[i], NAVY); set_cell_text(t.rows[0].cells[i], h, True, WHITE, 9)
set_repeat_table_header(t.rows[0])
for values in options:
    cells = t.add_row().cells
    for i, value in enumerate(values):
        set_cell_text(cells[i], value, i == 0, NAVY if i == 0 else INK, 8.7)
    if len(t.rows) % 2 == 1:
        for c in cells: shade(c, LIGHT)
set_table_geometry(t, [1750, 2860, 2860, 1890])

callout("CRITERIO", "La tecnología debe escogerse por mantenibilidad, capacidades del equipo, compatibilidad y controles de seguridad; no por el porcentaje de lenguajes que GitHub muestra en el repositorio del compilador.", PALE_GOLD, GOLD)

doc.add_heading("6. Seguridad de la información", level=1)
p = doc.add_paragraph("La seguridad depende principalmente de la arquitectura y de los controles del servidor, no de que el código esté escrito en Kotlin, JavaScript o TypeScript.")

for item in [
    "Separar la API de autoría, la API de distribución y la API de progreso.",
    "Aplicar autenticación y autorización en el backend con roles de autor, revisor, publicador y administrador.",
    "Exigir revisión y registrar actor, fecha, versión y decisión de cada publicación.",
    "Entregar al juego únicamente catálogos publicados, validados e inmutables.",
    "No incluir secretos, credenciales administrativas ni endpoints de escritura dentro de la APK o del frontend.",
    "Validar esquema, MIME, tamaño, hash y referencias de cada recurso en el servidor.",
    "Mitigar XSS, CSRF, inyección, cargas maliciosas, abuso de API y escalamiento de privilegios.",
    "Separar datos académicos, contenido publicado y datos de progreso del estudiante.",
]:
    add_bullet(item)

doc.add_heading("6.1 Controles ya bien encaminados", level=2)
add_bullet("Comunicación exclusivamente por HTTPS.", GREEN)
add_bullet("Token cifrado con Android Keystore y AES-GCM.", GREEN)
add_bullet("Verificación SHA-256 y límites de tamaño para catálogos y medios.", GREEN)
add_bullet("Sincronización offline mediante eventos idempotentes.", GREEN)
add_bullet("Configuración de producción que impide el modo demostrativo.", GREEN)

doc.add_page_break()
doc.add_heading("7. Deuda técnica y riesgos prioritarios", level=1)

risks = [
    ("Alta", "Desalineación v1/v2", "El juego aún usa constelación → temas → misiones, mientras el modelo final usa constelación/tema → estrella/nivel.", "Formalizar y probar el contrato v2 antes de construir el backend."),
    ("Alta", "Backend inexistente", "No hay persistencia, autenticación administrativa, auditoría ni publicación real.", "Implementar primero un servicio mínimo seguro de autoría y distribución."),
    ("Alta", "Prototipo monolítico", "Interfaz, estado y lógica conviven en un único HTML.", "Separar módulos, servicios, modelos y pruebas antes de producción."),
    ("Media", "Servicios remotos desactivados", "El juego todavía opera en modo de desarrollo.", "Completar endpoints y verificar configuración de release."),
    ("Media", "Convivencia Java/Kotlin", "Aumenta el costo de mantenimiento durante la transición.", "Migrar por zonas estables, sin reescritura masiva."),
    ("Baja", "Transición TS6/TS7", "Puede afectar herramientas o API heredadas si se adopta prematuramente.", "Fijar versiones y probar antes de actualizar."),
]
t = doc.add_table(rows=1, cols=4)
set_table_geometry(t, [1050, 1850, 3500, 2960])
for i, h in enumerate(["Prioridad", "Riesgo", "Efecto", "Tratamiento"]):
    shade(t.rows[0].cells[i], NAVY); set_cell_text(t.rows[0].cells[i], h, True, WHITE, 9)
set_repeat_table_header(t.rows[0])
for priority, risk, effect, treatment in risks:
    cells = t.add_row().cells
    fill = PALE_RED if priority == "Alta" else PALE_GOLD if priority == "Media" else PALE_GREEN
    shade(cells[0], fill)
    set_cell_text(cells[0], priority, True, RED if priority == "Alta" else GOLD if priority == "Media" else GREEN, 8.8)
    set_cell_text(cells[1], risk, True, NAVY, 8.8)
    set_cell_text(cells[2], effect, False, INK, 8.5)
    set_cell_text(cells[3], treatment, False, INK, 8.5)
set_table_geometry(t, [1050, 1850, 3500, 2960])

doc.add_heading("8. Plan recomendado", level=1)
for text in [
    "Entrega inmediata: congelar cambios tecnológicos; presentar el juego y el prototipo administrativo en su estado actual.",
    "Contrato: definir JSON Schema u OpenAPI para el catálogo v2 y crear pruebas de compatibilidad con el juego.",
    "Backend mínimo: implementar autenticación, roles, borradores, revisión, publicación inmutable y auditoría.",
    "Frontend: modularizar el prototipo; decidir JavaScript o TypeScript después de estabilizar el contrato.",
    "Integración: habilitar un entorno de pruebas con HTTPS, catálogo remoto y progreso idempotente.",
    "Producción: ejecutar revisión de seguridad, pruebas de recuperación y verificación de configuración release.",
]:
    add_number(text)

doc.add_heading("9. Determinación final", level=1)
callout("APROBACIÓN TÉCNICA", "Se aprueba mantener Kotlin para el juego y Kotlin como primera opción para el backend. Se admite JavaScript vainilla para la entrega del prototipo administrativo. Para la consola productiva se recomienda TypeScript, sujeto a contrato v2 estable, pruebas y controles de seguridad en servidor.", PALE_GREEN, GREEN)

p = doc.add_paragraph()
p.add_run("Conclusión: ").bold = True
p.add_run("el cambio interno del compilador TypeScript no representa una amenaza para Caza Estelar. El proyecto debe concentrar sus recursos en el contrato v2, el backend seguro, la separación de APIs y la reducción de la deuda del prototipo administrativo.")

doc.add_heading("Fuentes y documentos revisados", level=1)
sources = [
    "Repositorio local: decisiones-tecnicas.md.",
    "Repositorio local: ARQUITECTURA.md.",
    "Repositorio local: INTEGRACION_ADMIN_JUEGO.md.",
    "Repositorio local: prototipo-admin-console.html.",
]
for s in sources:
    add_bullet(s)
p = doc.add_paragraph()
add_hyperlink(p, "Microsoft TypeScript PR #63763", "https://github.com/microsoft/TypeScript/pull/63763")
p.add_run(" — migración del repositorio a TypeScript 7, fusionada el 20 de agosto de 2026.")
p = doc.add_paragraph()
add_hyperlink(p, "Microsoft DevBlogs: A 10x Faster TypeScript", "https://devblogs.microsoft.com/typescript/typescript-native-port/")
p.add_run(" — objetivos, rendimiento y transición de versiones del puerto nativo.")

# Avoid row splitting and orphaned headings.
for table in doc.tables:
    for row in table.rows:
        trPr = row._tr.get_or_add_trPr()
        cantSplit = OxmlElement("w:cantSplit")
        trPr.append(cantSplit)

doc.core_properties.title = "Evaluación técnica del impacto de TypeScript 7 en Caza Estelar"
doc.core_properties.subject = "Determinación sobre juego, consola administrativa, backend, seguridad y deuda técnica"
doc.core_properties.author = "Equipo Caza Estelar"
doc.core_properties.keywords = "Caza Estelar, Kotlin, JavaScript, TypeScript 7, seguridad, deuda técnica"
doc.save(OUT)
print(OUT)

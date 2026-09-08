# -*- coding: utf-8 -*-
"""Genera el reporte de avances esperados para septiembre 2026.

Fuente reproducible de `Reporte_Avances_Esperados_Septiembre_Caza_Estelar.docx`.
Documento de presentación: qué se espera entregar en septiembre y con qué criterio se da por
cumplido. Derivado de caza-estelar/docs/PLAN_SEPTIEMBRE_2026.md y DECISIONES_FASE_0.md.

Requiere: python-docx.  Uso:  python build_reporte_avances_esperados.py
"""
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "Reporte_Avances_Esperados_Septiembre_Caza_Estelar.docx"

NAVY = "111B3C"; BLUE = "1967D2"; CYAN = "48CAE4"
INK = "202632"; MUTED = "5F6B7A"; PALE = "EEF4FF"
GREEN_BG = "E2F3EA"; AMBER_BG = "FFF4D6"


def shade(cell, color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd"); shd.set(qn("w:fill"), color); tcPr.append(shd)


def margins(cell, top=90, start=110, bottom=90, end=110):
    tc = cell._tc.get_or_add_tcPr()
    m = tc.first_child_found_in("w:tcMar")
    if m is None:
        m = OxmlElement("w:tcMar"); tc.append(m)
    for tag, val in [("top", top), ("start", start), ("bottom", bottom), ("end", end)]:
        e = OxmlElement("w:" + tag); e.set(qn("w:w"), str(val)); e.set(qn("w:type"), "dxa"); m.append(e)


def repeat(row):
    trPr = row._tr.get_or_add_trPr()
    x = OxmlElement("w:tblHeader"); x.set(qn("w:val"), "true"); trPr.append(x)


def no_split(row):
    row._tr.get_or_add_trPr().append(OxmlElement("w:cantSplit"))


doc = Document()
sec = doc.sections[0]
sec.page_width = Inches(8.5); sec.page_height = Inches(11)
sec.top_margin = Inches(.75); sec.bottom_margin = Inches(.7)
sec.left_margin = Inches(.85); sec.right_margin = Inches(.85)

styles = doc.styles
for s in ["Normal", "Title", "Subtitle", "Heading 1", "Heading 2"]:
    st = styles[s]
    st.font.name = "Arial"
    st._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
    st._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
styles["Normal"].font.size = Pt(10.5)
styles["Normal"].font.color.rgb = RGBColor.from_string(INK)
styles["Normal"].paragraph_format.space_after = Pt(6)
styles["Normal"].paragraph_format.line_spacing = 1.08
for s, size, color, before, after in [
    ("Title", 26, NAVY, 0, 6), ("Subtitle", 13, MUTED, 0, 12),
    ("Heading 1", 17, NAVY, 15, 6), ("Heading 2", 12.5, BLUE, 10, 4),
]:
    st = styles[s]
    st.font.size = Pt(size); st.font.color.rgb = RGBColor.from_string(color)
    st.font.bold = s != "Subtitle"
    st.paragraph_format.space_before = Pt(before)
    st.paragraph_format.space_after = Pt(after)
    st.paragraph_format.keep_with_next = True

header = sec.header.paragraphs[0]
header.text = "EXPLORAX  /  CAZA ESTELAR"
header.runs[0].font.size = Pt(8); header.runs[0].font.bold = True
header.runs[0].font.color.rgb = RGBColor.from_string(MUTED)
footer = sec.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
fr = footer.add_run("Avances esperados · septiembre 2026  |  ")
fr.font.size = Pt(8); fr.font.color.rgb = RGBColor.from_string(MUTED)
fld = OxmlElement("w:fldSimple"); fld.set(qn("w:instr"), "PAGE"); footer._p.append(fld)


def kicker(text):
    p = doc.add_paragraph(); p.paragraph_format.space_before = Pt(42)
    r = p.add_run(text); r.bold = True; r.font.name = "Arial"
    r.font.size = Pt(12); r.font.color.rgb = RGBColor.from_string(CYAN)


def para(text, lead=None, lead_color=BLUE):
    p = doc.add_paragraph()
    if lead:
        r = p.add_run(lead + " "); r.bold = True
        r.font.color.rgb = RGBColor.from_string(lead_color)
    p.add_run(text)
    return p


def bullet(text):
    doc.add_paragraph(text, style="List Bullet")


def callout(text, fill=AMBER_BG):
    t = doc.add_table(rows=1, cols=1); t.alignment = WD_TABLE_ALIGNMENT.LEFT
    shade(t.cell(0, 0), fill); margins(t.cell(0, 0), 150, 170, 150, 170)
    t.cell(0, 0).text = text


def table(headers, rows, widths, shade_col=None, shade_map=None):
    t = doc.add_table(rows=1, cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER; t.autofit = False
    for i, (h, w) in enumerate(zip(headers, widths)):
        t.columns[i].width = Inches(w)
        c = t.cell(0, i); c.text = h; shade(c, NAVY)
        c.paragraphs[0].runs[0].bold = True
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
    repeat(t.rows[0]); no_split(t.rows[0])
    for row in rows:
        cells = t.add_row().cells
        no_split(t.rows[-1])
        for i, v in enumerate(row):
            cells[i].text = v
            cells[i].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            margins(cells[i])
        if shade_col is not None and shade_map:
            shade(cells[shade_col], shade_map.get(row[shade_col], "FFFFFF"))
    return t


ST = {"Completado": GREEN_BG, "En progreso": AMBER_BG, "Pendiente": PALE}

# --------------------------------------------------------------------- portada
kicker("REPORTE DE AVANCES ESPERADOS")
doc.add_paragraph("Caza Estelar", style="Title")
doc.add_paragraph("Avances esperados para septiembre de 2026", style="Subtitle")

para("presentar el alcance comprometido para septiembre, los entregables esperados con su "
     "criterio de aceptación y las dependencias externas. Es un reporte de expectativa del "
     "mes; el detalle de contenido está en el documento de avance y en la documentación del "
     "repositorio.", lead="Propósito de este reporte:", lead_color=NAVY)

t = doc.add_table(rows=5, cols=2); t.alignment = WD_TABLE_ALIGNMENT.LEFT; t.autofit = False
for i, (a, b) in enumerate([
    ("Proyecto", "Caza Estelar — juego educativo Android y aplicación administrativa"),
    ("Periodo", "1 al 30 de septiembre de 2026"),
    ("Naturaleza del mes", "Planteamiento de diseño y prueba de concepto; sin implementación de la app"),
    ("Responsable", "carloppp"),
    ("Corte del reporte", "8 de septiembre de 2026"),
]):
    t.columns[0].width = Inches(1.75); t.columns[1].width = Inches(4.65)
    t.cell(i, 0).text = a; t.cell(i, 1).text = b; shade(t.cell(i, 0), PALE)
    for c in t.rows[i].cells:
        margins(c); c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    t.cell(i, 0).paragraphs[0].runs[0].bold = True

callout("Septiembre no implementa la aplicación. El avance del mes es el planteamiento del "
        "juego v2 y de la aplicación administrativa, más una prueba de concepto verificable "
        "del contrato de contenido v2. La implementación no forma parte de este avance.")
doc.add_page_break()

# --------------------------------------------------------------------- 1
doc.add_paragraph("1. Objetivo del mes", style="Heading 1")
para("Dejar cerrado y verificable el diseño sobre el que se construirá el proyecto: las "
     "decisiones de producto, el entorno de trabajo, el contrato de contenido v2 y la "
     "arquitectura de la aplicación administrativa. Con eso aprobado, la implementación "
     "posterior parte sin ambigüedades.")

# --------------------------------------------------------------------- 2
doc.add_paragraph("2. Avances esperados de septiembre", style="Heading 1")
table(["#", "Entregable", "Criterio de aceptación", "Estado"], [
    ("1", "Decisiones de producto (Fase 0)",
     "Contrato, motor móvil, conectividad, repositorios, progreso, narración y stack administrativo registrados y sin contradicciones abiertas.",
     "Completado"),
    ("2", "Entorno reproducible (Fase 1)",
     "Repositorio Git, Gradle Wrapper y toolchain funcionando; core:test verde; assembleDebug correcto.",
     "Completado"),
    ("3", "Contrato de contenido v2",
     "Documento CONTENT_SCHEMA_V2.md completo (estructura, ejemplo, mecánicas, validación, progreso) y aprobado por el responsable.",
     "Completado"),
    ("4", "Esquema JSON del catálogo v2",
     "catalog-v2.schema.json válido (JSON Schema 2020-12) con validación por mecánica.",
     "Completado"),
    ("5", "Prueba mínima de concepto del modelo v2",
     "Modelos Kotlin v2 que compilan, con pruebas verdes, aislados del parser y el progreso.",
     "Completado"),
    ("6", "Documento del avance del mes",
     "Avance_Septiembre_Caza_Estelar.docx con flujo, UML, casos de uso, arquitectura administrativa y anexo de la prueba de concepto.",
     "Completado"),
    ("7", "Revisión y aprobación por el responsable",
     "Contrato v2 y documento de avance revisados y aprobados.",
     "En progreso"),
], [0.4, 2.0, 3.0, 1.0], shade_col=3, shade_map=ST)

# --------------------------------------------------------------------- 3
doc.add_paragraph("3. Prueba de concepto esperada — alcance y límites", style="Heading 1")
table(["Incluye", "No incluye"], [
    ("Modelos de datos del contrato v2 en Kotlin (ContentCatalogV2, ConstellationDefinitionV2, LevelDefinition, LevelCompletion, LevelReward, LevelUnlock, LevelMedia, LevelProgress).",
     "Cambios en CatalogParser, CatalogValidator o MissionValidator."),
    ("Esquema JSON del catálogo v2 con validación condicional por mecánica.",
     "Cambios en la navegación o en las pantallas."),
    ("Pruebas de la derivación de estrellas y porcentaje y de la resolución de niveles por id.",
     "Cambios en el modelo de progreso en uso ni en la configuración de red."),
    ("Compilación y core:test en verde (41 pruebas).",
     "Uso del paquete content.v2 desde el juego (queda aislado)."),
], [3.2, 3.2])

# --------------------------------------------------------------------- 4
doc.add_paragraph("4. Cronología del mes", style="Heading 1")
table(["Fecha", "Hito"], [
    ("7 sep", "Cierre de decisiones de producto (Fase 0)."),
    ("7-8 sep", "Entorno reproducible (Fase 1): Git, Wrapper, toolchain, línea base verde."),
    ("8 sep", "Contrato de contenido v2 redactado, esquema JSON y prueba de concepto en código."),
    ("8 sep", "Documento de avance del mes generado; contrato v2 aprobado por el responsable."),
    ("resto de sep", "Revisión y aprobación del documento de avance."),
], [1.1, 5.3])

# --------------------------------------------------------------------- 5
doc.add_paragraph("5. Fuera de alcance de septiembre", style="Heading 1")
for x in [
    "Implementación del parser v2, la validación, la navegación por niveles y el progreso v2.",
    "Retiro del código de operación sin conexión.",
    "Cualquier código del backend o de la consola web.",
    "Ejecución del spike de motor y el ADR.",
    "Contenido matemático real; aprovisionamiento del VPS y del dominio.",
]:
    bullet(x)

# --------------------------------------------------------------------- 6
doc.add_paragraph("6. Dependencias del responsable", style="Heading 1")
table(["Acción", "Necesaria para", "Estado"], [
    ("Aprobar CONTENT_SCHEMA_V2.md y el documento de avance", "Cerrar el diseño del proyecto", "En progreso"),
    ("Solicitud formal al equipo académico (currículo GT, temario por grado, formato de bancos)", "Contenido matemático real", "Pendiente"),
    ("Priorizar 3-4 mecánicas nuevas", "Diseño de actividades", "Pendiente"),
    ("Definir proveedor, país y plan del VPS; usuarios simultáneos y volumen multimedia", "Infraestructura del backend", "Pendiente"),
    ("Iniciar consulta legal sobre datos de menores (Guatemala y Estados Unidos)", "Cumplimiento de privacidad", "Pendiente"),
], [3.0, 2.4, 1.0], shade_col=2, shade_map=ST)

# --------------------------------------------------------------------- 7
doc.add_paragraph("7. Resultado esperado al cierre de septiembre", style="Heading 1")
para("Al 30 de septiembre el proyecto debe tener: decisiones de producto cerradas, entorno "
     "reproducible, contrato de contenido v2 aprobado con su esquema y su prueba de concepto, "
     "y la arquitectura de la aplicación administrativa planteada. Con eso, el proyecto queda "
     "listo para iniciar la implementación sin decisiones de producto abiertas. La "
     "planificación de esa implementación no forma parte de este avance.")

doc.add_paragraph("Documentos de respaldo", style="Heading 2")
for x in [
    "Avance_Septiembre_Caza_Estelar.docx — planteamiento con diagramas y UML.",
    "caza-estelar/docs/CONTENT_SCHEMA_V2.md — contrato de contenido v2 aprobado.",
    "caza-estelar/docs/contracts/catalog-v2.schema.json — esquema del catálogo v2.",
    "caza-estelar/docs/DECISIONES_FASE_0.md — decisiones de producto cerradas.",
    "caza-estelar/docs/PLAN_SEPTIEMBRE_2026.md — alcance operativo del mes.",
    "caza-estelar/docs/PLAN_DESARROLLO.md — hoja de ruta por fases.",
]:
    bullet(x)

for tbl in doc.tables:
    repeat(tbl.rows[0])
    for row in tbl.rows:
        for cell in row.cells:
            for p in cell.paragraphs:
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.line_spacing = 1.0
                for r in p.runs:
                    r.font.name = "Arial"
                    r._element.rPr.rFonts.set(qn("w:ascii"), "Arial")
                    r._element.rPr.rFonts.set(qn("w:hAnsi"), "Arial")
                    r.font.size = Pt(9)

doc.core_properties.title = "Reporte de avances esperados - septiembre 2026 - Caza Estelar"
doc.core_properties.subject = "Alcance y entregables esperados del mes"
doc.core_properties.author = "Equipo Caza Estelar"
doc.save(OUT)
print(OUT)

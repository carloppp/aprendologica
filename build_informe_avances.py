from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "Informe_de_avances_Caza_Estelar.docx"
DIAG = ROOT / "qa_informe_avances" / "diagramas"
DIAG.mkdir(parents=True, exist_ok=True)

NAVY = "111B3C"; BLUE = "1967D2"; CYAN = "48CAE4"; GOLD = "F4B942"
INK = "202632"; MUTED = "5F6B7A"; PALE = "EEF4FF"; GREEN = "1B7F5A"; AMBER = "A15C00"; RED = "A23434"

def font(size=28, bold=False):
    names = ["C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"]
    for name in names:
        if Path(name).exists(): return ImageFont.truetype(name, size)
    return ImageFont.load_default()

def diagram(name, title, nodes, edges, size=(1500, 820)):
    im = Image.new("RGB", size, "#F8FAFE"); d = ImageDraw.Draw(im)
    d.rounded_rectangle((25,25,size[0]-25,size[1]-25), radius=28, fill="#F8FAFE", outline="#CAD7EF", width=3)
    d.text((60,45), title, fill="#111B3C", font=font(38, True))
    boxes = {}
    for key, x,y,w,h,label,color in nodes:
        boxes[key]=(x,y,w,h)
        d.rounded_rectangle((x,y,x+w,y+h), radius=18, fill=color, outline="#315B8A", width=3)
        lines=label.split("\n"); total=sum(d.textbbox((0,0),t,font=font(23,True))[3] for t in lines)+8*(len(lines)-1)
        yy=y+(h-total)/2
        for t in lines:
            bb=d.textbbox((0,0),t,font=font(23,True)); d.text((x+(w-(bb[2]-bb[0]))/2,yy),t,fill="#172033",font=font(23,True)); yy+=bb[3]-bb[1]+8
    for a,b,label in edges:
        ax,ay,aw,ah=boxes[a]; bx,by,bw,bh=boxes[b]
        if a == "save" and b == "map":
            p1=(ax+aw/2,ay+ah); p2=(bx+bw,by+bh/2)
            route=[p1,(p1[0],690),(1360,690),(1360,p2[1]),p2]
            d.line(route, fill="#485A72", width=5, joint="curve")
            d.polygon([p2,(p2[0]+18,p2[1]-10),(p2[0]+18,p2[1]+10)],fill="#485A72")
            d.rectangle((765,665,960,703),fill="#F8FAFE")
            d.text((780,670),label,fill="#485A72",font=font(18))
            continue
        p1=(ax+aw/2,ay+ah) if by>ay else (ax+aw,ay+ah/2)
        p2=(bx+bw/2,by) if by>ay else (bx,by+bh/2)
        d.line((p1,p2), fill="#485A72", width=5)
        import math
        ang=math.atan2(p2[1]-p1[1],p2[0]-p1[0]); L=16
        pts=[p2,(p2[0]-L*math.cos(ang-.55),p2[1]-L*math.sin(ang-.55)),(p2[0]-L*math.cos(ang+.55),p2[1]-L*math.sin(ang+.55))]
        d.polygon(pts,fill="#485A72")
        if label:
            mx=(p1[0]+p2[0])/2; my=(p1[1]+p2[1])/2-22
            bb=d.textbbox((0,0),label,font=font(18)); d.rectangle((mx-8,my-3,mx+bb[2]+8,my+bb[3]+3),fill="#F8FAFE")
            d.text((mx,my),label,fill="#485A72",font=font(18))
    path=DIAG/f"{name}.png"; im.save(path); return path

flow = diagram("flujo", "Flujo principal de la aplicación", [
 ("load",70,180,230,100,"Carga\nde recursos","#DDEBFF"),("login",380,180,230,100,"Inicio de\nsesión","#DDEBFF"),("menu",690,180,230,100,"Menú\nprincipal","#DDEBFF"),("map",1000,180,230,100,"Mapa / lista\nde misiones","#DDEBFF"),
 ("act",1000,430,230,100,"Actividad\ninteractiva","#FFF2CB"),("result",690,430,230,100,"Resultado y\nestrellas","#DFF4E9"),("save",380,430,230,100,"Guardar /\nsincronizar","#DFF4E9")],
 [("load","login",""),("login","menu","credenciales"),("menu","map","jugar"),("map","act","seleccionar"),("act","result","finalizar"),("result","save","progreso"),("save","map","elegir otra misión")])

entities = diagram("entidades", "UML simplificado de entidades", [
 ("user",70,150,250,115,"Usuario\nid, nombre, rol","#DDEBFF"),("student",430,150,250,115,"Alumno\nfechaNacimiento, grado","#DDEBFF"),("inst",790,150,250,115,"Institución\npaís, secciones","#DDEBFF"),("mission",70,455,250,115,"Misión\nid, tipo, orden","#FFF2CB"),("progress",430,455,250,115,"Progreso\npuntaje, estrellas","#DFF4E9"),("attempt",790,455,250,115,"Intento\ntiempo, porcentaje","#DFF4E9"),("catalog",1130,300,250,115,"Catálogo\nversión, estado","#EAE3FF")],
 [("user","student","perfil"),("student","inst","pertenece"),("student","progress","obtiene"),("mission","progress","genera"),("progress","attempt","1..n"),("mission","catalog","contenido")])

variables = diagram("variables", "UML de variables y estado de juego", [
 ("session",70,150,300,150,"PlayerSession\nuserId: String\ntoken: AuthToken\nauthenticated: Boolean","#DDEBFF"),("settings",450,150,300,150,"AppSettings\nlanguage: String\nsoundEnabled: Boolean","#DDEBFF"),("game",830,150,300,150,"StarHuntSession\ntargets: Int\ncaptured: Int\ncompleted: Boolean","#FFF2CB"),("prog",450,465,300,150,"MissionProgress\nscore: Int\nstars: Int\nattempts: Int\ncompleted: Boolean","#DFF4E9")],
 [("session","settings","usa"),("settings","game","configura"),("game","prog","actualiza"),("session","prog","asocia")])

scenarios = diagram("escenarios", "UML de escenarios (casos de uso)", [
 ("student",40,215,200,105,"Alumno","#DDEBFF"),
 ("login",300,100,360,80,"Iniciar sesión","#EEF4FF"),
 ("play",300,215,360,80,"Seleccionar y jugar misión","#EEF4FF"),
 ("result",300,330,360,80,"Consultar progreso","#EEF4FF"),
 ("teacher",40,620,200,105,"Docente","#DFF4E9"),
 ("sections",300,560,360,80,"Consultar secciones asignadas","#EAF8F0"),
 ("academic",300,680,360,80,"Resultados y reportes académicos","#EAF8F0"),
 ("admin",800,215,200,105,"Administrador","#FFF2CB"),
 ("users",1060,100,380,80,"Gestionar usuarios y contenido","#FDF5DF"),
 ("publish",1060,215,380,80,"Revisar y publicar contenido","#FDF5DF"),
 ("globalreports",1060,330,380,80,"Generar reportes globales","#FDF5DF"),
 ("director",800,620,200,105,"Director","#EAE3FF"),
 ("school",1060,560,380,80,"Consultar toda la institución","#F2EDFF"),
 ("schoolreports",1060,680,380,80,"Generar reportes institucionales","#F2EDFF")],
 [("student","login",""),("student","play",""),("student","result",""),
  ("teacher","sections",""),("teacher","academic",""),
  ("admin","users",""),("admin","publish",""),("admin","globalreports",""),
  ("director","school",""),("director","schoolreports","")], size=(1500,900))

def shade(cell, color):
    tcPr=cell._tc.get_or_add_tcPr(); shd=OxmlElement('w:shd'); shd.set(qn('w:fill'),color); tcPr.append(shd)
def margins(cell, top=100, start=120, bottom=100, end=120):
    tc=cell._tc.get_or_add_tcPr(); m=tc.first_child_found_in('w:tcMar')
    if m is None: m=OxmlElement('w:tcMar'); tc.append(m)
    for tag,val in [('top',top),('start',start),('bottom',bottom),('end',end)]:
        e=OxmlElement('w:'+tag); e.set(qn('w:w'),str(val)); e.set(qn('w:type'),'dxa'); m.append(e)
def set_repeat(row):
    trPr=row._tr.get_or_add_trPr(); x=OxmlElement('w:tblHeader'); x.set(qn('w:val'),'true'); trPr.append(x)
def keep(p):
    pPr=p._p.get_or_add_pPr(); pPr.append(OxmlElement('w:keepNext'))

doc=Document(); sec=doc.sections[0]
sec.page_width=Inches(8.5); sec.page_height=Inches(11); sec.top_margin=Inches(.75); sec.bottom_margin=Inches(.7); sec.left_margin=Inches(.85); sec.right_margin=Inches(.85)
styles=doc.styles
for s in ['Normal','Title','Subtitle','Heading 1','Heading 2','Heading 3']:
    st=styles[s]; st.font.name='Arial'; st._element.rPr.rFonts.set(qn('w:ascii'),'Arial'); st._element.rPr.rFonts.set(qn('w:hAnsi'),'Arial')
styles['Normal'].font.size=Pt(10.5); styles['Normal'].font.color.rgb=RGBColor.from_string(INK); styles['Normal'].paragraph_format.space_after=Pt(6); styles['Normal'].paragraph_format.line_spacing=1.08
for s,size,color,before,after in [('Title',27,NAVY,0,6),('Subtitle',13,MUTED,0,12),('Heading 1',18,NAVY,16,7),('Heading 2',13,BLUE,11,5),('Heading 3',11,INK,8,4)]:
    st=styles[s]; st.font.size=Pt(size); st.font.color.rgb=RGBColor.from_string(color); st.font.bold=s!='Subtitle'; st.paragraph_format.space_before=Pt(before); st.paragraph_format.space_after=Pt(after); st.paragraph_format.keep_with_next=True

header=sec.header.paragraphs[0]; header.text='EXPLORAX  /  CAZA ESTELAR'; header.style=styles['Normal']; header.runs[0].font.size=Pt(8); header.runs[0].font.bold=True; header.runs[0].font.color.rgb=RGBColor.from_string(MUTED)
footer=sec.footer.paragraphs[0]; footer.alignment=WD_ALIGN_PARAGRAPH.CENTER
run=footer.add_run('Informe de avances · 24 de agosto de 2026  |  '); run.font.size=Pt(8); run.font.color.rgb=RGBColor.from_string(MUTED)
fld=OxmlElement('w:fldSimple'); fld.set(qn('w:instr'),'PAGE'); footer._p.append(fld)

p=doc.add_paragraph(); p.paragraph_format.space_before=Pt(45); r=p.add_run('INFORME DE AVANCES'); r.bold=True; r.font.name='Arial'; r.font.size=Pt(12); r.font.color.rgb=RGBColor.from_string(CYAN)
p=doc.add_paragraph('Caza Estelar',style='Title'); p.alignment=WD_ALIGN_PARAGRAPH.LEFT
doc.add_paragraph('Aplicación educativa Android y propuesta de aplicación administrativa',style='Subtitle')
p=doc.add_paragraph(); p.paragraph_format.space_before=Pt(18); p.paragraph_format.space_after=Pt(18)
r=p.add_run('Avance general: '); r.bold=True; r.font.color.rgb=RGBColor.from_string(NAVY); p.add_run('prototipo jugable e integración técnica en desarrollo. La consola administrativa existe como prototipo web funcional; el backend productivo y su despliegue permanecen planteados.')
t=doc.add_table(rows=3,cols=2); t.alignment=WD_TABLE_ALIGNMENT.LEFT; t.autofit=False
for i,(a,b) in enumerate([('Proyecto','Caza Estelar'),('Plataforma actual','Android 8.0+ · orientación horizontal'),('Corte del informe','24 de agosto de 2026')]):
    t.columns[0].width=Inches(1.7); t.columns[1].width=Inches(4.7); t.cell(i,0).text=a; t.cell(i,1).text=b; shade(t.cell(i,0),PALE)
    for c in t.rows[i].cells: margins(c); c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
    t.cell(i,0).paragraphs[0].runs[0].bold=True
doc.add_paragraph('Nota de alcance',style='Heading 2')
p=doc.add_paragraph('Este documento distingue hechos comprobados en el repositorio de propuestas futuras. Los campos de nombre del estudiante, curso, docente e institución pueden completarse antes de entregar.')
shadebox=doc.add_table(rows=1,cols=1); shadebox.alignment=WD_TABLE_ALIGNMENT.LEFT; shade(shadebox.cell(0,0),'FFF4D6'); margins(shadebox.cell(0,0),160,180,160,180); shadebox.cell(0,0).text='Estado usado: IMPLEMENTADO = existe en código; PROTOTIPO = demostración navegable o parcial; PLANTEADO = diseño recomendado aún no desplegado.'
doc.add_page_break()

doc.add_paragraph('1. Resumen ejecutivo',style='Heading 1')
doc.add_paragraph('Caza Estelar ya cuenta con una base técnica ejecutable para Android, pantallas de carga, acceso, menú, mapas/listados de misiones y actividades educativas. Se implementaron animaciones, configuración bilingüe, recursos gráficos, persistencia local, modelos de contenido, progreso, autenticación intercambiable y clientes HTTP preparados para servicios remotos. Existen APK de prueba y una batería de pruebas unitarias.')
data=[('Aplicación del juego','IMPLEMENTADO / EN DESARROLLO','Java y Kotlin sobre libGDX; APK Android disponible.'),('Aplicación administrativa','PROTOTIPO','Consola HTML navegable para contenido, medios, revisión y publicación.'),('Backend y base de datos','PLANTEADO','Contrato REST y configuración remota definidos; falta infraestructura productiva.'),('Instalación','MIXTO','Juego: APK Android. Administración: navegador web mediante hosting HTTPS recomendado.')]
t=doc.add_table(rows=1,cols=3); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False
for i,w in enumerate([2.0,1.6,2.9]): t.columns[i].width=Inches(w)
for i,h in enumerate(['Componente','Estado','Evidencia / alcance']): t.cell(0,i).text=h; shade(t.cell(0,i),NAVY); t.cell(0,i).paragraphs[0].runs[0].font.color.rgb=RGBColor(255,255,255); t.cell(0,i).paragraphs[0].runs[0].bold=True
set_repeat(t.rows[0])
for row in data:
    cells=t.add_row().cells
    for i,v in enumerate(row): cells[i].text=v; margins(cells[i]); cells[i].vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
    shade(cells[1], 'E2F3EA' if 'IMPLEMENTADO' in row[1] else 'FFF4D6')

doc.add_paragraph('2. Aplicación del juego',style='Heading 1')
doc.add_paragraph('2.1 Lenguaje, plataforma y arquitectura actual',style='Heading 2')
for text in ['Java y Kotlin como lenguajes del núcleo actual.','libGDX para pantallas, actores, entrada táctil, animación y renderizado 2D.','Gradle con módulos core y android; compilación orientada a Android SDK 35, mínimo API 26.','Resolución virtual 1920 × 1080 mediante FitViewport y funcionamiento horizontal.','Arquitectura por servicios para autenticación, contenido, medios, progreso, configuración de red y diagnóstico.']:
    doc.add_paragraph(text,style='List Bullet')
doc.add_paragraph('La documentación estratégica plantea una futura reescritura completa en Kotlin y la evaluación de Jetpack Compose combinado con libGDX o Canvas. Esta migración no debe reportarse todavía como implementada.',style=None)

doc.add_paragraph('2.2 Diagrama de flujo',style='Heading 2'); doc.add_picture(str(flow),width=Inches(6.55)); doc.paragraphs[-1].alignment=WD_ALIGN_PARAGRAPH.CENTER
doc.add_paragraph('El flujo implementado parte de carga y acceso, continúa hacia menú y actividades. Los módulos de catálogo, progreso y sincronización amplían el flujo hacia misiones administrables y servicios remotos.',style=None)

doc.add_paragraph('2.3 UML de entidades',style='Heading 2'); doc.add_picture(str(entities),width=Inches(6.55)); doc.paragraphs[-1].alignment=WD_ALIGN_PARAGRAPH.CENTER
doc.add_paragraph('Las entidades Usuario, Alumno e Institución pertenecen al dominio administrativo planteado; Misión, Catálogo, Progreso e Intento ya cuentan con modelos o lógica equivalente en el núcleo del juego.')

doc.add_paragraph('2.4 UML de variables',style='Heading 2'); doc.add_picture(str(variables),width=Inches(6.55)); doc.paragraphs[-1].alignment=WD_ALIGN_PARAGRAPH.CENTER
doc.add_paragraph('Variables representativas verificadas en las clases de sesión, ajustes, actividades y progreso. Los nombres exactos pueden variar por implementación, pero el diagrama refleja las responsabilidades actuales.')

doc.add_paragraph('2.5 UML de escenarios',style='Heading 2'); doc.add_picture(str(scenarios),width=Inches(6.55)); doc.paragraphs[-1].alignment=WD_ALIGN_PARAGRAPH.CENTER
doc.add_paragraph('El alumno consume el contenido y registra resultados; el administrador gestiona usuarios, contenido y reportes desde la aplicación administrativa. Los tres escenarios administrativos permanecen en fase de prototipo o definición contractual.')

doc.add_paragraph('2.6 Programación de eventos',style='Heading 2')
events=[('Carga','Finalización de precarga','Mostrar pantalla de acceso.'),('Autenticación','Pulsar “Iniciar sesión”','Validar localmente o llamar al servicio HTTP; crear sesión.'),('Navegación','Elegir jugar, misión o volver','Cambiar la pantalla mediante GameNavigator.'),('Actividad','Toque/clic sobre estrella u opción','Evaluar selección, actualizar contador/puntaje y retroalimentar.'),('Configuración','Cambiar idioma o sonido','Actualizar AppSettings y refrescar la interfaz.'),('Progreso','Finalizar actividad','Calcular porcentaje/estrellas, persistir y encolar sincronización.'),('Red','Respuesta, error o desconexión','Resolver callback, conservar estado y reintentar según política.')]
t=doc.add_table(rows=1,cols=3); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False
for i,w in enumerate([1.25,2.15,3.1]): t.columns[i].width=Inches(w)
for i,h in enumerate(['Área','Evento','Respuesta programada']): t.cell(0,i).text=h; shade(t.cell(0,i),NAVY); t.cell(0,i).paragraphs[0].runs[0].font.color.rgb=RGBColor(255,255,255); t.cell(0,i).paragraphs[0].runs[0].bold=True
set_repeat(t.rows[0])
for row in events:
    cells=t.add_row().cells
    for i,v in enumerate(row): cells[i].text=v; margins(cells[i]); cells[i].vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER

doc.add_paragraph('2.7 Áreas visuales y distribución',style='Heading 2')
for head,desc in [('Carga','Logo central, fondo espacial, animación y barra/progreso.'),('Acceso','Escena exterior de constelaciones; panel de cristal y controles de credenciales.'),('Menú principal','Observatorio como fondo; navegación agrupada a la derecha; ajustes en esquina superior izquierda.'),('Mapas y misiones','Jerarquía visual de constelaciones, estrellas y estados de bloqueo/progreso.'),('Actividad','Zona principal de interacción, instrucción visible, marcador y retroalimentación inmediata.'),('Ajustes','Idioma español/inglés, sonido y cierre de sesión cuando corresponda.')]:
    p=doc.add_paragraph(); r=p.add_run(head+': '); r.bold=True; r.font.color.rgb=RGBColor.from_string(BLUE); p.add_run(desc)

doc.add_paragraph('2.8 Elementos dinámicos y estáticos',style='Heading 2')
t=doc.add_table(rows=1,cols=2); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False
for i,w in enumerate([3.25,3.25]): t.columns[i].width=Inches(w)
for i,h in enumerate(['Dinámicos','Estáticos']): t.cell(0,i).text=h; shade(t.cell(0,i),NAVY); t.cell(0,i).paragraphs[0].runs[0].font.color.rgb=RGBColor(255,255,255); t.cell(0,i).paragraphs[0].runs[0].bold=True
rows=[('Transiciones entre pantallas y viaje estelar','Fondos Full HD de constelaciones y observatorio'),('Estrellas pulsantes, lluvia diagonal y efectos cinematográficos','Logotipos, tipografías Fredoka/Nunito y paneles'),('Botones con estados normal/presionado','Etiquetas, instrucciones y marcos de interfaz'),('Mira de telescopio y captura de objetivos','Icono Android y recursos de marca'),('Progreso, puntaje, idioma y sonido','Estructura visual del menú y formularios')]
for a,b in rows:
    c=t.add_row().cells; c[0].text=a; c[1].text=b
    for x in c: margins(x); x.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER

doc.add_paragraph('3. Aplicación administrativa',style='Heading 1')
doc.add_paragraph('3.1 Estado y lenguaje de desarrollo',style='Heading 2')
doc.add_paragraph('Existe un prototipo navegable en HTML, CSS y JavaScript sin framework. Demuestra el tablero, constelaciones, editor de niveles, biblioteca multimedia, mecánicas, revisión/publicación y archivo. Para producción se propone TypeScript con un framework web mantenible (React, Angular o Vue), decisión aún pendiente.')
doc.add_paragraph('3.2 Herramientas de terceros',style='Heading 2')
tools=[('Actual: libGDX / FreeType','Juego Android, escenas 2D, entrada y tipografías.','Implementado'),('Actual: Gradle / Android SDK','Compilación, dependencias y empaquetado APK.','Implementado'),('Actual: JSON + clientes HTTP de libGDX','Catálogo, autenticación, medios y progreso remoto.','Implementado parcialmente'),('Propuesta: framework TypeScript','Interfaz administrativa modular y validada.','Pendiente'),('Propuesta: AWS','Hosting, API, almacenamiento, base de datos, monitoreo.','Pendiente'),('Propuesta: librería de reportes','Exportación PDF/Excel desde la web.','Pendiente')]
t=doc.add_table(rows=1,cols=3); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False
for i,w in enumerate([2.0,3.2,1.3]): t.columns[i].width=Inches(w)
for i,h in enumerate(['Herramienta','Uso','Estado']): t.cell(0,i).text=h; shade(t.cell(0,i),NAVY); t.cell(0,i).paragraphs[0].runs[0].font.color.rgb=RGBColor(255,255,255); t.cell(0,i).paragraphs[0].runs[0].bold=True
set_repeat(t.rows[0])
for row in tools:
    c=t.add_row().cells
    for i,v in enumerate(row): c[i].text=v; margins(c[i]); c[i].vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER

doc.add_paragraph('3.3 Roles de usuarios',style='Heading 2')
roles=[('Alumno','Jugar actividades y consultar su progreso.'),('Docente','Consultar secciones asignadas, resultados e incompletos.'),('Director','Consultar todas las secciones de su institución.'),('Administrador institucional','Gestionar información operativa de su institución según permisos.'),('Administrador general','Crear/cargar usuarios, bloquear cuentas, administrar contenido y consultar todos los colegios y países.'),('Autor / revisor académico','Propuesto para crear, revisar y aprobar contenido antes de publicación.')]
for a,b in roles:
    p=doc.add_paragraph(); r=p.add_run(a+': '); r.bold=True; r.font.color.rgb=RGBColor.from_string(BLUE); p.add_run(b)
doc.add_paragraph('Pendiente: cerrar la matriz exacta de permisos y decidir si autor y revisor serán roles independientes o capacidades del administrador.')

doc.add_paragraph('3.4 Utilización de APIs',style='Heading 2')
for text in ['Autenticación: inicio de sesión y validación/bloqueo de cuenta.','Contenido: descarga de catálogo publicado y control de versión/integridad.','Medios: descarga y caché local de imágenes, audio o video.','Progreso: envío idempotente de intentos, porcentaje, tiempo y número de intento.','Administración: altas masivas, instituciones, roles, publicación y reportes.','Configuración: archivo de servicios permite activar/desactivar endpoints y separar ambientes.']:
    doc.add_paragraph(text,style='List Bullet')
doc.add_paragraph('El contrato remoto y los clientes base están definidos, pero los endpoints productivos, credenciales, cifrado, auditoría y política definitiva de errores deben validarse con el equipo del backend.')

doc.add_paragraph('3.5 ¿Dónde será instalada?',style='Heading 2')
p=doc.add_paragraph(); r=p.add_run('Propuesta recomendada: '); r.bold=True; r.font.color.rgb=RGBColor.from_string(GREEN); p.add_run('la aplicación administrativa será una aplicación web responsiva instalada en infraestructura AWS y utilizada desde navegadores autorizados. No será necesario instalarla computadora por computadora.')
install=[('Frontend','AWS Amplify Hosting o S3 + CloudFront','Publicación HTTPS, distribución global y versiones controladas.'),('API','Amazon API Gateway + servicio backend (Lambda/ECS, por definir)','Acceso seguro desde la web y el juego.'),('Base de datos','Amazon RDS PostgreSQL o DynamoDB, tras evaluación','Usuarios, instituciones, contenido, intentos y auditoría.'),('Archivos','Amazon S3','Imágenes, audio, video y exportaciones.'),('Acceso','Dominio institucional + HTTPS + control por roles','Uso desde Chrome/Edge/Firefox actuales en equipos administrativos.'),('Juego','APK en tabletas/teléfonos Android 8.0+; luego tienda o MDM','Instalación controlada en dispositivos de colegios.')]
t=doc.add_table(rows=1,cols=3); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False
for i,w in enumerate([1.15,2.55,2.8]): t.columns[i].width=Inches(w)
for i,h in enumerate(['Capa','Ubicación propuesta','Justificación']): t.cell(0,i).text=h; shade(t.cell(0,i),NAVY); t.cell(0,i).paragraphs[0].runs[0].font.color.rgb=RGBColor(255,255,255); t.cell(0,i).paragraphs[0].runs[0].bold=True
set_repeat(t.rows[0])
for row in install:
    c=t.add_row().cells
    for i,v in enumerate(row): c[i].text=v; margins(c[i]); c[i].vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER

doc.add_paragraph('4. Pendientes planteados y próximos pasos',style='Heading 1')
pending=[('Alta','Definir tecnología final del backend, base de datos y servicios AWS.','Documento de arquitectura aprobado.'),('Alta','Cerrar contrato API, autenticación, roles y seguridad.','OpenAPI probado entre juego, web y backend.'),('Alta','Convertir la consola HTML en aplicación productiva TypeScript.','MVP desplegado con acceso por roles.'),('Media','Completar contenido matemático, constelaciones y actividades.','Catálogo v1 revisado académicamente.'),('Media','Decidir Compose + libGDX frente a Compose + Canvas.','Prueba técnica y decisión registrada.'),('Media','Implementar reportes PDF/Excel y carga CSV/Excel.','Exportaciones y validaciones de datos.'),('Media','Pruebas integrales en dispositivos y navegadores.','Matriz de QA, rendimiento y accesibilidad.'),('Baja','Publicación mediante tienda o MDM institucional.','Plan de distribución y soporte.')]
t=doc.add_table(rows=1,cols=3); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False
for i,w in enumerate([.8,3.55,2.15]): t.columns[i].width=Inches(w)
for i,h in enumerate(['Prioridad','Actividad','Resultado esperado']): t.cell(0,i).text=h; shade(t.cell(0,i),NAVY); t.cell(0,i).paragraphs[0].runs[0].font.color.rgb=RGBColor(255,255,255); t.cell(0,i).paragraphs[0].runs[0].bold=True
set_repeat(t.rows[0])
for row in pending:
    c=t.add_row().cells
    for i,v in enumerate(row): c[i].text=v; margins(c[i]); c[i].vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
    shade(c[0], 'FFE3E3' if row[0]=='Alta' else ('FFF4D6' if row[0]=='Media' else 'E2F3EA'))

doc.add_paragraph('5. Evidencias revisadas',style='Heading 1')
for x in ['Código fuente de pantallas, actores visuales, navegación, sesión, catálogo, progreso, medios y red.','Pruebas unitarias para autenticación, contenido, integridad, progreso, desbloqueo, mecánicas y sesiones de juego.','APK de demostración y compilaciones versionadas.','Prototipo de consola administrativa en HTML/CSS/JavaScript.','Documentación maestra, arquitectura, contrato remoto e integración administración-juego.']:
    doc.add_paragraph(x,style='List Bullet')
doc.add_paragraph('Conclusión',style='Heading 2')
doc.add_paragraph('El proyecto demuestra un avance tangible en la aplicación Android y una dirección clara para integrar contenido, usuarios y resultados. El siguiente hito debe concentrarse en convertir el prototipo administrativo y los contratos técnicos en un entorno productivo conectado, con seguridad, roles y despliegue definidos.')

alt_texts = [
    'Diagrama del flujo principal: carga, inicio de sesión, menú, misiones, actividad, resultado y sincronización.',
    'Diagrama UML simplificado de Usuario, Alumno, Institución, Misión, Progreso, Intento y Catálogo.',
    'Diagrama UML de variables de PlayerSession, AppSettings, StarHuntSession y MissionProgress.',
    'Diagrama de casos de uso para Alumno y Administrador.',
]
for shape, alt in zip(doc.inline_shapes, alt_texts):
    doc_pr = shape._inline.docPr
    doc_pr.set('descr', alt)
    doc_pr.set('title', alt.split('.')[0])

for table in doc.tables:
    set_repeat(table.rows[0])
    for row in table.rows:
        for cell in row.cells:
            for p in cell.paragraphs:
                p.paragraph_format.space_after=Pt(2); p.paragraph_format.line_spacing=1.0
                for r in p.runs: r.font.name='Arial'; r._element.rPr.rFonts.set(qn('w:ascii'),'Arial'); r._element.rPr.rFonts.set(qn('w:hAnsi'),'Arial'); r.font.size=Pt(9)

doc.core_properties.title='Informe de avances - Caza Estelar'
doc.core_properties.subject='Aplicación del juego y aplicación administrativa'
doc.core_properties.author='Equipo Caza Estelar'
doc.save(OUT)
print(OUT)

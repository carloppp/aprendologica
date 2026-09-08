# Caza Estelar

Base técnica en Java y libGDX para Android horizontal.

## Estado actual

- Pantalla de carga y precarga de recursos.
- Acceso libre de prueba mediante el botón `Iniciar sesión`, sin solicitar una cuenta.
- Menú principal provisional.
- Navegación desacoplada y servicio de autenticación sustituible.
- Interfaz provisional independiente de los recursos gráficos finales.
- Fondo ilustrado original del observatorio para carga, acceso y menú.
- Tipografía Nunito renderizada con FreeType para texto nítido.
- Transiciones de entrada, estrellas pulsantes y respuesta animada del botón.
- Lluvia diagonal de estrellas cian, doradas y violetas.
- Logo aprobado de Tojil utilizado como icono de Android; el panel de acceso permanece limpio y sin mascota flotante.
- Acceso simplificado con `Explorax`, `Caza estelar`, usuario, contraseña y botón de entrada.
- Escena Full HD de constelaciones para el acceso y fondo Full HD del observatorio para el menú, ambos con controles a la derecha.
- Transición de viaje estelar veloz: oculta el acceso, amplía hacia las estrellas, atraviesa un túnel sobre azul marino `#040820` y se acerca al observatorio.
- Tipografía infantil Fredoka bajo licencia SIL OFL y botones 3D limpios, sin líneas curvas decorativas.
- La carga inicial vuelve a presentar el logo de Explorax con su animación y progreso.
- El acceso conserva estable la escena exterior de constelaciones; después de iniciar sesión, el viaje hace entrar la imagen completa del observatorio y el menú mantiene ese encuadre.
- Panel de cristal y botones redondeados de alta resolución.
- Filtrado lineal para fondos, logo y controles, evitando bordes pixelados.
- Primera misión replanteada: orientar una mira de telescopio, capturar tres estrellas brillantes y recibir una celebración inmediata.
- Inicio y menú utilizan ilustraciones Full HD completas con movimiento cinematográfico e iluminaciones radiales suaves, sin cruces, polvo superpuesto ni deformación de personajes.
- Ajustes globales desplegables en la esquina superior izquierda: Español/English, sonido activado/desactivado y cierre de sesión cuando hay una sesión activa. El botón de cierre ya no ocupa espacio en el menú principal.

El acceso permite escribir usuario y contraseña, pero todavía no valida credenciales. También se puede entrar con ambos campos vacíos como `Explorador`.

## Requisitos para ejecutar

- Android Studio con JDK 17.
- Android SDK 35.
- Gradle compatible con Android Gradle Plugin 8.7.3.

Abrir esta carpeta (`Proyecto`) desde Android Studio, sincronizar Gradle y ejecutar el módulo `android` en un dispositivo o emulador API 26 o posterior.

Los recursos visuales se incorporarán dentro de `assets/` cuando el paquete adjunto vuelva a estar disponible.

## Aviso sobre el APK existente

El archivo `CazaEstelar-debug.apk` existente corresponde a una compilación anterior. Las mejoras visuales actuales están validadas en código, pero no se generará un APK nuevo hasta que el usuario lo solicite.

## Alcance excluido por ahora

- Backend y base de datos.
- Registro o recuperación de contraseña.
- Persistencia de sesión y progreso.
- Niveles posteriores, energía estelar y progreso persistente.

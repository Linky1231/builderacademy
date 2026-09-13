# Correcciones de chat, navegación y foro

## Resultado
- La foto y el nombre quedarán agrupados junto a su propio mensaje o archivo, tanto en mensajes propios como ajenos.
- Los cambios entre Clases, Foro, Administración y Perfil reutilizarán la sesión ya comprobada y precargarán la siguiente pantalla al señalar sus accesos.
- El logotipo de la página principal permanecerá completamente estático.
- Las imágenes del foro conservarán su proporción y se mostrarán completas, sin recorte.

## Implementación
- Reordenar cada fila del chat como dos bloques inseparables: identidad y contenido; invertir el orden completo para mensajes propios sin separar sus elementos.
- Guardar temporalmente la comprobación de sesión y rol en la caché compartida, limpiándola al cerrar sesión, y activar la precarga por intención en la navegación.
- Mantener desactivada la clase de flotación del logotipo en el acceso.
- Sustituir el ajuste de recorte del foro por un ajuste proporcional de altura automática.

## Validación
- Comprobar compilación y estado del sitio.
- Revisar visualmente el chat y el foro en pantalla móvil, además del cambio entre secciones.

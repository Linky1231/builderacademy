# Actualización de Builder Academy

## Objetivo
Convertir cada clase en una experiencia unificada con una sala de chat propia, ampliar la administración y usar el logo adjunto como identidad principal.

## Cambios principales
- Sustituir el logo actual por la imagen adjunta en acceso, navegación, perfil y estados vacíos relevantes.
- Mantener la relación elegida: cada clase incluye exactamente una sala de chat; crear o eliminar una clase crea o elimina su sala y contenido asociado.
- Rediseñar el aula para que el chat ocupe toda la altura y anchura útil de la pantalla, con cabecera, conversación, archivos y cuadro de envío integrados.
- Permitir adjuntar imágenes y documentos sin filtro por extensión, con límites seguros de tamaño.
- Mostrar imágenes directamente en los mensajes y ofrecer vista o descarga para PDF, audio, video y otros documentos cuando el navegador lo permita.
- Añadir estados claros de carga, subida, error, sala cerrada y archivo no previsualizable.

## Panel de administración
- Organizar el panel en resumen, clases y salas, creación/edición, recursos y estudiantes.
- Crear clases con título, descripción, categoría, fecha, duración y estado; su sala queda disponible automáticamente.
- Cambiar una clase/sala entre disponible, en vivo y cerrada.
- Abrir una clase directamente desde administración para moderar su conversación.
- Eliminar clases y sus salas mediante confirmación explícita; también se eliminan mensajes y registros de recursos asociados.
- Gestionar archivos de recursos por clase: subir, visualizar y eliminar.
- Mejorar búsquedas, filtros por estado y presentación adaptable a móvil y escritorio.

## Datos y seguridad
- Crear el almacenamiento privado faltante para adjuntos del chat y limitar el tamaño por archivo.
- Guardar el tipo de archivo junto al adjunto para elegir una vista previa segura.
- Añadir permisos para que participantes vean y suban archivos únicamente en salas abiertas, y administradores puedan gestionarlos.
- Mantener las acciones administrativas protegidas por rol en la base de datos.
- Limpiar los archivos almacenados al eliminar mensajes, recursos o clases para evitar contenido huérfano.

## Validación
- Probar creación, edición, cierre, apertura y eliminación como administrador.
- Probar envío y visualización de imágenes y documentos en una sala abierta.
- Confirmar que estudiantes no pueden gestionar clases ni publicar en salas cerradas.
- Revisar el chat y el panel en móvil y escritorio, además de compilación y errores del navegador.

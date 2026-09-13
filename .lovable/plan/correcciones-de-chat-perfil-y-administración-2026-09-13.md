# Correcciones de chat, perfil y administración

## Qué se cambiará

- Mostrar en cada mensaje del aula la foto de perfil y el nombre del autor en el mismo renglón que el contenido o archivo compartido.
- Compactar la cabecera del aula en móvil y ajustar la altura disponible para que conversación y área de escritura permanezcan visibles.
- Evitar que los campos de fecha y hora desborden sus paneles en administración.
- Añadir en “Tu identidad de creador” un botón claro para volver a Clases sin guardar.
- Mantener estáticos el logotipo y el nombre de Builder Academy en la pantalla de acceso.

## Detalles técnicos

- Resolver las imágenes de perfil mediante las rutas ya guardadas en el perfil y conservar un fallback visual cuando no exista foto.
- Aplicar una estructura móvil de altura dinámica y áreas internas desplazables, respetando la vista de escritorio.
- Limitar el ancho mínimo de los campos `datetime-local` y sus contenedores.
- Usar la navegación existente y los componentes de botón actuales.
- Verificar compilación y revisar visualmente acceso, perfil, administración y aula en móvil y escritorio.
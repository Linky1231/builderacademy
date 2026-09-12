# Builder Academy

## Objetivo
Crear una academia online privada para aprender Builda, con acceso por cuenta, incorporación obligatoria, clases conversacionales en tiempo real y administración segura.

## Experiencia principal
- Sustituir la pantalla vacía por una portada de acceso de Builder Academy.
- Permitir registro e inicio de sesión con Google y correo/contraseña para pruebas.
- Exigir al primer acceso completar nombre de usuario, avatar e ID de Builda antes de mostrar las clases.
- Mostrar un panel de estudiante con clases agrupadas en `En vivo`, `Disponibles` y `Cerradas`.
- Abrir cada clase como una experiencia de aprendizaje con conversación en tiempo real, mensajes, archivos y recursos adjuntos.
- Mostrar estados vacíos, carga, errores y restricciones de acceso con textos claros.

## Administración
- Reconocer de forma segura a `judithereyes534@gmail.com` como administradora cuando esa cuenta se registre.
- Añadir una vista administrativa para crear chats/clases, editar su temática y cambiar su estado entre en vivo, disponible y cerrada.
- Permitir abrir o cerrar una clase al instante y reflejar el cambio para estudiantes conectados.
- Incluir un directorio de estudiantes con avatar, nombre de usuario e ID de Builda.

## Datos, seguridad y tiempo real
- Activar Lovable Cloud para cuentas, base de datos, almacenamiento y actualizaciones en tiempo real.
- Crear perfiles, roles separados, clases, mensajes y recursos con permisos por usuario y por rol.
- Proteger las acciones administrativas en el servidor y en la base de datos; no confiar en controles del navegador.
- Crear almacenamiento para avatares y adjuntos con límites de tipo/tamaño y acceso acorde a la clase.
- Bloquear el contenido privado hasta completar el perfil y cerrar correctamente sesión borrando datos temporales.

## Dirección visual
- Aplicar estrictamente la guía adjunta: negro profundo, brillo radial azul noche, rejilla azul tenue, paneles azul noche, superficies azul acero y acentos azul hielo.
- Usar títulos blancos o azul hielo, cuerpo gris claro y controles azules con estados visibles de foco y brillo.
- Mantener paneles de 20–24 px, profundidad azul suave, jerarquía clara y diseño adaptable a móvil y escritorio.
- Crear una identidad gráfica propia de Builder Academy, vinculada a construcción y aprendizaje, evitando iconografía genérica de IA.

## Detalles técnicos
- Mantener TanStack Start y rutas públicas de acceso, incorporación protegida, panel, clase y administración.
- Componer la conversación con AI Elements y adaptar sus piezas a la identidad visual.
- Añadir metadatos únicos a cada página pública o navegable.
- Incluir datos iniciales de ejemplo para que el panel muestre los tres estados desde el primer uso.
- Validar compilación, permisos, acceso de estudiante/administradora, mensajería y vistas móvil/escritorio.

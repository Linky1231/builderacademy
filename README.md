# Builda Creator Academy

Crea Builder Academy, una academia en línea para formar creadores y profesionales en Builda (un motor de juegos y red social).

Sigue estrictamente la paleta de colores y guía de estilo visual adjunta:
- Fondo principal: Negro profundo (#000000) con degradado radial #0F1927 y rejilla tenue en azul oscuro.
- Paneles y tarjetas: Azul noche (#0F1927) con bordes rgba(123, 182, 240, 0.12), bordes redondeados (20-24px) y sombra azul suave.
- Superficies secundarias: Azul acero (#193961).
- Botones primarios: Fondo #2F68B6, texto blanco (#FFFFFF), hover #7BB6F0.
- Botones secundarios: Fondo transparente, borde #2F68B6, texto #7BB6F0.
- Tipografía: Títulos en blanco (#FFFFFF) o Azul hielo (#7BB6F0) con peso 700-800. Texto regular en gris claro (#C8D4E3) y secundario (#8EA3B8).
- Iconos y detalles: Azul hielo (#7BB6F0) con efectos de brillo cian.

Requisitos y funcionalidades de la aplicación:
1. Autenticación y Perfil Obligatorio:
   - Inicio de sesión con Google (y opción con email/demo para pruebas).
   - Flujo de incorporación obligatorio tras registrarse para completar el perfil antes de acceder al contenido:
     * Nombre de usuario
     * Foto de perfil (subida de avatar)
     * ID de su cuenta de Builda
2. Chats y Clases de Aprendizaje:
   - Panel principal para estudiantes con lista de clases/chats disponibles organizados por estado (en vivo, disponibles, cerradas).
   - Sistema de chat en vivo por cada clase/sesión de aprendizaje, con mensajes en tiempo real, recursos adjuntos y estado de sesión.
3. Panel y Controles de Administrador:
   - Administrador predeterminado: judithereyes534@gmail.com (con acceso a vista de administración).
   - Crear nuevos chats y convertirlos en clases o sesiones de aprendizaje temáticas.
   - Control de estado en tiempo real para abrir o cerrar cualquier clase en cualquier momento, gestionando el acceso de los estudiantes.
   - Vista de estudiantes registrados con sus IDs de Builda y perfiles.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://builderacademy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/baf247de-d9a5-41f5-803b-1bec6b29c789).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

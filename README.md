# Quest - Comunidad de Crecimiento Espiritual

Quest es una aplicación web diseñada para fomentar la disciplina espiritual y el crecimiento comunitario a través del seguimiento de hábitos diarios (lectura y oración) y la responsabilidad compartida.

## 🌟 Características Principales

- **Seguimiento Diario:** Registro simple de lectura bíblica y tiempo de oración.
- **Gamificación:** Sistema de rachas (fuego 🔥) para motivar la consistencia.
- **Muro de Responsabilidad:** Visualización transparente de las penalizaciones por incumplimiento.
- **Comunidad:** Feed de actividad para ver el progreso de otros miembros.
- **Gestión de Planes:** Sistema flexible para crear y seguir planes de lectura.
- **Penalizaciones:** Cálculo automático de deudas por días fallidos (excluyendo domingos).

## 🛠️ Tecnologías

- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Shadcn UI.
- **Backend:** Supabase (PostgreSQL, Auth, Realtime).
- **Base de Datos:** PostgreSQL con funciones RPC y Triggers para lógica de negocio.
- **PWA:** Soporte para instalación en dispositivos móviles.

## 🚀 Comenzando

### Prerrequisitos

- Node.js 18+
- Cuenta de Supabase

### Instalación

1.  Clonar el repositorio:

    ```bash
    git clone https://github.com/tu-usuario/quest.git
    cd quest
    ```

2.  Instalar dependencias:

    ```bash
    npm install
    ```

3.  Configurar variables de entorno:
    Crear un archivo `.env.local` con las credenciales de Supabase:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
    ```

4.  Iniciar el servidor de desarrollo:
    ```bash
    npm run dev
    ```

## 📚 Documentación

La documentación detallada de los módulos se encuentra en la carpeta `docs/`:

- [01 - Gestión de Planes](docs/01-gestion-de-planes.md)
- [02 - Historial y Estadísticas](docs/02-historial-y-estadisticas.md)
- [03 - Gamificación y Comunidad](docs/03-gamificacion-comunidad.md)
- [04 - Gestión de Penalizaciones](docs/04-gestion-penalizaciones.md)
- [05 - Muro de Actividad](docs/05-muro-actividad.md)
- [06 - Configuración de Admin](docs/06-configuracion-admin.md)
- [07 - Plan de Pulido UX](docs/07-plan-pulido-ux.md)
- [08 - Gamificación de Perfil](docs/08-gamificacion-perfil.md)
- [09 - Configuración PWA](docs/09-configuracion-pwa.md)

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, abre un issue o un pull request para sugerir cambios o mejoras.

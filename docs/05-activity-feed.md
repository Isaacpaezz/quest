# Módulo: Muro de Actividad de la Comunidad

## 1. Visión General

El Muro de Actividad será una página de tipo "feed" social que mostrará en orden cronológico inverso las acciones clave que los miembros de la comunidad realizan dentro de la aplicación. Su objetivo es aumentar la interacción, la visibilidad del esfuerzo y el sentido de comunidad activa.

## 2. Características Principales

- **Feed Cronológico:** Las acciones más recientes aparecerán en la parte superior.
- **Tipos de Eventos a Mostrar:**
  - **[Usuario]** ha completado su lectura de hoy: **[Capítulo]**.
  - **[Usuario]** ha completado su tiempo de oración de hoy.
  - **[Usuario]** ha compartido su resumen sobre **[Capítulo]**. (El resumen podría ser visible al hacer clic).
  - **[Usuario]** ha completado su misión del día (ambas tareas).
- **Interactividad (Futura):** Posibilidad de añadir "Ánimos" (equivalente a "Me gusta") a las acciones de otros.

## 3. Implementación Técnica Propuesta

1.  **Nueva Tabla en la Base de Datos: `actividad_comunidad`**
    -   `id`: Clave primaria.
    -   `usuario_id`: Foreign key a `perfiles.id`.
    -   `tipo_actividad`: ENUM ('lectura_completada', 'oracion_completada', 'resumen_enviado', 'mision_diaria_completada').
    -   `contenido_id`: Foreign key a `progreso_usuario.id` para enlazar con el contexto.
    -   `creado_en`: Timestamp para ordenar el feed.

2.  **Modificación de Server Actions Existentes:**
    -   Actualizar `registrarProgresoLecturaAction` para que, además de guardar el progreso, inserte un nuevo registro en `actividad_comunidad` con el tipo 'resumen_enviado'.
    -   Actualizar `actualizarProgresoOracionAction` para que inserte un registro cuando la oración se complete.

3.  **Nueva Página de Interfaz: `/comunidad/feed`**
    -   Un Componente de Servidor que obtiene los últimos 50 registros de `actividad_comunidad`, haciendo un `JOIN` con `perfiles` para obtener los nombres de usuario.
    -   Un Componente de Cliente que renderiza cada evento en una tarjeta de actividad.
    -   (Futuro) Implementar "scroll infinito" para cargar más actividades a medida que el usuario baja.
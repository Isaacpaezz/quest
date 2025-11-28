# Módulo: Muro de Actividad de la Comunidad

## 1. Visión General

El Muro de Actividad es una página de tipo "feed" social que muestra en orden cronológico inverso las acciones clave que los miembros de la comunidad realizan dentro de la aplicación. Su objetivo es aumentar la interacción, la visibilidad del esfuerzo y el sentido de comunidad activa.

## 2. Características Implementadas

- **Feed Cronológico:** Las acciones más recientes aparecen en la parte superior.
- **Héroes del Día:** Sección especial que destaca a los usuarios que completaron ambas misiones (lectura y oración) el día actual.
- **Tipos de Eventos:**
  - **Lectura Completada:** Muestra el capítulo leído y el resumen del usuario.
  - **Oración Completada:** Indica que el usuario completó su tiempo de oración.
- **Interactividad Social:**
  - Sistema de likes en las actividades
  - Sistema de comentarios en las actividades
  - Contadores de likes y comentarios con actualización automática

## 3. Implementación Técnica

### 3.1 Estructura de Base de Datos

**Tabla `actividad_comunidad`:**
- `id`: Clave primaria (bigint)
- `usuario_id`: Foreign key a `perfiles.id`
- `tipo_actividad`: ENUM ('lectura_completada', 'oracion_completada')
- `referencia_contenido`: Texto con la referencia (ej: "Levítico 5")
- `resumen_actividad`: Texto con el resumen o descripción de la actividad
- `likes_count`: Contador de likes (actualizado automáticamente)
- `comentarios_count`: Contador de comentarios (actualizado automáticamente)
- `creado_en`: Timestamp UTC (convertido a zona horaria de Venezuela en el frontend)

**Tablas de Interacción Social:**
- `comunidad_likes`: Almacena los likes con constraint único por usuario/actividad
- `comunidad_comentarios`: Almacena los comentarios en las actividades

### 3.2 Server Actions

Las acciones del servidor registran automáticamente las actividades:
- `registrarProgresoLecturaAction`: Inserta registro de tipo 'lectura_completada'
- `actualizarProgresoOracionAction`: Inserta registro de tipo 'oracion_completada' cuando se completa

### 3.3 Página del Feed (`/feed`)

**Componente de Servidor (`page.tsx`):**
- Obtiene actividades con contadores de likes y comentarios (límite: 100)
- Calcula los "Héroes del Día" filtrando usuarios que completaron ambas misiones
- Agrupa actividades por fecha en zona horaria de Venezuela
- **Importante:** Usa la función `getTodayInVenezuela()` para consistencia en el filtrado de fechas

**Componente Cliente (`feed-client.tsx`):**
- Renderiza la sección de "Héroes del Día" con avatares y coronas
- Muestra el feed agrupado por fechas (Hoy, Ayer, fecha específica)
- Tarjetas de actividad con likes y comentarios interactivos

## 4. Manejo de Zonas Horarias

**Crítico:** El sistema usa la zona horaria de Venezuela (UTC-4) de manera consistente:
- La función `getTodayInVenezuela()` retorna la fecha en formato `YYYY-MM-DD`
- Todas las comparaciones de fechas convierten timestamps UTC a hora de Venezuela
- Los filtros de "hoy" usan la misma lógica para evitar inconsistencias

**Fix Nov 2025:** Corregido el bug donde los héroes del día no se mostraban correctamente debido a conversiones de fecha inconsistentes. Ahora todas las páginas usan `getTodayInVenezuela()` para mantener consistencia.

## 5. Características Futuras

- Scroll infinito para cargar más actividades
- Notificaciones en tiempo real cuando alguien comenta o da like
- Posibilidad de compartir actividades fuera de la plataforma
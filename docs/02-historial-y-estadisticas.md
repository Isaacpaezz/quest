# Módulo: Historial y Estadísticas

## 1. Visión General

Este módulo proporcionará vistas históricas y estadísticas sobre los planes de lectura completados y la participación de los usuarios. El objetivo es fomentar un sentido de logro y proporcionar datos para la gamificación.

## 2. Historial de Planes Completados

### Requisito

El sistema debe mantener un registro de todos los planes de lectura que se han completado exitosamente. Los administradores y usuarios deben poder ver qué libros se han leído en el pasado, en qué fechas y quiénes participaron.

### Implementación Propuesta

1.  **Modificación de la Base de Datos:**
    -   El estado `inactivo`  actual es ambiguo. Se debe refinar el `ENUM` de `plan_estado` para incluir un estado final, como `completado`.
    -   Cuando el cron job `transicion_automatica_de_plan`  finalice un plan, su estado cambiará de `activo` a `completado` en lugar de `inactivo`.

2.  **Interfaz de Administrador:**
    -   Crear una nueva sección en el panel de administración llamada "Historial de Planes".
    -   Esta vista mostrará una tabla de todos los planes con estado `completado` .

3.  **Interfaz de Usuario:**
    -   Crear una página accesible para todos los usuarios que muestre una línea de tiempo visual de los libros leídos por la comunidad.

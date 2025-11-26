# Módulo: Perfil de Usuario 2.0 - Gamificación

## 1. Visión General

Esta actualización transforma la página de perfil en un dashboard de logros personales. El objetivo es proporcionar al usuario métricas claras y motivadoras sobre su consistencia y progreso a lo largo del tiempo.

## 2. Métricas Clave a Implementar

- **Racha Actual (Streak):** Número de días consecutivos en los que el usuario ha completado ambas tareas.
- **Total de Misiones Completadas:** Conteo histórico de todos los días en que se completaron ambas tareas.

## 3. Arquitectura

- La página del servidor (`/perfil/page.tsx`) se encargará de realizar las consultas a la base de datos y los cálculos complejos (como la racha).
- Los datos procesados se pasarán al componente de cliente (`user-profile.tsx`), que se actualizará para mostrar las nuevas estadísticas en una sección dedicada.
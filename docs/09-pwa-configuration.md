# Módulo: Implementación de Progressive Web App (PWA)

## 1. Visión General

El objetivo es transformar la aplicación web "Quest" en una PWA. Esto permitirá a los usuarios "instalar" la aplicación en la pantalla de inicio de sus dispositivos, proporcionando una experiencia de usuario más cercana a la de una app nativa, acceso sin conexión básico y un mejor rendimiento.

## 2. Pila Tecnológica

- **Librería:** `@ducanh2912/next-pwa` (una bifurcación bien mantenida y compatible con las últimas versiones de Next.js y Turbopack).

## 3. Artefactos Clave

- **`next.config.mjs`:** Actualizado para inyectar la lógica de PWA en el proceso de build.
- **`public/manifest.json`:** El archivo de manifiesto que describe la aplicación al sistema operativo (nombre, iconos, colores, etc.).
- **Iconos:** Un conjunto de iconos de la aplicación en varios tamaños.
- **Service Worker:** Generado automáticamente por la librería para manejar el cacheo y la funcionalidad offline.
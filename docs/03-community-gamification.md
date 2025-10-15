# Módulo: Página de Comunidad y Gamificación

## 1. Visión General

Esta página es el centro social de la aplicación. Proporciona una visión transparente del progreso diario de todos los miembros y del estado de las penalizaciones, fomentando un entorno de responsabilidad y motivación mutua.

## 2. Componentes de la Interfaz

- **El Pulso de Hoy:** Una tabla que muestra el estado de completado (lectura y oración) de cada usuario para el día actual en tiempo real.
- **Muro de la Responsabilidad:** Una tabla que resume las penalizaciones pendientes, agrupadas por usuario, para mostrar la deuda total acumulada.
- **Salón de la Fama:** (Futuro) Un espacio para destacar logros, como rachas de cumplimiento o finalización de planes.

## 3. Arquitectura de Datos

- La página (`/comunidad`) será un Componente de Servidor que obtiene todos los datos necesarios en una sola carga.
- Se realizarán consultas concurrentes a `perfiles`, `progreso_usuario` y `penalizaciones`.
- Los datos se procesarán y combinarán en el servidor antes de pasarlos a un Componente de Cliente para su renderización, optimizando el rendimiento.
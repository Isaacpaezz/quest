# Módulo: Gestión de Planes de Lectura

## 1. Visión General

Este módulo permite a los administradores crear, visualizar y gestionar los planes de lectura para toda la comunidad. La característica principal es la automatización completa del calendario de lectura, eliminando la necesidad de cálculos manuales.

## 2. Arquitectura de Datos

- **Tabla:** `planes_lectura`
- **Columna de Estado:** Se modifica la columna `esta_activo` (booleano) por una columna `estado` de tipo `ENUM('inactivo', 'activo', 'proximo')` para permitir la programación de planes futuros.

## 3. Lógica de Negocio

- **Creación:** Se realiza a través de una Server Action de Next.js que llama a una función RPC de Supabase (`crear_plan_con_capitulos`) para garantizar una transacción atómica.
- **Calendarización:** La lógica omite los domingos y calcula automáticamente la fecha de fin.
- **Transición:** Un cron job diario verificará si el plan activo ha finalizado para promover automáticamente el plan 'próximo' a 'activo'.
# Módulo: Gestión de Penalizaciones (Admin)

## 1. Visión General

Este módulo proporciona al administrador las herramientas necesarias para gestionar las penalizaciones generadas por el sistema. La funcionalidad principal es permitir al administrador marcar las penalizaciones como 'pagadas', cerrando así el ciclo de responsabilidad.

## 2. Arquitectura

- **Página de Interfaz:** `/admin/penalizaciones`.
- **Lógica de Negocio:** Una Server Action (`marcarComoPagadaAction`) que invoca una función RPC (`marcar_penalizacion_pagada`) en Supabase para garantizar una actualización atómica y segura.
- **Seguridad:** El acceso a la página y la capacidad para ejecutar la acción están restringidos a usuarios con el rol de 'admin'.
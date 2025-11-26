# Módulo: Configuración de la Aplicación (Admin)

## 1. Visión General

Este módulo proporciona una interfaz para que el administrador gestione las configuraciones globales de la aplicación. La primera y más importante configuración es el `monto_penalizacion`.

## 2. Arquitectura

- **Página de Interfaz:** `/admin/configuracion`.
- **Lógica de Negocio:** Una Server Action (`actualizarConfiguracionAction`) que valida y actualiza los valores en la tabla `configuracion_app`.
- **Seguridad:** El acceso y la capacidad de modificación están restringidos a usuarios con el rol de 'admin'.
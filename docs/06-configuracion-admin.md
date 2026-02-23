# Módulo: Configuración de la Aplicación (Admin)

## 1. Visión General

Este módulo proporciona una interfaz para que el administrador gestione todas las configuraciones del grupo. Incluye penalizaciones, sistema de XP, métodos de recuperación, zona horaria y días libres.

## 2. Arquitectura

- **Página de Interfaz:** `/admin/configuracion`.
- **Lógica de Negocio:** Una Server Action (`actualizarConfiguracionAction`) que valida con Zod y upserta los valores en la tabla `configuracion_app`.
- **Seguridad:** El acceso está restringido a usuarios con rol `admin` en `miembros_grupo`.

## 3. Secciones del Formulario

### Modo de Penalización
- Tipo de penalización (dinero o puntos)
- Monto por incumplimiento

### Puntos XP por Actividad
- XP por lectura y oración
- XP bonus por oración larga + minutos para bonus
- XP devocional completo y reto completado
- Multiplicador de racha y máximo XP por racha

Ver documentación detallada: `docs/developer/xp-system.md`

### Canjeo y Recuperación
- Tasa de canjeo (puntos → dinero)
- Costo de recuperación (XP y dinero)
- Máximo de recuperaciones por mes
- Métodos de recuperación (multi-select)

### Zona Horaria
- Timezone IANA del grupo (determina inicio/fin de cada día)

### Días Libres
- Selector de días (Dom-Sáb) que no requieren lectura ni oración
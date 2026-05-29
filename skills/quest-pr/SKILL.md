---
name: quest-pr
description: >
  Crea Pull Requests para Quest siguiendo el template y convenciones del proyecto.
  Trigger: Al crear PRs, revisar requisitos de PR, o llenar template de PR.
license: MIT
metadata:
  author: quest
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Create a PR with gh pr create"
    - "Review PR requirements"
    - "Fill .github/pull_request_template.md"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## Reglas Críticas

- SIEMPRE escribir el PR en **español**
- SIEMPRE llenar todas las secciones del template
- SIEMPRE marcar los checkboxes que apliquen
- SIEMPRE actualizar CHANGELOG.md si hay cambios funcionales

---

## Proceso de Creación de PR

1. **Analizar cambios**: `git diff main...HEAD` para entender TODOS los commits
2. **Determinar componentes afectados**: Frontend, Backend (Supabase), UI, Config
3. **Llenar secciones del template** basado en cambios
4. **Crear PR** con `gh pr create`

## Estructura del Template

```markdown
## Contexto

{¿Por qué este cambio? Enlace a issues si aplica}

## Descripción

{Resumen de cambios y dependencias}

## Pasos para Revisar

{Cómo probar/verificar los cambios}

## Checklist

### General

- [ ] El código sigue las convenciones del proyecto
- [ ] Los tests pasan localmente (si aplica)
- [ ] Se actualizó CHANGELOG.md si aplica

### Frontend (Next.js / React)

- [ ] Componentes "Use Client" solo donde es necesario
- [ ] Server Actions para mutaciones de datos
- [ ] Diseño responsive (mobile-first) verificado
- [ ] Accesibilidad básica (aria-labels, contrastes)

### UI (Tailwind / shadcn)

- [ ] Uso de tokens de diseño (variables CSS)
- [ ] Soporte para modo oscuro verificado
- [ ] Componentes reutilizables en lugar de duplicación

### Backend (Supabase)

- [ ] Migraciones SQL creadas y probadas
- [ ] Políticas RLS configuradas correctamente
- [ ] Tipos de base de datos actualizados (`npm run gen:types` si aplica)

```

## Reglas por Componente

| Componente    | Verificaciones Clave                              |
| ------------- | ------------------------------------------------- |
| Next.js       | Server vs Client components, Metadata             |
| Supabase      | RLS policies, Migrations, Auth flow               |
| Tailwind      | Uso de @theme, variantes oscuras                  |
| PWA           | Manifest, Service Worker updates                  |

## Comandos

```bash
# Ver estado de la rama
git status
git log main..HEAD --oneline

# Ver diff completo
git diff main...HEAD

# Crear PR
gh pr create --title "feat(app): agregar dashboard" --body "$(cat <<'EOF'
## Contexto

Implementar dashboard principal para usuarios.

## Descripción

- Componente de resumen de actividad
- Gráfico de progreso semanal
- Integración con Supabase para datos reales

## Pasos para Revisar

1. Login como usuario normal
2. Ir a /dashboard
3. Verificar carga de datos

## Checklist

- [x] Responsive verificado
- [x] RLS policies probadas
EOF
)"

# Crear PR en borrador
gh pr create --draft --title "feat: descripción"
```

## Convenciones de Título

Seguir conventional commits (en español):

| Tipo        | Uso                        |
| ----------- | -------------------------- |
| `feat:`     | Nueva funcionalidad        |
| `fix:`      | Corrección de bug          |
| `docs:`     | Documentación              |
| `chore:`    | Mantenimiento              |
| `refactor:` | Reestructuración de código |
| `test:`     | Tests                      |
| `perf:`     | Rendimiento                |

**Ejemplos de títulos (en español):**

```
feat(app): agregar dashboard
fix(auth): corregir redirección en login
docs: actualizar guía de PWA
chore(deps): actualizar Next.js a 16.1
refactor(components): extraer Card a componente reutilizable
```

## Antes de Crear el PR

1. ✅ Build pasa (`npm run build`)
2. ✅ Linting pasa (`npm run lint`)
3. ✅ CHANGELOG actualizado (si aplica)
4. ✅ Rama está al día con main
5. ✅ Commits son limpios y descriptivos

## Recursos

- **Convenciones de commit**: Ver skill `quest-commit`

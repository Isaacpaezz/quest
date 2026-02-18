---
name: quest-commit
description: >
  Crea commits profesionales siguiendo el formato conventional-commits.
  Trigger: Al crear commits, después de completar cambios, cuando el usuario pide hacer commit.
license: MIT
metadata:
  author: quest
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Creating a git commit"
    - "Committing changes"
allowed-tools: Read, Glob, Grep, Bash
---

## Reglas Críticas

- SIEMPRE usar conventional-commits: `tipo(alcance): descripción`
- SIEMPRE escribir mensajes en **español**
- SIEMPRE mantener primera línea bajo 72 caracteres
- SIEMPRE pedir confirmación antes de hacer commit
- NUNCA ser muy específico (evitar "6 archivos", "3 componentes")
- NUNCA incluir detalles de implementación en el título
- NUNCA usar `git push --force` (destructivo)
- NUNCA ofrecer hacer commit proactivamente - esperar que el usuario lo pida

---

## Formato de Commit

```
tipo(alcance): descripción concisa en español

- Cambio clave 1
- Cambio clave 2
- Cambio clave 3
```

### Tipos

| Tipo       | Cuándo Usar                          |
| ---------- | ------------------------------------ |
| `feat`     | Nueva funcionalidad                  |
| `fix`      | Corrección de bug                    |
| `docs`     | Solo documentación                   |
| `chore`    | Mantenimiento, dependencias, configs |
| `refactor` | Cambio de código sin feat/fix        |
| `test`     | Agregar o actualizar tests           |
| `perf`     | Mejora de rendimiento                |
| `style`    | Formato, sin cambio de código        |

### Alcances (Quest)

| Alcance      | Cuándo                                    |
| ------------ | ----------------------------------------- |
| `app`        | Cambios en `src/app/`                     |
| `components` | Cambios en `src/components/`              |
| `lib`        | Cambios en `src/lib/`                     |
| `auth`       | Cambios relacionados con autenticación    |
| `supabase`   | Cambios en `supabase/` o migraciones      |
| `admin`      | Cambios en el panel de administración     |
| `public`     | Cambios en `public/` (assets, PWA)        |
| `config`     | Cambios en archivos de configuración      |
| `docs`       | Cambios en `docs/` o `README.md`          |
| `skills`     | Cambios en `skills/`                      |
| `ci`         | Cambios en workflows o scripts            |
| _omitir_     | Múltiples alcances o nivel raíz           |

---

## Ejemplos Buenos vs Malos

### Línea de Título

```
# BUENO - Conciso y claro (en español)
feat(app): agregar dashboard de usuario
fix(auth): corregir redirección después de logout
chore(config): actualizar next.config.ts
docs: actualizar guía de instalación
feat(components): implementar botón con variante outline
fix(supabase): corregir política RLS en perfiles

# MALO - Muy específico o en inglés
feat(app): add user dashboard with 3 widgets
chore(config): update next config to remove swcMinify
fix(auth): arreglar el bug en el login línea 45
```

### Cuerpo (Puntos)

```
# BUENO - Cambios de alto nivel en español
- Agregar manejo de errores en formulario de contacto
- Implementar validación con Zod
- Mejorar accesibilidad en modal de confirmación

# MALO - Muy detallado
- Agregar try/catch en línea 30
- Usar esquema Zod con min(5)
- Agregar aria-label="Confirmar" en el botón
```

---

## Flujo de Trabajo

1. **Analizar cambios**

   ```bash
   git status
   git diff --stat HEAD
   git log -3 --oneline  # Ver estilo de commits recientes
   ```

2. **Redactar mensaje de commit**
   - Elegir tipo y alcance apropiados
   - Escribir título conciso (< 72 chars) **en español**
   - Agregar 2-5 puntos para cambios significativos

3. **Presentar al usuario para confirmación**
   - Mostrar archivos a commitear
   - Mostrar mensaje propuesto
   - Esperar confirmación explícita

4. **Ejecutar commit**

   ```bash
   git add <archivos>
   git commit -m "$(cat <<'EOF'
   tipo(alcance): descripción en español

   - Cambio 1
   - Cambio 2
   EOF
   )"
   ```

---

## Árbol de Decisión

```
¿Un solo archivo cambió?
├─ Sí → Puede omitir cuerpo, solo título
└─ No → Incluir cuerpo con cambios clave

¿Múltiples alcances afectados?
├─ Sí → Omitir alcance: `feat: descripción`
└─ No → Incluir alcance: `feat(app): descripción`

¿Arreglando un bug?
├─ Visible al usuario → fix(alcance): descripción
└─ Interno/dev → chore(alcance): corregir descripción

¿Agregando documentación?
├─ Docs de código (docstrings) → Parte de feat/fix
└─ Docs standalone → docs: o docs(alcance):
```

---

## Comandos

```bash
# Ver estado actual
git status
git diff --stat HEAD

# Commit estándar
git add <archivos>
git commit -m "tipo(alcance): descripción"

# Commit multilínea
git commit -m "$(cat <<'EOF'
tipo(alcance): descripción

- Cambio 1
- Cambio 2
EOF
)"

# Enmendar último commit (mismo mensaje)
git commit --amend --no-edit

# Enmendar con nuevo mensaje
git commit --amend -m "nuevo mensaje"
```

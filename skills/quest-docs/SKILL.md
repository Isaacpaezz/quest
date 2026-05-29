---
name: quest-docs
description: >
  Documentación técnica y de usuario para Quest. Templates, API docs, help articles.
  Trigger: Al crear documentación, guías de usuario, o documentar APIs.
license: MIT
metadata:
  author: quest
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Writing documentation"
    - "Creating help articles"
    - "API documentation"
---

# Quest Docs — Documentación

## Estructura de Docs

```
docs/
├── developer/          ← Para desarrolladores
│   ├── setup.md        ← Guía de instalación
│   ├── architecture.md ← Arquitectura del proyecto
│   ├── database.md     ← Schema & migrations
│   └── api.md          ← API reference
├── user/               ← Para usuarios finales
│   ├── getting-started.md
│   ├── features.md
│   └── faq.md
└── changelog.md        ← Release notes
```

---

## Templates

### Developer Doc
```markdown
# [Feature Name]

## Overview
Brief description of what this feature does.

## Architecture
How it fits into the overall system.

## Database
Tables and relationships involved.

## Implementation
Key files and their purposes.

## Testing
How to test this feature.
```

### User Help Article
```markdown
# [¿Cómo hacer X?]

## Pasos
1. Paso 1
2. Paso 2
3. Paso 3

## Tips
- Consejo útil

## ¿Problemas?
Si algo no funciona, contacta al admin de tu grupo.
```

### Changelog Entry
```markdown
## [1.2.0] - 2025-XX-XX

### ✨ Nuevo
- Feature nueva

### 🐛 Corregido
- Bug fix

### 🔧 Cambios
- Mejora o refactor
```

---

## Reglas

- Documentación de usuario en **español**
- Documentación técnica puede ser en **español o inglés**
- Usar Markdown con headers claros
- Incluir screenshots cuando sea visual (Fase 2+)
- Actualizar changelog con cada release
- Docs viven en `docs/` en el repo

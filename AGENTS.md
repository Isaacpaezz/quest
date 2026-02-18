# KAIROS AI Agent Skills

> **Single Source of Truth** - Este archivo es el master para todos los asistentes AI.
> Run `./skills/setup.sh` para sincronizar a Claude, Gemini, Copilot y otros formatos.

Este repositorio provee AI agent skills para Claude Code, Antigravity, Cursor, Copilot y otros asistentes.
Las skills proporcionan contexto y patrones on-demand para trabajar con este codebase.

## Quick Start

Los agentes AI cargan automáticamente skills relevantes basándose en el contexto.
Para carga manual, lee el archivo SKILL.md directamente:

```bash
# Ver una skill específica
cat skills/kairos-crm/SKILL.md

# Sincronizar skills a todos los agentes
./skills/setup.sh --all
```

---

## Available Skills

### Generic Skills (Any Project)

| Skill        | Description                                | File                                   |
| ------------ | ------------------------------------------ | -------------------------------------- |
| `python`     | Python 3.9+ patterns and best practices    | [SKILL.md](skills/python/SKILL.md)     |
| `django`     | Django 5.2 models, views, forms, admin     | [SKILL.md](skills/django/SKILL.md)     |
| `django-drf` | Django REST Framework patterns             | [SKILL.md](skills/django-drf/SKILL.md) |
| `htmx`       | HTMX patterns, partial responses, triggers | [SKILL.md](skills/htmx/SKILL.md)       |
| `alpinejs`   | Alpine.js reactivity, x-data, x-on         | [SKILL.md](skills/alpinejs/SKILL.md)   |
| `tailwind`   | Tailwind CSS utilities, responsive design  | [SKILL.md](skills/tailwind/SKILL.md)   |
| `pytest`     | Fixtures, mocking, markers, parametrize    | [SKILL.md](skills/pytest/SKILL.md)     |
| `postgresql` | PostgreSQL + PostGIS + pgvector            | [SKILL.md](skills/postgresql/SKILL.md) |
| `systematic-debugging` | Root Cause Investigation & 4-Phase Debugging | [SKILL.md](skills/systematic-debugging/SKILL.md) |
| `security-review` | Security review checklist and best practices | [SKILL.md](skills/security-review/SKILL.md) |
| `astro`      | Astro 5.x SSG, components, content collections | [SKILL.md](skills/astro/SKILL.md)      |
| `remotion`   | Remotion video composition with React      | [SKILL.md](skills/remotion/SKILL.md)   |
| `vercel-deployment` | Vercel deployment, env vars, Edge/Serverless | [SKILL.md](skills/vercel-deployment/SKILL.md) |
| `dns-management` | DNS records (A, CNAME), TTL, domain migration | [SKILL.md](skills/dns-management/SKILL.md) |
| `astro-framework` | Islands architecture, content collections, SSR adapters | [SKILL.md](skills/astro-framework/SKILL.md) |
| `seo-audit` | SEO audit, technical SEO, on-page optimization | [SKILL.md](skills/seo-audit/SKILL.md) |
| `programmatic-seo` | Programmatic SEO, template pages at scale | [SKILL.md](skills/programmatic-seo/SKILL.md) |
| `seo-geo` | SEO + GEO (Generative Engine Optimization for AI search) | [SKILL.md](skills/seo-geo/SKILL.md) |
| `ui-ux-pro-max` | UI/UX design intelligence, palettes, fonts, charts | [SKILL.md](skills/ui-ux-pro-max/SKILL.md) |
| `api-integration-patterns` | OAuth2 lifecycle, backoff+jitter, circuit breaker, error taxonomy | [SKILL.md](skills/api-integration-patterns/SKILL.md) |
| `api-security` | API credential management, input validation, error sanitization | [SKILL.md](skills/api-security/SKILL.md) |
| `api-client` | REST client patterns, pagination, response transformation | [SKILL.md](skills/api-client/SKILL.md) |
| `health-check` | Health check patterns, liveness/readiness, connection testing | [SKILL.md](skills/health-check/SKILL.md) |
| `redis` | Redis best practices: data structures, caching, TTL, transactions | [SKILL.md](skills/redis/SKILL.md) |
| `django-celery` | Django Celery: task design, retries, DLQ, health checks, Sentry, Beat | [SKILL.md](skills/django-celery/SKILL.md) |
| `sentry` | Sentry error monitoring, debugging workflow, Celery/Django integration | [SKILL.md](skills/sentry/SKILL.md) |
| `railway-docs` | Fetch up-to-date Railway documentation for accurate answers | [SKILL.md](skills/railway-docs/SKILL.md) |

### Kairos-Specific Skills

| Skill                      | Description                                 | File                                                 |
| -------------------------- | ------------------------------------------- | ---------------------------------------------------- |
| `kairos`                   | Project overview, apps, architecture        | [SKILL.md](skills/kairos/SKILL.md)                   |
| `kairos-htmx`              | HTMX + Alpine patterns en Kairos            | [SKILL.md](skills/kairos-htmx/SKILL.md)              |
| `skill-creator`            | Create new AI agent skills                  | [SKILL.md](skills/skill-creator/SKILL.md)            |
| `kairos-django`            | Django patterns específicos de Kairos       | [SKILL.md](skills/kairos-django/SKILL.md)            |
| `kairos-academy`           | LMS: courses, lessons, quizzes, gamification| [SKILL.md](skills/kairos-academy/SKILL.md)           |
| `kairos-accounts`          | Auth, users, roles, regions, seller profiles| [SKILL.md](skills/kairos-accounts/SKILL.md)          |
| `kairos-core`              | Organization, plans/features, middleware    | [SKILL.md](skills/kairos-core/SKILL.md)              |
| `kairos-coach`             | Coach AI (RAG + Function Calling + OpenAI)  | [SKILL.md](skills/kairos-coach/SKILL.md)             |
| `kairos-knowledge`         | Ingestión de libros y documentos para Coach | [SKILL.md](skills/kairos-knowledge/SKILL.md)         |
| `kairos-crm`               | CRM, Customer 360, gestión de clientes      | [SKILL.md](skills/kairos-crm/SKILL.md)               |
| `kairos-sales`             | Ventas, rutas, visitas, órdenes, catálogo   | [SKILL.md](skills/kairos-sales/SKILL.md)             |
| `kairos-cobranzas`         | Cuentas por cobrar, pagos, aging            | [SKILL.md](skills/kairos-cobranzas/SKILL.md)         |
| `kairos-supervisor`        | Vista supervisor, territorio, equipo        | [SKILL.md](skills/kairos-supervisor/SKILL.md)        |
| `kairos-saas-admin`        | Administración multi-tenant, catálogos      | [SKILL.md](skills/kairos-saas-admin/SKILL.md)        |
| `kairos-integrations`      | Sistema de integraciones externas           | [SKILL.md](skills/kairos-integrations/SKILL.md)      |
| `kairos-import`            | Data import wizards (CxC, clientes, Excel)  | [SKILL.md](skills/kairos-import/SKILL.md)            |
| `kairos-compliance`        | Security, multi-tenancy, RBAC, PII rules    | [SKILL.md](skills/kairos-compliance/SKILL.md)        |
| `kairos-compliance-review` | PR reviews for security/compliance          | [SKILL.md](skills/kairos-compliance-review/SKILL.md) |
| `kairos-dashboard`         | Dashboard, métricas, 4DX, radar             | [SKILL.md](skills/kairos-dashboard/SKILL.md)         |
| `kairos-org-dashboard`     | CEO Dashboard, KPIs, visualización ejecutiva| [SKILL.md](skills/kairos-org-dashboard/SKILL.md)     |
| `kairos-ui-design-system`  | Tokens, colores, tipografía Inter           | [SKILL.md](skills/kairos-ui-design-system/SKILL.md)  |
| `kairos-ui-admin`          | Layout sidebar admin (billing, saas-admin)  | [SKILL.md](skills/kairos-ui-admin/SKILL.md)          |
| `kairos-ui-mobile`         | Templates mobile-first vendedor             | [SKILL.md](skills/kairos-ui-mobile/SKILL.md)         |
| `kairos-mcp`               | MCP server tools and AI integrations        | [SKILL.md](skills/kairos-mcp/SKILL.md)               |
| `kairos-commit`            | Professional commits (conventional-commits) | [SKILL.md](skills/kairos-commit/SKILL.md)            |
| `kairos-changelog`         | Changelog entries (keepachangelog.com)      | [SKILL.md](skills/kairos-changelog/SKILL.md)         |
| `kairos-pr`                | Pull request conventions and template       | [SKILL.md](skills/kairos-pr/SKILL.md)                |
| `kairos-notebooklm`        | Query NotebookLM documentation & research   | [SKILL.md](skills/kairos-notebooklm/SKILL.md)        |
| `kairos-railway-db`        | Railway DB sync (production ↔ staging)      | [SKILL.md](skills/kairos-railway-db/SKILL.md)        |
| `kairos-dry-guardian`      | Detects refactor opportunities (managers, components) | [SKILL.md](skills/kairos-dry-guardian/SKILL.md) |
| `kairos-persona-vendor`    | Complete file map for Vendedor persona (routes, cart, coach) | [SKILL.md](skills/kairos-persona-vendor/SKILL.md) |
| `kairos-persona-supervisor`| Complete file map for Supervisor persona (team, territory) | [SKILL.md](skills/kairos-persona-supervisor/SKILL.md) |
| `kairos-persona-admin`     | Complete file map for Org Admin persona (CEO dashboard) | [SKILL.md](skills/kairos-persona-admin/SKILL.md) |
| `kairos-persona-cobranzas` | Complete file map for Cobranzas persona (CxC, payments) | [SKILL.md](skills/kairos-persona-cobranzas/SKILL.md) |

---

## Auto-invoke Skills

When performing these actions, **ALWAYS** invoke the corresponding skill FIRST:

### Generic Skills

| Action | Skill |
|--------|-------|
| Adding DRF pagination or permissions | `django-drf` |
| After creating/modifying a skill | `skill-sync` |
| Creating new skills | `skill-creator` |
| Creating ViewSets, serializers, or filters | `django-drf` |
| Database queries, spatial operations, or vector search | `postgresql` |
| General Kairos development questions | `kairos` |
| Implementing REST API endpoints | `django-drf` |
| Regenerate AGENTS.md Auto-invoke tables (sync.sh) | `skill-sync` |
| Troubleshoot why a skill is missing from AGENTS.md auto-invoke | `skill-sync` |
| Using hx-* attributes | `htmx` |
| Using x-* attributes | `alpinejs` |
| Working with Django | `django` |
| Working with Python files | `python` |
| Working with Tailwind classes | `tailwind` |
| Writing or running tests | `pytest` |
| Creating Astro project | `astro` |
| Building static pages | `astro` |
| Working with Astro components | `astro` |
| Setting up content collections | `astro` |
| Creating Remotion compositions | `remotion` |
| Rendering videos | `remotion` |
| Working with video animations | `remotion` |
| Integrating data into videos | `remotion` |
| Deploying to Vercel | `vercel-deployment` |
| Configuring vercel.json | `vercel-deployment` |
| Setting up custom domains | `vercel-deployment` |
| Managing preview branches | `vercel-deployment` |
| Configuring DNS records | `dns-management` |
| Domain migration | `dns-management` |
| Subdomain setup | `dns-management` |
| SSL certificate issues | `dns-management` |
| Astro islands architecture or hydration | `astro-framework` |
| Astro content collections with schemas | `astro-framework` |
| Astro SSR adapters (Vercel, Node) | `astro-framework` |
| Astro view transitions | `astro-framework` |
| Auditing SEO or technical SEO issues | `seo-audit` |
| Reviewing meta tags, headings, or schema | `seo-audit` |
| SEO health check or rankings | `seo-audit` |
| Building SEO pages at scale | `programmatic-seo` |
| Creating template or directory pages | `programmatic-seo` |
| Location or comparison pages | `programmatic-seo` |
| Optimizing for AI search engines | `seo-geo` |
| Adding JSON-LD or schema markup | `seo-geo` |
| GEO (Generative Engine Optimization) | `seo-geo` |
| ChatGPT, Perplexity, or AI visibility | `seo-geo` |
| Designing new UI components or pages | `ui-ux-pro-max` |
| Choosing color palettes and typography | `ui-ux-pro-max` |
| Reviewing code for UX issues or accessibility | `ui-ux-pro-max` |
| Building external API integrations | `api-integration-patterns` |
| Token management or refresh logic | `api-integration-patterns` |
| Retry logic, backoff, or circuit breaker | `api-integration-patterns` |
| Securing API integrations or credentials | `api-security` |
| API security review for integrations | `api-security` |
| Building API client classes | `api-client` |
| Handling API pagination or response transformation | `api-client` |
| Implementing health checks or connection testing | `health-check` |
| API availability monitoring | `health-check` |
| Working with Redis caching, sessions, or queues | `redis` |
| Redis data structures, TTL, or pub/sub | `redis` |
| Creating or configuring Celery tasks | `django-celery` |
| Celery retries, queues, or Beat scheduling | `django-celery` |
| Moving work to background async jobs | `django-celery` |
| Debugging failed Celery tasks or DLQ | `django-celery` |
| Celery health check or worker monitoring | `django-celery` |
| Debugging Sentry issues or production errors | `sentry` |
| Investigating error monitoring or alerting | `sentry` |
| Working with Sentry SDK or DSN | `sentry` |
| Railway platform questions or deployment | `railway-docs` |
| Deploying services to Railway | `railway-docs` |

### Kairos Domain Skills

| Action | Skill |
|--------|-------|
| Creating/modifying HTMX partials in Kairos | `kairos-htmx` |
| Working on /internal/org/ dashboard or CEO KPIs | `kairos-org-dashboard` |
| Unexpected behavior, test failures, or production bugs | `systematic-debugging` |
| Editing views.py, templates, or models.py (DRY Check) | `kairos-dry-guardian` |
| Creating a new feature or endpoint | `kairos-dry-guardian` |
| Refactoring existing Django code | `kairos-dry-guardian` |
| Adding forms, serializers, or querysets | `kairos-dry-guardian` |
| Creating UI elements (buttons, badges, cards) | `kairos-dry-guardian` |
| Querying NotebookLM or research docs | `kairos-notebooklm` |
| Working with GitHub MCP or Perplexity MCP tools | `kairos-mcp` |
| Working on academy, courses, or e-learning | `kairos-academy` |
| Working on lessons, modules, or course content | `kairos-academy` |
| Working on enrollments or certificates | `kairos-academy` |
| Working on quizzes or gamification | `kairos-academy` |
| Working on user authentication or roles | `kairos-accounts` |
| Working on regions or seller profiles | `kairos-accounts` |
| Modifying user models or permissions | `kairos-accounts` |
| Working on Organization model or settings | `kairos-core` |
| Working on plans, features, or feature gating | `kairos-core` |
| Modifying middleware or decorators | `kairos-core` |
| Working on multi-tenancy logic | `kairos-core` |
| Working on billing views or dashboard | `kairos-cobranzas` |
| Working on order approvals or rejections | `kairos-cobranzas` |
| Recording or approving payments | `kairos-cobranzas` |

### Persona Navigation Skills

| Action | Skill |
|--------|-------|
| Working on vendor mobile views, routes, or cart | `kairos-persona-vendor` |
| Working on supervisor dashboard or team views | `kairos-persona-supervisor` |
| Working on CEO dashboard or org admin views | `kairos-persona-admin` |
| Working on CxC, collections, or payments | `kairos-persona-cobranzas` |

### Kairos UI Skills

| Action | Skill |
|--------|-------|
| Creating billing or saas-admin views | `kairos-ui-admin` |
| Creating global CSS variables | `kairos-ui-design-system` |
| Creating mobile-first templates | `kairos-ui-mobile` |
| Defining color palette or design tokens | `kairos-ui-design-system` |
| Modifying bottom navigation | `kairos-ui-mobile` |
| Modifying sidebar navigation | `kairos-ui-admin` |
| Working on admin panel layout | `kairos-ui-admin` |
| Working on typography or fonts | `kairos-ui-design-system` |
| Working on vendor mobile views | `kairos-ui-mobile` |

### Kairos Workflow Skills

| Action | Skill |
|--------|-------|
| Add changelog entry for a PR or feature | `kairos-changelog` |
| Committing changes | `kairos-commit` |
| Create a PR with gh pr create | `kairos-pr` |
| Create PR that requires changelog entry | `kairos-changelog` |
| Creating a git commit | `kairos-commit` |
| Fill .github/pull_request_template.md | `kairos-pr` |
| Review PR requirements | `kairos-pr` |
| Update CHANGELOG.md | `kairos-changelog` |
| Sync database between Railway environments | `kairos-railway-db` |
| Backup production database | `kairos-railway-db` |
| Restore staging from production | `kairos-railway-db` |

---

## How Skills Work

1. **Auto-detection**: El agente lee AGENTS.md que contiene los triggers de skills
2. **Context matching**: Al editar código de CRM, se carga `kairos-crm` automáticamente
3. **Pattern application**: El AI sigue los patrones exactos de la skill
4. **First-time-correct**: Sin trial and error - las skills dan convenciones exactas

---

## Skill Structure

```
skills/                              # Skills del repositorio
├── setup.sh                         # Script de sincronización
├── README.md                        # Documentación de skills
├── skill-creator/SKILL.md           # Cómo crear nuevas skills
│
├── # Generic Skills
├── python/SKILL.md
├── django/SKILL.md
├── django-drf/SKILL.md
├── htmx/SKILL.md
├── alpinejs/SKILL.md
├── tailwind/SKILL.md
├── pytest/SKILL.md
├── postgresql/SKILL.md
├── redis/SKILL.md
├── django-celery/SKILL.md
├── sentry/SKILL.md
├── railway-docs/SKILL.md
│
├── # Kairos Core
├── kairos/SKILL.md                  # Overview del proyecto
├── kairos-django/SKILL.md           # Patrones Django
├── kairos-htmx/SKILL.md             # HTMX + Alpine
│
├── # Kairos Domain
├── kairos-coach/SKILL.md            # Coach AI
├── kairos-knowledge/SKILL.md        # Knowledge base
├── kairos-crm/SKILL.md              # CRM
├── kairos-sales/SKILL.md            # Sales
├── kairos-cobranzas/SKILL.md        # Cobranzas
├── kairos-supervisor/SKILL.md       # Supervisor
├── kairos-dashboard/SKILL.md        # Dashboard
├── kairos-saas-admin/SKILL.md       # SaaS Admin
├── kairos-integrations/SKILL.md     # Integrations
├── kairos-import/SKILL.md           # Import wizards
├── kairos-compliance/SKILL.md       # Compliance & Security
├── kairos-compliance-review/SKILL.md# Security PR reviews
│
├── # Kairos UI
├── kairos-ui-design-system/SKILL.md # Design system
├── kairos-ui-admin/SKILL.md         # Admin layouts
├── kairos-ui-mobile/SKILL.md        # Mobile templates
│
└── # Kairos Workflow
    ├── kairos-commit/SKILL.md       # Commits
    ├── kairos-changelog/SKILL.md    # Changelog
    └── kairos-pr/SKILL.md           # Pull requests
```

---

## Contributing

### Adding a New Skill

1. Lee primero la skill `skill-creator`
2. Crea un directorio bajo `skills/`
3. Agrega `SKILL.md` siguiendo el template
4. Registra la skill en este archivo bajo la sección apropiada
5. Ejecuta `./skills/setup.sh --all` para regenerar

### Updating an Existing Skill

1. Modifica el archivo `SKILL.md` correspondiente
2. Si cambias el nombre o scope, actualiza también este archivo
3. Ejecuta `./skills/setup.sh --all`

---

## Project Overview

**KAIROS** es una plataforma inteligente de gestión de ventas con IA conversacional que combina CRM, optimización de rutas geográficas, y un Coach de Ventas impulsado por IA (RAG + Function Calling).

| Component    | Location             | Tech Stack                        |
| ------------ | -------------------- | --------------------------------- |
| Core         | `apps/core/`         | Django 5.2, modelos base          |
| Accounts     | `apps/accounts/`     | Autenticación, usuarios, tenants  |
| Coach AI     | `apps/coach/`        | OpenAI GPT-4o, RAG, functions     |
| CRM          | `apps/crm/`          | Customer 360, gestión de clientes |
| Sales        | `apps/sales/`        | Órdenes, visitas, rutas, catálogo |
| Dashboard    | `apps/dashboard/`    | Métricas, 4DX, radar              |
| Integrations | `apps/integrations/` | Integraciones externas            |
| Knowledge    | `apps/knowledge/`    | Base de conocimiento vectorial    |
| Academy      | `apps/academy/`      | Capacitación y e-learning         |
| Billing      | `apps/billing/`      | Facturación y CxC                 |
| SaaS Admin   | `apps/saas_admin/`   | Administración multi-tenant       |
| Supervisor   | `apps/supervisor/`   | Vista supervisor de equipo        |

---

## Tech Stack

| Layer             | Technology                                 |
| ----------------- | ------------------------------------------ |
| **Backend**       | Django 5.2, Django REST Framework          |
| **Database**      | PostgreSQL 15 + PostGIS + pgvector         |
| **Cache/Broker**  | Redis (Django cache + Celery broker)       |
| **Task Queue**    | Celery (Worker + Beat scheduler)           |
| **AI**            | OpenAI GPT-4o-mini, text-embedding-3-small |
| **Frontend**      | Django Templates, Tailwind CSS, Alpine.js  |
| **Interactivity** | HTMX                                       |
| **Maps**          | Folium, Leaflet.js                         |
| **Deploy**        | Railway (web, worker, beat, redis, db)     |

---

## Development

```bash
# Setup
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver

# Start Tailwind (dev)
python manage.py tailwind start
```

---

## Commit & Pull Request Guidelines

Follow conventional-commit style: `<type>[scope]: <description>`

**Types:** `feat`, `fix`, `docs`, `chore`, `perf`, `refactor`, `style`, `test`

Before creating a PR:

1. Complete checklist in `.github/pull_request_template.md`
2. Run all relevant tests
3. Update CHANGELOG.md if needed
4. Link screenshots for UI changes

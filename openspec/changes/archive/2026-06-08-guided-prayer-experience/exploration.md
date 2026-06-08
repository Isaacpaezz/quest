## Exploration: Guided Prayer Experience

### Current State

#### Architecture Map

**Prayer Session Flow (current):**
```
/oracion (Server Page)                    /peticiones (Server Pages)
  │ - Loads plan→minutos_oracion_requeridos   │ - CRUD for prayer requests
  │ - Loads user progress (accumulated secs)   │ - Community wall
  │ - Loads group config (bonus thresholds)    │ - AI-guided prayer generation
  │ - Fetches petitions (own + community)      │ - Intercession tracking
  ▼                                             ▼
OracionClient (896-line monolithic client)   petitions/actions.ts (1405 lines)
  │ Phases: timer → bonus → complete           │ - crearPeticionAction
  │ - requestAnimationFrame loop               │ - orarPorPeticionAction
  │ - 30s periodic sync to Supabase            │ - generarOracionesGuiaBatch (OpenAI)
  │ - localStorage state persistence           │ - registrarIntercesionesBatch
  │ - PreparacionOracion (pre-timer screen)    │ - getCommunityWallAction
  │ - ResumenOracion (completion summary)      │
  ▼                                             ▼
actualizarProgresoOracionAction              peticiones/comunidad PRs
  │ - upserts progreso_usuario               - Realtime via Supabase channels
  │ - inserts actividad_comunidad             - Push notifications
  │ - grants XP (base + bonus + intercession)
  ▼
progreso_usuario table
```

**Exact Files and Their Roles:**

| File | Role | Lines |
|------|------|-------|
| `src/app/(app)/oracion/page.tsx` | Server page: loads plan, progress, petitions, group config | 136 |
| `src/app/(app)/oracion/_components/oracion-client.tsx` | Monolithic timer + guided prayer UI | 896 |
| `src/app/(app)/oracion/_components/preparacion-oracion.tsx` | Pre-timer petition selection screen | 274 |
| `src/app/(app)/oracion/_components/resumen-oracion.tsx` | Post-prayer completion summary | 164 |
| `src/app/(app)/home/actions.ts` | `actualizarProgresoOracionAction` - save progress, XP, feed | 321 |
| `src/app/(app)/home/_components/prayer-timer.tsx` | Simpler inline timer on home (redundant) | 162 |
| `src/app/(app)/peticiones/actions.ts` | All petition/intercession server actions + OpenAI | 1405 |
| `src/app/(app)/peticiones/page.tsx` | Community prayer wall | 61 |
| `src/app/(app)/peticiones/nueva/page.tsx` | New petition form page | 57 |
| `src/app/(app)/peticiones/mis-peticiones/page.tsx` | Personal petitions list | 69 |
| `src/app/(app)/peticiones/[id]/page.tsx` | Petition detail view | — |
| `src/app/(app)/peticiones/_components/peticion-form.tsx` | Petition creation/editing form | 305 |
| `src/app/(app)/peticiones/_components/peticion-card.tsx` | Petition card display | 243 |
| `src/app/(app)/peticiones/_components/orar-por-peticion-button.tsx` | "I prayed" button with optimistic update | 129 |
| `src/app/(app)/peticiones/_components/use-realtime-peticiones.ts` | Realtime subscription for petitions | — |
| `src/lib/grupo-helpers.ts` | Group config, timezone, date bounds | 204 |
| `src/app/(app)/admin/configuracion/actions.ts` | Admin settings upsert (key-value) | 114 |
| `src/app/(app)/admin/configuracion/_components/settings-form.tsx` | Admin settings form UI | 369 |
| `src/app/(app)/admin/configuracion/page.tsx` | Admin settings page | — |

**Database Tables Relevant:**

| Table | Key Columns | Purpose |
|-------|------------|---------|
| `planes_lectura` | `minutos_oracion_requeridos`, `grupo_id`, `estado` | Total prayer time assigned per plan |
| `configuracion_app` | `clave`, `valor`, `grupo_id` | Group-level key-value config (XP, timezone, penalties) |
| `progreso_usuario` | `segundos_oracion_acumulados`, `oracion_completada`, `fecha_progreso` | Per-user daily prayer progress |
| `peticiones_oracion` | `titulo`, `descripcion`, `categoria`, `visibilidad`, `usuario_id`, `grupo_id`, `oracion_guia`, `oracion_guia_context_hash` | Prayer requests with AI-generated guides |
| `oraciones_por_peticion` | `peticion_id`, `usuario_id` (UNIQUE) | Intercession tracking (1 per user per petition lifetime) |
| `actualizaciones_peticion` | `peticion_id`, `tipo`, `texto`, `testimonio_publico` | Petition updates (progress, resolved, testimony) |
| `actividad_comunidad` | `tipo_actividad`, `usuario_id`, `grupo_id` | Feed entries (prayer/reading completed, petitions) |
| `perfiles` | `grupo_activo_id`, `nombre_usuario`, `xp`, `nivel` | User profiles |
| `grupos` | `nombre`, `codigo_invitacion` | Groups |
| `miembros_grupo` | `usuario_id`, `grupo_id`, `rol` | Group membership |

**Current Timer Mechanics:**
- `Phase = 'timer' | 'bonus' | 'complete'`
- Base time from `planes_lectura.minutos_oracion_requeridos`
- Bonus threshold from `configuracion_app['xp_oracion_bonus_minutos']` (admin-configurable)
- `requestAnimationFrame` loop updates elapsed seconds
- 30-second periodic sync to DB via `actualizarProgresoOracionAction`
- `localStorage` state for cross-session persistence
- Petitions selected in `PreparacionOracion` screen, rotated at 20-second intervals during prayer
- AI-generated `oracion_guia` displayed per petition via `generarOracionesGuiaBatch`
- "Oré" button marks a petition as prayed-for
- Batch intercession save on completion via `registrarIntercesionesBatch`

**What DOES NOT exist:**
- No section-based structure (Adoration, Confession, Gratitude, Supplication, Intercession)
- No proportional time allocation per section
- No admin configuration for section percentages
- No visual section transitions or vignette animations
- No ephemeral/session-only data pathways (everything persists to DB)
- Confession data does not exist as a standalone concept

### Affected Areas

- **`src/app/(app)/oracion/`** — Entire prayer page and its components must be restructured from a single timer phase to multiple guided sections with proportional time allocation and visual transitions.
- **`src/app/(app)/oracion/_components/oracion-client.tsx`** — Current 896-line monolith will likely be split into smaller section-specific components or a state-machine-driven container.
- **`src/app/(app)/oracion/_components/preparacion-oracion.tsx`** — Current petition selector may need to include section preview/awareness.
- **`src/app/(app)/admin/configuracion/`** — Admin settings must add section percentage configuration with validation (sum to 100%).
- **`configuracion_app` table** — New keys: `oracion_secciones_porcentajes` (JSONB array or comma-separated), `oracion_secciones_tiempo_total` (could derive from plan).
- **`src/app/(app)/home/actions.ts`** — `actualizarProgresoOracionAction` may need section-level progress data, though this depends on whether section progress is tracked server-side or client-only.
- **`src/app/(app)/peticiones/actions.ts`** — `registrarIntercesionesBatch` already exists and can be reused. May need enhancement for section-aware intercession tracking.
- **`planes_lectura` table** — The `minutos_oracion_requeridos` is the total pool to be proportionally divided.
- **`src/app/(app)/oracion/_components/resumen-oracion.tsx`** — Summary screen may want section-level breakdown.
- **`progreso_usuario` table** — May need extension if section-level progress is tracked persistently (e.g., `secciones_completadas JSONB` or separate table). Currently only stores `segundos_oracion_acumulados`.
- **`src/lib/grupo-helpers.ts`** — Any new config reading for section percentages.
- **Design/UI:** New visual components for section transitions (IG Stories-inspired gestural navigation, vignettes, progress indicators).
- **Privacy:** Confession section needs special handling — data must NOT be persisted to any DB table; ephemeral client-side only.

### Approaches

#### Approach A: State-Machine Container with Section Slots

**Description:** Refactor `OracionClient` into a container that manages prayer state through a section sequence. Each section is a "slot" component that receives its allocated time slice. Section order and time slices are computed from admin-configured percentages applied to the plan's `minutos_oracion_requeridos`.

- **State:** `{ phase, currentSectionIndex, sectionProgress, remainingSectionTime }`
- **Transitions:** Auto-advance when section time expires OR user taps "next"
- **Sections:** `Adoration → Confession → Gratitude → Supplication → Intercession`
- **Confession:** Client-only text area that is never sent to any server action. Stored transiently in React state, wiped on section exit.
- **Intercession:** Reuses existing `PreparacionOracion` petition selection + `registrarIntercesionesBatch`.
- **Other sections:** Show guided prompts, scripture verses, or free-form prayer space.

**Pros:**
- Fits existing timer infrastructure (same RAF loop, same periodic sync)
- Reuses existing server actions (`actualizarProgresoOracionAction`, `registrarIntercesionesBatch`)
- Minimal DB schema changes (only new config keys in `configuracion_app`)
- Clear component boundaries per section
- Can ship incrementally (add sections one at a time)

**Cons:**
- Still a client-heavy design; no server rendering of section content
- Section progress tracking is client-only unless we extend `progreso_usuario`
- Section component explosion possible if each section needs distinct UI
- The 896-line component is already large; adding sections without extraction makes it worse

**Effort:** Medium | **Risk:** Low

---

#### Approach B: Full-Screen Story Carousel

**Description:** IG Stories-inspired swipeable/slideable carousel. Each section is a full-screen "story" card with its own timer ring, visual styling, and prompts. User swipes to advance (or auto-advances after time allocation).

- Uses CSS snap points or Framer Motion for carousel transitions
- Each section card has independent background gradient, icon, prompt content
- Progress indicator: horizontal dots or mini-progress-bar at top showing section sequence
- Timer ring per section or global timer with section subdivision

**Pros:**
- Maximally visually impressive, directly matches "IG Stories-inspired" reference
- Distinct visual identity per section (worship = warm gold, confession = deep purple, etc.)
- Natural fit for contemplative experience
- Each section can have unique animation/motion
- Good mobile UX (swipe gestures)

**Cons:**
- Higher implementation complexity
- Framer Motion or similar animation library may need to be added
- Accessibility concerns with swipe-only navigation (needs fallback buttons)
- May conflict with existing timer ring UI patterns
- More components to build and maintain

**Effort:** High | **Risk:** Medium (visual polish scope creep)

---

#### Approach C: Progressive Enhancement of Current Timer

**Description:** Add sections as an overlay modal/panel on top of the existing timer. The timer continues tracking total prayer time, but a section indicator shows current section and remaining section time. This is the "minimal change" approach.

- Add `sectionConfig` computed from admin percentages × plan minutes
- Add a small section progress bar or label above the timer ring
- Add section transition prompts (optional user tap to advance)
- Confession: modal panel that appears during confession time slice
- Intercession: reuse existing petition rotation

**Pros:**
- Fastest to implement
- Least risk of regressions
- Minimal new components
- Easy to A/B test with existing users
- Section percentages configurable via admin immediately

**Cons:**
- Least visually impressive
- Does not deliver the "IG Stories-inspired" experience requested
- Sections feel bolted-on rather than integral to the experience
- May need a full redesign later anyway (wasted effort)
- Does not meet the "visual quality is a core requirement" explicit constraint

**Effort:** Low | **Risk:** Low

### Recommendation

**Approach A (State-Machine Container with Section Slots) is recommended**, with visual polish borrowed from Approach B's section-specific styling. This balances delivery speed with the visual quality requirement and keeps change scope manageable.

**Why not B alone:** Full carousel adds significant interaction complexity (gestures, snap points, accessibility) that may not ship in a single PR budget. Approach A can ship sections as flat cards first, then upgrade to carousel later.

**Why not C:** It doesn't satisfy the visual quality requirement and would likely be replaced.

**Implementation strategy:**
1. **DB/Config first:** Add `oracion_secciones` and `oracion_secciones_porcentajes` to `configuracion_app` (new migration). Admin UI adds percentage sliders with sum-to-100% validation.
2. **Refactor OracionClient:** Extract a `usePrayerSession` hook + `PrayerSectionRenderer`. Sections become composable slots.
3. **Build sections incrementally** in separate PRs:
   - PR 1: Section infrastructure + Adoration section
   - PR 2: Confession (ephemeral, no persistence) + Gratitude
   - PR 3: Supplication + Intercession (reuses existing petition system)
4. **Visual polish** applied per section from tailwind-v4 design tokens and quest-ui guidelines.

**Key architectural decisions needed before spec:**
- Should section progress be server-tracked (new DB columns) or client-only? Client-only is safer for confession privacy but loses progress across sessions.
- Should sections auto-advance strictly on timer, or allow user to tap "next" early? Both is ideal (auto-advance default, early advance optional).
- Should the total prayer timer remain visible during sections, or only section-time? Both (section progress ring + mini total progress below).

### Risks

- **Privacy: Confession data leakage.** If confession text is accidentally sent to any server action (e.g., via periodic sync), user trust is irreversibly damaged. Mitigation: confession section MUST use only local React state, never hit any network endpoint. Add a linter rule or code comment convention to mark confession code as "NEVER SERIALIZE."
- **Supabase production safety.** New `configuracion_app` keys are safe (additive). A new migration adding `secciones_completadas` to `progreso_usuario` is safe. No destructive changes needed. Still: test all config reads with missing keys (graceful defaults).
- **Timer accuracy.** Splitting total time into sections introduces floating-point division. Use integer seconds throughout; round down remaining time for last section to avoid overruns.
- **OpenAI cost.** If guided prayers are generated per-section instead of per-petition, API costs could increase. Current `generarOracionesGuiaBatch` only fires for petitions in the intercession section — this should remain unchanged.
- **Component size.** `oracion-client.tsx` is already 896 lines. Adding sections without extraction makes it unmaintainable. The refactor must split the monolith FIRST.
- **Admin UX.** Percentage sliders summing to exactly 100% is fiddly. Consider using "distribute evenly" button + manual adjustment with live validation feedback.

### Ready for Proposal

**Yes.** The current system is well-understood, the affected areas are mapped, the database surface for section percentages is trivial (`configuracion_app` upsert), and the core risk (confession privacy) has a clear mitigation path. The proposal can proceed with Approach A as the recommended architecture, with section-level visual design defined in a subsequent spec phase.

**Prerequisites for proposal phase:**
- Confirm section list: Adoration / Confession / Gratitude / Supplication / Intercession
- Confirm percentage defaults (suggest: 20/15/20/25/20)
- Decide: section progress client-only or server-tracked?
- Decide: auto-advance only or allow manual "next" tap?
- Agree on visual reference: IG Stories style yes or simpler cards?

**Size forecast** (400-line review budget, `chained_pr_strategy=auto-forecast`):
- **Decision needed before apply: Yes**
- **Chained PRs recommended: Yes**
- **400-line budget risk: High**

This change spans DB migration, admin UI, core timer refactor, 5 new section components, and visual polish. A single PR would far exceed 400 lines. Recommended chain:

| PR | Scope | Est. Lines |
|----|-------|-----------|
| PR1 | Migration + section config types + admin section UI | ~150 |
| PR2 | Refactor `OracionClient` → extract `usePrayerSession` hook + section slots | ~300 |
| PR3 | Adoration + Gratitude sections (prompt-based, no persistence needed) | ~250 |
| PR4 | Confession section (ephemeral, strict client-only) | ~200 |
| PR5 | Supplication + Intercession (reuses petitions) + summary integration | ~250 |
| PR6 | Visual polish (gradients, transitions, typography per section) | ~200 |

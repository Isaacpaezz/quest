# Design: Guided Prayer Experience

## Technical Approach

Refactor the 896-line `oracion-client.tsx` monolith into a **state-machine container** (`GuidedPrayerContainer`) that owns session timing and section sequencing, with five **section slot components** that each render only their own display and local interactions. Admin-configurable section percentages stored in `configuracion_app` divide the plan's `minutos_oracion_requeridos` into per-section durations. The existing RAF timer loop, 30s periodic sync, `actualizarProgresoOracionAction`, and `registrarIntercesionesBatch` are preserved and reused.

## Architecture Decisions

| Decision | Options | Tradeoff | Choice |
|----------|---------|----------|--------|
| Section progress tracking | (A) Client-only state, (B) New `progreso_usuario` columns | A: simpler, protects confession privacy, loses cross-session section resume. B: enables resume but adds schema risk and confession leak surface. | **A — client-only.** Section progress stays in `usePrayerSession` hook state + `localStorage`. Total elapsed seconds still syncs to `progreso_usuario` via existing action. |
| Config storage format | (A) Single JSONB key `oracion_secciones`, (B) Five separate keys | A: atomic read, single upsert. B: more granular but 5× the upserts. | **A — single key.** `clave='oracion_secciones'`, `valor` = JSON string of `{adoracion,confesion,gratitud,suplica,intercesion}` percentages. |
| Rounding remainder | (A) Floor all, give remainder to last section, (B) Largest-remainder method | A: simple, deterministic. B: fairer but more code. | **A — floor + last-section remainder.** Matches proposal spec. Sum always equals `totalSeconds`. |
| Early advance behavior | (A) Complete session early, (B) Redistribute remaining time | A: simple, predictable. B: complex, unexpected UX. | **A — complete section early, move to next.** Last section ends the session at whatever elapsed time. |
| Confession isolation | (A) Sibling component with no shared state, (B) Section receives only duration prop | Both prevent leakage. | **A — `ConfessionSection` owns its own `useState`, never receives session dispatch.** The container passes only `durationSeconds`. No callback can carry confession text upward. |
| Section auto-advance | (A) Timer-only, (B) Timer + manual next/prev buttons | B: respects user pace. | **B — both.** Auto-advance on section time expiry; user may tap next/prev. |

## Data Flow

```
Server Page (page.tsx)
  │ fetches: plan.minutos_oracion_requeridos, config['oracion_secciones'],
  │          petitions, user progress, bonus config
  ▼
GuidedPrayerContainer (client)
  │ usePrayerSession(totalSeconds, sectionConfig)
  │ → { currentSection, sectionElapsed, totalElapsed, isPaused, phase }
  │ → dispatch: start, pause, resume, nextSection, prevSection
  │
  ├── SectionProgressBar  (top: 5 dots + section timer ring)
  ├── AdorationSection     (prompts + scripture, no persistence)
  ├── ConfessionSection    (ephemeral textarea, local state only)
  ├── GratitudeSection     (prompts, no persistence)
  ├── SupplicationSection  (own petitions display)
  ├── IntercessionSection  (community petitions + "Oré" + batch save)
  └── SessionSummary       (replaces ResumenOracion, adds section breakdown)
  
  30s periodic sync → actualizarProgresoOracionAction (totalElapsed only)
  On complete → registrarIntercesionesBatch (existing)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/(app)/oracion/_components/guided-prayer-container.tsx` | Create | State-machine container; renders active section slot + progress bar + controls |
| `src/hooks/use-prayer-session.ts` | Create | `usePrayerSession(totalSeconds, sections)` — RAF loop, section timing, pause/resume, localStorage |
| `src/lib/prayer-sections.ts` | Create | `computeSectionDurations()`, `parseSectionConfig()`, `DEFAULT_SECTIONS`, types |
| `src/app/(app)/oracion/_components/sections/adoration-section.tsx` | Create | Adoration slot: scripture verse + worship prompts |
| `src/app/(app)/oracion/_components/sections/confession-section.tsx` | Create | Confession slot: ephemeral textarea, `useState` only, never serialized |
| `src/app/(app)/oracion/_components/sections/gratitude-section.tsx` | Create | Gratitude slot: thanksgiving prompts |
| `src/app/(app)/oracion/_components/sections/supplication-section.tsx` | Create | Personal supplication slot: displays user's own petitions |
| `src/app/(app)/oracion/_components/sections/intercession-section.tsx` | Create | Community intercession: reuses petition cards + "Oré" tap + `handleOreTap` |
| `src/app/(app)/oracion/_components/sections/section-progress-bar.tsx` | Create | Top bar: 5 section dots + current section timer ring + section label |
| `src/app/(app)/oracion/_components/session-summary.tsx` | Create | Replaces `resumen-oracion.tsx`; adds per-section time breakdown |
| `src/app/(app)/oracion/_components/oracion-client.tsx` | Modify | Thin wrapper: reads section config from props, delegates to `GuidedPrayerContainer`. Existing timer/bonus logic removed. |
| `src/app/(app)/oracion/page.tsx` | Modify | Fetch `oracion_secciones` from `configuracion_app`, pass as prop. |
| `src/app/(app)/admin/configuracion/actions.ts` | Modify | Add `oracion_secciones` to Zod schema + upsert array. |
| `src/app/(app)/admin/configuracion/_components/settings-form.tsx` | Modify | Add "Secciones de Oración" card with 5 percentage inputs + live total + distribute-evenly button. |
| `src/app/globals.css` | Modify | Add prayer section CSS vars: `--section-adoration`, `--section-confession`, etc. for calm gradient backgrounds. |

## Interfaces / Contracts

```typescript
// src/lib/prayer-sections.ts

export const SECTION_KEYS = ['adoracion', 'confesion', 'gratitud', 'suplica', 'intercesion'] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export type SectionConfig = Record<SectionKey, number>; // percentages 0-100

export const DEFAULT_SECTIONS: SectionConfig = {
  adoracion: 20, confesion: 15, gratitud: 20, suplica: 25, intercesion: 20,
};

export type SectionDuration = {
  key: SectionKey;
  label: string;
  seconds: number;
  startOffset: number; // cumulative seconds from session start
};

export function computeSectionDurations(
  totalSeconds: number, config: SectionConfig
): SectionDuration[] {
  // floor each section; assign remainder to last
  const entries = SECTION_KEYS.map(key => ({
    key, seconds: Math.floor(totalSeconds * config[key] / 100),
  }));
  const assigned = entries.reduce((s, e) => s + e.seconds, 0);
  entries[entries.length - 1].seconds += totalSeconds - assigned;
  // compute startOffsets
  let offset = 0;
  return entries.map(e => {
    const d = { ...e, startOffset: offset, label: SECTION_LABELS[e.key] };
    offset += e.seconds;
    return d;
  });
}

export function parseSectionConfig(raw: string | undefined): SectionConfig {
  if (!raw) return DEFAULT_SECTIONS;
  try {
    const parsed = JSON.parse(raw);
    const result = { ...DEFAULT_SECTIONS };
    for (const key of SECTION_KEYS) {
      if (typeof parsed[key] === 'number' && parsed[key] >= 0) result[key] = parsed[key];
    }
    return result;
  } catch { return DEFAULT_SECTIONS; }
}
```

```typescript
// src/hooks/use-prayer-session.ts

type PrayerSessionState = {
  phase: 'idle' | 'running' | 'paused' | 'complete';
  currentSectionIndex: number;
  totalElapsed: number;
  sectionElapsed: number;
};

type PrayerSessionActions = {
  start: () => void;
  pause: () => void;
  resume: () => void;
  nextSection: () => void;
  prevSection: () => void;
};

export function usePrayerSession(
  totalSeconds: number,
  sections: SectionDuration[],
  initialElapsed: number,
  onSync: (elapsed: number) => void,  // periodic save callback
): [PrayerSessionState, PrayerSessionActions]
```

## Visual System

Each section gets a calm gradient background using CSS vars in `globals.css`:

| Section | Light gradient | Dark gradient | Accent |
|---------|---------------|---------------|--------|
| Adoration | `#FFF8E7 → #FFF3D4` | `#1A1810 → #15130A` | Warm gold `#D4A017` |
| Confession | `#F3EEFF → #E8DEFF` | `#14101A → #0F0C14` | Soft purple `#8B5CF6` |
| Gratitude | `#E8FFF3 → #D4FFE8` | `#0A1A14 → #081410` | Green `#10B981` |
| Supplication | `#E8F4FF → #D4ECFF` | `#0A141A → #081014` | Blue `#3B82F6` |
| Intercession | `#FFF0E8 → #FFE4D4` | `#1A120A → #140E08` | Warm orange `#F59E0B` |

Section transitions use `transition: opacity 400ms ease-in-out` (matches Quest UI motion guidelines). Timer ring per section reuses existing SVG circle pattern with section accent color.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `computeSectionDurations` rounding, `parseSectionConfig` fallback | Pure function tests |
| Unit | `usePrayerSession` state transitions | Mock RAF, assert section index + elapsed |
| Integration | Admin form validation (sum ≠ 100 blocks save) | Render settings form, assert disabled submit |
| Integration | Confession never calls server action | Spy on fetch/action calls during confession section lifecycle |
| Manual/E2E | Full guided prayer session flow | Walk through all 5 sections on mobile viewport |

## Migration / Rollout

**No schema migration required.** The change is purely additive:
- New `configuracion_app` row with `clave='oracion_secciones'` — created by admin UI or seeded with defaults.
- `parseSectionConfig()` falls back to `DEFAULT_SECTIONS` when the key is missing.
- Existing `actualizarProgresoOracionAction` signature unchanged — still receives `{segundosAcumulados, capituloId, oracionCompletada}`.
- No changes to `progreso_usuario` table.

## Recommended Chained PR Slices

| Slice | Scope | Est. Lines | Depends On |
|-------|-------|-----------:|------------|
| PR1 | `prayer-sections.ts` types + `computeSectionDurations` + admin config schema/UI | ~180 | — |
| PR2 | `usePrayerSession` hook + `GuidedPrayerContainer` skeleton + section progress bar | ~280 | PR1 |
| PR3 | Adoration + Gratitude sections + visual gradients in globals.css | ~220 | PR2 |
| PR4 | Confession section (ephemeral, strict client-only) | ~150 | PR2 |
| PR5 | Supplication + Intercession (reuses existing petition data + `handleOreTap`) + `SessionSummary` | ~250 | PR2 |
| PR6 | Polish: transitions, accessibility (aria labels, focus management), responsive tuning | ~180 | PR3-5 |

## Open Questions

- [ ] Should the `PreparacionOracion` screen (petition selector) remain as a pre-session step, or be folded into the Intercession section's first render?
- [ ] Should section-level time be visible in `SessionSummary`, or only total elapsed + intercession count?

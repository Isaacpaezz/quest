# Design: Guided Intercession AI Selection

## Technical Approach

Keep the guided prayer flow stable and add a focused intercession preparation layer. The server computes the intercession duration, selects a bounded eligible petition subset, and sends only that subset to the client. The client requests validated AI guide text for those selected IDs via the existing `generarOracionesGuiaBatch()` action and renders one petition at a time.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
| --- | --- | --- | --- |
| Petition selection | Server-side helper on `/oracion` path | Client-side selection from all petitions; combined select+generate action | Avoids shipping all group petitions, supports current-user exclusion and prayed-before priority with database data. |
| AI guide source | Existing `generarOracionesGuiaBatch()` | Trust raw `oracion_guia` from page query | Existing action validates perspective/context hash and handles cache/fallback behavior. |
| UI pacing | One petition at a time | Scrollable list with highlighted card | Matches limited prayer time and avoids overwhelming the contemplative flow. |
| Fairness persistence | Existing metadata only | New rotation table | Keeps this follow-up reviewable and avoids schema/migration risk. |

## Data Flow

```txt
/oracion/page.tsx
  ├─ computes sectionDurations
  ├─ derives intercessionSeconds
  ├─ selects eligible community petitions
  └─ passes bounded peticionesComunidad

GuidedPrayerContainer
  ├─ requests or reuses an in-flight generarOracionesGuiaBatch(selected IDs)
  ├─ keeps guide text only in component state after the server action resolves
  └─ passes guide/loading/fallback data to IntercessionSection

IntercessionSection
  ├─ maps sectionElapsed to active petition index
  ├─ displays requester identity + AI guide text
  └─ queues Oré through existing onIntercede callback
```

## File Changes

| File | Action | Description |
| --- | --- | --- |
| `src/app/(app)/oracion/page.tsx` | Modify | Compute intercession duration before community query result is finalized; select a bounded subset and exclude current user's petitions. |
| `src/app/(app)/oracion/_components/guided-prayer-container.tsx` | Modify | Import `generarOracionesGuiaBatch`, request guides for selected petitions, reuse only an in-flight request keyed by selected fingerprint, track loading/error state, pass guide map to section. |
| `src/app/(app)/oracion/_components/sections/intercession-section.tsx` | Modify | Render active petition only, show guide/fallback/loading state, preserve requester identity and `Oré`. |
| `src/lib/guided-intercession.ts` | Create | Pure selection utilities: capacity calculation and deterministic petition ordering. |
| `src/lib/guided-intercession.test.ts` | Create | Unit coverage for capacity, exclusion, priority, and fairness ordering. |

## Interfaces / Contracts

```ts
type GuidedIntercessionPetition = {
  id: string
  titulo: string
  descripcion: string | null
  categoria: string
  usuario_id?: string
  usuario_nombre: string
  oraciones_count: number
  has_prayed?: boolean
}

type GuidedPrayerGuideState = Record<string, string>
```

Selection defaults:

- `SECONDS_PER_INTERCESSION_PETITION = 60`
- `MAX_GUIDED_INTERCESSION_PETITIONS = 6`
- `capacity = intercessionSeconds <= 0 ? 0 : clamp(floor(seconds / 60), 0, 6)`

## Testing Strategy

| Layer | What to Test | Approach |
| --- | --- | --- |
| Unit | Capacity calculation and petition selection ordering | Vitest for `src/lib/guided-intercession.test.ts`. |
| Component | One-petition rendering and fallback state | Add focused test if current component test harness supports it; otherwise verify through integration/manual smoke. |
| Build | Type safety across page/container/section props | `pnpm lint`, `pnpm test`, `pnpm build`. |

## Migration / Rollout

No database migration required. The change reuses existing petition fields, `oraciones_por_peticion`, and `generarOracionesGuiaBatch()`.

## Risks

- Guide generation can be slow; the section must remain usable with fallback text.
- Querying prayed-before state adds complexity; keep it scoped to selected candidate ordering.
- Review size may approach 400 lines if component tests are added; split only if implementation expands beyond the planned files.

## Open Questions

- None blocking. Start with 60 seconds per petition and adjust later if product feedback shows pacing is too slow.

# Tasks: Guided Prayer Experience

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,200 (across 6 slices) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 → PR2 → PR3 → PR4 → PR5 → PR6 (stacked) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Admin config + section types/utility | PR 1 | base: main; standalone deliverable |
| 2 | Prayer session hook + container skeleton + progress bar | PR 2 | base: main (after PR1 merge); wire config prop |
| 3 | Adoration + Gratitude sections + CSS gradients | PR 3 | base: main (after PR2 merge) |
| 4 | Confession section (client-only ephemeral) | PR 4 | base: main (after PR2 merge); independent of PR3 |
| 5 | Supplication + Intercession + SessionSummary | PR 5 | base: main (after PR2 merge); independent of PR3-4 |
| 6 | Polish: transitions, a11y, responsive tuning | PR 6 | base: main (after PR3-5 merge) |

## Phase 1: Foundation — Admin Config + Section Types (PR1, ~155 lines)

- [x] 1.1 Create `src/lib/prayer-sections.ts` with `SECTION_KEYS`, `SectionKey`, `SectionConfig`, `SectionDuration` types, `DEFAULT_SECTIONS` constant, `SECTION_LABELS` map, `computeSectionDurations()`, and `parseSectionConfig()` per design interfaces.
- [x] 1.2 Add `oracion_secciones` field to `SettingsSchema` in `src/app/(app)/admin/configuracion/actions.ts` — accept JSON string, validate parsed object has all 5 keys with non-negative numbers summing to 100.
- [x] 1.3 Add `oracion_secciones` entry to the upsert array in `actualizarConfiguracionAction` — serialize validated JSON string to `valor`.
- [x] 1.4 Add "Secciones de Oración" card to `src/app/(app)/admin/configuracion/_components/settings-form.tsx` with 5 percentage inputs (one per section), live total display, disabled submit when total ≠ 100, and a "Distribuir equitativamente" button.
- [x] 1.5 Verify: `pnpm lint` passes clean; admin form blocks save when percentages sum ≠ 100.

## Phase 2: Core — Prayer Session Hook + Container Skeleton (PR2, ~355 lines)

- [x] 2.1 Create `src/hooks/use-prayer-session.ts` implementing `usePrayerSession(totalSeconds, sections, initialElapsed, onSync)` — RAF loop, section index tracking, pause/resume, next/prev dispatch, 30s sync callback, localStorage persistence for `quest_prayer_session`.
- [x] 2.2 Create `src/app/(app)/oracion/_components/sections/section-progress-bar.tsx` — renders 5 section dots (active = filled, completed = check), current section label, and per-section timer ring using section accent color.
- [x] 2.3 Create `src/app/(app)/oracion/_components/guided-prayer-container.tsx` — imports `usePrayerSession`, renders `SectionProgressBar` + active section slot (placeholder text per section for now) + prev/next/pause controls. Receives `totalSeconds`, `sections`, `initialElapsed`, `onSync`, and section slot children.
- [x] 2.4 Modify `src/app/(app)/oracion/page.tsx` — fetch `oracion_secciones` from `configuracion_app` via `getConfigGrupo()`, call `parseSectionConfig()`, compute `SectionDuration[]` via `computeSectionDurations()`, pass as props to `OracionClient`.
- [x] 2.5 Modify `src/app/(app)/oracion/_components/oracion-client.tsx` — extract section config from props, delegate rendering to `GuidedPrayerContainer` when section config is present. Preserve existing timer path as fallback.
- [x] 2.6 Verify: `pnpm build` passes; prayer route loads with section config; container renders placeholder sections with correct durations.

## Phase 3: Adoration + Gratitude Sections + Visual Foundation (PR3, ~180 lines)

- [x] 3.1 Add prayer section CSS variables to `src/app/globals.css` — `--section-adoration`, `--section-confession`, `--section-gratitude`, `--section-supplication`, `--section-intercession` gradient pairs for light and dark mode per design visual system table.
- [x] 3.2 Create `src/app/(app)/oracion/_components/sections/adoration-section.tsx` — full-screen calm layout with warm gold gradient, scripture verse display (reuse `VERSES` from oracion-client), worship prompt text, section accent icon.
- [x] 3.3 Create `src/app/(app)/oracion/_components/sections/gratitude-section.tsx` — green gradient, thanksgiving prompts, optional reflection textarea (client-only, same ephemeral pattern as confession but lower risk).
- [x] 3.4 Wire `AdorationSection` and `GratitudeSection` into `GuidedPrayerContainer` slot rendering for sections 0 and 2.
- [x] 3.5 Verify: `pnpm build` passes; sections render with correct gradients on mobile viewport; transitions between sections are smooth.

## Phase 4: Confession Section — Ephemeral Client-Only (PR4, ~100 lines)

- [x] 4.1 Create `src/app/(app)/oracion/_components/sections/confession-section.tsx` — purple gradient, ephemeral `useState` textarea, clear visual notice "Esto no se guarda", component owns its own state with no upward callbacks carrying text.
- [x] 4.2 Add `useEffect` cleanup on unmount that resets confession state to empty string. Verify no `formData`, no server action import, no `localStorage` write for confession text.
- [x] 4.3 Wire `ConfessionSection` into `GuidedPrayerContainer` slot for section index 1. Container passes only timing progress (`sectionElapsed`) — no session dispatch.
- [x] 4.4 Verify: `pnpm build` passes; confession text is cleared on section change; grep confirms no server action receives confession content; progress sync payload excludes confession data.

## Phase 5: Supplication + Intercession + Session Summary (PR5, ~260 lines)

- [ ] 5.1 Create `src/app/(app)/oracion/_components/sections/supplication-section.tsx` — blue gradient, displays user's own petitions from `peticionesPropias` prop, each petition shows title + category + prayer count.
- [ ] 5.2 Create `src/app/(app)/oracion/_components/sections/intercession-section.tsx` — orange gradient, displays community petitions with requester identity (`usuario_nombre`), "Oré" tap button per petition reusing existing `handleOreTap` pattern, tracks interceded IDs locally for batch save on completion.
- [ ] 5.3 Create `src/app/(app)/oracion/_components/session-summary.tsx` — replaces `resumen-oracion.tsx`; shows total elapsed, per-section time breakdown, intercession count, completion status. Excludes confession text.
- [ ] 5.4 Wire `SupplicationSection`, `IntercessionSection` into container slots 3 and 4. Wire `SessionSummary` into `phase === 'complete'` state. Pass `peticionesPropias`, `peticionesComunidad`, `currentUserId` from `OracionClient` through container.
- [ ] 5.5 Verify: `pnpm build` passes; intercession "Oré" tap increments count; batch save fires on session complete; summary shows correct breakdown.

## Phase 6: Polish — Transitions, Accessibility, Responsive (PR6, ~150 lines)

- [ ] 6.1 Add section transition animations to `guided-prayer-container.tsx` — `opacity 400ms ease-in-out` crossfade between sections, respecting `prefers-reduced-motion` via CSS media query.
- [ ] 6.2 Add ARIA attributes: `role="region"` + `aria-label` per section with section name and position (e.g., "Adoración, sección 1 de 5"), `aria-live="polite"` on progress bar for elapsed time announcements.
- [ ] 6.3 Add focus management: auto-focus section content area on section change, trap focus within prayer container during active session.
- [ ] 6.4 Responsive tuning: verify and adjust typography scale, spacing, and timer ring size for viewports 320px–428px. Ensure `pb-safe` and `pt-safe` on container.
- [ ] 6.5 Remove dead code from `oracion-client.tsx` — extract reusable constants (`VERSES`, `BONUS_PROMPTS`) to shared module if still needed, or remove if fully replaced by guided prayer sections.
- [ ] 6.6 Final verification: `pnpm build` passes; `pnpm lint` clean; full guided prayer walkthrough on mobile viewport completes all 5 sections + summary.

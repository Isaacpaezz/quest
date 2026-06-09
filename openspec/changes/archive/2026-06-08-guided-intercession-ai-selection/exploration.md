## Exploration: Guided Intercession AI Selection

### Current State

Quest now has a section-based guided prayer flow. `/oracion` loads the active plan, group config, own petitions, community petitions, and computes section durations with `computeSectionDurations()`. Because `sectionDurations` is always passed, `OracionClient` delegates to `GuidedPrayerContainer` instead of the legacy timer UI.

The legacy timer path still contains the AI-guided intercession behavior: selected community petition IDs are sent to `generarOracionesGuiaBatch()`, generated text is stored in local guided state, and the UI displays `guidedPrayers[id] || currentPetition.oracion_guia`. That path also records `Oré` taps and flushes them through `registrarIntercesionesBatch()`.

The new guided section path does not use that AI path. `GuidedPrayerContainer` passes all `peticionesComunidad` into `IntercessionSection`; `IntercessionSection` renders petition cards, rotates a highlight every 20 seconds, and exposes an `Oré` button, but it does not accept or display `oracion_guia`, does not call `generarOracionesGuiaBatch()`, and does not limit the number of petitions to the section duration. The page query also intentionally maps `oracion_guia` to `null`, relying on the server action to validate cache perspective and context hash.

`generarOracionesGuiaBatch()` already has the right cost-control primitives: it accepts at most 20 IDs, validates the active group and petition state, builds a context hash including perspective and recent updates, reuses cached `oracion_guia` when the hash matches for intercession, and falls back locally if OpenAI is unavailable. `registrarIntercesionesBatch()` is idempotent via `oraciones_por_peticion` unique `(peticion_id, usuario_id)`, filters out the current user's own petitions, grants XP with a daily cap, and batches notifications.

### Affected Areas

- `src/app/(app)/oracion/page.tsx` — should compute the intercession section duration before selecting community petitions, fetch/prioritize a bounded candidate set, preserve requester identity, and preferably avoid sending all active group petitions to the client.
- `src/app/(app)/oracion/_components/guided-prayer-container.tsx` — should carry selected community petitions with guided-prayer text state, call or coordinate `generarOracionesGuiaBatch()` for the selected subset, and pass guided text into the intercession section.
- `src/app/(app)/oracion/_components/sections/intercession-section.tsx` — should render one time-appropriate guided petition at a time (or a short bounded sequence), display `oracion_guia`, keep requester identity, and preserve the existing `Oré` button behavior.
- `src/app/(app)/oracion/_components/oracion-client.tsx` — currently contains legacy guided-prayer generation logic; the new guided path should reuse the server action but avoid duplicating more state in the monolith.
- `src/app/(app)/peticiones/actions.ts` — `generarOracionesGuiaBatch()` and `registrarIntercesionesBatch()` can be reused; optional small extraction may make guided-prayer generation easier to share without changing behavior.
- `src/lib/prayer-sections.ts` — provides `intercesion` duration; no behavior change likely needed, but tests should cover downstream duration-to-petition-count logic if added elsewhere.
- `src/types/database.ts` and Supabase schema — existing `oracion_guia`, `oracion_guia_context_hash`, `oraciones_por_peticion`, and `oraciones_count` support this change without a required migration.
- `src/app/(app)/oracion/_components/preparacion-oracion.tsx` — legacy manual selection exists only outside the guided section path; it is relevant only if manual selection is intentionally reintroduced.
- `src/hooks/use-prayer-session.ts` — no direct change expected, but its `sectionElapsed` is the correct input for rotating within the intercession section.

### Approaches

1. **Server-selected subset with client-side guide generation** — Select the time-appropriate petition subset on `/oracion` server load, pass only that subset to the guided container, then generate/reuse guided prayers from the client via `generarOracionesGuiaBatch()` for those IDs.
   - Pros: avoids shipping every petition to the client, supports not-yet-prayed filtering and fairness using server data, limits OpenAI work to a small subset, reuses the existing validated cache action, keeps UI responsive by prefetching during earlier sections.
   - Cons: requires new selection helper/query logic and a client effect in `GuidedPrayerContainer`; cached guide text still arrives asynchronously unless generated before intercession starts.
   - Effort: Medium

2. **Client-selected subset from all loaded petitions** — Keep loading all community petitions on the server, compute the intercession capacity in the client, pick a subset in `GuidedPrayerContainer`, and generate guides for the selected IDs.
   - Pros: smallest implementation change, easy to preserve legacy local/manual selection state, no extra server helper needed.
   - Cons: still sends too many petitions to the browser, cannot reliably prioritize not-yet-prayed without also loading the user's existing intercessions, weaker privacy/data-minimization story, and repeats the current scalability problem.
   - Effort: Low

3. **Server action selects and generates on demand** — Add a dedicated server action such as `prepareGuidedIntercession(intercessionSeconds)` that selects petitions and returns generated/cached guide text in one call.
   - Pros: one client call, strongest centralization of selection + cache validation, can avoid stale `oracion_guia` entirely.
   - Cons: couples selection to OpenAI latency, can block the user at the start of prayer or on entering intercession, larger action surface, and easier to over-call unless carefully guarded.
   - Effort: Medium/High

### Recommendation

Use **Approach 1: server-selected subset with client-side guide generation**.

The server page should compute `intercessionSeconds` from the existing `sectionDurations` and select only the number of petitions that reasonably fit the section. A practical starting rule is: `maxPetitions = intercessionSeconds <= 0 ? 0 : clamp(floor(intercessionSeconds / 60), 0, 6)`, capped below the existing `generarOracionesGuiaBatch()` limit of 20. The exact seconds-per-petition can be tuned in spec/design, but it should be long enough for a 70–120 word guided prayer plus the user's `Oré` action; the current 20-second rotation is too short for AI-guided text.

Selection should happen on server page load, after section durations are known and before passing `peticionesComunidad` to the client. Recommended priority order:

1. Exclude the current user's own petitions from community intercession because `registrarIntercesionesBatch()` will not record self-intercession.
2. Prefer petitions the current user has not already prayed for, using `oraciones_por_peticion`.
3. Honor manually selected petition IDs first if the guided flow reintroduces a manual selector; otherwise do not add the selector in this follow-up.
4. Prioritize `urgente`, then other categories, but avoid letting urgency permanently starve the rest.
5. Prefer lower `oraciones_count` for fairness, then recent `creado_en` within the same priority bucket.
6. Cap repeated requester exposure, ideally one petition per requester in the first pass, then fill remaining slots if capacity remains.

The UI should show **one guided petition at a time**, not a scrollable list of all cards. Compute `secondsPerPetition = intercessionSection.seconds / selectedPetitions.length` and derive the active index from `sectionElapsed`; include a small counter/dots and optional manual previous/next controls if this stays within review budget. Each petition view should display requester identity, title/category, the AI-generated `oracion_guia` when available, a respectful loading/fallback state while generation resolves, and the existing `Oré` button. Batch save should remain in `GuidedPrayerContainer` through `onIntercessionBatch()` and `registrarIntercesionesBatch()`.

For OpenAI cost control, trigger `generarOracionesGuiaBatch()` only for the selected subset, ideally when the session starts or before the intercession section is reached. The client should attach to a module-level in-flight request during remounts, but after that request resolves it should call the server action again on later remounts instead of reading completed guide text from browser-session storage. Continue relying on the server action's context hash to reuse cached `oracion_guia`; do not trust raw DB `oracion_guia` from `/oracion/page.tsx` unless the same hash validation is extracted into a shared server helper.

Expected review size is **medium**: roughly 250–380 changed lines if scoped to selection helper/tests, guided container generation state, and a focused intercession section update. It may exceed the 400-line review budget if manual selection UI, extra carousel controls, or server-action refactors are included.

### Risks

- OpenAI latency could leave the intercession section without guide text if generation starts too late; prefetch selected guides during earlier sections and show a calm fallback.
- Over-selecting petitions will recreate the original problem and increase OpenAI calls; enforce a small duration-based cap.
- Current community query includes the current user's own petitions; these should be excluded or they will display but never save as intercessions.
- Existing `oracion_guia` cache is safe only when validated against the current perspective/context hash; avoid displaying unvalidated raw cache.
- Fairness rules can become complex quickly; keep the first version deterministic and testable without adding schema unless product needs stronger rotation history later.
- `usePrayerSession` localStorage restores elapsed/section state, but interceded IDs are currently local component state only; exiting mid-session flushes, but browser refresh during the intercession section may lose unsaved `Oré` taps unless local persistence is added.

### Ready for Proposal

Yes — proceed to proposal with a focused follow-up: server-select a bounded, fair subset from the intercession section duration; generate/reuse AI guided prayers only for that subset; render one petition at a time with requester identity and `Oré`; preserve the existing batch save behavior.

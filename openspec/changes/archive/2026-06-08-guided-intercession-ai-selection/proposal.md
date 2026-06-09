# Guided Intercession AI Selection

## Why

The guided prayer experience now has a dedicated Community Intercession section, but it does not yet preserve the legacy AI-guided prayer behavior. It also passes all community petitions into the section, which does not scale when the section has limited time.

This change restores AI-guided intercession inside the new guided prayer flow and limits the number of petitions shown based on the configured intercession duration.

## What Changes

- Select a bounded subset of community petitions for the guided intercession section.
- Calculate the maximum number of petitions from the intercession section duration.
- Generate or reuse AI-guided prayer text for only the selected petitions.
- Render one guided petition at a time with requester identity, petition details, guide text, and the existing `Oré` action.
- Preserve existing batch intercession save behavior.

## Goals

- Restore AI-guided prayer text in guided intercession.
- Avoid showing every community petition when the available time is limited.
- Reduce OpenAI cost by generating guides only for selected petitions.
- Preserve requester identity for shared community petitions.
- Avoid showing self-owned petitions in community intercession when they cannot be saved as intercessions.
- Keep the first version deterministic, testable, and small enough for review.

## Non-Goals

- Do not redesign the whole guided prayer flow.
- Do not add a manual petition picker in this follow-up.
- Do not change confession behavior.
- Do not add new Supabase tables for rotation/fairness history.
- Do not generate AI text for every active community petition.

## Proposed Approach

Use **server-selected subset with client-side guide generation**.

1. `/oracion/page.tsx` computes section durations as it does today.
2. The server identifies the `intercesion` duration.
3. The server selects only the number of community petitions that fit that duration.
4. The client receives the bounded subset.
5. `GuidedPrayerContainer` requests AI guide text via `generarOracionesGuiaBatch()` for that selected subset only.
6. `IntercessionSection` shows one guided petition at a time, using `sectionElapsed` to determine the active petition.

## Selection Model

Initial rule:

```txt
secondsPerPetition = 60
maxPetitions = clamp(floor(intercessionSeconds / secondsPerPetition), 0, 6)
```

If `intercessionSeconds` is zero or no community petitions are available, show an empty state.

Priority order:

1. Exclude petitions authored by the current user.
2. Prefer petitions the user has not already prayed for.
3. Prioritize urgent petitions.
4. Prefer lower `oraciones_count` for fairness.
5. Prefer recent petitions within the same priority bucket.
6. Avoid showing multiple petitions from the same requester in the first pass when possible.

## AI Guide Model

- Call `generarOracionesGuiaBatch()` only with selected petition IDs.
- Reuse cached `oracion_guia` through the existing server action, which validates perspective/context hash.
- Reuse only an active in-flight guide request for the same selected-petition fingerprint; after resolution, later remounts call the server action again so validated server-side cache freshness decides what to return.
- Show a calm loading state while guide text is being prepared.
- Show a fallback prompt if generation fails.

## User Journeys

### Guided intercession with enough time

1. User reaches Community Intercession.
2. Quest shows petition 1 of N with requester identity.
3. AI guide text appears when ready.
4. User taps `Oré`.
5. Section advances through the bounded set based on time.
6. Completion batch saves intercessions as today.

### Guided intercession with many petitions

1. The group has many active community petitions.
2. Quest selects only the subset that fits the section duration.
3. The user sees a focused sequence instead of a long feed.

### AI guide unavailable

1. Guide generation fails or is slow.
2. Quest keeps the petition visible with requester identity.
3. Quest shows a respectful fallback prompt.
4. User can still tap `Oré`.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| OpenAI latency | Prefetch guides before the intercession section when possible; show fallback text. |
| Too many AI calls | Select a small bounded subset and reuse only an active in-flight batch request; completed guide reuse stays behind the server action's validation. |
| Self-owned petitions displayed | Exclude current user's petitions in server selection. |
| Stale cached guide text | Use `generarOracionesGuiaBatch()` rather than raw DB `oracion_guia` from page load or completed browser-session guide storage, letting the server validate the current context. |
| Review size creep | Exclude manual selection UI and advanced fairness persistence from this change. |

## Review Forecast

- Expected size: ~250–380 changed lines.
- 400-line budget risk: Medium.
- Chained PRs recommended: No unless implementation grows beyond the selection + AI rendering scope.

## Open Questions

- Should `secondsPerPetition` start at 60 seconds or 45 seconds?
- Should urgent petitions always outrank fairness, or only within a bounded priority boost?

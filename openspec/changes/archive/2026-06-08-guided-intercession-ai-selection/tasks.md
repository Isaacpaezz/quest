# Tasks: Guided Intercession AI Selection

## Review Workload Forecast

| Field | Value |
| --- | --- |
| Estimated changed lines | 300–420 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR if scoped to planned files; split tests/helper from UI only if implementation grows. |
| Delivery strategy | auto-forecast |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: feature-branch-chain
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
| --- | --- | --- | --- |
| 1 | Selection helper + tests | PR 1 if split | Autonomous pure utility work. |
| 2 | Page wiring + AI guide state + UI | PR 2 if split | Depends on Unit 1. |

## Phase 1: Selection Foundation

- [x] 1.1 Create `src/lib/guided-intercession.ts` with capacity and deterministic petition selection helpers.
- [x] 1.2 Add `src/lib/guided-intercession.test.ts` covering zero duration, max cap, own-petition exclusion, prayed-before priority, urgency, count, and recency ordering.

## Phase 2: Server Data Wiring

- [x] 2.1 Update `src/app/(app)/oracion/page.tsx` to derive `intercessionSeconds` from `sectionDurations` before finalizing community petitions.
- [x] 2.2 Update the community petition query/mapping to include fields needed for selection and exclude/pass current-user data safely.
- [x] 2.3 Apply the selection helper so `peticionesComunidad` contains only the bounded selected subset.

## Phase 3: AI Guide State

- [x] 3.1 Update `src/app/(app)/oracion/_components/guided-prayer-container.tsx` to request `generarOracionesGuiaBatch()` once for selected community petition IDs.
- [x] 3.2 Track guide text, loading, and error state by petition ID without repeating calls across re-renders.
- [x] 3.3 Pass guide state and selected petition timing context into `IntercessionSection`.

## Phase 4: Guided Intercession UI

- [x] 4.1 Update `src/app/(app)/oracion/_components/sections/intercession-section.tsx` to render one active petition based on `sectionElapsed`.
- [x] 4.2 Show requester identity, category/count metadata, AI guide text, loading/fallback copy, and the existing `Oré` action.
- [x] 4.3 Preserve the existing batch intercession callback and prevent duplicate `Oré` taps for already-prayed IDs.

## Phase 5: Verification

- [x] 5.1 Run `pnpm test` and fix failures.
- [x] 5.2 Run `pnpm lint` and fix failures.
- [x] 5.3 Run `pnpm build` and fix failures.
- [x] 5.4 Run a fresh-context review before commit or PR because code changes will touch multiple files.

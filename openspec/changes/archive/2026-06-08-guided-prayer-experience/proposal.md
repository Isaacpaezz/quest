# Guided Prayer Experience

## Why

Quest currently treats prayer primarily as a plan-driven timer with petition rotation. The experience records prayer progress, supports intercession, and reuses existing prayer request data, but it does not guide the user through a structured prayer rhythm or allocate the configured prayer time across meaningful sections.

The goal of this change is to turn prayer into a calm, visually pleasant, guided experience that helps users pray with focus while preserving the existing plan duration, community petitions, and progress systems.

## What Changes

- Introduce a section-based guided prayer flow:
  - Adoration
  - Confession
  - Gratitude / Thanksgiving
  - Personal supplication
  - Community intercession
- Divide the plan-configured prayer duration across those sections using admin-configurable percentages.
- Add admin configuration for guided prayer section percentages, including validation that the total is exactly 100%.
- Preserve requester identity in community prayer requests because community sharing is explicit in Quest.
- Keep confession input ephemeral and client-only; it must not be sent to Supabase, stored in progress sync, or included in server actions.
- Improve the prayer UI so it feels calm, immersive, and pleasant rather than form-like or feed-like.
- Refactor the current monolithic prayer client toward a state-machine/container model with section slots.

## Goals

- Use the existing `planes_lectura.minutos_oracion_requeridos` as the total prayer time pool.
- Let admins tune the guided prayer rhythm without code changes.
- Guide the user through one prayer focus at a time.
- Reuse existing petition and intercession actions where possible.
- Make the community intercession section clearly about praying for known community members, not anonymous content consumption.
- Treat visual quality as an acceptance criterion: typography, spacing, transitions, gradients, and section progress should support a peaceful prayer posture.

## Non-Goals

- Do not rebuild the whole prayer experience as a full Instagram Stories carousel in the first slice.
- Do not add streaks, leaderboards, or competitive prayer mechanics.
- Do not persist confession text.
- Do not change the existing prayer request visibility model beyond the guided prayer integration.
- Do not introduce destructive Supabase schema changes.

## Proposed Approach

Use a **state-machine container with section slots**.

The prayer page should compute section durations from:

```txt
section_seconds = total_prayer_seconds * section_percentage / 100
```

Durations should use integer seconds. Any rounding remainder should be assigned deterministically, preferably to the final section, so the sum of section durations matches the configured total.

The container owns:

- current section index
- total elapsed time
- per-section elapsed time
- pause/resume state
- manual next/previous navigation
- completion state
- periodic progress sync using existing prayer progress behavior

Each section slot owns only its display and local interactions.

## Default Section Percentages

Initial defaults:

| Section | Percentage |
| --- | ---: |
| Adoration | 20% |
| Confession | 15% |
| Gratitude / Thanksgiving | 20% |
| Personal supplication | 25% |
| Community intercession | 20% |

The admin UI must show the live total and block save when the sum is not 100%.

## User Journeys

### Plan-Driven Guided Prayer Session

1. User opens the prayer route.
2. Quest loads the active plan prayer duration.
3. Quest loads guided prayer percentage configuration, falling back to safe defaults when missing.
4. User starts prayer.
5. The guided prayer container presents one section at a time with a calm full-screen layout.
6. The section progress advances automatically, while the user may pause or manually move forward/back.
7. Existing prayer progress continues syncing safely without including ephemeral section text.
8. Completion shows a summary of the session and intercessions.

### Admin Percentage Configuration

1. Admin opens configuration.
2. Admin sees the guided prayer section percentages.
3. Admin adjusts percentages.
4. UI shows the current total and section distribution.
5. Save is allowed only when total equals 100% and each required section has a valid non-negative percentage.
6. Config is stored additively in `configuracion_app`.

### Community Intercession

1. User reaches the community intercession section.
2. Quest presents shared community requests with requester identity visible.
3. User taps the existing intercession action to mark that they prayed for a request.
4. Completion persists intercession updates using existing batch behavior where possible.

### Confession

1. User reaches the confession section.
2. Quest may offer an optional private reflection input.
3. The UI must clearly communicate that the input is not saved.
4. The value remains in React state only and is wiped when leaving/completing the session.
5. No server action receives confession text.

## Scope Boundaries

Recommended chained implementation forecast:

| Slice | Scope | Estimated review size |
| --- | --- | ---: |
| 1 | Admin config storage/types/UI for section percentages | ~150 lines |
| 2 | Prayer session state machine and section duration calculation | ~300 lines |
| 3 | Adoration and Gratitude sections with pleasant visual style | ~250 lines |
| 4 | Confession section with client-only ephemeral input | ~200 lines |
| 5 | Personal supplication and community intercession integration | ~250 lines |
| 6 | Summary polish, transitions, accessibility, responsive visual refinement | ~200 lines |

Because the full change exceeds the 400-line review budget, chained PRs are expected unless the task phase finds a smaller safe slice plan.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Confession text leaks to server | Keep confession state local to the section component; never include it in progress sync payloads or server actions. |
| Admin config invalid percentages | Validate client-side and server-side; require total of 100%. |
| Missing config breaks prayer route | Provide hardcoded safe defaults. |
| Visual scope creep | Start with section slots and calm layouts before adding complex gestures/carousel behavior. |
| Prayer feels like social feed | Keep community intercession as a focused section, not an infinite feed. |
| Existing monolithic component becomes worse | Extract timer/session behavior before adding section-specific UI. |
| Supabase production risk | Use additive config changes only; no destructive migrations. |

## Open Questions

- Should section-level completion be persisted in `progreso_usuario`, or remain client-only for the first release?
- Should manual early advance redistribute remaining time across pending sections, or simply complete the session earlier?

## Success Criteria

- A user can complete a plan-driven guided prayer session divided into configured sections.
- Admins can adjust section percentages and cannot save invalid totals.
- Community intercession shows requester identity and reuses existing prayer request behavior.
- Confession text never leaves the client.
- The experience is visually calm, readable, and pleasant on mobile.

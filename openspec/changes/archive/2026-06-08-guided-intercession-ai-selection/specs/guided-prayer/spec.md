# Delta for Guided Prayer

## ADDED Requirements

### Requirement: Duration-Bounded Guided Intercession Selection

The system MUST select a bounded set of community petitions for guided intercession based on the configured intercession section duration.

#### Scenario: Selects petitions that fit the section duration

- GIVEN a guided prayer plan with an intercession section duration
- WHEN the prayer page prepares community intercession data
- THEN the selected petition count MUST NOT exceed the duration-based capacity
- AND the selected petition count MUST NOT exceed 6 petitions.

#### Scenario: Handles no available petitions

- GIVEN no eligible community petitions are available
- WHEN the user reaches guided intercession
- THEN the system MUST show a calm empty state
- AND MUST NOT request AI guide generation.

### Requirement: Eligible and Fair Petition Selection

The system MUST exclude the current user's own petitions and SHOULD prioritize petitions using deterministic fairness rules.

#### Scenario: Excludes own petitions

- GIVEN the active group contains petitions authored by the current user
- WHEN guided intercession petitions are selected
- THEN those own petitions MUST NOT be included.

#### Scenario: Applies fairness priority

- GIVEN multiple eligible petitions exist
- WHEN the system selects the bounded subset
- THEN it SHOULD prefer not-yet-prayed petitions, urgent petitions, lower `oraciones_count`, and recent petitions within the same priority bucket.

### Requirement: AI Guide Generation for Selected Petitions

The system MUST generate or reuse AI-guided prayer text only for the selected guided intercession petitions.

#### Scenario: Requests guides only for selected petitions

- GIVEN a bounded selected petition set
- WHEN guided prayer prepares intercession guide text
- THEN it MUST call the validated batch guide action only for selected petition IDs
- AND MUST NOT generate guide text for unselected community petitions.

#### Scenario: Reuses validated cache

- GIVEN a selected petition has a valid cached intercession guide
- WHEN guide text is requested
- THEN the system MUST reuse the validated cached guide returned by the server action.

#### Scenario: Remount handles in-flight guide generation

- GIVEN guide generation is already in flight for the selected petition fingerprint
- WHEN the guided prayer component remounts before the request resolves
- THEN the remounted component MUST NOT get permanently stuck in an unrequested or empty guide state
- AND it MUST eventually show the validated guide text or the calm fallback state.

#### Scenario: Post-resolution remount revalidates guide freshness

- GIVEN guide generation has already resolved for selected petitions
- WHEN the guided prayer component later remounts or reopens with the same selected petition IDs
- THEN the system MUST call the validated batch guide action again so server-side context validation decides whether cached guide text is fresh.
- AND it MUST NOT skip the server action by reading completed guide text from browser-session storage.

### Requirement: One-Petition Guided Intercession UI

The guided intercession section MUST present one selected petition at a time with requester identity, guide text, and the existing `Oré` behavior.

#### Scenario: Shows active petition with identity

- GIVEN selected petitions are available
- WHEN the user enters guided intercession
- THEN the section MUST show the active petition's requester identity, title, category, and prayer content.
- AND it MUST show AI guide text when available.

#### Scenario: Saves intercession action

- GIVEN the active petition is visible
- WHEN the user taps `Oré`
- THEN the petition ID MUST be queued for the existing batch intercession save flow.

#### Scenario: Shows calm guide fallback

- GIVEN AI guide text is loading or unavailable
- WHEN the active petition is displayed
- THEN the section MUST show a calm loading or fallback prompt
- AND the user MUST still be able to mark the petition as prayed.

## REMOVED Requirements

### Requirement: Manual Guided Intercession Selector

(Reason: Manual petition selection is intentionally out of scope for this follow-up.)
(Migration: None.)

### Requirement: Persistent Fairness Rotation State

(Reason: First-pass fairness uses existing petition and prayer metadata without new tables.)
(Migration: None.)

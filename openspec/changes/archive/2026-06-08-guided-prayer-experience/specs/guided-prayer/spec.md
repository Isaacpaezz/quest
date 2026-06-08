# Guided Prayer Specification

## ADDED Requirements

### Requirement: Guided prayer sections

Quest SHALL guide a prayer session through these ordered sections: Adoration, Confession, Gratitude / Thanksgiving, Personal supplication, and Community intercession.

#### Scenario: User starts a plan-driven prayer session

- **Given** the user has an active reading plan with a configured prayer duration
- **When** the user starts the prayer session
- **Then** Quest presents the first guided section, Adoration
- **And** the session progresses through all required sections in order
- **And** each section presents a focused prompt or interaction for that prayer theme

#### Scenario: User navigates between sections

- **Given** the user is in an active guided prayer session
- **When** the user manually advances to the next section
- **Then** Quest moves to the next section without ending the full session
- **And** Quest preserves total prayer progress tracking

### Requirement: Admin-configurable section percentages

Admins SHALL be able to configure the time percentage assigned to each guided prayer section.

#### Scenario: Admin saves valid section percentages

- **Given** an admin configures Adoration 20%, Confession 15%, Gratitude 20%, Personal supplication 25%, and Community intercession 20%
- **When** the admin saves the configuration
- **Then** Quest accepts the configuration
- **And** the configuration total is 100%

#### Scenario: Admin attempts to save invalid section percentages

- **Given** an admin configures section percentages whose total is not 100%
- **When** the admin attempts to save
- **Then** Quest blocks the save
- **And** Quest shows a clear validation message with the current total

#### Scenario: Section configuration is missing

- **Given** no guided prayer section configuration exists for the group
- **When** Quest loads the prayer session
- **Then** Quest uses safe default percentages
- **And** the prayer session remains usable

### Requirement: Section duration calculation

Quest SHALL calculate each section duration from the plan's total prayer duration and the configured section percentages.

#### Scenario: Section durations are computed from plan time

- **Given** the plan requires 10 minutes of prayer
- **And** the section percentages are 20%, 15%, 20%, 25%, and 20%
- **When** Quest prepares the guided prayer session
- **Then** Quest allocates the total 600 seconds across the sections according to those percentages

#### Scenario: Rounding produces an exact total

- **Given** section duration calculations produce fractional seconds
- **When** Quest computes section durations
- **Then** Quest uses integer seconds
- **And** any rounding remainder is assigned deterministically so the sum of section durations equals the total prayer duration

### Requirement: Calm and pleasant prayer UI

The guided prayer UI SHALL provide a calm, visually pleasant mobile experience suitable for focused prayer.

#### Scenario: User views a guided section

- **Given** the user is in a guided prayer section
- **When** the section renders
- **Then** the UI uses readable typography, generous spacing, calm color treatment, and minimal visual noise
- **And** the current section and progress are clear without making the user feel rushed

#### Scenario: User transitions between sections

- **Given** the current section time completes or the user advances manually
- **When** Quest moves to the next section
- **Then** the transition is visually gentle
- **And** the experience does not resemble an infinite social feed

### Requirement: Community intercession identity

Community intercession SHALL display the requester identity for shared community prayer requests.

#### Scenario: User reaches community intercession

- **Given** a community prayer request was intentionally shared by its author
- **When** the request appears in the community intercession section
- **Then** Quest displays the requester identity using the available profile information
- **And** Quest allows the user to mark that they prayed for the request using the existing intercession behavior

### Requirement: Confession privacy

Confession text SHALL be client-only and ephemeral.

#### Scenario: User writes in the confession section

- **Given** the user enters text in the confession section
- **When** the user advances, exits, or completes the session
- **Then** Quest clears the confession text from component state
- **And** Quest does not send that text to Supabase or any server action
- **And** Quest does not store that text in localStorage or session progress payloads

#### Scenario: Prayer progress sync runs during confession

- **Given** the user is in the confession section
- **When** periodic prayer progress sync runs
- **Then** the sync payload includes only allowed progress metadata
- **And** the sync payload excludes confession text or private reflection content

### Requirement: Session completion summary

Quest SHALL show a completion summary after the guided prayer session.

#### Scenario: User completes all sections

- **Given** the user completes the guided prayer session
- **When** Quest shows the completion state
- **Then** the summary includes session completion status and prayer progress
- **And** the summary may include intercession activity
- **And** the summary does not include confession text

### Requirement: Accessibility basics

Guided prayer screens SHALL support basic accessibility needs.

#### Scenario: Assistive technology reads section state

- **Given** the user relies on assistive technology
- **When** a guided prayer section is active
- **Then** Quest exposes the section name, position in sequence, and progress in accessible text

#### Scenario: Motion reduction is preferred

- **Given** the user prefers reduced motion
- **When** section transitions occur
- **Then** Quest avoids disruptive motion and uses a simpler transition treatment

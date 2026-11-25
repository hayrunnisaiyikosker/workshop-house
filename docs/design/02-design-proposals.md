# Workshop House — UI/UX Design Proposal

**Project:** Workshop House — Web application for running short courses and technical workshops  
**Course:** Advanced Web Programming (SFWE475 / CPRG201)  
**Author:** Hayrunnisa İyiköşker (ID: 2203060011)  
**Status:** Design proposal — documentation only. No production code modified.  
**Branch:** feature/hardening-1  
**Date:** 2026-11-23

---

## 1. Executive Summary

This document proposes a UI/UX design direction for Workshop House, a three-tier, server-rendered web application built with Node.js, Express 5, TypeScript, Nunjucks, and PostgreSQL. The application supports three user roles (Learner, Trainer, Coordinator) and enforces strict business rules around enrollment capacity, attendance integrity, trainer isolation, and role-based authorization.

The design proposal is grounded in three sources reviewed together:

1. **The Software Requirements Specification (SRS)** — the authoritative source for functional requirements, business rules, priorities, scope, constraints, and acceptance scenarios.
2. **The existing project implementation** — the actual codebase architecture, routes, services, database schema, templates, and CSS.
3. **The current Google Stitch design exploration ("The Cozy Creative Community")** — a visual design candidate featuring warm cream backgrounds, peach, butter yellow, sage, powder blue, subtle lilac, friendly typography, and workshop photography.

A UI/UX audit file was referenced in the project brief but **no audit document exists in the repository**. Where audit findings are referenced in this document, they are derived from direct inspection of the existing templates, CSS, and implementation rather than from an external audit report.

**Key design decision:** The Cozy design direction is evaluated critically. It is visually appealing and aligns with the "workshop/community" identity, but its warm pastel palette and soft contrast present accessibility risks for WCAG 2.2 AA compliance — particularly for text scaling, high contrast mode, and focus visibility. A recommended design direction is proposed that preserves the Cozy's warm, community-oriented identity while meeting accessibility requirements and the practical constraints of the existing Nunjucks + vanilla CSS architecture.

No production code, database migrations, routes, services, or business logic are modified by this document.


---

## 6. Design Opportunities

1. Establish a distinct brand identity (warm, workshop-appropriate, inspired by Cozy exploration).
2. Role-specific visual context — signal which role the user is in without separate design systems.
3. Discovery vs. management layouts — cards for learner browsing, tables for staff administration.
4. Enhance empty states with clear next actions.
5. Strengthen capacity communication — remaining seats prominent and unambiguous (BR-01, BR-03).
6. Clarify check-in workflow — camera vs. manual entry equally clear (FR-17, 18, 19).
7. Define responsive breakpoints for mobile/tablet/desktop.
8. Consistent feedback patterns — alerts, inline errors, success states.


---

## 7. Design Direction Comparison

### Direction A: "Cozy Creative Community" (Current Google Stitch Candidate)

**Visuals:** Warm cream, peach, butter yellow, sage, powder blue, subtle lilac; friendly rounded typography; workshop photography; soft rounded components; pastel accents.

**Strengths:** Warm, inviting, community-oriented; differentiates from generic blue-gray; aligns with "Workshop House" brand.

**Risks:** Pastel colors may fail WCAG 2.2 AA contrast (4.5:1 normal text); cream with light pastel text unreadable for low vision; soft focus rings may not show on light backgrounds; photography adds page weight; may feel too soft for Coordinator administrative tasks.

**AA compliance:** Moderate risk — needs careful contrast testing and darker accent variants.

**Architecture fit:** Good — works with Nunjucks + vanilla CSS, no new dependencies.

### Direction B: "Workshop Studio" (Professional Creative)

**Visuals:** Neutral warm base (off-white, warm gray); saturated accessible accents (deep terracotta, forest green, indigo); clean sans-serif typography; minimal imagery (icons); 4-6px border radius; high contrast text/background.

**Strengths:** Excellent AA compliance; clear hierarchy for admin tasks; works for discovery and management contexts; prints and projects well.

**Risks:** Less emotionally warm than Cozy; may feel more corporate.

**AA compliance:** Strong — contrast designed in from the start.

**Architecture fit:** Good — works with existing CSS custom properties.

### Direction C: "Community Bulletin Board" (Warm + Functional Hybrid)

**Visuals:** Warm cream/off-white background (from Cozy); saturated accessible accent colors; mix of cards (discovery) and tables (management); friendly typography with clear hierarchy; minimal purposeful imagery; defined responsive breakpoints.

**Strengths:** Balances warmth with accessibility; role-appropriate layouts; builds on existing CSS custom properties; practical for Nunjucks architecture.

**Risks:** More design tokens to manage; two layout systems need consistency.

**AA compliance:** Strong — contrast designed in, warmth from background not text colors.

**Architecture fit:** Good — works with existing CSS custom properties system.

---

## 8. Critical Evaluation of the Cozy Design

### 8.1 What Works Well Visually

Warm color story (cream, peach, butter yellow, sage, powder blue, lilac) creates a welcoming, community-oriented atmosphere appropriate for a workshop platform. Friendly typography supports approachability. Workshop photography reinforces the creative community identity. Soft rounded components feel approachable for learners.

### 8.2 What Works Well from a UX Perspective

Warm backgrounds reduce eye strain compared to stark white. Pastel accents can differentiate interactive elements from static content. Community-focused imagery helps learners understand the platform's purpose.

### 8.3 What Should Be Improved

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| Contrast risk | Pastel text on cream may fail WCAG 2.2 AA | Use pastels for backgrounds/borders only; text must be dark enough (#3f2e1e or darker on cream) |
| Focus visibility | Soft focus rings may disappear on light backgrounds | Ensure focus rings are at least 3px with high-contrast color |

---

## 9. Recommended Design Direction

**Recommended: Direction C — "Community Bulletin Board" (Warm + Functional Hybrid)**

This direction combines the warm, community-oriented background palette from Cozy with saturated, accessible accent colors for interactive elements. It uses role-appropriate layouts (cards for learner discovery, tables for staff management) and preserves all existing accessibility features.

### 9.1 Why This Direction

| Criterion | Rationale |
|-----------|-----------|
| WCAG 2.2 AA compliance | Contrast designed in from the start; dark text on warm backgrounds; saturated accents for interactive elements |
| Role differentiation | Learner gets warm, discovery-friendly layouts; Trainer/Coordinator get clear, data-dense administrative layouts |
| Existing architecture | Works with Nunjucks + vanilla CSS custom properties; no new dependencies |
| Business rule communication | Saturated colors make capacity warnings, errors, and success states unambiguous |
| Brand identity | Warm but not saccharine; professional where needed, welcoming where appropriate |


---

## 10. Page-Level Proposals

### 10.1 Public and Learner

#### 10.1.1 Homepage

| Attribute | Detail |
|-----------|--------|
| Primary purpose | Welcome visitors, explain the platform, route learners/trainers/coordinators to starting points |
| User goal | Understand what Workshop House is and sign in or browse sessions |
| Information hierarchy | 1. Brand + value proposition 2. Role-based entry points (Sign In / Browse Workshops) 3. Three-role summary 4. Footer |
| Proposed layout | Single-column hero section with headline, subhead, primary CTA (Sign In), secondary CTA (Browse Workshops), three-role feature grid below |
| Main components | Hero banner, role cards (Learner/Trainer/Coordinator), CTA buttons |
| Primary action | Sign In |
| Secondary action | Browse Workshops |
| Interaction states | Button hover/focus, card hover |
| Responsive behavior | Stack role cards vertically on mobile; side-by-side on tablet+ |
| Accessibility | Skip link to main content, heading hierarchy (h1 → h2 → h3), contrast on hero text, descriptive link text |

#### 10.1.2 Workshop Browsing (Session List)

| Attribute | Detail |
|-----------|--------|
| Primary purpose | Let learners browse upcoming sessions and see remaining seats |
| User goal | Find a session to enroll in |
| Information hierarchy | 1. Page title 2. Session count/filter summary 3. Session cards (discovery) or table (staff view) 4. Empty state |
| Proposed layout | Learner: card grid (2-3 columns desktop, 1 column mobile). Each card shows course title, trainer, date/time, room, capacity bar, remaining seats, enroll button. Coordinator/Trainer: table view with enrollment counts and actions. |
| Main components | Session card, capacity indicator, enroll button, empty state, filter controls |
| Primary action | Enroll in session |
| Secondary action | View session details |
| Interaction states | Enroll button disabled when full; hover/focus states; loading state |
| Responsive behavior | Card grid → single column on mobile; table scrolls horizontally on small screens |
| Accessibility | Cards use `<article>` or role="region"; capacity color + text (not color alone); "X of Y seats remaining" text; ARIA labels on enroll buttons |

#### 10.1.3 Workshop Detail

| Attribute | Detail |
|-----------|--------|
| Primary purpose | Show full session information and enrollment actions |
| User goal | Decide whether to enroll; enroll if eligible |
| Information hierarchy | 1. Course title 2. Session meta (trainer, room, dates) 3. Capacity/remaining seats (prominent) 4. Description 5. Resource link (conditional) 6. Announcements (conditional) 7. Enrollment action box |
| Proposed layout | Single column, max-width ~720px. Session info card, resource section (conditional visibility), announcements list, enrollment card with enroll/cancel/re-enroll actions |
| Main components | Session meta grid, resource card, announcement list, enrollment action card, check-in QR/code display |
| Primary action | Enroll / Cancel / Re-enroll |
| Secondary action | Access resource, view announcements |
| Interaction states | Form submit states, flash messages, button disabled when full |
| Responsive behavior | Single column on all sizes; meta grid stacks on mobile |
| Accessibility | Capacity text + color indicator; resource link not rendered in HTML for unauthorized users (server-side); check-in code has `code` styling; QR has `aria-label` and `role="img"` |

#### 10.1.4 Login

| Attribute | Detail |
|-----------|--------|
| Primary purpose | Authenticate users with email and password |
| User goal | Sign in to access role-appropriate features |
| Information hierarchy | 1. Page title 2. Login form (email, password, submit) 3. Error messages (inline + summary) |
| Proposed layout | Centered form card, max-width ~400px. Email input, password input, submit button. Error summary above form if validation fails. |
| Main components | Form inputs, submit button, error summary, field errors |
| Primary action | Sign In |
| Secondary action | None (no registration — SRS Section 2.5: users created by seed data) |
| Interaction states | Button loading state, inline field errors, error summary |
| Responsive behavior | Full width on mobile, centered card on desktop |
| Accessibility | Labels on all inputs, `aria-invalid` on errored fields, error summary linked via `aria-describedby`, focus order logical |

#### 10.1.5 My Sessions

### 10.2 Trainer

#### 10.2.1 Trainer Session Overview (My Assigned Sessions)

| Attribute | Detail |
|-----------|--------|
| Primary purpose | Show trainer's assigned sessions with quick links to attendance, check-in, and resource management |
| User goal | Manage own sessions; access attendance and check-in |
| Information hierarchy | 1. Page title 2. Session cards (one per assigned session) 3. Each card: session meta, enrolled count, action buttons (Attendance, Check-in, Public Page, Resource form) |
| Proposed layout | Card grid (current implementation). Each card shows course title, schedule, room, enrolled/capacity, remaining seats, action buttons. Resource update form inline on each card. |
| Main components | Session card, capacity indicator, action buttons, resource update form, empty state |
| Primary action | Open Attendance / Open Check-in |
| Secondary action | Update resource link, view public page |
| Interaction states | Form submit states, button hover/focus |
| Responsive behavior | Card grid → single column; action buttons stack vertically on mobile |
| Accessibility | Button labels are descriptive ("Attendance & Roster", "Check-in Terminal"), not vague ("Go", "Click"); remaining seats as text + color |

#### 10.2.2 Participant List (Attendance & Completions)

| Attribute | Detail |
|-----------|--------|
| Primary purpose | Let trainer mark attendance and completion for active enrollments |
| User goal | Mark learners as attended/absent, record completion |
| Information hierarchy | 1. Back link 2. Session summary card (course, room, schedule, enrolled count, attended count) 3. Participant roster table 4. Announcements section |
| Proposed layout | Session summary card at top, roster table below, announcements section at bottom. Each roster row: learner name, email, attendance status badge, method, completion status, action buttons (Present/Absent/Mark Complete/Revoke) |
| Main components | Session summary card, roster table, status badges, action forms per row, announcement form, announcement list |
| Primary action | Mark Present / Mark Absent / Mark Complete |
| Secondary action | Post announcement, open check-in terminal |
| Interaction states | Button states per row, flash messages, form submission |
| Responsive behavior | Table scrolls horizontally; action buttons stack vertically per row on mobile |
| Accessibility | Table with `aria-label`, row-level context (learner name announced with each action), status badges with text + icons, confirm not needed for attendance (immediate action per SRS) |

#### 10.2.3 QR/Code Check-in Terminal

| Attribute | Detail |
|-----------|--------|
| Primary purpose | Let trainer check in learners by scanning QR or typing code |
| User goal | Record attendance quickly during a live session |
| Information hierarchy | 1. Back link 2. Session info card (course, schedule, room, check-in window notice) 3. Check-in form (code input prominent, submit button) |
| Proposed layout | Centered column, max-width ~580px (current). Session info card, check-in window alert, large code input with autofocus, submit button. Camera/QR scanning is referenced as a concept but the current UI is text-input based. |
| Main components | Session info card, check-in window notice, code input (large, monospace, uppercase), submit button, Alt+Shift+K hint |
| Primary action | Record Check-in |
| Secondary action | Return to Attendance Roster |
| Interaction states | Input autofocus, submit disabled until valid pattern, flash message on result |
| Responsive behavior | Single column; input full width on mobile |
| Accessibility | Large touch target input (56px height), `autofocus`, `aria-describedby` hint, `pattern` validation, Alt+Shift+K keyboard shortcut, clear error messages for invalid/unknown/outside-window codes (FR-19) |

#### 10.2.4 Resources

| Attribute | Detail |
|-----------|--------|
| Primary purpose | Let trainer set a resource link on their own session |
| User goal | Share course materials with enrolled learners |
| Information hierarchy | Resource URL input, submit button, current URL display |
| Proposed layout | Inline form on trainer session card (current implementation). URL input, "Update Resource" button. |
| Main components | URL input, submit button |
| Primary action | Update Resource |
| Secondary action | None |
| Interaction states | Form validation (URL format), submit state |
| Responsive behavior | Form stacks on mobile |
| Accessibility | Label on input, URL type input, error messages for invalid format (FR-25) |

#### 10.2.5 Announcements

| Attribute | Detail |

### 10.3 Coordinator

#### 10.3.1 Coordinator Dashboard

| Attribute | Detail |
|-----------|--------|
| Primary purpose | Show upcoming sessions with enrolled count, capacity, fill rate; show totals of enrolled, attended, completed learners |
| User goal | Monitor program health at a glance |
| Information hierarchy | 1. Metrics cards (totals) 2. Session breakdown table 3. Actions (new session, new course) |
| Proposed layout | Metrics cards row (grid), session breakdown table below |
| Main components | Metric cards, session table, action buttons |
| Primary action | View session details / Create new session |
| Secondary action | Create new course |
| Interaction states | Button hover/focus, table row hover |
| Responsive behavior | Metrics grid → stacked on mobile; table scrolls horizontally |
| Accessibility | Metric cards have visible labels + values; table has `aria-label` and `scope` headers; fill rate shown as percentage + text |

#### 10.3.2 Course Management

| Attribute | Detail |
|-----------|--------|
| Primary purpose | Let coordinator create, edit, and list courses |
| User goal | Manage course catalog |
| Information hierarchy | 1. Page title 2. Create button 3. Course table 4. Empty state |
| Proposed layout | Table view (current implementation). Each row: title, truncated description, session count, edit/delete buttons. |
| Main components | Course table, action buttons, empty state, create form |

#### 10.3.3 Session Management

| Attribute | Detail |
|-----------|--------|
| Primary purpose | Let coordinator create and edit sessions: date, start/end time, room, trainer, capacity |
| User goal | Schedule sessions and assign trainers |
| Information hierarchy | 1. Page title 2. Create button 3. Session table 4. Session form (separate page) |
| Proposed layout | Table view (current implementation). Capacity and remaining seats shown with color coding. Edit/delete actions per row. |
| Main components | Session table, capacity indicator, edit/delete forms |
| Primary action | Create / Edit / Delete session |
| Secondary action | Assign trainer |
| Interaction states | Confirm dialog for delete, capacity validation error (FR-05: cannot set below active enrollments) |
| Responsive behavior | Table scrolls horizontally on mobile |
| Accessibility | Capacity field shows "Active: X" hint when editing, error shown next to capacity field (FR-25), table headers scoped |

#### 10.3.4 Trainer Assignment

| Attribute | Detail |
|-----------|--------|
| Primary purpose | Part of session form — coordinator assigns a trainer to a session |
| User goal | Assign the correct trainer to each session |
| Information hierarchy | Trainer dropdown in session form |
| Proposed layout | Select dropdown in session form with trainer name + email |
| Main components | Trainer select field |
| Primary action | Select trainer |
| Secondary action | None |
| Interaction states | Form validation |
| Responsive behavior | Select full width on mobile |
| Accessibility | Label on select, `aria-required`, error message if invalid |

#### 10.3.5 Capacity Management

| Attribute | Detail |
|-----------|--------|
| Primary purpose | Let coordinator set session capacity with floor validation |
| User goal | Set appropriate capacity without violating BR-05 |
| Information hierarchy | Capacity input with hint showing current active enrollments |
| Proposed layout | Number input in session form. Hint: "Active: X enrollments". Error if below active count (FR-05). |

#### 10.3.6 Attendance and Completion Management

| Attribute | Detail |
|-----------|--------|
| Primary purpose | Let coordinator record completion for learners with active enrollment |
| User goal | Mark learners as completed |
| Information hierarchy | Completion form or table with completion toggle |
| Proposed layout | Currently handled within trainer attendance page (completion toggle per enrollment row). Coordinator may need a dedicated view listing all enrollments across sessions with completion status. |
| Main components | Completion toggle per enrollment, completion table |
| Primary action | Mark Complete / Revoke Completion |
| Secondary action | View attendance status |
| Interaction states | Button per row, flash confirmation |
| Responsive behavior | Table scrolls horizontally |
| Accessibility | Button text changes based on state ("Mark Complete" / "Revoke Completion"), table headers scoped |

#### 10.3.7 Administrative Tables and Actions

| Attribute | Detail |
|-----------|--------|
| Primary purpose | Support coordinator administrative actions across courses, sessions, enrollments |
| User goal | Manage the program data |
| Information hierarchy | Table with sortable/filterable columns, bulk actions where appropriate |
| Proposed layout | Dense table layout appropriate for administrative work. No cards for this context. |
| Main components | Data table, action buttons per row, confirm dialogs |
| Primary action | Edit / Delete |

---

## 11. Role-Specific UX Summary

The design must **not** make every role visually or structurally identical. Each role has a distinct mental model:

| Role | Mental Model | Primary Layout Pattern | Key Screens |
|------|-------------|----------------------|-------------|
| **Learner** | Discovery and participation | Cards for browsing; tables for "My Sessions"; warm, inviting tone | Homepage, Session List, Session Detail, My Sessions, Login |
| **Trainer** | Session management and live check-in | Cards for session overview; tables for attendance roster; action-oriented | Trainer Sessions, Attendance Roster, Check-in Terminal |
| **Coordinator** | Program administration | Dense tables throughout; forms for creation/editing; metrics-focused | Dashboard, Courses, Sessions, Course Form, Session Form |

**Navigation differentiation:**

---

## 12. Requirements-to-Design Mapping

| SRS Requirement | Related Business Rules | Existing Functionality | UX/Visual Implications | Proposed Design Solution | Implementation Changes Necessary? |
|-----------------|----------------------|----------------------|------------------------|--------------------------|-----------------------------------|
| FR-01 Login/logout | — | Login page, logout route, argon2 hashing | Form must be clear, errors shown next to fields | Centered login card, inline errors, error summary | No |
| FR-02 Role-based access | BR-07 | Middleware `requireRole`, `populateUser` | UI must not expose unauthorized features; server enforces | Role-filtered nav links; conditional rendering of resource links, announcements, actions | No (server already enforces) |
| FR-03 Course CRUD | — | Coordinator courses page, course form | Forms need validation errors next to fields | Course table, create/edit forms with Zod error display | No |
| FR-04 Session CRUD | BR-05 | Coordinator sessions page, session form | Capacity field needs floor hint | Session form with capacity hint ("Active: X enrollments") | No |
| FR-05 Capacity floor | BR-05 | Session form hint text | Error must show next to capacity field | Field error + error summary when capacity < active enrollments | No (server enforces) |
| FR-06 Browse sessions | BR-03 | Session list table | Remaining seats must be prominent | Capacity indicator with text ("X of Y free") + color; not color alone | No |
| FR-07-FR-12 Enrollment | BR-01, BR-02, BR-03 | Enrollment service, session detail enroll/cancel | Enroll button disabled when full; duplicate enrollment refused | Enroll button state; flash messages for full/duplicate; cancel frees seat immediately | No |
| FR-13 Resource access | BR-08 | Resource link conditional visibility | Resource link visible only to authorized users | Server-side conditional rendering (already implemented); link not in HTML for unauthorized | No |
| FR-14 Announcements | — | Announcements on session detail + trainer attendance | Trainer can post; learners see on session page | Announcement form + list; conditional visibility | No |
| FR-15-FR-16 Attendance | BR-04, BR-05 | Attendance roster table | Attendance in separate table; enrollment row unchanged | Roster table with Present/Absent buttons per row; status badges | No |
| FR-17-FR-19 Check-in | — | Check-in terminal, QR code on My Sessions | Check-in window validation; unknown/invalid codes refused; no duplicates | Large code input, autofocus, pattern validation, clear error reasons, QR with aria-label | No |
| FR-20-FR-21 Completion | BR-04 | Completion toggle on attendance page | Completion in separate table; learner sees status | Completion toggle per enrollment; "Completed" badge on My Sessions | No |

---

## 13. Design Pattern Inventory

| Pattern | Where Used | Why |
|---------|-----------|-----|
| Header navigation | All pages | Consistent entry point; role-filtered links; preserves existing `layout.njk` structure |
| Skip link | All pages (via layout) | WCAG 2.4.1; keyboard users bypass navigation |
| Session card | Learner session list, trainer session overview | Discovery-friendly; presents course, trainer, schedule, capacity, action |
| Data table | Coordinator courses/sessions, trainer attendance, learner my-sessions | Dense tabular data; sortable columns; row-level actions |
| Metric cards | Coordinator dashboard | At-a-glance totals (enrolled, attended, completed, fill rate) |
| Capacity indicator | Session list, session detail, session cards | Communicates BR-03 (remaining seats = capacity − active enrollments); text + color |
| Status badge | Enrollment status, attendance status, completion status | Text + icon (not color alone); WCAG 1.4.1 compliance |
| Enroll action button | Session detail, session list, my-sessions | Primary action for learners; disabled state when full |
| Check-in input | Check-in terminal | Large monospace input, autofocus, Alt+Shift+K shortcut, pattern validation |
| QR code display | My sessions, session detail | `aria-label`, `role="img"`, code text alongside for non-scanner users |
| Resource link | Session detail, my-sessions | Conditional visibility (BR-08); external link with `target="_blank" rel="noopener noreferrer"` |
| Announcement list | Session detail, trainer attendance | Trainer posts; enrolled learners see |
| Confirmation dialog | Delete course/session, cancel enrollment | `confirm()` with plain language; prevents accidental destructive actions |
| Form validation | All forms (login, course, session, preferences, announcements) | Zod server-side; field errors + error summary; `aria-invalid` |
| Empty state | All list pages | Clear message + primary action (e.g., "Create New Session") |
| Flash alert | Top of page after actions | Success/error messages; `role="status"` / `role="alert"` |

---

## 14. Preliminary Design System

### 14.1 Color Palette (HEX Values)

**Backgrounds (warm, from Cozy exploration):**

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#fdfaf5` | Page background (warm cream) |
| `--color-surface` | `#ffffff` | Cards, surfaces, form backgrounds |
| `--color-surface-hover` | `#f5ede0` | Hover states, subtle backgrounds |

**Text (dark for contrast — NOT pastel):**

| Token | Value | Usage |
|-------|-------|-------|
| `--color-text` | `#3f2e1e` | Primary text (warm dark brown, passes AA on cream) |
| `--color-text-muted` | `#6b5a4a` | Secondary text, captions |

**Accents (saturated for accessibility):**

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#c2410c` | Primary buttons, links, focus rings (burnt orange) |
| `--color-primary-hover` | `#e65100` | Primary hover |
| `--color-primary-contrast` | `#ffffff` | Text on primary buttons |

**Semantic colors:**

| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | `#15803d` | Success, attended, completed |
| `--color-error` | `#b91c1c` | Errors, cancelled, absent, full |
| `--color-warning` | `#b45309` | Warnings, nearly full |

**Decorative (Cozy-inspired, low contrast — backgrounds/borders only):**

| Token | Value | Usage |
|-------|-------|-------|
| `--color-accent-peach` | `#fcd3c4` | Decorative backgrounds, subtle highlights |
| `--color-accent-yellow` | `#fde68a` | Decorative backgrounds |
| `--color-accent-sage` | `#a7d3a7` | Decorative backgrounds |
| `--color-accent-blue` | `#bfdbfe` | Decorative backgrounds |
| `--color-accent-lilac` | `#e9d5ff` | Decorative backgrounds |

**Borders and focus:**

| Token | Value | Usage |
|-------|-------|-------|
| `--color-border` | `#d9c7b3` | Borders, dividers |
| `--focus-ring` | `3px solid #c2410c` | Focus indicator |
| `--focus-offset` | `2px` | Focus offset |

**High contrast mode (existing, preserved):**
Black background, white text, yellow primary, cyan focus ring — as defined in current `theme.css`.

### 14.2 Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-family` | `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | All body text |
| `--font-scale` | `1` (100%), `1.25` (125%), `1.5` (150%) | User-controlled text scaling |
| `--font-base` | `calc(1rem * var(--font-scale))` | Base font size |
| `--font-weight-normal` | `400` | Body text |
| `--font-weight-medium` | `500` | Labels, captions |
| `--font-weight-semibold` | `600` | Buttons, headings |
| `--font-weight-bold` | `700` | Page titles, important data |

**Heading scale:**
- h1: `calc(2rem * var(--font-scale))`
- h2: `calc(1.5rem * var(--font-scale))`
- h3: `calc(1.25rem * var(--font-scale))`
- h4: `calc(1rem * var(--font-scale))`

### 14.3 Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `0.25rem` | Tight gaps |
| `--space-sm` | `0.5rem` | Component internal padding |
| `--space-md` | `1rem` | Standard section spacing |
| `--space-lg` | `1.5rem` | Card padding, section margins |
| `--space-xl` | `2rem` | Page section spacing |
| `--border-radius` | `6px` | Component corner radius |
| `--container-max-width` | `1024px` | Content container |

### 14.4 Layout Principles

1. **Single container** — All content centered in `max-width: 1024px` container (existing pattern).
2. **Cards for discovery** — Learner-facing browsing pages use cards with imagery/icons.
3. **Tables for administration** — Trainer and Coordinator management pages use dense tables.
4. **No sidebars** — Header-only navigation preserved (no architectural changes).
5. **Role-appropriate density** — Learner pages are more spacious; staff pages are denser.


---

## 15. Accessibility and Responsive Principles

### 15.1 WCAG 2.2 AA Compliance (Preserved and Enhanced)

| Requirement | Current Status | Design Proposal |
|-------------|---------------|-----------------|
| 1.3.1 Info and Relationships | ✅ Semantic HTML, ARIA landmarks | Preserved; heading hierarchy maintained |
| 1.4.1 Use of Color | ✅ Status badges use text + icon | Preserved; colors never sole conveyors of meaning |
| 1.4.3 Contrast (Minimum) | ⚠️ Current gray-blue passes; Cozy pastels may fail | All text meets 4.5:1 on backgrounds; large text 3:1 |
| 1.4.10 Reflow | ⚠️ Minimal breakpoint system | Defined breakpoints; horizontal scroll only for data tables |
| 2.1.1 Keyboard | ✅ All functionality keyboard accessible | Preserved; all interactive elements focusable |
| 2.1.4 Character Key Shortcuts | ✅ Alt+Shift modifiers, togglable | Preserved; shortcuts documented in shortcuts dialog |
| 2.4.1 Bypass Blocks | ✅ Skip link | Preserved |
| 2.4.7 Focus Visible | ✅ Custom focus ring | Enhanced with warmer primary color |
| 2.4.11 Focus Appearance (AA) | ✅ 3px focus ring | Preserved and specified in design system |
| 3.3.1 Error Identification | ✅ Error summary + field errors | Preserved; errors shown next to fields (FR-25) |
| 3.3.2 Labels or Instructions | ✅ Labels on all inputs | Preserved |
| 3.3.3 Error Suggestion | ✅ Error messages with reasons | Preserved; plain language explanations |
| 4.1.3 Status Messages | ✅ Flash alerts with `role="status"`/`role="alert"` | Preserved |

### 15.2 Existing Accessibility Features (Must Be Preserved)

- Skip to main content link
- ARIA landmarks (banner, nav, main, contentinfo)
- Text scaling (100%/125%/150%) via `data-text-scale` attribute
- High contrast mode via `data-high-contrast="true"`
- Reduced motion via `data-reduced-motion="true"` and `prefers-reduced-motion`
- Keyboard shortcuts (Alt+Shift+S/M/D/A/K/H, Esc)
- Shortcuts toggle in Preferences
- Focus rings on all interactive elements
- Error summaries linked to fields via `aria-describedby`
- Status badges with text + icons (not color alone)
- QR codes with `aria-label` and `role="img"`
- Touch targets ≥ 44×44px

### 15.3 Responsive Behavior


---

## 16. Technical Gaps and Dependencies

### 16.1 What Requires NO Changes

The following can be implemented purely through CSS and Nunjucks template edits:

- Color palette updates (CSS custom properties in `theme.css`)
- Typography scale (CSS custom properties)
- Spacing adjustments (CSS)
- Component styling (buttons, inputs, cards, tables, badges, dialogs)
- Layout changes within existing templates (no new routes)
- Responsive breakpoints (CSS media queries)
- Accessibility enhancements (contrast, focus states, ARIA attributes already present)

### 16.2 What May Require Technical Changes (Identified for Transparency)

These are flagged because they were observed during inspection — NOT because this proposal recommends implementing them:

| Potential Change | Reason | Status in This Proposal |
|-----------------|--------|------------------------|
| Separate coordinator dashboard page | Current dashboard serves all roles; SRS implies coordinator-specific dashboard | Noted as opportunity; no implementation required for design |
| Separate coordinator completion page | Completion currently on trainer attendance page | Noted; design can accommodate within existing pages |
| QR camera scanning UI | Current check-in is text-input only; SRS FR-18 mentions camera scanning | Noted as UX enhancement; would require browser camera API JS |
| Wait-list feature | SRS Section 12 (future, not current scope) | Explicitly NOT included |

---

## 17. Design Implementation Priorities

| Priority | Task | Rationale |
|----------|------|-----------|
| P0 | Update `theme.css` with new color palette, typography, spacing | Foundation for all visual changes |
| P0 | Verify WCAG 2.2 AA contrast for all color combinations | Accessibility is non-negotiable (SRS NFR-02) |
| P1 | Update `layout.njk` header styling for role differentiation | All pages inherit from layout |
| P1 | Style learner pages (home, session list, detail, my-sessions) with card-based discovery layout | Learner is primary user volume |
| P1 | Style trainer pages (sessions, attendance, check-in) with table-based management layout | Trainer needs clarity during live sessions |
| P1 | Style coordinator pages (courses, sessions, forms, dashboard) with dense administrative layout | Coordinator needs data density |
| P2 | Update empty states, flash messages, form validation styling | Consistent feedback |

---

## 18. Risks, Conflicts, and Unresolved Questions

### 18.1 Identified Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cozy pastel colors fail WCAG 2.2 AA contrast | High (accessibility violation) | Use pastels only for decorative backgrounds/borders; text and interactive colors must be saturated and dark |
| Photography doesn't load or lacks alt text | Medium | Use icons as primary visuals; photos optional with `alt=""` if decorative |
| Role-specific designs drift apart | Medium (maintenance burden) | Shared component system (buttons, inputs, cards, tables, badges) across all roles |
| Table-heavy admin pages feel dated | Low (cosmetic) | Tables are appropriate for dense administrative data; cards reserved for discovery contexts |
| No separate coordinator dashboard/completion page | Medium (SRS implies these exist) | Current dashboard serves all roles; completion on trainer attendance page. Design can accommodate within existing structure. |

### 18.2 Conflicts Between Sources

| Conflict | Source A | Source B | Resolution |
|----------|----------|----------|------------|
| Cozy pastel palette vs. WCAG 2.2 AA | Google Stitch Cozy design | SRS NFR-02 (security/accessibility) | SRS takes precedence; pastels used decoratively, not for text/interactive elements |
| "All pages should look the same" (generic dashboard assumption) | Generic UI expectation | SRS role definitions (distinct workflows) | Role-appropriate layouts; not all pages identical |

---

## 19. Verification: Production Files Not Modified

This document was created as design documentation only. The following production files were **not** read for modification purposes (only read for analysis):

- No files under `src/` were modified
- No files under `public/` were modified
- No files under `tests/` were modified
- No database migrations under `src/db/migrations/` were modified
- `package.json`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts` were not modified
- `.env` and `.env.example` were not modified

The only files created are:
- `docs/design/02-design-proposals.md` (this document)
- `docs/design/proposals/` (directory for supporting artifacts, currently empty)

---

## 20. Summary

### Design Directions Evaluated

| Direction | Name | Verdict |
|-----------|------|---------|
| A | Cozy Creative Community | Evaluated — warm and inviting but accessibility risks with pastel contrast; not recommended as-is |
| B | Workshop Studio | Evaluated — accessible and professional but less warm/community-oriented |
| C | Community Bulletin Board | **Recommended** — warm backgrounds from Cozy + saturated accessible accents + role-appropriate layouts |

### Recommended Design Direction

**Direction C — Community Bulletin Board (Warm + Functional Hybrid)**

- Warm cream background (`#fdfaf5`) and warm dark text (`#3f2e1e`) — accessible contrast
- Saturated burnt-orange primary (`#c2410c`) for buttons, links, focus rings
- Decorative pastel accents (peach, yellow, sage, blue, lilac) for non-text surfaces only
- Role-appropriate layouts: cards for learner discovery, tables for staff management
- Preserves all existing accessibility features (skip links, high contrast, text scale, reduced motion, keyboard shortcuts, error summaries)

### Major Design Decisions

1. **No framework migration** — Nunjucks + vanilla CSS architecture preserved
2. **No new dependencies** — Design system implemented with CSS custom properties
3. **No business logic changes** — All SRS business rules (BR-01 through BR-08) preserved and communicated through UI
4. **Role-appropriate layouts** — Not all pages use the same pattern
5. **Accessibility first** — WCAG 2.2 AA contrast designed in; pastels never used for text or primary interactive elements

### Technical Dependencies

- `public/css/theme.css` — update CSS custom properties (colors, typography, spacing)
- `src/views/layout.njk` — update header styling (inherited by all pages)
- Individual page templates — update class usage and structure within existing Nunjucks templates
- No changes to routes, services, migrations, or tests

### Next Recommended Design Step

Create supporting design artifacts in `docs/design/proposals/`:
1. Wireframe sketches (text-based or referenced) for key pages: homepage, session list, session detail, my-sessions, trainer attendance, check-in terminal, coordinator dashboard
2. Component specification sheet (buttons, inputs, cards, tables, badges, dialogs)
3. Contrast verification matrix for all color combinations

These artifacts should be reviewed with stakeholders before any CSS or template changes are made to production code.

### 18.3 Unresolved Questions

1. **Coordinator dashboard separation:** Should the coordinator have a dedicated dashboard page distinct from the general `dashboard.njk`? The SRS implies coordinator-specific dashboard metrics (FR-22, FR-23), but the current implementation serves all roles from one page. This is a product decision, not a design blocker.

2. **Completion page for coordinator:** SRS lists "Completion Coordinator Record completion for enrolled learners" as a screen (Section 10.1), but no separate completion page exists in the codebase. Completion is currently handled within the trainer attendance page. Should a dedicated coordinator completion view be added? This would require new routes/services (outside scope of design-only proposal).

3. **QR camera UI:** SRS FR-18 mentions scanning QR with device camera. The current implementation is text-input only. Should a camera interface be added? This would require JavaScript for camera access and HTTPS (SRS Section 2.3). Flagged as future enhancement.

4. **UI/UX audit absence:** No audit file exists in the repository. All UX findings in this document are derived from code inspection, not from an external audit report. If an audit exists externally, its findings should be reconciled with this document.

| P2 | Add responsive breakpoints for mobile/tablet | Cross-device usability |
| P3 | Refine decorative accent colors (peach, sage, etc.) for non-critical surfaces | Visual polish |
| P3 | Verify high contrast mode and text scaling still work | Accessibility regression check |

| Email notifications | SRS Section 12 (future, not current scope) | Explicitly NOT included |

### 16.3 Dependencies

- No new npm dependencies
- No new JavaScript frameworks
- No backend changes required for visual design
- No database migration changes required
- Existing `tsconfig.json` strict mode preserved
- Existing `vitest` and `playwright` test configuration preserved

| Component | Mobile (< 640px) | Tablet (640–1023px) | Desktop (≥ 1024px) |
|-----------|-----------------|---------------------|-------------------|
| Navigation | Wrapped, full width | Flex, wrapped | Flex, single row |
| Session cards | Single column | 2 columns | 3 columns |
| Data tables | Horizontal scroll | Horizontal scroll | Full width |
| Forms | Full width, stacked | Max-width 600px | Max-width 600–650px |
| Metric cards | Stacked | 2–3 columns | 6 columns |
| Buttons | Full width on forms | Inline | Inline |

### 14.5 Responsive Breakpoints

| Breakpoint | Value | Usage |
|------------|-------|-------|
| Mobile | `< 640px` | Single column, stacked cards, full-width inputs, horizontal table scroll |
| Tablet | `640px – 1023px` | 2-column card grids, adjusted padding |
| Desktop | `≥ 1024px` | 3-column card grids, full container width |

### 14.6 Components

| Component | Specification |
|-----------|--------------|
| Buttons | `min-height: 44px`, `min-width: 44px`, border-radius `6px`, font-weight `600`, primary (filled), secondary (outline), destructive (error color) |
| Inputs | `min-height: 44px`, full width, border `2px solid var(--color-border)`, `aria-invalid` on error, focus ring visible |
| Forms | `.form-group` with label, input, hint, field error; error summary at top; `novalidate` with server-side Zod |
| Navigation | Header with brand, role-filtered nav links, sign-in/sign-out, shortcuts button, user info |
| Cards | Background surface, border, border-radius, padding `1.5rem`, margin-bottom `1.5rem` |
| Status indicators | Badges with text + icon; not color alone |
| Dialogs | `<dialog>` element, Esc closes, focus managed, `aria-labelledby` |
| Feedback | Flash alerts (success/error/info) with `role="status"`/`role="alert"`; inline field errors |
| Empty states | Message + primary action button; no dead ends |
| Loading states | Button disabled + text change during form submission |

### 14.7 Focus States

- `:focus-visible` outline: `3px solid var(--color-primary)` with `2px` offset
- All interactive elements have visible focus indicators
- Focus order follows DOM order (logical tab sequence)
- Skip link focuses `#main-content`

| Modal dialog | Keyboard shortcuts help | `<dialog>` element; Esc closes; focus trapped |
| Preferences form | Preferences page | Fieldsets with legends; text scale, high contrast, reduced motion, shortcuts toggle |
| Responsive table wrapper | All tables | `.table-responsive` with `overflow-x: auto`; prevents horizontal page scroll |

| FR-22-FR-24 Dashboard | — | Dashboard page with metrics | Fill rates, enrolled/attended/completed totals | Metric cards + session breakdown table | No |
| FR-25 Validation | — | Zod schemas, error-summary component | Errors shown next to form fields | Field-level errors + error summary banner; `aria-invalid` | No |

**Conclusion:** No new routes, services, or business logic changes are required for the proposed design. All design changes are presentational (CSS, Nunjucks template structure, component usage).

- All roles share the same header layout (from `layout.njk`) but with role-filtered nav links.
- Learner sees: Home, Workshops, Dashboard, My Sessions, Preferences, Shortcuts, Sign Out.
- Trainer sees: Home, Workshops, Dashboard, My Sessions (trainer), Preferences, Shortcuts, Sign Out.
- Coordinator sees: Home, Workshops, Dashboard, Manage Sessions, Manage Courses, Preferences, Shortcuts, Sign Out.

No sidebar navigation is introduced — the existing header-only navigation pattern is preserved to avoid architectural changes.

| Secondary action | View details |
| Interaction states | Confirm dialogs for destructive actions |
| Responsive behavior | Horizontal scroll on mobile |
| Accessibility | `scope="col"` on all headers, `aria-label` on table, descriptive button text |

| Main components | Number input, hint text, field error |
| Primary action | Set capacity |
| Secondary action | None |
| Interaction states | Field error on invalid value, form submission blocked |
| Responsive behavior | Full width on mobile |
| Accessibility | Error text next to field (FR-25), `aria-invalid`, error summary linked |

| Primary action | Create / Edit / Delete course |
| Secondary action | View sessions for course |
| Interaction states | Confirm dialog for delete, form validation |
| Responsive behavior | Table scrolls horizontally on mobile |
| Accessibility | Delete confirmation uses plain language; table headers scoped |

|-----------|--------|
| Primary purpose | Let trainer post announcements for enrolled learners |
| User goal | Communicate updates to session participants |
| Information hierarchy | Announcement form (textarea, submit), announcement list below |
| Proposed layout | Card containing form and list (current implementation on attendance page). |
| Main components | Textarea, submit button, announcement list items |
| Primary action | Post Announcement |
| Secondary action | None |
| Interaction states | Form submit, list update |
| Responsive behavior | Single column |
| Accessibility | Label on textarea, required attribute, error summary if validation fails |


| Attribute | Detail |
|-----------|--------|
| Primary purpose | Show learner's enrollments with statuses and actions |
| User goal | View enrolled sessions, check-in codes, cancel or re-enroll |
| Information hierarchy | 1. Page title 2. Browse all sessions link 3. Enrollment table (or cards) with status, schedule, trainer, check-in code, resource, actions 4. Empty state |
| Proposed layout | Table view (current implementation is appropriate). Each row: course title, status badge, schedule/room, trainer, check-in code + QR, resource link (conditional), cancel/re-enroll action |
| Main components | Enrollment table, status badge, check-in code + QR, resource link, cancel/re-enroll forms, empty state |
| Primary action | Cancel enrollment / Re-enroll |
| Secondary action | Access resource, view session details |
| Interaction states | Confirm dialog for cancel, disabled re-enroll when full, flash messages |
| Responsive behavior | Table scrolls horizontally on mobile; card alternative on small screens |
| Accessibility | Table with `aria-label`, `scope="col"` headers, status badges with text + icon, check-in code has `aria-label` on QR, cancel uses `confirm()` with plain language |

### 9.2 Design Principles

1. **Accessibility first** — Every color, contrast value, focus state, and touch target meets WCAG 2.2 AA.
2. **Role-appropriate layouts** — Not every page uses cards; not every page uses tables. Layout matches the user's task.
3. **Progressive disclosure** — Complex actions (capacity management, check-in) reveal complexity only when needed.
4. **Clear business rule communication** — Capacity limits, enrollment restrictions, trainer isolation, and check-in windows are visible in the UI, not hidden.
5. **No silent failures** — Every refused action shows a plain explanation (SRS Section 6.1).
6. **Preserve existing accessibility** — Skip links, high contrast mode, text scaling, reduced motion, keyboard shortcuts, error summaries all remain intact.

| High contrast mode | Existing high contrast feature must override all pastels | Map all Cozy colors to high-contrast equivalents in CSS |
| Photography | May not load; adds page weight; decorative images need alt text | Use icons as primary visuals; photos optional with empty alt if decorative |
| Coordinator density | Soft pastels may not suit dense administrative tables | Use saturated accents for staff actions; reserve pastels for learner-facing discovery pages |
| Color-only meaning | Status badges using pastel colors alone | Maintain existing pattern: status badges use text + icon, not color alone |

### 8.4 Does the Design Fit the Platform Identity?

Partially. "Workshop House" suggests a warm, creative, community space — Cozy aligns with this. However, the platform also has serious administrative functions (capacity management, enrollment limits, attendance integrity, trainer isolation) that benefit from clarity and authority over softness. The design must serve both the warm community identity and the functional administrative reality.

### 8.5 Does Visual Hierarchy Support Actual Workflows?

Learner workflows (browse, enroll, check-in): Cozy works well — warm, inviting, discovery-oriented. Trainer workflows (attendance, check-in terminal, announcements): Cozy could work if check-in actions use saturated colors for visibility during live sessions. Coordinator workflows (course/session creation, capacity management, dashboard): Cozy is less ideal — administrative tasks need clear hierarchy, dense data presentation, and unambiguous action buttons. Pastel colors may reduce perceived urgency for capacity warnings and error states.

### 8.6 Can Components Be Consistently Applied Across All Three Roles?

Yes, with adaptation. Learner pages can use more imagery and cards; Trainer and Coordinator pages should use more tables and saturated action colors. The component system (buttons, inputs, cards, tables, badges, dialogs) should be shared, but role contexts can emphasize different subsets.

### 8.7 Is the Color Palette Practical and Accessible?

With modifications. Background colors (cream, warm neutrals) are accessible. Accent colors (peach, butter yellow, sage, powder blue, lilac) need contrast verification — butter yellow text on cream, powder blue text on cream, sage green text on cream likely fail AA. These colors work better as backgrounds, borders, or decorative elements — not as text or primary interactive colors.

**Recommendation:** Use the Cozy's warm background story but pair it with saturated, accessible accent colors for interactive elements (buttons, links, focus rings, status indicators).


**Visuals:** Warm cream/off-white background (from Cozy); saturated accessible accent colors; mix of cards (discovery) and tables (management); friendly typography with clear hierarchy; minimal purposeful imagery; defined responsive breakpoints.

**Strengths:** Balances warmth with accessibility; role-appropriate layouts; builds on existing CSS custom properties; practical for Nunjucks architecture.

**Risks:** More design tokens to manage; two layout systems need consistency.

**AA compliance:** Strong — contrast designed in, warmth from background not text colors.

**Architecture fit:** Good — works with existing CSS custom properties system.


---

## 8. Critical Evaluation of the Cozy Design

### 8.1 What Works Well Visually

Warm color story (cream, peach, butter yellow, sage, powder blue, lilac) creates a welcoming, community-oriented atmosphere appropriate for a workshop platform. Friendly typography supports approachability. Workshop photography reinforces the creative community identity. Soft rounded components feel approachable for learners.

### 8.2 What Works Well from a UX Perspective

Warm backgrounds reduce eye strain compared to stark white. Pastel accents can differentiate interactive elements from static content. Community-focused imagery helps learners understand the platform's purpose.

### 8.3 What Should Be Improved

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| Contrast risk | Pastel text on cream may fail WCAG 2.2 AA | Use pastels for backgrounds/borders only; text must be dark enough (#3f2e1e or darker on cream) |
| Focus visibility | Soft focus rings may disappear on light backgrounds | Ensure focus rings are at least 3px with high-contrast color |
| High contrast mode | Existing high contrast feature must override all pastels | Map all Cozy colors to high-contrast equivalents in CSS |
| Photography | May not load; adds page weight; decorative images need alt text | Use icons as primary visuals; photos optional with empty alt if decorative |
| Coordinator density | Soft pastels may not suit dense administrative tables | Use saturated accents for staff actions; reserve pastels for learner-facing discovery pages |
| Color-only meaning | Status badges using pastel colors alone | Maintain existing pattern: status badges use text + icon, not color alone |

### 8.4 Does the Design Fit the Platform Identity?

Partially. "Workshop House" suggests a warm, creative, community space — Cozy aligns with this. However, the platform also has serious administrative functions (capacity management, enrollment limits, attendance integrity, trainer isolation) that benefit from clarity and authority over softness. The design must serve both the warm community identity and the functional administrative reality.

### 8.5 Does Visual Hierarchy Support Actual Workflows?

Learner workflows (browse, enroll, check-in): Cozy works well — warm, inviting, discovery-oriented. Trainer workflows (attendance, check-in terminal, announcements): Cozy could work if check-in actions use saturated colors for visibility during live sessions. Coordinator workflows (course/session creation, capacity management, dashboard): Cozy is less ideal — administrative tasks need clear hierarchy, dense data presentation, and unambiguous action buttons. Pastel colors may reduce perceived urgency for capacity warnings and error states.

### 8.6 Can Components Be Consistently Applied Across All Three Roles?

Yes, with adaptation. Learner pages can use more imagery and cards; Trainer and Coordinator pages should use more tables and saturated action colors. The component system (buttons, inputs, cards, tables, badges, dialogs) should be shared, but role contexts can emphasize different subsets.

### 8.7 Is the Color Palette Practical and Accessible?

With modifications. Background colors (cream, warm neutrals) are accessible. Accent colors (peach, butter yellow, sage, powder blue, lilac) need contrast verification — butter yellow text on cream, powder blue text on cream, sage green text on cream likely fail AA. These colors work better as backgrounds, borders, or decorative elements — not as text or primary interactive colors.

**Recommendation:** Use the Cozy's warm background story but pair it with saturated, accessible accent colors for interactive elements (buttons, links, focus rings, status indicators).

# Workshop House — Visual Design Refinement Plan

**Project:** Workshop House  
**Status:** Refinement planning — documentation only. No production code modified.  
**Branch:** feature/hardening-1  
**Date:** 2026-11-23  
**Parent document:** `docs/design/02-design-proposals.md`

---

## 1. Purpose and Scope

This document defines the next step in the visual design process: refining the current Google Stitch Cozy exploration into a cohesive, accessible visual direction for Workshop House. It does **not** repeat the full design proposal. It builds on `docs/design/02-design-proposals.md`, focusing specifically on:

- Comparing the Cozy Creative Community direction with the recommended Community Bulletin Board direction
- Establishing a refined visual direction that combines both
- Planning the next Google Stitch iteration (homepage-focused only)
- Identifying the next screens to design after the homepage
- Reviewing accessibility implications of color and visual decisions
- Deciding whether the existing design proposal needs updating


---

## 2. Direction Comparison: Cozy vs Community Bulletin Board

### 2.1 Side-by-side evaluation

| Dimension | Cozy Creative Community (Stitch) | Community Bulletin Board (Proposal) | Decision |
|-----------|----------------------------------|-------------------------------------|----------|
| Background | Warm cream + pastels | Warm cream/off-white | **Retain** warm cream as base |
| Primary accent | Pastels (peach, butter yellow, sage, powder blue, lilac) | Saturated accessible accents (burnt orange #c2410c, etc.) | **Refine** — Cozy hues used decoratively; saturated colors for interactive elements |
| Typography | Friendly, rounded | Friendly with clear hierarchy | **Combine** — rounded friendly type with clear scale hierarchy |
| Imagery | Workshop photography | Minimal purposeful imagery / icons | **Refine** — photography as accent only; icons for functional elements |
| Components | Soft rounded, pastel-filled | Cards for discovery, tables for management | **Combine** — soft corners retained, but component fills use accessible colors |
| Layout | Softer, less structured | Defined breakpoints, role-appropriate | **Adopt** — defined breakpoints, cards for learner discovery, tables for staff |
| Focus rings | Soft, potentially low visibility | 3px solid high-contrast ring | **Adopt** — bulletin board focus standard |
| Brand character | Warm, creative, community | Warm but functional, professional where needed | **Combine** — welcoming identity with clear authority for admin tasks |

### 2.2 Elements to retain, combine, refine, reject

| Element | Source | Decision | Rationale |
|---------|--------|----------|-----------|
| Warm cream background | Cozy | **Retain** | Defines the "Workshop House" identity; accessible as a base |
| Peach / butter yellow / sage / powder blue / lilac | Cozy | **Refine** — decorative only | Pastels fail AA as text/interactive colors; work well as subtle background accents and borders |
| Friendly rounded typography | Cozy | **Retain** | Matches community/workshop brand; readable at all text scales |
| Workshop photography | Cozy | **Refine** — accent only | Adds page weight; decorative images need empty alt; use sparingly on homepage |

---

## 3. Refined Visual Direction

### 3.1 Color hierarchy

| Tier | Role | Example usage |
|------|------|---------------|
| **Base** | Warm cream (`#fdfaf5`-adjacent) | Page background, large surface areas |
| **Surface** | White / off-white | Cards, form backgrounds, modal panels |
| **Primary** | Saturated warm accent (burnt orange / terracotta family) | Primary buttons, active links, focus rings, key CTAs |
| **Secondary** | Saturated complementary (deep green or indigo family) | Secondary actions, success states, trainer/coordinator accents |
| **Semantic** | Error red, success green, warning amber | Form errors, status badges, alerts, capacity warnings |
| **Decorative** | Cozy pastels (peach, butter yellow, sage, powder blue, lilac) | Section backgrounds, subtle dividers, decorative blobs, hover states on non-critical elements |
| **Text** | Warm dark brown / charcoal | Body, headings, labels — never pastel |
| **Text-muted** | Warm gray-brown | Captions, helper text, timestamps |

### 3.2 Accessible primary and secondary colors

- **Primary:** A saturated warm color in the terracotta/burnt orange family — dark enough to pass WCAG AA (4.5:1) against cream background and white surface
- **Secondary:** A saturated cool color (deep green or indigo) — passes AA against cream and white; used for secondary actions and role differentiation
- **Text on primary:** White or near-white (must verify contrast)
- **All decorative pastels:** Never used for text, primary buttons, or focus indicators

### 3.3 Decorative color usage

Cozy pastels are retained but demoted from structural to decorative:

- Section background accents on homepage hero and feature cards
- Subtle border tints on non-interactive containers
- Hover states on decorative elements only
- **Never** for: form field borders, status badges, focus rings, primary buttons, error/success indicators

### 3.4 Typography principles

- **Family:** System sans-serif (existing stack: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`) — no new font dependencies
- **Scale:** Respect existing text scaling (100% / 125% / 150%) via `data-text-scale` attribute
- **Hierarchy:** h1 → h2 → h3 → h4 with clear size steps; friendly but not overly rounded
- **Weights:** Regular (400) for body, Semibold (600) for buttons and labels, Bold (700) for page titles and critical data
- **Line height:** 1.5 for body; 1.2 for headings

### 3.7 Card and list philosophy

- **Cards:** Learner-facing discovery (session browsing, role cards on homepage). Soft corners, cream or white surface, subtle border, primary action prominent.
- **Tables:** Staff-facing management (attendance roster, session management, course management). Dense, scannable, row-level actions, `scope="col"` headers.
- **Never:** Forcing cards onto admin pages or tables onto discovery pages.

### 3.8 Navigation

- **Header:** Brand + role-filtered nav links + sign in/out + shortcuts button + user info (existing `layout.njk` structure)
- **Visual role signaling:** Subtle accent color shift in header or active nav indicator to show which role context the user is in
- **No breadcrumbs** (not required by SRS; keeps header simple)

### 3.9 Visual hierarchy

- **Primary actions:** Saturated primary button, full-width on mobile, inline on desktop
- **Secondary actions:** Outline or ghost button in secondary color
- **Destructive actions:** Error red, always with confirmation

---

## 4. Next Google Stitch Iteration Plan

### 4.1 What should remain (from current Cozy homepage)

- Warm cream background as the page base
- Friendly, rounded typography for headings and body
- Workshop photography (hero or small grid) to establish creative identity
- Soft rounded component corners (4–6px)
- Pastel hues as decorative accents (not structural)

### 4.2 What should change

- **Primary button color:** From pastel to saturated burnt orange / terracotta (accessible contrast on cream)
- **Link colors:** From pastel blue/purple to saturated accessible color with underline
- **Focus rings:** From soft/low-contrast to 3px solid high-contrast ring
- **Text colors:** From any pastel text to warm dark brown/charcoal (4.5:1+ against cream)
- **Component fills:** From pastel-filled cards/buttons to white/cream surfaces with saturated borders or accents

### 4.3 What should be added

- Clear visual hierarchy: h1 hero headline, h2 section headers, body text with readable measure
- Primary CTA button ("Sign In" or "Browse Workshops") in saturated primary color
- Secondary CTA in outline style
- Three role entry points (Learner / Trainer / Coordinator) as cards with clear labels
- Accessible focus states on all interactive elements
- Skip link (visible on focus)

### 4.4 What should be removed

- Pastel text on cream backgrounds (fails contrast)
- Pastel-filled primary buttons (fails contrast, unclear affordance)
- Generic dashboard widgets or metric cards on homepage (not homepage-appropriate)
- Overly soft shadows or low-contrast borders

### 4.5 Visual elements to refine


---

## 5. Next Screens to Design (After Homepage)

Prioritized by SRS workflow frequency and role coverage:

| Priority | Screen | Role | Why this order | Dependencies |
|----------|--------|------|----------------|--------------|
| 1 | Login | All | Entry point for all authenticated workflows (FR-01) | Homepage visual direction established |
| 2 | Session list (browse) | Learner | Core discovery flow; most frequently used learner screen (FR-06) | Homepage card style established |
| 3 | Session detail | Learner | Enrollment decision point; capacity, QR, resource visibility (FR-07, FR-13, FR-17) | Session list card component |
| 4 | My Sessions | Learner | Post-enrollment management; cancel/re-enroll, check-in codes (FR-10, FR-12) | Session detail patterns |
| 5 | Trainer sessions overview | Trainer | Trainer entry point; assigned sessions, attendance/check-in links (FR-24, FR-13) | Card style from session list |
| 6 | Check-in terminal | Trainer | Live session workflow; QR/code input prominence (FR-18, FR-19) | Trainer sessions overview |

---

## 6. Accessibility Review

### 6.1 Color combinations requiring contrast testing

The following combinations **must** be tested against WCAG 2.2 AA (4.5:1 for normal text, 3:1 for large text, 3:1 for UI components) before approval:

| Combination | Context | Risk level | Required test |
|-------------|---------|------------|---------------|
| Burnt orange primary on cream | Primary buttons, links | High | AA 4.5:1 (normal), 3:1 (large/UI) |
| Burnt orange primary on white | Secondary surfaces | Medium | AA 4.5:1 (normal) |
| White text on burnt orange | Button text | High | AA 4.5:1 |
| Warm dark text on cream | Body, headings | Low (expected pass) | Verify anyway |
| Peach decorative background on cream | Section accents | Low | Verify if text placed on top |
| Butter yellow decorative background on cream | Section accents | High | Likely fails; do not use for text backgrounds |
| Sage decorative background on cream | Section accents | Medium | Verify |
| Error red on cream | Error messages, field borders | Medium | Verify AA for text, 3:1 for UI components |
| Success green on cream | Success messages, badges | Medium | Verify AA for text, 3:1 for UI components |
| Focus ring (3px) on cream | Focus indicators | High | Must be visible; 3:1 against adjacent colors |
| Border color on cream | Input borders, card borders | Medium | 3:1 against adjacent colors (WCAG 1.4.11) |

### 6.2 Colors that should NOT be used for text or interactive elements

- Butter yellow on cream (likely fails AA)
- Powder blue on cream (likely fails AA)
- Sage green on cream (likely fails AA for normal text)
- Lilac on cream (likely fails AA)
- Peach on cream (borderline; verify before use)

### 6.3 Accessibility principles to preserve

---

## 7. Documentation Decision

### 7.1 Does the existing design proposal need updating?

**No.** The refinement decisions in this document do **not** materially change the original proposal:

- The recommended direction (Community Bulletin Board) remains the same
- The refinement simply specifies *how* to combine Cozy warmth with Bulletin Board accessibility
- All page-level proposals, requirements mapping, design pattern inventory, and design system from `02-design-proposals.md` remain valid
- No business rules, routes, services, or technical constraints have changed

### 7.2 Where this document lives

This refinement plan (`docs/design/03-visual-design-refinement.md`) sits alongside `02-design-proposals.md` as a focused execution plan for the next Stitch iteration. It does not duplicate the full proposal.

### 7.3 When to update `02-design-proposals.md`

Update the parent proposal only if:

- The refined color palette is finalized with verified contrast ratios (then update Section 14.1)
- The Stitch homepage iteration produces a finalized visual system that should be locked in
- A design token file or CSS custom property specification is created

---

## 8. Summary of Refinement Decisions

| Decision | Detail |
|----------|--------|
| Visual direction | Community Bulletin Board refined with Cozy warmth — saturated accessible accents on warm cream background |
| Cozy pastels | Decorative only (section backgrounds, subtle accents); never for text, buttons, focus rings |
| Primary color | Saturated burnt orange / terracotta (verify AA contrast) |
| Typography | System sans-serif, friendly rounded, clear hierarchy, respects existing text scaling |
| Photography | Homepage accent only; icons for functional elements |
| Layout | Cards for learner discovery, tables for staff management; defined breakpoints |
| Next Stitch step | Homepage refinement only, via focused prompt |
| Next screens | Login → Session list → Session detail → My Sessions → Trainer overview → Check-in → Attendance → Dashboard → Forms |
| Contrast testing | Required for all primary/semantic color combinations before approval |
| Parent document | `02-design-proposals.md` remains valid; no material changes needed |

- Reduced motion: `data-reduced-motion="true"` override
- Skip link: visible on focus, links to `#main-content`
- Touch targets: ≥ 44×44px
- Error messages: shown next to fields, not color alone

| 7 | Attendance roster | Trainer | Mark attended/absent/completion (FR-15, FR-16, FR-20) | Trainer sessions overview |
| 8 | Coordinator dashboard | Coordinator | Program metrics; fill rates, totals (FR-22, FR-23) | Table style from attendance roster |
| 9 | Course/session management forms | Coordinator | Create/edit with validation (FR-03, FR-04, FR-25) | Dashboard table patterns |

**Dependency note:** The homepage visual direction (colors, typography, buttons, cards) must be locked before designing the session list, because the session list reuses the card component. Login should be designed early because it establishes form patterns (inputs, errors, buttons) reused across all authenticated screens.

- **Buttons:** Saturated fill, white text, clear hover state, 44px min height
- **Inputs:** White surface, dark border, visible focus ring, `aria-invalid` states
- **Cards:** White/cream surface, subtle border, primary action emphasized
- **Photography:** Compressed, purposeful, with empty alt if decorative

### 4.6 UX improvements necessary

- Clear CTA hierarchy (primary vs secondary)
- Role-based entry points that match actual user workflows (SRS Section 2.2)
- Skip link to main content
- Error-free form states on homepage (if any forms exist)
- Mobile-responsive card stacking

### 4.7 Focused Google Stitch prompt

> Refine the Workshop House homepage from the "Cozy Creative Community" direction. Keep the warm cream background, friendly rounded typography, and subtle workshop photography. Change primary interactive elements (buttons, links, focus rings) from pastel to a saturated accessible burnt orange/terracotta color that passes WCAG 2.2 AA contrast against cream. Replace pastel text with warm dark brown/charcoal. Add clear visual hierarchy: hero headline, three role entry cards (Learner, Trainer, Coordinator), primary CTA button, and secondary CTA. Keep pastel peach/yellow/sage as decorative section accents only. Ensure all interactive elements have visible focus states and 44px min touch targets. Do not add dashboard widgets or generic admin components. Homepage only — no internal application screens.

- **Capacity indicators:** Text + color (never color alone), prominent on session cards and detail pages
- **Status badges:** Text + icon (existing pattern preserved)

### 3.10 Brand character

- **Warm but not saccharine:** Cream background + rounded type + sparing photography = welcoming
- **Functional where it matters:** Saturated colors for buttons, focus rings, capacity warnings, errors = clear authority
- **Workshop-appropriate:** Creative but not childish; professional but not corporate


### 3.5 Photography principles

- **Homepage only:** One hero image or small workshop photo grid on the homepage to establish creative identity
- **Internal pages:** No decorative photography; use icons and typography instead
- **Alt text:** All decorative images get `alt=""`; functional images (QR, avatars) get descriptive alt text
- **Performance:** Optimized, compressed images only; no hero video

### 3.6 Layout composition

- **Container:** `max-width: 1024px` centered (existing pattern preserved)
- **Learner pages:** Card-based discovery layout (2–3 columns desktop, 1 column mobile)
- **Trainer/Coordinator pages:** Table-based management layout with dense data
- **Breakpoints:** Mobile (< 640px), Tablet (640–1023px), Desktop (≥ 1024px)
- **No sidebars:** Header-only navigation preserved (no architectural changes)

| Saturated burnt orange primary | Bulletin Board | **Retain** | Passes WCAG AA on cream; clear interactive color |
| Cards for discovery, tables for management | Bulletin Board | **Retain** | Role-appropriate; learner needs discovery, staff needs data density |
| 3px focus ring, high contrast | Bulletin Board | **Retain** | Non-negotiable for WCAG 2.2 AA |
| Status badges with text + icon | Existing implementation | **Retain** | Already WCAG 1.4.1 compliant; do not change to color-only |
| Soft pastel component fills | Cozy | **Reject** for primary actions | Fails contrast; use saturated colors for buttons, links, focus states |
| Generic corporate dashboard widgets | Neither | **Reject** | Not aligned with workshop/community identity; avoid |

**Restrictions observed:**
- No production code, routes, services, database files, or business logic are modified
- No framework migration
- Stitch exploration remains focused on the homepage only
- No generic dashboard aesthetics
- Neither Cozy nor Community Bulletin Board is blindly approved

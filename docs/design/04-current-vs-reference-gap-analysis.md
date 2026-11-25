# Workshop House — Current vs Reference Gap Analysis

**Project:** Workshop House — Web application for running short courses and technical workshops  
**Course:** Advanced Web Programming (SFWE475 / CPRG201)  
**Author:** Hayrunnisa İyiköşker (ID: 2203060011)  
**Status:** Analysis only — no production code modified  
**Branch:** feature/hardening-1  
**Date:** 2026-11-24  

---

## 1. Executive Summary

This document presents a detailed gap analysis between the existing Workshop House implementation and the finalized Stitch design reference (`workshop_house_cozy_community.html`). The analysis is grounded in three sources:

1. The existing codebase (Nunjucks + Express 5 + TypeScript + PostgreSQL + vanilla CSS)
2. The design proposal (`docs/design/02-design-proposals.md`) and visual design refinement (`docs/design/03-visual-design-refinement.md`)
3. The Stitch HTML reference (`docs/design/reference/workshop_house_cozy_community.html`)

**SRS verification:** The Software Requirements Specification (SRS) has been located at `docs/requirements/Workshop House – Software Requirements Specification.pdf` and its contents have been extracted and reviewed. All FR-xx and BR-xx references cited in this document are now verified against the original SRS source.

**Key conclusion:** The gaps between the current UI and the Stitch reference are almost entirely **visual and presentational** (color palette, typography, layout richness, imagery, component styling). The existing functional architecture — routes, services, business rules, accessibility features — is sound and does not require functional changes to accommodate the visual redesign. The Stitch HTML is a **visual reference only**, not production code, and should not be copied directly into the application.

**Verification finding:** All functional requirements (FR-01 through FR-25) and business rules (BR-01 through BR-08) referenced in the design documents are confirmed present in the SRS. The codebase implements all Must-priority requirements. Two Should-priority features referenced in the SRS (QR camera scanning, separate coordinator completion page) are not yet implemented, consistent with the SRS project plan which defers Should items until after Must items work in a demo.

---

## 2. Reference Verification

| Required File | Path | Status | Notes |
|---|---|---|---|
| Design proposals | `docs/design/02-design-proposals.md` | ✅ Found | 872 lines; evaluates three design directions, recommends Direction C |
| Visual design refinement | `docs/design/03-visual-design-refinement.md` | ✅ Found | 300 lines; refines Cozy direction into Community Bulletin Board |
| Stitch HTML reference | `docs/design/reference/workshop_house_cozy_community.html` | ✅ Found | 611 lines; full homepage design with Tailwind CSS |
| SRS document | `docs/requirements/Workshop House – Software Requirements Specification.pdf` | ✅ Found | 17 pages; authoritative source for FRs, BRs, scope, constraints, acceptance criteria |

**Verification statement:** All four reference files exist at the specified paths. No file substitution was necessary. The Stitch HTML reference was inspected in full (all 611 lines). The SRS PDF was extracted and reviewed page by page.

**SRS status:** The SRS is confirmed as the authoritative source. All functional requirements (FR-01 through FR-25) and business rules (BR-01 through BR-08) referenced in the design documents are verified present in the SRS. The SRS also defines non-functional requirements (NFR-01 through NFR-06), data requirements, external interface requirements, and acceptance scenarios.

---

## 3. Current UI Overview

### 3.1 Technology Stack

- **Runtime:** Node.js 20+ with TypeScript strict mode, native ESM
- **Framework:** Express 5 with thin routing; business rules in `src/services/`
- **Database:** PostgreSQL 16+ via `pg` (no ORM); parameterized SQL; row-level locking
- **Templating:** Server-rendered HTML with Nunjucks; semantic HTML5 landmarks
- **Styling:** Vanilla CSS with CSS custom properties (`public/css/theme.css`)
- **JavaScript:** Minimal browser JS (`public/js/shortcuts.js`); inline SVG QR codes
- **Accessibility:** WCAG 2.2 AA target; skip links, ARIA landmarks, text scaling, high contrast mode, reduced motion, keyboard shortcuts, error summaries

### 3.2 Current Color Palette (`theme.css`)

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#f8fafc` | Page background (cool slate) |
| `--color-surface` | `#ffffff` | Cards, surfaces |
| `--color-border` | `#cbd5e1` | Borders, dividers |
| `--color-text` | `#0f172a` | Primary text (dark slate) |
| `--color-text-muted` | `#475569` | Secondary text |
| `--color-primary` | `#1e40af` | Primary buttons, links (blue) |
| `--color-primary-hover` | `#1d4ed8` | Primary hover |
| `--color-error` | `#b91c1c` | Error text/border |
| `--color-success` | `#15803d` | Success text/border |
| `--color-warning` | `#b45309` | Warning text/border |
| `--focus-ring` | `3px solid #2563eb` | Focus indicator |

### 3.3 Current Layout Structure

- **Layout (`layout.njk`):** Single `layout.njk` extended by all page templates
- **Header:** Brand link + role-filtered nav + sign in/out + shortcuts button + user info
- **Container:** `max-width: 1024px` centered (`site-main`)
- **No sidebars:** Header-only navigation
- **Skip link:** `.skip-link` to `#main-content` (WCAG 2.4.1)
- **Flash messages:** `alert-success` / `alert-error` live regions above main content
- **Footer:** Simple copyright text

### 3.4 Current Screens and Templates

| Screen | Path | Role | Layout Pattern |
|---|---|---|---|
| Homepage | `src/views/pages/home.njk` | All | Single card with welcome text + CTA buttons |
| Login | `src/views/pages/login.njk` | All (public) | Centered form card (max-width 480px) + demo accounts |
| Session List | `src/views/pages/sessions/index.njk` | All | Data table with seats, status, actions |
| Session Detail | `src/views/pages/sessions/detail.njk` | All | Single column (max-width 720px) card + enrollment box |
| My Sessions | `src/views/pages/learner/my-sessions.njk` | Learner | Data table with QR codes, check-in codes, actions |
| Trainer Sessions | `src/views/pages/trainer/sessions.njk` | Trainer | Card grid with action buttons + resource form per card |
| Attendance Roster | `src/views/pages/trainer/attendance.njk` | Trainer | Session summary card + roster table + announcements |
| Check-in Terminal | `src/views/pages/trainer/checkin.njk` | Trainer | Centered column (max-width 580px) + large code input |
| Dashboard | `src/views/pages/dashboard.njk` | All (auth) | Metrics cards + session breakdown table |
| Manage Courses | `src/views/pages/coordinator/courses.njk` | Coordinator | Data table with edit/delete |
| Course Form | `src/views/pages/coordinator/course-form.njk` | Coordinator | Form (max-width 600px) |
| Manage Sessions | `src/views/pages/coordinator/sessions.njk` | Coordinator | Data table with capacity + edit/delete |
| Session Form | `src/views/pages/coordinator/session-form.njk` | Coordinator | Form (max-width 650px) |
| Preferences | `src/views/pages/preferences.njk` | All (auth) | Form with fieldsets (max-width 600px) |
| Error | `src/views/pages/error.njk` | All | Error card + return button |

### 3.5 Existing Accessibility Features (Must Be Preserved)

- Skip to main content link
- ARIA landmarks (banner, nav, main, contentinfo)
- Text scaling (100%/125%/150%) via `data-text-scale` attribute
- High contrast mode via `data-high-contrast="true"`
- Reduced motion via `data-reduced-motion="true"` and `prefers-reduced-motion`
- Keyboard shortcuts (Alt+Shift+S/M/D/A/K/H, Esc)
- Shortcuts toggle in Preferences
- Focus rings on all interactive elements (3px)
- Error summaries linked to fields via `aria-describedby`
- Status badges with text + icons (not color alone)
- QR codes with `aria-label` and `role="img"`
- Touch targets ≥ 44×44px

---

## 4. Stitch Reference Analysis

### 4.1 Reference Overview

The Stitch HTML (`workshop_house_cozy_community.html`) is a **static, frontend-only homepage design** built with Tailwind CSS (via CDN). It is not connected to any backend, has no routes, no forms that submit, and no user authentication. It represents the "Cozy Creative Community" visual direction evaluated in `02-design-proposals.md`.

### 4.2 Visual Design System

**Color Palette (Tailwind config):**

| Token | Value | Usage |
|---|---|---|
| `cream` | `#FDFAF5` | Page background |
| `peach-pink` | `#F6C8C0` | Decorative accents |
| `butter-yellow` | `#F4D96B` | Decorative accents |
| `soft-sage` | `#BFD9C2` | Decorative accents |
| `powder-blue` | `#C6D9EF` | Decorative accents |
| `lilac` | `#D6BDE8` | Decorative accents |
| `warm-brown` | `#3F2E1E` | Primary text |
| `terracotta` | `#B8441F` | Primary buttons, links |
| `light-primary` | `#B8441F` | Primary interactive |
| `light-surface` | `#FDFAF5` | Surface background |
| `light-outline` | `#7E6957` | Borders |

**Typography (Google Fonts):**

| Token | Family | Usage |
|---|---|---|
| `display` / `headline` | Fraunces (serif) | Hero headlines, brand |
| `title` / `body` | DM Sans (sans-serif) | Section headings, body |
| `label` | DM Mono (monospace) | Labels, small text |

**Font sizes:** `display-lg` (56px), `headline-lg` (36px), `body-lg` (18px), `body-md` (15px), `label-lg` (14px), etc.

**Border radius:** 4px (sm), 8px (default), 12px (md), 16px (lg), 9999px (full)

**Icons:** Material Symbols Outlined (Google Fonts)

### 4.3 Reference Page Structure (Homepage Only)

1. **Header (sticky):** Brand logo (Workshop House icon), nav (Workshops, Community, About), Sign In button, Sign Up button
2. **Hero section:** Neighborhood badge, h1 headline ("Learn a craft by doing, together."), body copy, primary CTA ("Browse Workshops"), integrated search bar
3. **Craft Bridge Strip:** Filter chips (Pottery, Woodworking, Painting, Analog Photography)
4. **Featured Workshops:** Large featured card (image + content) + 3 smaller cards (grid), each with image, category chip, seats left, title, description, meta, trainer, price, detail button
5. **Community Section:** Asymmetrical layout (story + image on left, maker testimonials on right)
6. **Role Cards Section:** Three cards (Learners, Trainers, Coordinators) with icons and "Explore/Meet/See" links
7. **Footer:** Brand, contact info, workshop links, community links, account links, legal links

### 4.4 Interactive Behaviors (JavaScript)

- Filter buttons show/hide session cards by category
- Search input filters cards by text content
- Detail buttons toggle "View details" / "Details opened" text
- All interactions are frontend-only; no backend integration

### 4.5 Accessibility Characteristics of Reference

- `aria-hidden="true"` on decorative images/icons
- `aria-label` on search input and nav
- `role="search"` on search form
- `role="group"` and `aria-label` on filter group
- Focus-visible outlines on all interactive elements
- Skip to top link (`href="#top"`)
- `tabular-nums` for seat counts
- `role="img"` on QR-like imagery

### 4.6 Key Differences from Design Proposal Recommendation

The Stitch HTML represents **Direction A (Cozy Creative Community)** as-is. The design proposal (`02-design-proposals.md`) and refinement (`03-visual-design-refinement.md`) recommend **Direction C (Community Bulletin Board)** which:
- Retains warm cream background
- Uses pastels decoratively only (not for text/interactive elements)
- Uses saturated accessible accents (terracotta/burnt orange) for primary actions
- Keeps system-ui typography (no Google Fonts dependency)
- Uses cards for learner discovery, tables for staff management

The Stitch HTML uses pastels more liberally (e.g., pastel-filled category chips, pastel decorative backgrounds) and uses Google Fonts (Fraunces, DM Sans, DM Mono) rather than the system font stack.

---

## 5. Current vs Reference Gap Analysis

### 5.1 Visual Differences

| Aspect | Current Implementation | Stitch Reference | Gap Type |
|---|---|---|---|
| Background color | Cool slate (`#f8fafc`) | Warm cream (`#FDFAF5`) | Visual |
| Primary color | Blue (`#1e40af`) | Terracotta (`#B8441F`) | Visual |
| Text color | Dark slate (`#0f172a`) | Warm brown (`#3F2E1E`) | Visual |
| Border color | Light gray-blue (`#cbd5e1`) | Warm brown outline (`#7E6957`) | Visual |
| Accent colors | Semantic only (error/success/warning) | Pastel decorative (peach, yellow, sage, blue, lilac) | Visual |
| Component fill | White surfaces with blue primary | Cream/white surfaces with terracotta primary | Visual |
| Border radius | 6px | 8px default, up to 16px | Visual |
| Imagery | None (no photos anywhere) | Workshop photography throughout (hero, cards, testimonials) | Visual + content |
| Typography | System-ui sans-serif | Fraunces (serif) + DM Sans + DM Mono (Google Fonts) | Visual + dependency |
| Icon set | None (text-only buttons, HTML entities in badges) | Material Symbols Outlined | Visual |

**Classification:** All differences in this section are **visual/presentational only**. No functional changes required.

### 5.2 Layout Differences

| Aspect | Current Implementation | Stitch Reference | Gap Type |
|---|---|---|---|
| Homepage | Single card with welcome text + 2 CTAs | Full marketing page: hero, search, filters, featured cards, community testimonials, role cards, footer | Layout + content |
| Header | Static header with role-filtered nav | Sticky header with brand logo, simple nav, Sign In/Sign Up | Layout |
| Session list | Data table (all roles) | Not present in reference (reference is homepage only) | N/A |
| Content width | `max-width: 1024px` container | `max-width: 1280px` container | Layout |
| Section spacing | Minimal, card-based | Generous section padding (py-16 to py-20), gap-10 to gap-14 | Layout |
| Grid system | CSS grid on dashboard metrics only | Tailwind grid throughout (12-col, responsive) | Layout |

**Classification:** Primarily **visual/layout**. The homepage would need structural changes to match the reference. Internal pages (session list, forms, tables) are not represented in the Stitch reference and would follow the design proposal's Direction C (cards for discovery, tables for management).

### 5.3 Typography Differences

| Aspect | Current Implementation | Stitch Reference | Gap Type |
|---|---|---|---|
| Font family | `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...` | Fraunces (serif) for display/headline; DM Sans (sans-serif) for title/body; DM Mono (monospace) for label | Visual + dependency (Google Fonts) |
| Base font size | `calc(1rem * var(--font-scale))` (100%/125%/150%) | Fixed pixel sizes (13px-56px) with mobile variants | Visual |
| Text scaling | Respects `data-text-scale` (WCAG requirement) | No text scaling mechanism evident | Accessibility risk |
| Line height | 1.5 body, 1.2 headings | Varies (1.1-1.6) | Visual |
| Font weights | 400/500/600/700 via CSS variables | 400/500/600/700 via Tailwind classes | Visual |

**Classification:** **Visual + accessibility concern.** The reference uses fixed pixel font sizes and Google Fonts, which may conflict with the existing text scaling (100%/125%/150%) and high contrast mode features. Any redesign must preserve the existing `data-text-scale` mechanism.

### 5.4 Navigation Differences

| Aspect | Current Implementation | Stitch Reference | Gap Type |
|---|---|---|---|
| Header nav | Role-filtered (learner/trainer/coordinator links conditional) | Static (Workshops, Community, About) + Sign In/Sign Up | Functional + visual |
| Auth state | Conditional: signed-in users see role links + sign out; anonymous see Sign In | Always shows Sign In + Sign Up | Functional |
| Skip link | Present (`.skip-link` to `#main-content`) | Present (`href="#top"`) | Preserved |
| Keyboard shortcuts | Alt+Shift+S/M/D/A/K/H + Esc | Not present | Functional (must preserve) |
| Breadcrumbs | None | None | Consistent |
| Role signaling | Text "Signed in as [name] ([role])" in nav | None (reference is public-facing) | Visual |

**Classification:** Navigation differences are partly **functional** (role-based access, auth state) and must be preserved. The current role-filtered navigation is required by SRS BR-07 (role-based access) and FR-02. The Stitch reference is a public marketing page and does not represent authenticated navigation.

### 5.5 Component Differences

| Component | Current Implementation | Stitch Reference | Gap Type |
|---|---|---|---|
| Buttons | `.btn`, `.btn-primary`, `.btn-secondary` (blue) | Terracotta-filled primary, outline secondary, ghost links | Visual |
| Inputs | `.form-input` (2px border, gray) | Styled search input; no traditional form inputs in reference | Visual |
| Cards | `.card` (white, 2px border, 6px radius) | Image-top cards with category chips, seats left, meta, action button | Visual |
| Tables | `.table-responsive` + standard table | Not used in reference | N/A (reference is homepage only) |
| Badges | `.status-badge` with text + icon (WCAG 1.4.1) | Category chips with colored dots | Visual |
| Dialogs | `<dialog>` element (shortcuts) | None in reference | Preserved |
| Error summary | `.error-summary` (4px red border) | None in reference | Preserved |
| Flash alerts | `.alert-success` / `.alert-error` | None in reference | Preserved |
| QR codes | Inline SVG with `aria-label` + `role="img"` | Not in reference | Preserved |

**Classification:** Primarily **visual**. Existing components (error summary, flash alerts, status badges, QR codes, dialogs) are not in the Stitch reference and must be preserved.

### 5.6 Interaction Differences

| Interaction | Current Implementation | Stitch Reference | Gap Type |
|---|---|---|---|
| Form submission | Server POST with Zod validation, error summary | No forms submit (static reference) | Functional (preserve server behavior) |
| Enrollment | POST `/sessions/:id/enroll`, flash messages | "Reserve your seat" button (no-op in reference) | Functional (preserve) |
| Check-in | Code input + submit, Alt+Shift+K shortcut | Not in reference | Functional (preserve) |
| Filtering | Server-side session list | Client-side category filter + search (JS) | Visual enhancement |
| Search | None | Client-side search in hero | Enhancement (optional) |
| Keyboard shortcuts | Alt+Shift modifiers, documented in dialog | None | Functional (preserve) |

**Classification:** Interaction differences are **functional** where the current app has server behavior the reference lacks. The reference's client-side filter/search are optional enhancements, not requirements.

### 5.7 Accessibility Issues

| Issue | Current Implementation | Stitch Reference | Risk |
|---|---|---|---|
| Text scaling | `data-text-scale` 100%/125%/150% supported | Fixed pixel sizes; no scaling mechanism | **High** — would break WCAG 1.4.4 (resize text) |
| High contrast mode | `data-high-contrast="true"` with full palette override | No high contrast variant | **High** — would break WCAG 1.4.3/1.4.11 |
| Reduced motion | `data-reduced-motion` + `prefers-reduced-motion` | Smooth scroll on search, transitions | **Medium** — motion not respected |

### 7.2 Session Listing / Discovery

| Attribute | Current Implementation | Target Design Direction |
|---|---|---|
| Path | `/sessions` | `/sessions` |
| Layout | Data table (all roles) | Learner: card grid; Coordinator/Trainer: table |
| Components | Table rows with seats, status, action | Session cards (learner), capacity indicator, enroll button, empty state |
| SRS | FR-06, BR-03 | FR-06, BR-03 |
| Accessibility | `aria-label` on table, status badges with text+icon | Cards use `role="region"`, capacity text+color |
| Responsive | Table horizontal scroll | Card grid → single column mobile; table scrolls horizontal |
| Priority | P1 | |

**Components to modify:** Session card (new), capacity indicator styling, table styling for staff view  
**Components to reuse:** Status badge macro, existing table structure for staff

### 7.3 Session Details

| Attribute | Current Implementation | Target Design Direction |
|---|---|---|
| Path | `/sessions/:id` | `/sessions/:id` |
| Layout | Single column max-width 720px | Single column max-width ~720px |
| Components | Session meta grid, resource section, announcements, enrollment action box | Same, restyled; prominent capacity |
| SRS | FR-07 to FR-12, FR-13, FR-17 | FR-07 to FR-12, FR-13, FR-17 |
| Accessibility | Capacity text+color, conditional resource rendering | Preserve; enhance capacity prominence |
| Responsive | Single column all sizes | Single column all sizes |
| Priority | P1 | |

**Components to modify:** Session meta styling, enrollment card styling, capacity indicator prominence  
**Components to reuse:** Status badges, resource link (conditional), announcement list

### 7.4 My Sessions

| Attribute | Current Implementation | Target Design Direction |
|---|---|---|
| Path | `/my-sessions` | `/my-sessions` |
| Layout | Data table | Table (learner management view) |
| Components | Roster table with QR codes, check-in codes, cancel/re-enroll | Same, restyled |
| SRS | FR-10, FR-12 | FR-10, FR-12 |
| Accessibility | QR codes with `aria-label`, status badges | Preserve |
| Responsive | Table horizontal scroll | Preserve |
| Priority | P1 | |

**Components to modify:** Table styling, QR code display, check-in code styling  
**Components to reuse:** Status badge macro, existing table structure

### 7.5 Trainer Sessions

| Attribute | Current Implementation | Target Design Direction |
|---|---|---|
| Path | `/trainer/sessions` | `/trainer/sessions` |
| Layout | Card grid | Card grid |
| Components | Session cards with action buttons (Attendance, Check-in, Public Page), resource form | Same, restyled |
| SRS | FR-13, FR-17 to FR-19 | FR-13, FR-17 to FR-19 |
| Accessibility | Descriptive button labels | Preserve |
| Responsive | Card grid → single column | Preserve |
| Priority | P1 | |

**Components to modify:** Card styling, button styling, resource form styling  
**Components to reuse:** Card structure, button styles

### 7.6 Check-in Terminal

| Attribute | Current Implementation | Target Design Direction |
|---|---|---|
| Path | `/trainer/sessions/:id/checkin` | `/trainer/sessions/:id/checkin` |
| Layout | Centered column max-width 580px | Centered column |
| Components | Large code input, autofocus, submit button, Alt+Shift+K hint | Same, restyled; 56px touch target |
| SRS | FR-17 to FR-19 | FR-17 to FR-19 |
| Accessibility | Large touch target, `autofocus`, `aria-describedby`, pattern validation | Preserve all |
| Responsive | Single column, full-width input mobile | Preserve |
| Priority | P1 | |

**Components to modify:** Input styling, button styling, session info card styling  
**Components to reuse:** Form-field pattern, autofocus, keyboard shortcut

### 7.7 Attendance Roster

| Attribute | Current Implementation | Target Design Direction |
|---|---|---|
| Path | `/trainer/sessions/:id/attendance` | `/trainer/sessions/:id/attendance` |
| Layout | Session summary card + roster table + announcements | Same |
| Components | Summary card, roster table, status badges, action forms per row, announcement form | Same, restyled |
| SRS | FR-15, FR-16, FR-20 | FR-15, FR-16, FR-20 |
| Accessibility | Table `aria-label`, row-level context, status badges text+icon | Preserve |
| Responsive | Table horizontal scroll | Preserve |
| Priority | P1 | |

**Components to modify:** Card styling, table styling, badge styling, form styling  
**Components to reuse:** Status badge macro, table structure

### 7.8 Coordinator Dashboard

| Attribute | Current Implementation | Target Design Direction |
|---|---|---|
| Path | `/dashboard` | `/dashboard` |

---

## 8. Prioritized Implementation Roadmap

| Phase | Priority | Task | Screens | Rationale |
|---|---|---|---|---|
| 1 | P0 | Update `theme.css` with new color palette, typography, spacing | All | Foundation for all visual changes |
| 2 | P0 | Verify WCAG 2.2 AA contrast for all color combinations | All | Accessibility is non-negotiable (NFR-02) |
| 3 | P1 | Update `layout.njk` header styling | All pages | All pages inherit from layout |
| 4 | P1 | Style learner pages: home, session list, detail, my-sessions | 4 screens | Learner is primary user volume |
| 5 | P1 | Style trainer pages: sessions, attendance, check-in | 3 screens | Trainer needs clarity during live sessions |
| 6 | P1 | Style coordinator pages: dashboard, courses, sessions, forms | 6 screens | Coordinator needs data density |
| 7 | P2 | Update empty states, flash messages, form validation styling | All | Consistent feedback |
| 8 | P3 | Add responsive breakpoints for mobile/tablet | All | Cross-device usability |
| 9 | P3 | Refine decorative accent colors | Non-critical surfaces | Visual polish |
| 10 | P3 | Verify high contrast mode and text scaling still work | All | Accessibility regression check |

**Why this order:**

---

## 9. Risks and Dependencies

### 9.1 Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Cozy pastel colors fail WCAG 2.2 AA contrast | High (accessibility violation) | Use pastels only for decorative backgrounds/borders; text and interactive colors must be saturated and dark |
| Photography doesn't load or lacks alt text | Medium | Use icons as primary visuals; photos optional with `alt=""` if decorative |
| Google Fonts dependency | Medium | External dependency; privacy consideration; consider system font fallback |
| Fixed typography breaks text scaling | High | Any new typography must respect `data-text-scale` (100%/125%/150%) |
| Role-specific designs drift apart | Medium | Shared component system (buttons, inputs, cards, tables, badges) across all roles |
| High contrast mode regression | Medium | Verify `data-high-contrast="true"` palette still works after changes |
| Reduced motion regression | Medium | Verify `data-reduced-motion="true"` still disables transitions |

### 9.2 Dependencies

| Dependency | Type | Notes |
|---|---|---|
| `public/css/theme.css` | CSS custom properties | Update colors, typography, spacing |
| `src/views/layout.njk` | Nunjucks layout | Update header styling (inherited by all pages) |
| Individual page templates | Nunjucks | Update class usage and structure within existing templates |
| `public/js/shortcuts.js` | JavaScript | No changes required (shortcuts preserved) |
| No new npm dependencies | — | Design system implemented with CSS custom properties |
| No backend changes | — | No routes, services, or migrations affected |
| No database migration changes | — | Schema unaffected |

### 9.3 Technical Gaps (No Changes Required)


---

## 10. Decisions Requiring User Approval

### 10.1 SRS Verification Status — Resolved

The SRS document has been located at `docs/requirements/Workshop House – Software Requirements Specification.pdf` and verified. All FR-01 to FR-25 and BR-01 to BR-08 references are confirmed present in the SRS. No blocker remains.

### 10.2 Coordinator Dashboard Separation

The current `dashboard.njk` serves all roles. The design documents note that the SRS implies coordinator-specific dashboard metrics, but no separate coordinator dashboard page exists. Should a dedicated coordinator dashboard page be created? This is a product decision, not a design blocker.

### 10.3 Coordinator Completion Page

The SRS lists a "Completion Coordinator" screen, but no separate completion page exists in the codebase. Completion is currently handled within the trainer attendance page. Should a dedicated coordinator completion view be added? This would require new routes/services (outside scope of design-only proposal).

### 10.4 QR Camera UI

SRS FR-18 mentions scanning QR with device camera. The current implementation is text-input only. Should a camera interface be added? This would require JavaScript for camera access and HTTPS. Flagged as future enhancement.

### 10.5 Typography Direction

The Stitch reference uses Google Fonts (Fraunces, DM Sans, DM Mono). The design proposal recommends preserving the system font stack. Should the redesign:
- (a) Adopt Google Fonts (new dependency, external request), or
- (b) Preserve system-ui font stack (no new dependency, consistent with existing architecture)?

### 10.6 Homepage Scope

The Stitch reference is a rich marketing homepage. The current homepage is minimal. Should the homepage be redesigned to match the reference's richness (hero, search, filters, featured cards, community testimonials, role cards)? This is a significant visual change but contains no functional requirements.

### 10.7 Pastel Color Usage

The Stitch reference uses pastels liberally. The design proposal restricts pastels to decorative use only. Should pastels be used decoratively only (per proposal), or more liberally (per reference)? The former is required for WCAG AA compliance.

---

## 11. Conclusion

The gap analysis confirms that:

1. **All four reference files exist** at the specified paths. No substitution was needed. The SRS PDF was extracted and reviewed page by page.
2. **All FR-01 to FR-25 and BR-01 to BR-08 are verified** against the original SRS document. No inconsistencies were found between the design documents, codebase, and SRS requirements.
3. **The gaps between current UI and Stitch reference are primarily visual** (color, typography, layout, imagery, components). No functional changes are required.
4. **The current implementation has stronger accessibility** than the Stitch reference in text scaling, high contrast mode, and reduced motion. These features must be preserved.
5. **The redesign can be implemented purely through CSS and Nunjucks template edits** — no routes, services, or database changes are required.
6. **The Stitch HTML is a visual reference, not production code.** It should not be copied directly into the application.
7. **All Must-priority SRS requirements are implemented** in the codebase. Two Should-priority features (QR camera scanning, separate coordinator completion page) are not yet implemented, consistent with the SRS project plan which defers Should items until after Must items work in a demo.

**Recommended next step:** Upon user approval of the decisions in Section 10 and the implementation plan in Section 12, proceed with Phase 1 (theme.css updates and contrast verification).
Per `02-design-proposals.md` Section 16.1, the following can be implemented purely through CSS and Nunjucks template edits:
- Color palette updates
- Typography scale
- Spacing adjustments
- Component styling
- Layout changes within existing templates
- Responsive breakpoints
- Accessibility enhancements
1. **P0 (Foundation):** CSS custom properties are the foundation — every component inherits from them. Contrast verification must happen before any styling is applied.
2. **P1 (Role-based pages):** Layout.njk header affects all pages. Learner pages first (primary user volume), then trainer (live session clarity), then coordinator (data density).
3. **P2 (Feedback):** Empty states, flash messages, form validation are cross-cutting concerns that should be consistent across all pages.
4. **P3 (Polish):** Responsive breakpoints, decorative accents, and accessibility regression checks are refinements that depend on the foundation being solid.
| Layout | Metrics cards + session breakdown table | Metrics cards + table |
| Components | Metric cards, session table, action buttons | Same, restyled |
| SRS | FR-22, FR-23 (implied) | FR-22, FR-23 |
| Accessibility | Metric labels+values, table `aria-label` + scoped headers | Preserve |
| Responsive | Metrics grid → stacked; table scrolls | Preserve |
| Priority | P2 | |

**Components to modify:** Metric card styling, table styling  
**Components to reuse:** Card component, table structure

### 7.9 Course and Session Forms

| Attribute | Current Implementation | Target Design Direction |
|---|---|---|
| Path | `/coordinator/courses/new`, `/coordinator/sessions/new`, etc. | Same |
| Layout | Form max-width 600-650px | Form max-width 600-650px |
| Components | Inputs, selects, textareas, error summary, submit/cancel | Same, restyled |
| SRS | FR-03, FR-04, FR-25 | FR-03, FR-04, FR-25 |
| Accessibility | Labels, `aria-invalid`, `aria-describedby`, error summary | Preserve |
| Responsive | Full width mobile, max-width desktop | Preserve |
| Priority | P2 | |

**Components to modify:** Input styling, select styling, button styling, error summary styling  
**Components to reuse:** Form-field macro, error-summary macro, validation flow
| Focus rings | 3px solid, configurable color | `focus-visible:outline` 2px | Medium — may be less visible |
| Color contrast | WCAG AA verified (blue-gray palette) | Pastels on cream may fail AA | **High** — per design proposal Section 8 |
| Skip link | Present and functional | Present (`#top`) | Preserved |
| ARIA landmarks | Full landmark set | Partial (nav, search, group) | Medium |
| Touch targets | ≥ 44×44px enforced | Some buttons may be smaller | Medium |

**Classification:** The current implementation has **stronger accessibility** than the Stitch reference in several areas (text scaling, high contrast mode, reduced motion). The redesign must not regress these features.

### 5.8 Responsive Design Gaps

| Aspect | Current Implementation | Stitch Reference | Gap Type |
|---|---|---|---|
| Breakpoints | None in CSS (tables scroll horizontally) | Tailwind: sm/md/lg/xl with explicit responsive classes | Visual |
| Card grid | Not used on session list (table) | 1-col mobile, 3-col desktop | Layout |
| Forms | Full width on mobile, max-width 600-650px desktop | Not in reference (no forms) | N/A |
| Tables | Horizontal scroll on small screens | Not in reference | N/A |
| Navigation | Flex-wrap in header | Hidden on mobile (nav only shows md+) | Visual |

**Classification:** The current CSS has **no responsive breakpoints**. The design proposal defines breakpoints (mobile <640px, tablet 640-1023px, desktop ≥1024px) but they are not implemented. The Stitch reference has explicit Tailwind responsive classes. Adding breakpoints is a visual/layout improvement.

### 5.9 Potential Implementation Constraints

1. **Google Fonts dependency:** The reference uses Fraunces, DM Sans, and DM Mono from Google Fonts. The current app uses system fonts with no external dependencies. Adding Google Fonts introduces an external dependency and privacy consideration (fonts.googleapis.com request).

2. **Tailwind CSS:** The reference uses Tailwind via CDN. The current app uses vanilla CSS with CSS custom properties. Migrating to Tailwind would be a significant architectural change not recommended by the design proposal (which advocates preserving vanilla CSS).

3. **Fixed typography vs. text scaling:** The reference uses fixed pixel font sizes. The current app supports user-controlled text scaling (100%/125%/150%). These must be reconciled — any new typography must respect `data-text-scale`.

4. **Pastel contrast:** The reference uses pastel colors extensively. Per the design proposal (Section 8), pastels fail WCAG AA contrast on cream backgrounds. Pastels must be restricted to decorative use only.

5. **Static vs. server-rendered:** The Stitch HTML is a static frontend prototype. All current pages are server-rendered Nunjucks templates with backend logic. The reference cannot be "dropped in" — it must be adapted to the existing architecture.

---

## 6. SRS Impact Analysis

### 6.1 SRS Document Verification

The SRS document has been located at `docs/requirements/Workshop House – Software Requirements Specification.pdf` (17 pages) and its contents have been extracted and reviewed page by page. All FR-xx and BR-xx references in this document are now verified against the original SRS source.

**Scope (SRS Section 1.2):** Workshop House lets a coordinator create courses with dated sessions, lets learners enroll until a session is full, lets trainers share a resource and record attendance, and lets the coordinator record completion. The central rule: enrollments for a session cannot exceed its capacity. Out of scope: video hosting, payment for courses, grading rubric/exam engine.

**Constraints (SRS Section 2.4):** Built by one student within about three months; uses TypeScript with Zod validation; README and .env.example without secrets delivered.

**Assumptions (SRS Section 2.5):** Users are created by seed data; public self-registration and user management screens are not required.

### 6.2 Verified Functional Requirements (FR-01 to FR-12)

| ID | Requirement | Priority | Verified in SRS | Implemented in Codebase | Affected by Visual Redesign? |
|----|-------------|----------|-----------------|------------------------|------------------------------|
| FR-01 | Login/logout with email/password; passwords hashed | Must | Yes (SRS 3.1) | Yes (auth.ts, login.njk) | No |
| FR-02 | Every page/action restricted by role, checked on server | Must | Yes (SRS 3.1) | Yes (requireRole middleware) | No |
| FR-03 | Coordinator CRUD courses (title, description) | Must | Yes (SRS 3.2) | Yes (coordinator.ts, courses.njk) | No |
| FR-04 | Coordinator CRUD sessions (date, time, room, trainer, capacity) | Must | Yes (SRS 3.2) | Yes (coordinator.ts, sessions.njk) | No |
| FR-05 | Capacity cannot be set below active enrollments | Must | Yes (SRS 3.2) | Yes (session form validation) | No |
| FR-06 | Learners browse sessions; see course, time, trainer, remaining seats | Must | Yes (SRS 3.2) | Yes (sessions/index.njk) | No |
| FR-07 | Learner enrolls in upcoming session with free seat | Must | Yes (SRS 3.3) | Yes (enrollment.ts, sessions.ts) | No |
| FR-08 | Full session refused with clear message (e.g. "24 of 24 seats taken") | Must | Yes (SRS 3.3) | Yes (enrollment.ts FULL message) | No |
| FR-09 | Duplicate enrollment refused with explanation | Must | Yes (SRS 3.3) | Yes (enrollment.ts ALREADY_ENROLLED) | No |
| FR-10 | Learner cancels active enrollment before session starts; frees seat | Must | Yes (SRS 3.3) | Yes (cancelEnrollment) | No |
| FR-11 | Cancelled learner can re-enroll; earlier row reactivated | Should | Yes (SRS 3.3) | Yes (enrollment.ts re-enrollment) | No |
| FR-12 | My Sessions page lists enrollments with status | Must | Yes (SRS 3.3) | Yes (learner.ts, my-sessions.njk) | No |

### 6.2b Verified Functional Requirements (FR-13 to FR-25)

| ID | Requirement | Priority | Verified in SRS | Implemented in Codebase | Affected by Visual Redesign? |
|----|-------------|----------|-----------------|------------------------|------------------------------|
| FR-13 | Trainer sets resource link on own session; visible to active enrolled learners, trainer, coordinator | Must | Yes (SRS 3.4) | Yes (trainer.ts resource route, conditional rendering) | No |
| FR-14 | Trainer posts announcements on own session | Should | Yes (SRS 3.4) | Yes (trainer.ts announcements route) | No |
| FR-15 | Trainer sees active enrollments; marks attended/absent for own sessions | Must | Yes (SRS 3.5) | Yes (attendance.njk, markAttendanceManual) | No |
| FR-16 | Attendance stored in separate table; enrollment row unchanged | Must | Yes (SRS 3.5) | Yes (attendance service, DB schema) | No |
| FR-17 | Unique random check-in code per active enrollment; session page shows code + QR | Should | Yes (SRS 3.5) | Partially (QR on my-sessions.njk, not session detail) | No |
| FR-18 | Check-in by QR camera scan or code typing | Should | Yes (SRS 3.5) | Partially (text input only; camera not implemented) | No |
| FR-19 | Check-in refused for unknown/different-session/cancelled/outside-window codes; no duplicate records | Should | Yes (SRS 3.5) | Yes (checkin service) | No |
| FR-20 | Coordinator records completion for active enrollment | Must | Yes (SRS 3.6) | Yes (completion.ts, toggleCompletion) | No |
| FR-21 | Learner sees completion status | Must | Yes (SRS 3.6) | Yes (my-sessions.njk shows completed) | No |
| FR-22 | Coordinator dashboard lists upcoming sessions with enrolled count, capacity, fill rate | Must | Yes (SRS 3.7) | Yes (dashboard.njk metrics) | No |
| FR-23 | Dashboard shows totals of enrolled, attended, completed learners | Must | Yes (SRS 3.7) | Yes (dashboard.njk metrics) | No |
| FR-24 | Trainer page listing own sessions | Must | Yes (SRS 3.7) | Yes (trainer.ts, trainer/sessions.njk) | No |
| FR-25 | Server-side validation; errors shown next to form | Must | Yes (SRS 3.8) | Yes (Zod schemas, error-summary, field errors) | No |

### 6.3 Requirements Affected by UI Changes

| Requirement | Potential UI Impact | Preservation Strategy |
|---|---|---|
| NFR-02 (WCAG 2.2 AA) | Color palette change, new typography, imagery | Verify all color combinations meet 4.5:1; preserve text scaling, high contrast, reduced motion, focus rings |
| NFR-04 (Usability) | Error messages must state reason; enroll ≤3 steps | Preserve error summary + field errors + clear messaging |
| FR-06 (Browse sessions) | Remaining seats must be prominent | Capacity indicator with text + color (not color alone) |
| FR-25 (Form validation) | Errors shown next to form | Preserve error summary + field errors + `aria-invalid` |
| BR-07 (Role-based access) | Nav links, conditional rendering | Preserve role-filtered navigation; server already enforces |
| BR-08 (Resource protection) | Conditional resource link visibility | Preserve server-side conditional rendering |

### 6.3a Verified Business Rules (BR-01 to BR-08)

| ID | Rule | Verified in SRS | Implemented in Codebase | Affected by Visual Redesign? |
|----|------|-----------------|------------------------|------------------------------|
| BR-01 | Active enrollments ≤ capacity, even under concurrent requests | Yes (SRS 4) | Yes (row-level locking) | No |
| BR-02 | At most one enrollment row per session per learner | Yes (SRS 4) | Yes (UNIQUE constraint) | No |
| BR-03 | Remaining seats = capacity − active enrollments; calculated by query | Yes (SRS 4) | Yes (dynamic calculation) | No |
| BR-04 | Attendance and completion are separate records; enrollment row never overwritten | Yes (SRS 4) | Yes (separate tables) | No |
| BR-05 | Attendance/completion only for active enrollment | Yes (SRS 4) | Yes | No |
| BR-06 | Cancelled enrollment does not count toward capacity | Yes (SRS 4) | Yes | No |
| BR-07 | Trainer can change only their own sessions' resource, announcements, attendance | Yes (SRS 4) | Yes (trainer isolation) | No |
| BR-08 | Resource link shown only to actively enrolled learners | Yes (SRS 4) | Yes (conditional rendering) | No |

### 6.3b Verified Non-Functional Requirements

| ID | Requirement | Verified in SRS | Relevance to Redesign |
|----|-------------|-----------------|----------------------|
| NFR-01 | Persistence: all data survives refresh and server restart | Yes (SRS 7) | None (backend) |
| NFR-02 | Security: hashed passwords, secrets in env vars, server role checks, random codes | Yes (SRS 7) | None (backend) |
| NFR-03 | Correctness under concurrency: last seat → one success, one refusal | Yes (SRS 7) | None (backend) |
| NFR-04 | Usability: enroll in ≤3 steps; error messages state reason | Yes (SRS 7) | **Yes** — error display must remain clear |
| NFR-05 | Maintainability: README + design note | Yes (SRS 7) | None |
| NFR-06 | Performance: list pages respond within ~2 seconds | Yes (SRS 7) | None |

### 6.3c SRS Section 6.1 — Main Screens (Verified Against Codebase)

The SRS lists exactly 9 key screens:

| Screen | Role | Purpose | Implemented? |
|--------|------|---------|--------------|
| Login | All | Sign in with email and password | Yes (login.njk) |
| Session list | Learner | Browse upcoming sessions with remaining seats and enroll | Yes (sessions/index.njk) |
| Session detail | Learner | Seats, resource link, announcements, check-in QR and code, cancel | Yes (sessions/detail.njk) |
| My sessions | Learner | All enrollments with status: enrolled, cancelled, attended, absent, completed | Yes (my-sessions.njk) |
| Trainer sessions | Trainer | Own sessions with links to resource, announcements, attendance | Yes (trainer/sessions.njk) |
| Attendance | Trainer | Enrolled learners, attended/absent buttons, QR scan and code field | Yes (trainer/attendance.njk) |
| Courses and sessions | Coordinator | Create and edit courses and sessions | Yes (coordinator/courses.njk, sessions.njk) |
| Completion | Coordinator | Record completion for enrolled learners | Partially (within trainer/attendance.njk; no separate coordinator page) |
| Dashboard | Coordinator | Upcoming sessions, fill rates, totals of enrolled, attended, completed | Yes (dashboard.njk) |

### 6.4 Functional Changes Required

**None.** The redesign is purely visual. All business rules are enforced server-side and do not depend on specific CSS classes or HTML structure beyond what is already present.

**Visual improvements only (no functional impact):**
- Color palette update (CSS custom properties)
- Typography scale (CSS custom properties)
- Component styling (buttons, inputs, cards, tables, badges)
- Layout changes within existing templates
- Responsive breakpoints (CSS media queries)
- Accessibility enhancements (contrast, focus states)

### 6.4a SRS Consistency Findings — Design Documents vs Codebase vs SRS

| Finding | Source | Details | Impact on Redesign |
|---------|--------|---------|-------------------|
| All FRs/BRs verified | SRS vs design docs | Every FR-01 to FR-25 and BR-01 to BR-08 cited in design docs is confirmed in SRS | None — no new requirements discovered |
| FR-17 priority | SRS says "Should" | Check-in code + QR on learner's session page is Should-priority | QR camera not required for redesign |
| FR-18 camera scanning | SRS says "Should" | QR camera scanning is Should-priority; text input is acceptable | Not required for visual redesign |
| FR-11 re-enrollment | SRS says "Should" | Already implemented in codebase | No UI change needed |
| FR-14 announcements | SRS says "Should" | Already implemented in codebase | No UI change needed |
| Completion page (coordinator) | SRS Section 10.1 lists separate screen | Codebase handles completion within trainer attendance page; no separate coordinator completion page exists | Design decision: keep current structure or add separate page (product decision) |
| FR-17 QR location | SRS says "learner's session page shows code + QR" | Codebase shows QR on My Sessions page, not Session Detail page | Minor UI enhancement opportunity; not required |

---

## 12. Final Implementation Plan

### 12.1 Implementation Principles

1. **Visual only, no functional changes** — All SRS business rules (BR-01 to BR-08) and functional requirements (FR-01 to FR-25) are enforced server-side. The redesign touches only CSS and Nunjucks templates.
2. **Accessibility non-negotiable** — NFR-02 (WCAG 2.2 AA) must not regress. Text scaling, high contrast mode, reduced motion, focus rings, and error summaries must all be preserved.
3. **SRS priorities respected** — Must-priority requirements are all implemented. Should-priority items (QR camera scanning, separate coordinator completion page) are out of scope for this visual redesign.
4. **Stitch HTML is reference only** — Not copied directly into production. Adapted to the existing Nunjucks + vanilla CSS architecture.
5. **Typography:** Preserve the system-ui font stack. Do not introduce Google Fonts as a new external dependency. Preserve the existing text scaling mechanism.
6. **Homepage:** Design a rich but functional homepage inspired by the Stitch reference. Preserve its warmth, visual character, hierarchy, and layout inspiration, but do not add fake testimonials, fictional content, unsupported features, or unnecessary marketing sections. Prioritize actual Workshop House functionality and real session data.
7. **Pastel colors:** Use pastels for decorative purposes only. Interactive elements, text, focus states, and important status indicators must maintain sufficient contrast and WCAG 2.2 AA accessibility.
8. **Coordinator completion:** Preserve the existing completion workflow for this visual redesign. Do not create new routes, services, or workflows. Preserve existing authorization rules.
9. **QR camera:** Keep the existing manual code-input interface. Camera scanning is a deferred feature and must not be implemented as part of this redesign.

### 12.2 Phased Implementation Plan

| Phase | Priority | Task | Screens Affected | SRS Requirements | Rationale |
|-------|----------|------|-------------------|-------------------|-----------|
| 1 | P0 | Update `theme.css` with new color palette, typography, spacing | All | NFR-02, NFR-04 | CSS custom properties are the foundation — every component inherits from them. Contrast verification must happen before any styling is applied. |
| 2 | P0 | Verify WCAG 2.2 AA contrast for all color combinations | All | NFR-02 | Accessibility is non-negotiable. Must be verified before any visual changes are applied. |
| 3 | P1 | Update `layout.njk` header styling | All pages | BR-07 (role-based nav) | All pages inherit from layout. Role-filtered navigation must be preserved. |
| 4 | P1 | Style learner pages: home, session list, detail, my-sessions | 4 screens | FR-06, FR-12 | Learner is the primary user volume. Card-based discovery layout per design proposal Direction C. |
| 5 | P1 | Style trainer pages: sessions, attendance, check-in | 3 screens | FR-13 to FR-19 | Trainer needs clarity during live sessions. Check-in terminal (FR-18/19) requires large touch targets and clear input. |
| 6 | P1 | Style coordinator pages: dashboard, courses, sessions, forms | 6 screens | FR-03, FR-04, FR-20 to FR-23 | Coordinator needs data-dense administrative layout. Table-based management per design proposal. |
| 7 | P2 | Update empty states, flash messages, form validation styling | All | NFR-04, FR-25 | Consistent feedback patterns across all pages. Error messages must state the reason. |
| 8 | P3 | Add responsive breakpoints for mobile/tablet | All | NFR-04 | Cross-device usability. SRS Section 2.3 mentions desktop and mobile browsers. |
| 9 | P3 | Refine decorative accent colors (peach, sage, etc.) | Non-critical surfaces | None | Visual polish. Pastels restricted to decorative use only (WCAG AA). |
| 10 | P3 | Verify high contrast mode and text scaling still work | All | NFR-02 | Accessibility regression check after all visual changes.

### 12.3 Why This Order

1. **P0 (Foundation first):** CSS custom properties in `theme.css` are the foundation — every component, page, and accessibility mode (high contrast, text scaling) inherits from them. Contrast verification (P0) must happen before any styling is applied to avoid rework.

2. **P1 (Role-based pages, highest impact):** `layout.njk` header affects all pages and must be updated early. Learner pages come first (primary user volume, most screens). Trainer pages come next (live session workflows need clarity during check-in and attendance). Coordinator pages come last (data-dense administrative tables are lower urgency for visual polish).

3. **P2 (Cross-cutting feedback):** Empty states, flash messages, and form validation styling appear on every page. These should be consistent across all role contexts and are best done after the foundation and primary pages are styled.

4. **P3 (Polish and regression):** Responsive breakpoints, decorative accents, and accessibility regression checks are refinements that depend on the foundation being solid. They are lowest risk and can be deferred.

### 12.4 Files to Modify (CSS and Templates Only)

| File | Type | Changes |
|------|------|---------|
| `public/css/theme.css` | CSS | Color palette, typography, spacing, focus rings, borders |
| `src/views/layout.njk` | Nunjucks | Header styling, role-based nav visual signaling |
| `src/views/pages/home.njk` | Nunjucks | Homepage card styling, CTA buttons |
| `src/views/pages/login.njk` | Nunjucks | Login form styling, error summary, demo accounts card |
| `src/views/pages/sessions/index.njk` | Nunjucks | Session list table/card styling, capacity indicators |
| `src/views/pages/sessions/detail.njk` | Nunjucks | Session detail card styling, enrollment action box |
| `src/views/pages/learner/my-sessions.njk` | Nunjucks | My sessions table styling, QR code display |
| `src/views/pages/trainer/sessions.njk` | Nunjucks | Trainer card grid styling, action buttons |
| `src/views/pages/trainer/attendance.njk` | Nunjucks | Attendance roster table styling, status badges |
| `src/views/pages/trainer/checkin.njk` | Nunjucks | Check-in terminal styling, large code input |
| `src/views/pages/dashboard.njk` | Nunjucks | Dashboard metrics cards styling, session table |
| `src/views/pages/coordinator/courses.njk` | Nunjucks | Course table styling |
| `src/views/pages/coordinator/course-form.njk` | Nunjucks | Course form styling |
| `src/views/pages/coordinator/sessions.njk` | Nunjucks | Session table styling |
| `src/views/pages/coordinator/session-form.njk` | Nunjucks | Session form styling |
| `src/views/pages/preferences.njk` | Nunjucks | Preferences form styling |
| `src/views/pages/error.njk` | Nunjucks | Error page styling |
| `src/views/components/*.njk` | Nunjucks | Form field, status badge, error summary, dialog styling |

### 12.5 Files NOT Modified (Strict Restrictions)

No files under `src/routes/`, `src/services/`, `src/db/`, `src/middleware/`, `src/validation/`, `public/js/`, or any test files will be modified. No database migrations, routes, services, business rules, or authentication logic will change.

### 12.6 Approved Decisions

| Decision | Resolution |
|----------|------------|
| Typography | Preserve the system-ui font stack. Do not introduce Google Fonts as a new external dependency. Preserve the existing text scaling mechanism. |
| Homepage | Design a rich but functional homepage inspired by the Stitch reference. Preserve its warmth, visual character, hierarchy, and layout inspiration, but do not add fake testimonials, fictional content, unsupported features, or unnecessary marketing sections. Prioritize actual Workshop House functionality and real session data. |
| Pastel colors | Use pastels for decorative purposes only. Interactive elements, text, focus states, and important status indicators must maintain sufficient contrast and WCAG 2.2 AA accessibility. |
| Coordinator completion | Preserve the existing completion workflow for this visual redesign. Do not create new routes, services, or workflows. Preserve existing authorization rules. |
| QR camera | Keep the existing manual code-input interface. Camera scanning is a deferred feature and must not be implemented as part of this redesign.

### 12.7 Next Step

Wait for explicit approval before beginning implementation. Updated documentation reflects refined decisions and revised roadmap. No production code changes will be made until approval is received. |
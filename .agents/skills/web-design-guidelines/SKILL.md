---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines and Sub-Store Cloudflare design-system compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", "check my site against best practices", or when changing frontend layout, navigation, forms, themes, or motion.
metadata:
  author: sub-store-cloudflare
  version: "1.1.1"
  argument-hint: <file-or-pattern>
---

# Web Design Guidelines

Review frontend UI against (1) general Web Interface Guidelines and (2) this project's product design system (embedded below).

## How It Works

1. Fetch the latest general guidelines from the source URL below.
2. Apply the **Project design system** section in this skill (tokens, chrome, overlays, mobile).
3. Read the specified files (or ask which files/pattern to review).
4. Check against **both** rule sets.
5. Output findings in the terse `file:line` format from the general guidelines.

## Guidelines Source (general)

Fetch fresh guidelines before each review:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Use WebFetch / equivalent. That document owns accessibility, focus, forms, animation, typography, performance, touch, safe areas, dark mode, i18n, and anti-patterns.

## Usage

When a user provides a file or pattern:

1. Fetch general guidelines from the URL above.
2. Read the specified files under `frontend/src/` (typical: `components/`, `views/`, `assets/styles/`, `themes/`).
3. Apply general rules + **Project design system** below.
4. Output findings using the format specified in the general guidelines.

If no files are specified, ask which files or areas to review (e.g. NavBar, Sub list, Tools, Settings, SubEditor).

## Project priority conflicts

When general guidance and this skill's **Project design system** conflict on **product chrome**, prefer this skill (e.g. top segmented control as primary nav, no bottom TabBar, desktop Modal + mobile Bottom Sheet for short tasks). Still flag accessibility / focus / reduced-motion / semantic HTML issues from the general guidelines.

---

## Project design system

Quiet, tool-like admin UI. Desktop and mobile share the same tokens; mobile only adjusts density, touch targets, and safe areas. Short tasks use light overlays (centered Modal / bottom Sheet)—not full-height right drawers by default.

### Tokens & sources

| Kind | Authority |
| --- | --- |
| Radius / space / type / fonts / z-index | `frontend/src/hooks/useThemes.ts` → `designTokens` (defaults in `assets/styles/tokens-root.scss`) |
| SCSS aliases | `assets/styles/tokens.scss`, `mixins.scss` |
| Theme colors | `frontend/src/themes/*.ts` (light primary `#0F172A`) |
| Global baselines / popup classes | `assets/styles/global.scss`, `overwritten_css_var.scss` |

**Allowed scales only** (do not invent intermediates):

- Radius: 6 / 8 / 12 / full; cards use `radius-lg` (12; `--item-card-radios` alias)
- Space: 4 / 8 / 12 / 16 / 24 / 32
- Type: 12 / 13 / 14 / 16 / 20 / 24
- Content max width: 1024px (`$content-max-width`)
- Breakpoints: 600 / **768 (desktop split)** / 900 / 1200

Use theme CSS variables (`--primary-color`, `--card-color`, `--divider-color`, text roles, `--danger-color`, `--succeed-color`). Dark via `html[data-theme="dark"]` + `color-scheme: dark`. Theme cycle: system → light → dark.

### App chrome

```
NavBar (fixed) → page-body (max 1024)
```

- Nav content row 56px + `env(safe-area-inset-top)`; bottom keeps `safe-area-inset-bottom`.
- **No bottom TabBar** as default primary nav (duplicates the top segmented control).

**NavBar**

| Zone | Primary routes | Secondary (`needNavBack`) |
| --- | --- | --- |
| Left | Logo + brand (hide brand name on narrow) | Back + compact title |
| Center | Segmented: Subs / Tools / Settings | **Same segmented control always** |
| Right | Refresh (optional) / language / theme | Language / theme |

- On `/edit/*`, keep **Subs** as parent active.
- Narrow (~420px): icon-only tabs OK; ~40px touch targets.

### Page patterns

- Section headers: ~13px semibold `--comment-text-color`; optional 12px desc; small circular actions (28–40px).
- Cards: `var(--card-color)` + 1px `var(--divider-color)` + `radius-lg`; restrained shadow; hover lift only under `@media (hover: hover) and (pointer: fine)`.
- List rows ~40–44px touch height; truncate with `min-width: 0`.
- Mobile sub cards: Copy always visible; edit/clone/refresh/delete in **⋯ menu** teleported to `body` with `position: fixed` (must not be covered by later cards).
- Forms: ~40px controls, `radius-md`, focus ring via `--focus-ring-color` (never bare `outline: none`).
- Editor: **single scroll page** (no display/content/actions tabs); tags inline (type + confirm), no right drawer.

### Overlays

| Task | Desktop (768px+) | Mobile (below 768px) |
| --- | --- | --- |
| Copy subscription / template edit | Center Modal (~420–560px, radius 16) | Bottom Sheet (handle, ~70–88vh) |
| Destructive confirm | Dialog | Same |
| Toast | Existing notify | Same |

Popup classes: `preview-modal-popup` / `preview-sheet-popup`, `template-modal-popup` / `template-sheet-popup`. Prefer not `position="right"` full-height drawers for short tasks. Sheets respect bottom safe area; prefer `overscroll-behavior: contain` on scroll regions.

### Motion & mobile

- UI motion ≤300ms; `ease-out` / `cubic-bezier(0.23, 1, 0.32, 1)`; animate `transform`/`opacity` (or listed props)—never `transition: all`.
- Press scale ~0.96–0.97; honor `prefers-reduced-motion` (`reduced-motion-fix.scss`).
- Mobile: 40–44px primary controls; `env(safe-area-inset-*)`; page pad ~14–16px (desktop 24px).

### Project anti-patterns

| Don't | Do |
| --- | --- |
| Bottom TabBar + top segmented | Top segmented only |
| Right drawer for copy/tags | Modal / Sheet / inline |
| Editor three-section tabs | Single scroll page |
| In-card absolute overflow menus | Teleport + fixed |
| Invented token scales | 6/8/12 radius, etc. |
| `transition: all` / bare `outline: none` | Explicit props / focus-visible |

### Key files

- `frontend/src/components/NavBar.vue`, `SubListItem.vue`
- `frontend/src/views/Sub.vue`, `Tools.vue`, `My.vue`, `SubEditor.vue`
- `frontend/src/hooks/useThemes.ts`, `frontend/src/assets/styles/*`

## Visual regression

After layout / chrome / overlay / theme changes, run `pnpm run check:visual`. Snapshots are Linux Chromium baselines under `frontend/e2e/__snapshots__/`. Update with `pnpm --dir frontend run test:visual:update` only after a deliberate visual change.

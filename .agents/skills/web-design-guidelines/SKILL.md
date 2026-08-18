---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines and Sub-Store Cloudflare design-system compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", "check my site against best practices", or when changing frontend layout, navigation, forms, themes, or motion.
metadata:
  author: sub-store-cloudflare
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Design Guidelines

Review frontend UI against (1) general Web Interface Guidelines and (2) this project's product design system.

## How It Works

1. Fetch the latest general guidelines from the source URL below.
2. Read `docs/design-guidelines.md` in this repository (project tokens, chrome, overlays, mobile rules).
3. Read the specified files (or ask which files/pattern to review).
4. Check against **both** rule sets.
5. Output findings in the terse `file:line` format from the general guidelines.

## Guidelines Sources

### General (fetch fresh before each review)

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Use WebFetch / equivalent to retrieve the latest rules. That document owns accessibility, focus, forms, animation, typography, performance, touch, safe areas, dark mode, i18n, and anti-patterns.

### Project-specific (always read)

```
docs/design-guidelines.md
```

Covers Sub-Store Cloudflare layout chrome, design tokens, navigation, overlays (modal / bottom sheet), cards, density, and mobile/desktop split.

## Usage

When a user provides a file or pattern:

1. Fetch general guidelines from the URL above.
2. Read `docs/design-guidelines.md`.
3. Read the specified files under `frontend/src/` (typical: `components/`, `views/`, `assets/styles/`, `themes/`).
4. Apply all rules from both sources.
5. Output findings using the format specified in the general guidelines.

If no files are specified, ask which files or areas to review (e.g. NavBar, Sub list, Tools, Settings, SubEditor).

## Project Priority Conflicts

When general guidance and `docs/design-guidelines.md` conflict on **product chrome**, prefer the project doc (e.g. top segmented control as primary nav, no bottom TabBar, desktop Modal + mobile Bottom Sheet for short tasks). Still flag accessibility / focus / reduced-motion / semantic HTML issues from the general guidelines.

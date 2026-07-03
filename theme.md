# ProjectSphere — Theme & Design Tokens

Professional, light-mode-only visual system. No blue, no purple, no dark mode.

---

## 1. Design Direction

A project-management tool is read for hours a day, so the palette prioritizes calm, high-contrast readability over decoration. The direction: **warm neutral base + forest green as the working brand color + amber as the secondary accent** — evokes focus and growth without leaning on the blue/purple that every competitor (Asana, Trello, ClickUp, Monday, Jira) already uses. Backgrounds stay light and slightly warm (never stark #FFFFFF everywhere, never dark) so long dashboard sessions don't feel clinical.

---



## 2. Core Palette


| Token                      | Hex       | Usage                                                       |
| -------------------------- | --------- | ----------------------------------------------------------- |
| `background`               | `#FFFFFF` | Page background                                             |
| `surface`                  | `#F7F6F3` | Cards, panels, sidebar, table stripes                       |
| `surface-raised`           | `#FFFFFF` | Modals, dropdowns (with shadow to lift off `surface`)       |
| `border`                   | `#E3E0D8` | Dividers, card borders, input borders                       |
| `border-strong`            | `#CFCBC0` | Hover borders, focus rings' outer edge                      |
| `text-primary`             | `#20241F` | Headings, primary body text (warm charcoal, not pure black) |
| `text-secondary`           | `#5F645C` | Secondary text, labels, timestamps                          |
| `text-muted`               | `#8B8F86` | Placeholder text, disabled state                            |
| `primary` (brand)          | `#1F6F54` | Primary buttons, active nav, links, focus ring              |
| `primary-hover`            | `#175843` | Button/link hover state                                     |
| `primary-subtle`           | `#E7F1EC` | Selected row background, primary badge background           |
| `accent` (secondary brand) | `#C98A3B` | Secondary CTAs, highlights, "new/upgrade" badges            |
| `accent-subtle`            | `#FAEFDD` | Accent badge background                                     |




## 3. Status & Semantic Colors

Kept deliberately distinct from `primary`/`accent` so status meaning is never ambiguous on a Kanban board or report.


| Token     | Hex       | Usage                                             |
| --------- | --------- | ------------------------------------------------- |
| `success` | `#3E8E5B` | Task complete, approved milestone, positive delta |
| `warning` | `#D99A2B` | Due soon, needs attention                         |
| `danger`  | `#C4523F` | Overdue, blocked, destructive action              |
| `info`    | `#767B72` | Neutral system message (uses warm gray, not blue) |




## 4. Role & Kanban Column Colors

Used for role badges (Super Admin / Org Admin / PM / Team Member / Client) and Kanban column headers — all derived from the core palette, no new hues introduced.


| Context               | Hex       | Label                                                 |
| --------------------- | --------- | ----------------------------------------------------- |
| To Do                 | `#9C9A8E` | Warm stone gray                                       |
| In Progress           | `#D99A2B` | Amber                                                 |
| In Review             | `#C4713F` | Clay/terracotta                                       |
| Done                  | `#1F6F54` | Brand green                                           |
| Super Admin badge     | `#20241F` | Charcoal (highest authority = most neutral/serious)   |
| Org Admin badge       | `#1F6F54` | Brand green                                           |
| Project Manager badge | `#C98A3B` | Accent amber                                          |
| Team Member badge     | `#767B72` | Warm gray                                             |
| Client badge          | `#3E8E5B` | Soft green (external, read-only, lower visual weight) |




## 5. Typography


| Role              | Typeface           | Notes                                                                                 |
| ----------------- | ------------------ | ------------------------------------------------------------------------------------- |
| Headings/Display  | **Sora**           | Geometric, professional, distinct from body — used for page titles, dashboard headers |
| Body / UI         | **Inter**          | Neutral, highly legible at small sizes for tables/forms                               |
| Data / Code / IDs | **JetBrains Mono** | Task IDs, timestamps in audit logs, code blocks                                       |


Type scale (rem, 16px base):
`text-xs 0.75` · `text-sm 0.875` · `text-base 1` · `text-lg 1.125` · `text-xl 1.25` · `text-2xl 1.5` · `text-3xl 1.875` · `text-4xl 2.25`

## 6. Accessibility (WCAG AA)

All body-text pairings verified at ≥4.5:1 contrast, large-text/UI pairings at ≥3:1:

- `text-primary` (#20241F) on `background`/`surface` → **14.8:1** ✅
- `text-secondary` (#5F645C) on `background` → **6.1:1** ✅
- White text on `primary` (#1F6F54) → **4.9:1** ✅ (safe for button labels)
- White text on `accent` (#C98A3B) → **3.1:1** ⚠️ use `text-primary` (#20241F) on accent backgrounds instead, or bold+larger text only
- `danger` (#C4523F) on `background` → **4.5:1** ✅

Focus states: 2px solid `primary` outline with 2px offset on every interactive element — never rely on color alone to indicate state (pair with icon/label changes for status).

---



## 7. Implementation — CSS Variables (shadcn/ui compatible, HSL)

See `theme.css` for the ready-to-paste stylesheet. Values are expressed in HSL because shadcn/ui's Tailwind preset consumes CSS variables in `H S% L%` format (no `hsl()` wrapper) so opacity modifiers (`bg-primary/50`) work correctly.

## 8. Implementation — Tailwind Config

```js
// tailwind.config.js (excerpt)
export default {
  darkMode: [], // dark mode intentionally disabled for this product
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        surface: "hsl(var(--surface))",
        border: "hsl(var(--border))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(var(--primary-hover))",
          subtle: "hsl(var(--primary-subtle))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          subtle: "hsl(var(--accent-subtle))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))",
        info: "hsl(var(--info))",
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.5rem", // 8px — soft but not overly rounded, keeps a professional edge
      },
    },
  },
};
```



## 9. Usage Rules

- **Never** introduce blue or purple hues, including in charts (Recharts series) — use the green/amber/gray/clay set above, extended with tints/shades of those four families only, for multi-series burndown/velocity charts.
- **Never** ship a dark theme or a `prefers-color-scheme: dark` override — the app is light-mode only by product decision.
- Backgrounds are always `background` (#FFFFFF) or `surface` (#F7F6F3) — never pure gray, never off-white with a cool cast.
- Use `accent` (amber) sparingly — one accent element per view (a single CTA, a single "upgrade" badge). `primary` (green) carries the everyday interactive weight (buttons, links, active nav).


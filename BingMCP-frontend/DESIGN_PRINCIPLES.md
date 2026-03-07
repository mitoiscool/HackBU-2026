# BingMCP Frontend — Design Principles

> This document is the source of truth for all UI/UX decisions on this project.
> All agents and contributors must follow these principles when building or modifying the frontend.

---

## 1. Vibe: Sleek Campus Tool

The app should feel like a **premium, dark-native campus dashboard** — not a generic chat UI, not a clunky university portal. Think Linear or Vercel, but built for Binghamton students. Data is the hero. Chrome is minimal.

- **Techy** — monospace fonts for real-time data (counts, times, status), precise spacing, crisp edges
- **Campus-rooted** — BU green is the primary accent, used intentionally, not decoratively
- **Trustworthy** — clean hierarchy, readable at a glance, never cluttered

---

## 2. Color System

Dark mode is the **default**. Light mode is a toggle.

### Design Tokens (CSS variables in `globals.css`)

| Purpose | Dark | Light |
|---|---|---|
| Background | `#0e1210` approx → `oklch(0.10 0.008 150)` | `#f5f7f5` → `oklch(0.97 0.005 150)` |
| Surface / Card | `oklch(0.16 0.008 150)` | `oklch(1 0 0)` |
| Primary accent (BU Green) | `oklch(0.62 0.18 152)` — bright, vivid | `oklch(0.40 0.14 152)` — deep, saturated |
| Text primary | `oklch(0.95 0.005 150)` | `oklch(0.10 0.005 150)` |
| Text muted | `oklch(0.52 0.02 150)` | `oklch(0.52 0.02 150)` |
| Border | `oklch(1 0 0 / 8%)` | `oklch(0 0 0 / 8%)` |

### Rules
- BU green is used for: interactive elements, status indicators, badges, hover states, active states
- Never use green as a background fill for large areas — it's an accent only
- White (`#ffffff` / near-white) is only used for text and card surfaces in light mode
- Avoid warm browns/beiges (the current default shadcn tokens) — shift toward cool green-tinted neutrals

---

## 3. Typography

- **UI chrome** (labels, buttons, nav): Inter or system-ui sans-serif, `font-weight: 500`
- **Real-time data** (bus times, laundry counts, capacity percentages): `font-mono` — this sells the "techy tool" feel
- **Headings**: `font-semibold`, never heavy — elegance over weight
- **Body / chat messages**: `text-sm` to `text-base`, `leading-relaxed`

### Type Scale (keep it tight)
- Page title: `text-2xl font-semibold`
- Section header: `text-sm font-medium uppercase tracking-wider text-muted-foreground`
- Data value: `text-xl font-mono font-semibold text-primary`
- Body: `text-sm leading-relaxed`

---

## 4. Animation Principles

Animations must feel **sleek and intentional** — never bouncy, never slow, never decorative without purpose.

### Motion Library: `framer-motion` (already installed)

### Core Easing
- **Default easing**: `[0.16, 1, 0.3, 1]` — fast out, smooth settle (snappy premium feel)
- **Subtle easing**: `easeOut` — for fades and opacity
- **Never use**: `spring` with high bounce, linear, or elastic for UI elements

### Duration Guidelines
| Interaction | Duration |
|---|---|
| Fade in / mount | `0.2s` |
| Slide in (panel, card) | `0.25s` |
| Page transition | `0.3s` |
| Stagger children delay | `0.05s` per item |
| Hover state | CSS `transition: 150ms` (no framer needed) |

### Standard Animation Patterns

**Fade + slide up (mount):**
```tsx
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
```

**Fade in (content reveal):**
```tsx
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: 0.2, ease: "easeOut" }}
```

**Staggered list:**
```tsx
// Parent
variants={{ visible: { transition: { staggerChildren: 0.05 } } }}

// Child
variants={{
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }
}}
```

**Card hover (CSS only — no framer):**
```css
transition: background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
```

### What to animate
- Page/view mounts (fade + slide up)
- Message bubbles appearing in chat (fade + slide up, staggered)
- Scenario cards on empty state (staggered fade-in)
- Tool call cards expanding
- Thinking dots (already done ✓)
- Theme toggle (smooth bg transition via CSS)

### What NOT to animate
- Static layout elements (headers, inputs at rest)
- Scrolling content (no scroll-triggered animations — too heavy)
- Every single hover (only cards and interactive elements)

---

## 5. Component Style Guidelines

### Cards
- Background: `var(--card)`, border: `1px solid var(--border)`
- Border radius: `0.75rem` (`rounded-xl`)
- Hover: slight bg lift + green border tint (`border-primary/30`)
- No drop shadows in dark mode — use border instead

### Buttons
- Primary: `bg-primary text-primary-foreground`, rounded-full for icon buttons, `rounded-lg` for text buttons
- Ghost: `hover:bg-muted/60 hover:text-foreground`
- All buttons: `transition-all duration-150`

### Input / Chat Box
- Rounded pill shape (`rounded-3xl`)
- Background: `bg-muted/50` with `focus-within:ring-1 focus-within:ring-primary/50`
- Keep it compact — the input is not the hero

### Badges
- Small, pill-shaped, `text-xs font-mono`
- Color: green-tinted background with green text (`bg-primary/10 text-primary border border-primary/20`)

### Avatar / Icon Bubbles
- Bot: `bg-primary/10 text-primary`
- User: `bg-muted text-muted-foreground`
- Size: `h-8 w-8`, `rounded-full`

---

## 6. Spacing & Layout

- Max content width: `max-w-screen-md` (768px) — keeps it focused and readable
- Page padding: `px-4 md:px-8`
- Gap between messages: `gap-6`
- Card grid gap: `gap-3`
- Section spacing: multiples of 4 (`p-4`, `p-6`, `p-8`)

---

## 7. Dark / Light Mode Implementation

- Default: dark mode (set `class="dark"` on `<html>` by default)
- Toggle: stored in `localStorage`, applied via `next-themes` or manual class toggle
- CSS transitions on theme switch: add to `body` → `transition: background-color 0.2s ease, color 0.2s ease`
- All color values use CSS custom properties — never hardcode hex in components

---

## 8. Do Not Do

- No gradients on backgrounds (only subtle on specific accent elements)
- No drop shadows in dark mode (use borders)
- No animations with `bounce` or high spring tension
- No hardcoded color values in component files — always use Tailwind tokens
- No decorative elements that don't carry information
- No warm beige/brown tones — keep the palette cool and green-neutral

# Dark Mode Full Pass — Design Doc

**Date:** 2026-03-05
**Scope:** All screens app-wide (~20 screens)
**Approach:** Option A — Direct inline theming using existing ThemeContext

---

## Goal

Make every screen in the app correctly respond to the user's chosen appearance mode (Light / Dark / System). Dark mode should be visually appropriate and bug-free — no white flashes, no unreadable text, no hardcoded colors breaking the theme.

---

## Architecture

No new files or abstractions needed. The existing `ThemeContext.js` already provides:
- `mode` — user's chosen setting: `"system" | "light" | "dark"`
- `setMode` — persisted to AsyncStorage
- `theme.colors` — resolved color set for the current mode
- `useTheme()` hook — used in all components

Work is confined to two areas:
1. Extending `ThemeContext.js` with missing semantic color tokens
2. Updating all screens to use `useTheme()` and replace hardcoded colors

---

## Part 1 — ThemeContext Color Token Extensions

Add the following tokens to both `LightColors` and `DarkColors`:

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `success` | `#2d7a2d` | `#6FCF6F` | "Achieved" badge text |
| `successBg` | `#e7ffd7` | `#1A3A1A` | "Achieved" badge background |
| `danger` | `#e53935` | `#FF6B6B` | Logout, destructive buttons |
| `overlay` | `rgba(0,0,0,0.35)` | `rgba(0,0,0,0.6)` | Modal backdrops |
| `wardrobeLocked` | `#adadad` | `#3A3F47` | Locked wardrobe item bg |
| `inputBg` | `#f9f9f9` | `#1E2530` | Input field backgrounds |

---

## Part 2 — Screen Audit

### Group 1 — No useTheme (full wiring needed)

- `LoginScreen.js`
- `SignUpScreen.js`
- `ForgotPassword.js`
- `ForgotPin.js`
- `HomeScreen.js`
- `ChildProfileSetupScreen.js`
- `AvatarSelection.js`
- `SelectAvatarsScreen.js`
- `ChildReward.js`
- `ChildSelection.js`
- `ParentTaskPage.js`
- `parentReward.js`
- `GenericTaskLibrary.js`
- `WeekCalendar.js` (shared component — use useTheme internally)
- `ChangeEmail.js`
- `ChangePassword.js`
- `ChangePin.js`
- `parentPinScreen.js`

### Group 2 — Partially themed (fix remaining hardcoded leaks)

- `AccountSetting.js` — back button text, logout button color
- `ChildHome.js` — milestone badge, popup modal, wardrobe locked state
- `ParentDashBoard.js` — spot-check hardcoded colors
- `childTask.js` — spot-check hardcoded colors
- `parentReviewTask.js` — spot-check hardcoded colors
- `parentReviewRewards.js` — spot-check hardcoded colors

---

## Part 3 — Pattern Applied Per Screen

For every screen:

1. Add import: `import { useTheme } from "../theme/ThemeContext";`
2. Add at top of component: `const { theme } = useTheme(); const colors = theme.colors;`
3. Replace all hardcoded hex/rgba in JSX inline styles with `colors.*`
4. Move color values out of `StyleSheet.create()` into inline styles where needed (StyleSheet entries are static and cannot reference dynamic theme values)

---

## Part 4 — AccountSetting Appearance UI Improvement

Add icons to the System/Light/Dark toggle buttons for better UX:
- System → globe icon
- Light → sun icon
- Dark → moon icon

Use `Ionicons` (already imported in that file).

---

## Success Criteria

- Toggling Light/Dark/System in AccountSetting immediately updates every visible screen
- No white backgrounds visible when dark mode is active
- No unreadable text (light text on light bg or dark text on dark bg)
- Modal overlays and popups are appropriately darkened in dark mode
- Locked wardrobe items, milestone badges, and status chips all adapt to theme

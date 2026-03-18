# Dark Mode Full Pass — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make every screen in the Habitat app correctly respond to Light / Dark / System appearance mode with no hardcoded colors leaking through.

**Architecture:** Extend the existing `ThemeContext.js` with missing semantic color tokens, then update every screen to use `useTheme()` and replace all hardcoded color values with `colors.*` tokens. StyleSheet entries that use color are moved to inline styles since StyleSheet is static.

**Tech Stack:** React Native, Expo, `useColorScheme`, AsyncStorage, `@react-navigation/native` DefaultTheme/DarkTheme, `react-native-vector-icons/Ionicons`

---

## Task 1: Extend ThemeContext with missing color tokens

**Files:**
- Modify: `habitat-app/theme/ThemeContext.js`

**Step 1: Add tokens to LightColors and DarkColors**

Replace the current `LightColors` and `DarkColors` objects with these extended versions:

```js
const LightColors = {
  primary: "#4CAF50",
  background: "#ffffff",
  card: "#ffffff",
  text: "#111111",
  border: "#e5e5e5",
  notification: "#ff3b30",
  muted: "#777777",
  tabBar: "#fff5f5ff",
  // New tokens
  success: "#2d7a2d",
  successBg: "#e7ffd7",
  danger: "#e53935",
  overlay: "rgba(0,0,0,0.35)",
  wardrobeLocked: "#adadad",
  inputBg: "#f9f9f9",
  starsBanner: "#FFF8E1",
  starsBannerBorder: "#FFE082",
  starsBannerText: "#C17F00",
  progressCard: "#E8F5E9",
  progressCardBorder: "#C8E6C9",
  progressCardText: "#388E3C",
  progressBarBg: "#C8E6C9",
};

const DarkColors = {
  primary: "#8BCF8F",
  background: "#0F172A",
  card: "#171A1E",
  text: "#F5F7FA",
  border: "#2A2F36",
  notification: "#ff453a",
  muted: "#A0A7B4",
  tabBar: "#121417",
  // New tokens
  success: "#6FCF6F",
  successBg: "#1A3A1A",
  danger: "#FF6B6B",
  overlay: "rgba(0,0,0,0.6)",
  wardrobeLocked: "#3A3F47",
  inputBg: "#1E2530",
  starsBanner: "#2A2510",
  starsBannerBorder: "#5A4A00",
  starsBannerText: "#FFD54F",
  progressCard: "#0D2A10",
  progressCardBorder: "#1A4A1A",
  progressCardText: "#81C784",
  progressBarBg: "#1A4A1A",
};
```

**Step 2: Verify app still starts**

Run: `npm start` from `habitat-app/`
Expected: Metro bundler starts, no JS errors in console

**Step 3: Commit**

```bash
git add habitat-app/theme/ThemeContext.js
git commit -m "feat: extend ThemeContext with semantic dark mode color tokens"
```

---

## Task 2: Fix AccountSetting.js — hardcoded leaks + icon improvements

**Files:**
- Modify: `habitat-app/screens/AccountSetting.js`

**Step 1: Add Ionicons to the import and fix hardcoded colors**

The `backText` color is hardcoded `#4CAF50`, `logoutButton` background is hardcoded `#ff0000`, and the "Change X" links are hardcoded `#1E90FF`. Update the JSX:

```jsx
// Change backText style — remove color from StyleSheet, add inline:
<Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>

// Change logoutButton — remove backgroundColor from StyleSheet, add inline:
<TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.danger }]} onPress={handleLogOut}>

// Change "Change Email" / "Change Password" / "Change PIN" links:
<Text style={{ color: colors.primary, fontSize: 12, marginRight:"1%" }}>Change Email</Text>
<Text style={{ color: colors.primary, fontSize: 12, marginRight:"1%" }}>Change Password</Text>
<Text style={{ color: colors.primary, fontSize: 12, marginRight:"1%" }}>Change PIN</Text>
```

**Step 2: Add icons to the System/Light/Dark toggle**

Replace the three-button themeRow section:

```jsx
{[
  { key: "system", label: "System", icon: "globe-outline" },
  { key: "light",  label: "Light",  icon: "sunny-outline" },
  { key: "dark",   label: "Dark",   icon: "moon-outline" },
].map((opt) => (
  <TouchableOpacity
    key={opt.key}
    style={[
      styles.themeOption,
      { borderColor: colors.border },
      mode === opt.key && { backgroundColor: colors.primary, borderColor: colors.primary },
    ]}
    onPress={() => setMode(opt.key)}
  >
    <Ionicons
      name={opt.icon}
      size={16}
      color={mode === opt.key ? "#fff" : colors.text}
      style={{ marginBottom: 2 }}
    />
    <Text
      style={[
        styles.themeOptionText,
        { color: mode === opt.key ? "#fff" : colors.text },
      ]}
    >
      {opt.label}
    </Text>
  </TouchableOpacity>
))}
```

Update `themeOption` in StyleSheet to allow stacking icon + text:
```js
themeOption: {
  flex: 1,
  paddingVertical: 8,
  marginRight: 8,
  borderRadius: 8,
  borderWidth: 1,
  alignItems: "center",
  justifyContent: "center",
},
```

Note: `Ionicons` is already imported as `import Ionicons from 'react-native-vector-icons/Ionicons';`

**Step 3: Remove static colors from StyleSheet entries that are now inline**

In `StyleSheet.create`, remove `color` from `backText` and `backgroundColor` from `logoutButton` (keep other properties).

**Step 4: Verify visually**

Toggle between Light/Dark/System in the app and confirm the AccountSetting screen looks correct in both modes. Icons should appear on the toggle buttons.

**Step 5: Commit**

```bash
git add habitat-app/screens/AccountSetting.js
git commit -m "fix: theme AccountSetting hardcoded colors and add icons to appearance toggle"
```

---

## Task 3: Fix ChildHome.js — hardcoded leaks in badges, popup, wardrobe

**Files:**
- Modify: `habitat-app/screens/ChildHome.js`

**Step 1: Fix milestone "Not Yet" badge — currently hardcoded**

Find this in the milestone map (around line 304-309):
```jsx
<Text style={[styles.milestoneStatus, {
    backgroundColor: m.achieved ? "#e7ffd7ff" : "#f0f0f0",
    color: m.achieved ? "#2d7a2d" : "#999"
}]}>
```

Replace with:
```jsx
<Text style={[styles.milestoneStatus, {
    backgroundColor: m.achieved ? colors.successBg : colors.border,
    color: m.achieved ? colors.success : colors.muted,
}]}>
```

**Step 2: Fix locked wardrobe item background**

Find the `wardrobeItem` TouchableOpacity (around line 328-337):
```jsx
style={[
    styles.wardrobeItem,
    {
        backgroundColor: unlocked ? "#ffffff" : "#adadade8",
        borderWidth: unlocked ? 0 : 1,
        borderColor: "#707070",
    }
]}
```

Replace with:
```jsx
style={[
    styles.wardrobeItem,
    {
        backgroundColor: unlocked ? colors.card : colors.wardrobeLocked,
        borderWidth: unlocked ? 0 : 1,
        borderColor: colors.border,
    }
]}
```

**Step 3: Fix popup modal — hardcoded white background**

Find the popup `View` (around line 366):
```jsx
<View style={styles.popup}>
```

In the StyleSheet, `popup` has `backgroundColor: "#fff"`. Move that to inline:
```jsx
<View style={[styles.popup, { backgroundColor: colors.card }]}>
```

And fix the popup overlay (modal backdrop):
```jsx
<View style={[styles.popupOverlay, { backgroundColor: colors.overlay }]}>
```

Remove `backgroundColor` from both `popup` and `popupOverlay` in `StyleSheet.create`.

**Step 4: Fix progress bar container — hardcoded white**

Around line 388 in StyleSheet:
```js
progressBarContainer: { flex: 1, height: 12, borderRadius: 5, backgroundColor: "#ffffffff", ... }
```

This is static so move background to inline in JSX. Find:
```jsx
<View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
```
That's already done! Now verify `progressBarContainer` in StyleSheet doesn't also set `backgroundColor`. Remove it from StyleSheet if present.

**Step 5: Verify visually in dark mode**

Check milestones show dark badges, wardrobe locked items use dark background, popup uses dark card background.

**Step 6: Commit**

```bash
git add habitat-app/screens/ChildHome.js
git commit -m "fix: theme ChildHome hardcoded milestone badges, popup modal, and wardrobe locked state"
```

---

## Task 4: Spot-check ParentDashBoard, childTask, parentReviewTask, parentReviewRewards

**Files:**
- Modify: `habitat-app/screens/ParentDashBoard.js`
- Modify: `habitat-app/screens/childTask.js`
- Modify: `habitat-app/screens/parentReviewTask.js`
- Modify: `habitat-app/screens/parentReviewRewards.js`

**Step 1: Audit each file for hardcoded color values**

Search each file for: `"#`, `rgba(`, `"white"`, `"black"`. Replace any found with `colors.*` tokens using the inline style pattern.

Common things to look for in each:
- `backgroundColor: "#fff"` in StyleSheet → move to inline `{ backgroundColor: colors.background }`
- `color: "#333"` or `color: "#2d2d2d"` → `{ color: colors.text }`
- `borderColor: "#ddd"` or `"#ccc"` → `{ borderColor: colors.border }`
- `backgroundColor: "#f9f9f9"` → `{ backgroundColor: colors.inputBg }`
- Status chip backgrounds (pending/approved/rejected) → check if themed

For `parentReviewTask.js` specifically: look for tab indicator colors (active tab highlighting), task status badge colors, and any FlatList item backgrounds.

For `childTask.js` specifically: look for the slider, task card backgrounds, completion checkmark colors, and the WeekCalendar wrapper.

**Step 2: Commit after each file**

```bash
git add habitat-app/screens/ParentDashBoard.js
git commit -m "fix: theme ParentDashBoard remaining hardcoded colors"

git add habitat-app/screens/childTask.js
git commit -m "fix: theme childTask remaining hardcoded colors"

git add habitat-app/screens/parentReviewTask.js
git commit -m "fix: theme parentReviewTask remaining hardcoded colors"

git add habitat-app/screens/parentReviewRewards.js
git commit -m "fix: theme parentReviewRewards remaining hardcoded colors"
```

---

## Task 5: Wire LoginScreen.js

**Files:**
- Modify: `habitat-app/screens/LoginScreen.js`

**Step 1: Add useTheme import and hook**

Add after existing imports:
```js
import { useTheme } from "../theme/ThemeContext";
```

Add at top of `LoginScreen` component body (after useState declarations):
```js
const { theme } = useTheme();
const colors = theme.colors;
```

**Step 2: Update JSX — container and form**

```jsx
// ScrollView
<ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>

// Title
<Text style={[styles.title, { color: colors.text }]}>Welcome Back!</Text>

// Subtitle
<Text style={[styles.subtitle, { color: colors.muted }]}>
  Log in to continue building healthy habits with Habitat.
</Text>

// Email input
<TextInput
  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
  placeholder="Enter your email"
  placeholderTextColor={colors.muted}
  ...
/>

// Password input
<TextInput
  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
  placeholder="Enter your password"
  placeholderTextColor={colors.muted}
  ...
/>

// Forgot / Sign Up links
<Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
<Text style={[styles.loginText, { color: colors.primary }]}>Don't have an account? Sign Up</Text>
```

Button stays `backgroundColor: "#4CAF50"` (primary green) — already correct and intentional brand color on both themes, but update to `colors.primary`:
```jsx
<TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} ...>
```

**Step 3: Remove static colors from StyleSheet**

In `StyleSheet.create`, remove:
- `backgroundColor: "#fff"` from `container`
- `color: "#2d2d2d"` from `title`
- `color: "#666"` from `subtitle`
- `color: "#4CAF50"` from `loginText` and `forgotText`

**Step 4: Commit**

```bash
git add habitat-app/screens/LoginScreen.js
git commit -m "feat: wire LoginScreen to useTheme for dark mode support"
```

---

## Task 6: Wire SignUpScreen.js

**Files:**
- Modify: `habitat-app/screens/SignUpScreen.js`

**Step 1: Add useTheme**

```js
import { useTheme } from "../theme/ThemeContext";
// In component:
const { theme } = useTheme();
const colors = theme.colors;
```

**Step 2: Update JSX**

```jsx
// ScrollView
<ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>

// Title + subtitle
<Text style={[styles.title, { color: colors.text }]}>Hey Family!</Text>
<Text style={[styles.subtitle, { color: colors.muted }]}>
  Create your account to start building healthy habits with Habitat.
</Text>

// All TextInput fields — apply to email, password, confirmPassword:
style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
placeholderTextColor={colors.muted}

// Eye icon buttons — change hardcoded "#555":
<Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={colors.muted} />
<Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={22} color={colors.muted} />

// Requirements text
<Text style={[styles.requirements, { color: colors.muted }]}>• At least 8 characters</Text>
// (repeat for all 5 requirement lines)

// Submit button
<TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} ...>

// Login link
<Text style={[styles.loginText, { color: colors.primary }]}>Already have an account? Log In</Text>
```

**Step 3: Clean StyleSheet**

Remove hardcoded color values from `container`, `title`, `subtitle`, `requirements`, `loginText`.

**Step 4: Commit**

```bash
git add habitat-app/screens/SignUpScreen.js
git commit -m "feat: wire SignUpScreen to useTheme for dark mode support"
```

---

## Task 7: Wire ForgotPassword.js and ForgotPin.js

**Files:**
- Modify: `habitat-app/screens/ForgotPassword.js`
- Modify: `habitat-app/screens/ForgotPin.js`

These two files have near-identical structure. Apply the same pattern to both.

**Step 1: Add useTheme to ForgotPassword.js**

```js
import { useTheme } from "../theme/ThemeContext";
// In component:
const { theme } = useTheme();
const colors = theme.colors;
```

**Step 2: Update ForgotPassword JSX**

```jsx
// Outer View
<View style={[styles.container, { backgroundColor: colors.background }]}>

// Header text
<Text style={[styles.header, { color: colors.text }]}>Reset Password</Text>

// Label
<Text style={[styles.label, { color: colors.text }]}>Email</Text>

// Input
<TextInput
  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
  placeholderTextColor={colors.muted}
  ...
/>

// Submit button
<TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} ...>

// Cancel text
<Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
```

**Step 3: Clean ForgotPassword StyleSheet**

Remove `backgroundColor: "#fff"` from `container`, remove color values from `header`, `label`, `cancelText`.

**Step 4: Apply identical changes to ForgotPin.js**

Same pattern — ForgotPin has 4 inputs (email, password, new PIN, confirm PIN). Apply `useTheme`, update all inputs and labels, update container background, header, cancel text.

**Step 5: Commit both**

```bash
git add habitat-app/screens/ForgotPassword.js habitat-app/screens/ForgotPin.js
git commit -m "feat: wire ForgotPassword and ForgotPin to useTheme for dark mode support"
```

---

## Task 8: Wire ChildProfileSetupScreen.js

**Files:**
- Modify: `habitat-app/screens/ChildProfileSetupScreen.js`

**Step 1: Add useTheme**

```js
import { useTheme } from "../theme/ThemeContext";
// In component:
const { theme } = useTheme();
const colors = theme.colors;
```

**Step 2: Update JSX**

```jsx
// ScrollView
<ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>

// Title
<Text style={[styles.title, { color: colors.text }]}>Child Profile Setup</Text>

// All TextInput fields — all use styles.input:
style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
placeholderTextColor={colors.muted}

// The tall notes input:
style={[styles.input, { height: 80, borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}

// Both buttons (Add Child + Finish Setup):
<TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} ...>

// Child card (child list item):
<View style={[styles.childCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
  <Text style={{ color: colors.text }}>{child.fullName}</Text>
  <TouchableOpacity onPress={() => removeChild(index)}>
    <Text style={{ color: colors.danger }}>Remove</Text>
  </TouchableOpacity>
</View>
```

Note: `childCard` style doesn't exist yet in StyleSheet — add it:
```js
childCard: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 10,
  marginBottom: 8,
  borderWidth: 1,
  borderRadius: 8,
},
```

**Step 3: Clean StyleSheet**

Remove `backgroundColor: "#fff"` from `container`, `color: "#2d2d2d"` from `title`.

**Step 4: Commit**

```bash
git add habitat-app/screens/ChildProfileSetupScreen.js
git commit -m "feat: wire ChildProfileSetupScreen to useTheme for dark mode support"
```

---

## Task 9: Wire HomeScreen.js

**Files:**
- Modify: `habitat-app/screens/HomeScreen.js`

Note: This is a prototype/placeholder screen (hardcoded data). Wire it minimally.

**Step 1: Add useTheme**

```js
import { useTheme } from "../theme/ThemeContext";
// In component:
const { theme } = useTheme();
const colors = theme.colors;
```

**Step 2: Update JSX**

```jsx
// Outer View
<View style={[styles.container, { backgroundColor: colors.background }]}>

// Title + date
<Text style={[styles.title, { color: colors.text }]}>Hello Child's Name!</Text>
<Text style={[styles.date, { color: colors.muted }]}>Today's Date</Text>

// Progress bar container
<View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>

// Progress text
<Text style={[styles.progressText, { color: colors.text }]}>150</Text>

// Subtitle
<Text style={[styles.subtitle, { color: colors.text }]}>Milestone Celebrations</Text>

// Milestone cards
<View style={[styles.milestone, { borderColor: colors.border, backgroundColor: colors.card }]}>
  <Text style={[styles.milestoneText, { color: colors.text }]}>First Task Completed!</Text>
  <Text style={[styles.milestoneStatus, { backgroundColor: colors.successBg, color: colors.success }]}>Achieved</Text>
</View>
// (repeat for second milestone)
```

**Step 3: Clean StyleSheet**

Remove `backgroundColor: "#fff"` from `container`, color values from `title`, `date`, `progressText`, `subtitle`, `milestoneText`, `milestoneStatus`.

**Step 4: Commit**

```bash
git add habitat-app/screens/HomeScreen.js
git commit -m "feat: wire HomeScreen to useTheme for dark mode support"
```

---

## Task 10: Wire parentPinScreen.js

**Files:**
- Modify: `habitat-app/screens/parentPinScreen.js`

**Step 1: Add useTheme**

```js
import { useTheme } from "../theme/ThemeContext";
// In component (after existing hooks):
const { theme } = useTheme();
const colors = theme.colors;
```

**Step 2: Update JSX**

```jsx
// SafeAreaView
<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

// Header text
<Text style={[styles.header, { color: colors.text }]}>Parent Access</Text>

// Label
<Text style={[styles.label, { color: colors.text }]}>Enter Your Pin</Text>

// Input
<TextInput
  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
  ...
/>

// Submit button
<TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} ...>

// Forgot PIN text
<Text style={[styles.forgotText, { color: colors.primary }]}>Forgot PIN?</Text>

// Back icon
<Ionicons name="arrow-back" style={[styles.backButton, { color: colors.text }]} />
```

**Step 3: Clean StyleSheet**

Remove `backgroundColor: "#fff"` from `container`.

**Step 4: Commit**

```bash
git add habitat-app/screens/parentPinScreen.js
git commit -m "feat: wire parentPinScreen to useTheme for dark mode support"
```

---

## Task 11: Wire ChildSelection.js

**Files:**
- Modify: `habitat-app/screens/ChildSelection.js`

**Step 1: Add useTheme**

```js
import { useTheme } from "../theme/ThemeContext";
// In component:
const { theme } = useTheme();
const colors = theme.colors;
```

**Step 2: Update JSX**

```jsx
// SafeAreaView (uses `styles.safe` not `styles.container`)
<SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>

// Title
<Text style={[styles.title, { color: colors.text }]}>Who's Playing?</Text>

// Debug text (userId display)
<Text style={{ marginBottom: 10, opacity: 0.6, color: colors.muted }}>
  Logged in as: {userId || "NO USER"}
</Text>

// Empty list message
<Text style={{ opacity: 0.7, color: colors.muted }}>
  No children found. ...
</Text>

// Child card
<View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
  <Text style={[styles.name, { color: colors.text }]}>{item.preferredName || item.fullName}</Text>
  // Buttons keep their hardcoded brand colors (#4CAF50 and #2D8CFF) — acceptable
</View>
```

**Step 3: Clean StyleSheet**

Remove `backgroundColor: "#fff"` from `container` and `safe`.

**Step 4: Commit**

```bash
git add habitat-app/screens/ChildSelection.js
git commit -m "feat: wire ChildSelection to useTheme for dark mode support"
```

---

## Task 12: Wire AvatarSelection.js

**Files:**
- Modify: `habitat-app/screens/AvatarSelection.js`

**Step 1: Add useTheme**

```js
import { useTheme } from "../theme/ThemeContext";
// In component:
const { theme } = useTheme();
const colors = theme.colors;
```

**Step 2: Update JSX**

```jsx
// SafeAreaView
<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

// Title
<Text style={[styles.title, { color: colors.text }]}>Select Your Avatar</Text>

// Selected avatar border (already inline — keep as is, uses #4CAF50 = primary)
// selectedAvatar: { borderColor: "#4CAF50", borderWidth: 3 } → move to inline:
style={[selectedAvatar === avatarId && { borderColor: colors.primary, borderWidth: 3 }]}

// Button
<TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }, !selectedAvatar && { opacity: 0.5 }]} ...>
```

**Step 3: Clean StyleSheet**

Remove `backgroundColor: "#fff"` from `container`, `color: "#2d2d2d"` from `title`, `backgroundColor` from `button` and `borderColor` from `selectedAvatar`.

**Step 4: Commit**

```bash
git add habitat-app/screens/AvatarSelection.js
git commit -m "feat: wire AvatarSelection to useTheme for dark mode support"
```

---

## Task 13: Fix SelectAvatarsScreen.js — hardcoded leaks

**Files:**
- Modify: `habitat-app/screens/SelectAvatarsScreen.js`

This screen already uses `useTheme()` but has several hardcoded color blocks remaining.

**Step 1: Fix stars banner**

```jsx
// Stars banner View — currently hardcoded:
<View style={[styles.starsBanner, { backgroundColor: colors.starsBanner, borderColor: colors.starsBannerBorder }]}>
  <Text style={[styles.starsText, { color: colors.starsBannerText }]}>⭐ {totalPoints} Stars Earned</Text>
</View>
```

Remove `backgroundColor`, `borderColor` from `starsBanner` in StyleSheet, and `color` from `starsText`.

**Step 2: Fix progress card**

```jsx
<View style={[styles.progressCard, { backgroundColor: colors.progressCard, borderColor: colors.progressCardBorder }]}>
  <Text style={[styles.progressTitle, { color: colors.progressCardText }]}>
    {nextLocked.emoji} Next unlock: <Text style={styles.progressBold}>{nextLocked.name}</Text>
  </Text>
  <View style={[styles.progressBarBg, { backgroundColor: colors.progressBarBg }]}>
  <Text style={[styles.progressLabel, { color: colors.progressCardText }]}>
```

Remove those color values from StyleSheet.

**Step 3: Fix loader container and bottom bar border**

```jsx
// Loader:
<View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>

// Bottom bar:
<View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
```

Remove `backgroundColor: "#fff"` from `loaderContainer` and `borderTopColor: "#eee"` from `bottomBar` in StyleSheet.

**Step 4: Fix badge backgrounds and emoji circle**

```jsx
// Badge — move background color inline:
<View style={[
  styles.badge,
  { backgroundColor: (avatar.milestoneRequired ?? 0) === 0 || isUnlocked ? colors.successBg : colors.starsBanner },
]}>

// Emoji circle — fix hardcoded #F0F0F0:
<View style={[styles.emojiCircle, { backgroundColor: colors.border }]}>
```

**Step 5: Fix checkBadge background**

```jsx
<View style={[styles.checkBadge, { backgroundColor: colors.card }]}>
```

**Step 6: Commit**

```bash
git add habitat-app/screens/SelectAvatarsScreen.js
git commit -m "fix: theme SelectAvatarsScreen remaining hardcoded colors"
```

---

## Task 14: Wire ChildReward.js

**Files:**
- Modify: `habitat-app/screens/ChildReward.js`

**Step 1: Read the full file first to identify all hardcoded colors**

The file uses `LinearGradient` and has a complex UI. Search for all `"#` occurrences, noting:
- Container/SafeArea backgrounds
- Card backgrounds
- Text colors
- Modal backdrops
- Character roster card backgrounds (locked vs unlocked)
- Confetti colors (leave as-is — decorative)

**Step 2: Add useTheme**

```js
import { useTheme } from "../theme/ThemeContext";
// In component:
const { theme } = useTheme();
const colors = theme.colors;
```

**Step 3: Apply theming pattern**

For every hardcoded color found:
- Move from StyleSheet to inline style using `colors.*`
- SafeAreaView background → `colors.background`
- Card backgrounds → `colors.card`
- Text → `colors.text`
- Muted text → `colors.muted`
- Borders → `colors.border`
- Modal backdrop → `colors.overlay`
- Locked character overlay → `colors.wardrobeLocked`
- LinearGradient colors: keep as-is if they are decorative/brand colors, or use `[colors.primary, colors.successBg]` if they need to adapt

**Step 4: Commit**

```bash
git add habitat-app/screens/ChildReward.js
git commit -m "feat: wire ChildReward to useTheme for dark mode support"
```

---

## Task 15: Wire ParentTaskPage.js

**Files:**
- Modify: `habitat-app/screens/ParentTaskPage.js`

**Step 1: Add useTheme**

```js
import { useTheme } from "../theme/ThemeContext";
// In component:
const { theme } = useTheme();
const colors = theme.colors;
```

**Step 2: Read the full file then apply theming**

Key elements to theme in this create-task form:
- SafeAreaView background → `colors.background`
- All TextInput fields → `borderColor: colors.border`, `backgroundColor: colors.inputBg`, `color: colors.text`, `placeholderTextColor={colors.muted}`
- Labels → `color: colors.text`
- Date/time picker row backgrounds → `colors.card`
- Steps list items → `borderColor: colors.border`, `backgroundColor: colors.card`
- Section headings → `color: colors.text`
- The Picker component → wrap in a View with `backgroundColor: colors.inputBg`
- Submit button → `backgroundColor: colors.primary`

**Step 3: Commit**

```bash
git add habitat-app/screens/ParentTaskPage.js
git commit -m "feat: wire ParentTaskPage to useTheme for dark mode support"
```

---

## Task 16: Wire parentReward.js

**Files:**
- Modify: `habitat-app/screens/parentReward.js`

**Step 1: Add useTheme**

```js
import { useTheme } from "../theme/ThemeContext";
// In component:
const { theme } = useTheme();
const colors = theme.colors;
```

**Step 2: Read the full file then apply theming**

Key elements:
- SafeAreaView background → `colors.background`
- Reward form inputs → `borderColor: colors.border`, `backgroundColor: colors.inputBg`, `color: colors.text`
- Labels → `color: colors.text`
- Frequency picker → `backgroundColor: colors.inputBg`
- Reward card list items → `backgroundColor: colors.card`, `borderColor: colors.border`
- Reward name / description text in cards → `color: colors.text`
- Delete button → `color: colors.danger`
- Add reward / save button → `backgroundColor: colors.primary`
- Image placeholder → `backgroundColor: colors.border`

**Step 3: Commit**

```bash
git add habitat-app/screens/parentReward.js
git commit -m "feat: wire parentReward to useTheme for dark mode support"
```

---

## Task 17: Wire GenericTaskLibrary.js

**Files:**
- Modify: `habitat-app/screens/GenericTaskLibrary.js`

**Step 1: Add useTheme**

```js
import { useTheme } from "../theme/ThemeContext";
// In component:
const { theme } = useTheme();
const colors = theme.colors;
```

**Step 2: Update JSX**

```jsx
// Loading state SafeAreaView (inline style currently):
<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>

// Main SafeAreaView:
<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>

// Back button text:
<Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>

// Header:
<Text style={[styles.header, { color: colors.text }]}>Generic Task Library</Text>

// FlatList item cards: read the renderItem to find card View and Text styles
// Apply: backgroundColor: colors.card, borderColor: colors.border, color: colors.text
```

**Step 3: Commit**

```bash
git add habitat-app/screens/GenericTaskLibrary.js
git commit -m "feat: wire GenericTaskLibrary to useTheme for dark mode support"
```

---

## Task 18: Wire WeekCalendar.js

**Files:**
- Modify: `habitat-app/screens/WeekCalendar.js`

This is a shared component rendered inside `childTask.js`. It can use `useTheme()` directly since it renders inside the ThemeProvider tree.

**Step 1: Add useTheme**

```js
import { useTheme } from "../theme/ThemeContext";
// In component:
const { theme } = useTheme();
const colors = theme.colors;
```

**Step 2: Read the full file then apply theming**

Key elements in the week calendar:
- Container View background → `colors.card`
- Day cell text (day name + day number) → `colors.text`
- Selected day background → `colors.primary`
- Selected day text → `"#fff"` (intentional — white on green)
- Today indicator dot → `colors.primary`
- Unselected day background → `colors.card`
- Navigation arrows (prev/next week) → `colors.text` or `colors.primary`
- Separator borders → `colors.border`

**Step 3: Commit**

```bash
git add habitat-app/screens/WeekCalendar.js
git commit -m "feat: wire WeekCalendar to useTheme for dark mode support"
```

---

## Task 19: Wire ChangeEmail.js, ChangePassword.js, ChangePin.js

**Files:**
- Modify: `habitat-app/screens/ChangeEmail.js`
- Modify: `habitat-app/screens/ChangePassword.js`
- Modify: `habitat-app/screens/ChangePin.js`

All three have identical structure to `ForgotPassword.js`. Apply the exact same pattern.

**Step 1: Add useTheme to all three**

```js
import { useTheme } from "../theme/ThemeContext";
// In component:
const { theme } = useTheme();
const colors = theme.colors;
```

**Step 2: Apply to ChangeEmail.js**

```jsx
// Outer View
<View style={[styles.container, { backgroundColor: colors.background }]}>

// Header
<Text style={[styles.header, { color: colors.text }]}>Change Parent Email</Text>

// All labels (Email, Password, New Email, Confirm New Email)
<Text style={[styles.label, { color: colors.text }]}>Email</Text>

// All inputs
style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}

// Cancel text
<Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
```

Remove `backgroundColor: "#fff"` from `container` in StyleSheet.

**Step 3: Apply identical changes to ChangePassword.js and ChangePin.js**

Same pattern. ChangePassword has: Email, Password, New Password, Confirm New Password inputs.
ChangePin has: Email, Password, New PIN, Confirm New PIN inputs.

**Step 4: Commit all three**

```bash
git add habitat-app/screens/ChangeEmail.js habitat-app/screens/ChangePassword.js habitat-app/screens/ChangePin.js
git commit -m "feat: wire ChangeEmail, ChangePassword, ChangePin to useTheme for dark mode support"
```

---

## Task 20: Final verification pass

**Step 1: Start the app**

```bash
cd habitat-app && npm start
```

**Step 2: Manually verify each theme mode**

In AccountSetting, toggle between System / Light / Dark and navigate through:

- [ ] LoginScreen — background, inputs, links all adapt
- [ ] SignUpScreen — background, inputs, requirements text all adapt
- [ ] ForgotPassword — background, inputs all adapt
- [ ] ChildProfileSetupScreen — background, inputs all adapt
- [ ] ChildSelection — background, cards all adapt
- [ ] AvatarSelection — background, selected border adapts
- [ ] ChildHome — background, milestone badges, wardrobe locked state, popup all adapt
- [ ] ChildReward — background, cards all adapt
- [ ] parentPinScreen — background, input all adapt
- [ ] ParentDashBoard — background adapts
- [ ] ParentTaskPage — background, inputs all adapt
- [ ] parentReviewTask — background, task cards adapt
- [ ] parentReviewRewards — background, claim cards adapt
- [ ] parentReward — background, reward cards adapt
- [ ] GenericTaskLibrary — background, task list adapts
- [ ] AccountSetting — toggle icons visible, all fields adapt
- [ ] ChangeEmail / ChangePassword / ChangePin — background, inputs adapt
- [ ] WeekCalendar (inside childTask) — day cells, selected day, borders adapt

**Step 3: Check for any remaining white flashes**

Pay special attention to screen transitions — if a white flash appears on navigation, the root screen container likely still has a hardcoded `backgroundColor: "#fff"` in StyleSheet.

**Step 4: Commit any stragglers found**

Fix any remaining issues screen by screen, commit each fix separately.

---

## Completion

After all tasks are done, the app should have zero hardcoded color values that escape into the rendered UI in dark mode. Every screen will correctly follow the user's chosen appearance setting, persisted across app restarts via AsyncStorage.

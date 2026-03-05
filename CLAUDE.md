# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All frontend commands run from `habitat-app/`:

```bash
npm start              # Start Expo dev server
npm run start:clear    # Start with cleared cache (use when metro cache issues arise)
npm run android        # Run on Android
npm run ios            # Run on iOS simulator
npm run web            # Run web version
```

Firebase backend (from repo root):
```bash
firebase deploy --only functions   # Deploy Cloud Functions
firebase emulators:start           # Run Firebase emulators locally
```

No test suite is configured.

## Architecture

**Stack:** React Native + Expo (frontend), Firebase (backend: Auth, Firestore, Storage, Cloud Functions)

### Two user roles

- **Child** — views assigned tasks on a calendar, marks tasks complete, earns points, spends points on avatar wardrobe items
- **Parent** — creates/assigns tasks with point values, reviews child completions (approve/reject), manages rewards catalog, protected by PIN lock

### Navigation structure (`habitat-app/App.js`)

Root navigator uses `ParentLockContext` to track whether the parent PIN is unlocked. Navigation is split into child-facing tabs and parent-facing screens using React Navigation Native Stack + Bottom Tabs.

### Key context providers

| File | Purpose |
|------|---------|
| `habitat-app/firebaseConfig.js` | Firebase SDK init (Auth, Firestore, Storage) |
| `habitat-app/auth.js` | Firebase auth helpers |
| `habitat-app/ParentLockContext.js` | Parent PIN locked/unlocked state |
| `habitat-app/theme/ThemeContext.js` | Light/dark theme, persisted to AsyncStorage |

### Firestore data model

- `children` — child profiles: avatar, preferred name, wardrobe items owned
- `tasks` — tasks assigned to children: date, points, status (`pending`/`completed`/`approved`/`rejected`)
- `childPoints` — point balance per child
- `parentPoints` — total points assigned by parent
- `notifications` — task events; a Firestore trigger in `functions/index.js` sends Expo push notifications when documents are created here
- `userPushTokens` — Expo push tokens keyed by user ID

### Avatar/wardrobe system

Avatar configurations live in `habitat-app/data/avatars.js`. Wardrobe image assets are in `habitat-app/assets/`. The rewards screen lets children spend points to unlock wardrobe items which are stored on their `children` document.

### Push notifications

`functions/index.js` contains a Firestore-triggered Cloud Function (Firebase Functions v2, Node 18) that fires on new `notifications` documents and calls the Expo Push API to deliver notifications to devices.

### Known issue

Tasks created by a parent for "today" using the current time may not appear in the child's calendar view if the creation time has already passed. Tasks should be queried by date only, not datetime.
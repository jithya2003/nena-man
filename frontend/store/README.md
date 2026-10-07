# nena-man — Global State Layer (`store/`)

Zustand-powered stores that act as the **single source of truth** for data shared across the app's four AI modules (reading/audio error analysis, text difficulty, behavior detection, recommendations).

---

## What lives where

| File | What it holds | Persisted? |
|:---|:---|:---:|
| `authStore.ts` | Logged-in user snapshot (uid, name, email, role) | ❌ |
| `childStore.ts` | Selected child + full children list | ✅ `@nena_man_child_store` |
| `sessionStore.ts` | One active reading session end-to-end | ✅ `@nena_man_session_store` |
| `settingsStore.ts` | Language, font size, accessibility flags | ✅ `@nena_man_settings_store` |
| `networkStore.ts` | `isOnline` boolean | ❌ |
| `types.ts` | All shared TypeScript interfaces | — |
| `hooks.ts` | **Only import from here in screens** | — |
| `_storageAdapter.ts` | Internal bridge from AppStorage → Zustand persist | — |

---

## How to read store data in a screen

**Rule: Always import from `@/store/hooks`, never from individual store files.**

```tsx
// ✅ Correct
import { useCurrentChild, useSession, useSettings, useIsOnline } from '@/store/hooks';

// ❌ Wrong — breaks the abstraction layer
import { useChildStoreBase } from '@/store/childStore';
```

### Examples

```tsx
// Get logged-in user (Zustand mirror — populated by AuthContext)
const { user, isAuthenticated } = useAuthStore();

// Get + change the selected child
const { currentChild, children, setCurrentChild } = useCurrentChild();

// Read and update the active reading session
const { sessionId, recordingStatus, setRecordingStatus, attachResult } = useSession();

// Read user settings
const { language, setLanguage, fontSize, accessibility } = useSettings();

// Check connectivity (re-renders when status changes)
const isOnline = useIsOnline();
if (!isOnline) return <OfflineBanner />;
```

---

## How to add a new field to an existing store

**Example: add `lastSyncedAt: number | null` to `childStore`.**

1. Open `store/childStore.ts`
2. Add the field to the `ChildState` interface
3. Add an initial value in `create(...)`
4. Add a setter action
5. If it should be persisted, it's automatically included (unless you used `partialize` to exclude it — check the store)

```ts
// store/childStore.ts
interface ChildState {
  // ... existing fields ...
  lastSyncedAt: number | null;          // ← add here
  setLastSyncedAt: (ts: number) => void; // ← add action
}

// inside create()(...)
lastSyncedAt: null,
setLastSyncedAt: (ts) => set({ lastSyncedAt: ts }),
```

That's it — the hook re-exports in `hooks.ts` don't need updating since they re-export the whole store object.

---

## How to attach a new module's result to a session

Each of the four AI modules stores its result via `attachResult()`:

```ts
// sessionStore results object shape:
results: {
  errorAnalysis:  ErrorAnalysisResult | null,
  textDifficulty: TextDifficultyResult | null,
  behaviorState:  BehaviorStateResult | null,
  recommendation: RecommendationResult | null,
}

// Usage in any screen or service:
const { attachResult } = useSession();
attachResult('errorAnalysis', {
  words: [{ text: 'ගස', status: 'correct', expected: 'ගස', confidence: 0.98 }],
  severity: 0.1,
});
```

TypeScript infers the correct shape from the module name — a wrong shape is a compile error.

---

## Session lifecycle

```
startSession(textId)
  → setCurrentText(text)
  → setRecordingStatus('recording')
  → setRecordingStatus('uploading')
  → attachResult('errorAnalysis', data)
  → attachResult('textDifficulty', data)
  → attachResult('behaviorState', data)
  → attachResult('recommendation', data)
  → endSession()         ← keeps results in store for review screen
  → resetSession()       ← full wipe (or called automatically on logout)
```

---

## Connectivity listener setup

`useNetworkStatus()` is already mounted once in `app/_layout.tsx` via the `<NetworkListener />` component. You do **not** need to call it again anywhere else.

To consume in a screen:

```tsx
import { useIsOnline } from '@/store/hooks';
const isOnline = useIsOnline(); // re-renders automatically on change
```

---

## Copy-pasteable usage example

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useAuthStore, useCurrentChild, useIsOnline } from '@/store/hooks';

export default function DashboardScreen() {
  const { user }                      = useAuthStore();
  const { currentChild, children }    = useCurrentChild();
  const isOnline                      = useIsOnline();

  return (
    <View>
      {!isOnline && <Text>Offline — some features unavailable</Text>}
      <Text>Welcome, {user?.name}</Text>
      {currentChild
        ? <Text>Viewing: {currentChild.name} (Grade {currentChild.grade})</Text>
        : <Text>Select a child to begin</Text>
      }
      <Text>{children.length} child profiles loaded</Text>
    </View>
  );
}
```

---

## Auth store note

`authStore` is a **Zustand mirror** of the Firebase-authenticated user.  
It is populated by `AuthContext` — do not call `setUser()` from screens.  
For Firebase operations (sign-in, sign-out, email verification), always use `useAuth()` from `@/context/AuthContext`.

```
AuthContext (Firebase authority)
    └─ on login    → authStore.setUser(...)
    └─ on logout   → authStore.logout()
                        └─ childStore.clearCurrentChild()
                        └─ sessionStore.resetSession()
```

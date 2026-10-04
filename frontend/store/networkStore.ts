/**
 * nena-man · frontend/store/networkStore.ts
 * Tiny store tracking online/offline status.
 *
 * Wired to @react-native-community/netinfo on native and window.navigator.onLine
 * on web. The listener is started once by the useNetworkStatus() hook (mount it
 * in app/_layout.tsx or App.tsx). Screens consume it via useIsOnline().
 *
 * Usage (mount once in root layout):
 *   import { useNetworkStatus } from '@/store/hooks';
 *   export default function RootLayout() {
 *     useNetworkStatus(); // <-- starts listener
 *     ...
 *   }
 *
 * Usage (any screen):
 *   import { useIsOnline } from '@/store/hooks';
 *   const isOnline = useIsOnline();
 */

import { create } from 'zustand';

interface NetworkState {
  isOnline: boolean;
  setOnline: (online: boolean) => void;
}

export const useNetworkStoreBase = create<NetworkState>()((set) => ({
  // Optimistic default — assume online until first NetInfo event.
  isOnline: true,
  setOnline: (online) => set({ isOnline: online }),
}));

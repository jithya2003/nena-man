import { Platform } from 'react-native';

const memoryStore = new Map<string, string>();

function getAsyncStorage() {
  if (Platform.OS === 'web') return null;
  try {
    const mod = require('@react-native-async-storage/async-storage');
    return mod.default || mod;
  } catch {
    return null;
  }
}

export const AppStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        const value = window.localStorage.getItem(key);
        return value !== null ? value : memoryStore.get(key) || null;
      }
      const storage = getAsyncStorage();
      if (storage) {
        const value = await storage.getItem(key);
        return value !== null ? value : memoryStore.get(key) || null;
      }
      return memoryStore.get(key) || null;
    } catch {
      return memoryStore.get(key) || null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      } else {
        const storage = getAsyncStorage();
        if (storage) {
          await storage.setItem(key, value);
        }
      }
      memoryStore.set(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      } else {
        const storage = getAsyncStorage();
        if (storage) {
          await storage.removeItem(key);
        }
      }
      memoryStore.delete(key);
    } catch {
      memoryStore.delete(key);
    }
  },
};

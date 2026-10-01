/**
 * nena-man · frontend/declarations.d.ts
 * Minimal ambient type declarations for expo-router@6.0.24.
 *
 * expo-router@6.x has a known npm packaging bug where build/index.d.ts is
 * missing from the published package. This file provides typed stubs for all
 * hooks and components the project actually uses, unblocking `tsc --noEmit`.
 *
 * IMPORTANT: Do NOT add any top-level `import` or `export` statements to this
 * file — doing so turns it into a module, which makes `declare module` local
 * only and invisible to the rest of the project.
 *
 * Remove this file once expo-router publishes a fixed version.
 */

declare module 'expo-router' {
  // All imports MUST be inside this block (not at the top of the file)
  import type { ReactNode, ReactElement } from 'react';

  // ── Navigation types ──────────────────────────────────────────────────────

  type Href = string | { pathname: string; params?: Record<string, string | undefined> };

  interface Router {
    push(href: Href): void;
    replace(href: Href): void;
    back(): void;
    navigate(href: Href): void;
    canGoBack(): boolean;
    setParams(params: Record<string, string>): void;
  }

  // ── Hooks ─────────────────────────────────────────────────────────────────

  export function useRouter(): Router;
  export function usePathname(): string;
  export function useSegments(): string[];
  export function useLocalSearchParams<
    T extends Record<string, string | string[] | undefined> = Record<string, string | string[]>
  >(): T;
  export function useGlobalSearchParams<
    T extends Record<string, string | string[] | undefined> = Record<string, string | string[]>
  >(): T;
  export function useFocusEffect(effect: () => void | (() => void)): void;

  // ── Stack ─────────────────────────────────────────────────────────────────
  // Explicit call signatures so JSX accepts these as valid element types.

  interface StackScreenOptions {
    headerShown?: boolean;
    title?: string;
    animation?: string;
    contentStyle?: object;
    [key: string]: unknown;
  }

  interface StackProps {
    screenOptions?: StackScreenOptions;
    children?: ReactNode;
    initialRouteName?: string;
  }

  interface StackScreenProps {
    name: string;
    options?: StackScreenOptions;
  }

  interface StackType {
    (props: StackProps): ReactElement | null;
    Screen(props: StackScreenProps): ReactElement | null;
  }
  export const Stack: StackType;

  // ── Tabs ──────────────────────────────────────────────────────────────────

  interface TabsScreenOptions {
    title?: string;
    headerShown?: boolean;
    tabBarIcon?: (props: { color: string; size: number }) => ReactNode;
    [key: string]: unknown;
  }

  interface TabsProps {
    screenOptions?: TabsScreenOptions;
    children?: ReactNode;
  }

  interface TabsScreenProps {
    name: string;
    options?: TabsScreenOptions;
  }

  interface TabsType {
    (props: TabsProps): ReactElement | null;
    Screen(props: TabsScreenProps): ReactElement | null;
  }
  export const Tabs: TabsType;

  // ── Other components ──────────────────────────────────────────────────────

  export function Link(props: {
    href: Href;
    children?: ReactNode;
    [key: string]: unknown;
  }): ReactElement | null;

  export function Redirect(props: { href: Href }): ReactElement | null;

  export function Slot(props?: { [key: string]: unknown }): ReactElement | null;

  // ── withLayoutContext ─────────────────────────────────────────────────────

  export function withLayoutContext<T, C>(
    component: C,
    processor?: (screens: any[]) => any[]
  ): C & {
    Screen(props: T & { name: string }): ReactElement | null;
  };
}

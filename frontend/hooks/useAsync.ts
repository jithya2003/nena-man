import { useState, useCallback, useEffect, useRef } from 'react';

export type AsyncStatus = 'idle' | 'loading' | 'error' | 'empty' | 'success';

export interface UseAsyncOptions<T> {
  /** If true, executes the asyncFunction immediately on mount */
  immediate?: boolean;
  /** Initial fallback data */
  initialData?: T | null;
  /** Custom check to decide if data should trigger 'empty' status (defaults to checking null/empty array/empty object) */
  isEmpty?: (data: T) => boolean;
  /** Callback fired on successful resolution */
  onSuccess?: (data: T) => void;
  /** Callback fired on error */
  onError?: (error: any) => void;
}

export interface UseAsyncReturn<T, Args extends any[] = any[]> {
  status: AsyncStatus;
  data: T | null;
  error: Error | string | null;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  isSuccess: boolean;
  isIdle: boolean;
  execute: (...args: Args) => Promise<T | null>;
  reload: () => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
}

/**
 * Default empty checker: handles null, undefined, empty arrays, and empty objects
 */
function defaultIsEmpty<T>(data: T): boolean {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object' && Object.keys(data).length === 0) return true;
  if (typeof data === 'string') return data.trim().length === 0;
  return false;
}

/**
 * useAsync / useFetchState hook:
 * Automatically manages state transitions between loading, error, empty, and data.
 * Pairs directly with <LoadingView />, <ErrorView />, and <EmptyView />.
 *
 * @example
 * const { data, isLoading, isError, isEmpty, reload } = useAsync(fetchSessions, { immediate: true });
 *
 * if (isLoading) return <LoadingView message="සැසි විස්තර ලබා ගනිමින්..." />;
 * if (isError) return <ErrorView onRetry={reload} />;
 * if (isEmpty) return <EmptyView onAction={startNewSession} />;
 * return <SessionList sessions={data} />;
 */
export function useAsync<T, Args extends any[] = any[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, Args> {
  const {
    immediate = false,
    initialData = null,
    isEmpty: customIsEmpty = defaultIsEmpty,
    onSuccess,
    onError,
  } = options;

  const [status, setStatus] = useState<AsyncStatus>(immediate ? 'loading' : 'idle');
  const [data, setData] = useState<T | null>(initialData);
  const [error, setError] = useState<Error | string | null>(null);

  const lastArgsRef = useRef<Args | []>([]);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      lastArgsRef.current = args;
      setStatus('loading');
      setError(null);

      try {
        const result = await asyncFunction(...args);
        if (!isMountedRef.current) return null;

        setData(result);
        const empty = customIsEmpty(result);
        const nextStatus: AsyncStatus = empty ? 'empty' : 'success';
        setStatus(nextStatus);

        onSuccess?.(result);
        return result;
      } catch (err: any) {
        if (!isMountedRef.current) return null;

        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setStatus('error');

        onError?.(err);
        return null;
      }
    },
    [asyncFunction, customIsEmpty, onSuccess, onError]
  );

  const reload = useCallback((): Promise<T | null> => {
    return execute(...(lastArgsRef.current as Args));
  }, [execute]);

  const reset = useCallback(() => {
    setStatus('idle');
    setData(initialData);
    setError(null);
  }, [initialData]);

  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as Args));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]);

  return {
    status,
    data,
    error,
    isLoading: status === 'loading',
    isError: status === 'error',
    isEmpty: status === 'empty',
    isSuccess: status === 'success',
    isIdle: status === 'idle',
    execute,
    reload,
    reset,
    setData,
  };
}

export default useAsync;

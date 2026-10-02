/**
 * nena-man · frontend/components/shared-states/index.ts
 * Shared UI States Module (Author: Pushpakumara A.S.P.L.T · IT23177246)
 *
 * Provides standardized, dyslexia-friendly loading, error, empty, and offline components
 * across the entire Nena-Man mobile application.
 */

export { default as LoadingView } from '../LoadingView';
export type { LoadingViewProps } from '../LoadingView';

export { default as ErrorView } from '../ErrorView';
export type { ErrorViewProps } from '../ErrorView';

export { default as EmptyView } from '../EmptyView';
export type { EmptyViewProps } from '../EmptyView';

export { default as OfflineBanner } from '../OfflineBanner';
export type { OfflineBannerProps } from '../OfflineBanner';

export {
  default as SkeletonLoader,
  SkeletonText,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonListItem,
} from '../SkeletonLoader';
export type { SkeletonProps } from '../SkeletonLoader';

export { useAsync } from '@/hooks/useAsync';
export type { AsyncStatus, UseAsyncOptions, UseAsyncReturn } from '@/hooks/useAsync';

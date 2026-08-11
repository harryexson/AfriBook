declare module 'posthog-node' {
  export class PostHog {
    constructor(apiKey: string, options?: Record<string, unknown>);
    capture(event: { distinctId: string; event: string; properties?: Record<string, unknown> }): void;
    identify(data: { distinctId: string; properties?: Record<string, unknown> }): void;
    shutdown(): Promise<void>;
  }
}

declare module '@sentry/nextjs' {
  import type { ErrorBoundaryProps } from '@sentry/react';
  import type { NodeOptions } from '@sentry/node';

  export function init(options: NodeOptions & { integrations?: unknown[] }): void;
  export function captureException(error: unknown, context?: Record<string, unknown>): string;
  export function captureMessage(message: string, level?: unknown): string;
  export function setUser(user: { id: string; email?: string } | null): void;
  export function setTag(key: string, value: string): void;
  export function setExtra(key: string, value: unknown): void;
  export function withScope(callback: (scope: { setTag: (k: string, v: string) => void; setExtra: (k: string, v: unknown) => void; setUser: (u: { id: string; email?: string } | null) => void }) => void): void;
  export const ErrorBoundary: React.ComponentType<ErrorBoundaryProps>;
  export { withSentryConfig } from '@sentry/nextjs';
}

declare module '@sentry/node' {
  export interface NodeOptions {
    dsn: string;
    environment?: string;
    tracesSampleRate?: number;
    debug?: boolean;
    enabled?: boolean;
    release?: string;
    maxBreadcrumbs?: number;
    attachStacktrace?: boolean;
  }
}

declare module '@sentry/react' {
  import type React from 'react';
  export type FallbackRender = (errorData: { error: Error; componentStack: string; resetError(): void }) => React.ReactElement;
  export interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    fallbackRender?: FallbackRender;
    onError?: (error: Error, componentStack: string, eventId: string) => void;
  }
  export const ErrorBoundary: React.ComponentType<ErrorBoundaryProps>;
}

declare module '@tailwindcss/typography' {
  const plugin: { handler: () => void };
  export default plugin;
}

declare module '@tailwindcss/postcss' {
  const plugin: { handler: () => void };
  export default plugin;
}

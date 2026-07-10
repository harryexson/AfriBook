'use client';

import { useState, useEffect } from 'react';

/**
 * Debounce a value by the given delay in milliseconds.
 * Returns the debounced value that updates only after the delay has elapsed
 * since the last change.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

/**
 * Prefetch utilities - Functions for prefetching data and routes
 * 
 * These functions are no-op stubs to maintain compatibility.
 * The actual prefetching is handled by Next.js router.prefetch() directly.
 */

/**
 * Prefetch data for a specific year
 * @param year - Year to prefetch data for ("all" for all years)
 * @returns Promise that resolves immediately
 */
export async function prefetchData(year: string): Promise<void> {
  // No-op: Data prefetching is handled by Next.js router.prefetch()
  // and the cache system in cache.ts
  return Promise.resolve()
}

/**
 * Prefetch data for the analyse page
 * @returns Promise that resolves immediately
 */
export async function prefetchAnalysePage(): Promise<void> {
  // No-op: Route prefetching is handled by Next.js router.prefetch()
  return Promise.resolve()
}

/**
 * Cancel all pending prefetch operations
 */
export function cancelAllPrefetches(): void {
  // No-op: No active prefetch operations to cancel
  // Next.js handles prefetch cancellation automatically
}


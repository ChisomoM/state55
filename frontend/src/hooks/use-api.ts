import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Runs an async loader and tracks its loading / error / data state.
 * It re-runs whenever `deps` change or `reload()` is called, and ignores results from stale runs
 * (so a slow earlier request cannot overwrite a newer one).
 *
 *   const { data, loading, error, reload } = useApi(() => usersApi.list({ page }), [page]);
 */
export function useApi<T>(loader: () => Promise<T>, deps: readonly unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // Always call the latest loader without making it a dependency.
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    loaderRef
      .current()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { data, error, loading, reload };
}

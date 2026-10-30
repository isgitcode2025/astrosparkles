"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiRequestError } from "./api";

/**
 * Loads data on mount (and when `deps` change). `data` is undefined while loading,
 * `error` holds a readable message when it failed, `reload()` tries again quietly
 * (keeps showing the current data while it refreshes).
 */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  const reload = useCallback(async () => {
    const mine = ++seq.current;
    setError(null);
    try {
      const d = await run();
      if (mine === seq.current) setData(d);
    } catch (e) {
      if (mine === seq.current) setError(e instanceof ApiRequestError ? e.message : "Could not load");
    }
  }, [run]);

  useEffect(() => {
    setData(undefined);
    reload();
  }, [reload]);

  return { data, error, reload, setData };
}

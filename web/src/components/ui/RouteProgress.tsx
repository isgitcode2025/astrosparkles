"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const START = "kj-nav-start";
/** Call before router.push / router.replace so the top bar shows for programmatic navigation too. */
export const startNavProgress = () => typeof window !== "undefined" && window.dispatchEvent(new Event(START));

/**
 * Thin bar at the top of the screen while a page is loading after a link click.
 * Starts on internal link clicks (and GET form submits), finishes when the URL has changed.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const start = () => {
    clear();
    setVisible(true);
    setWidth(12);
    // creep towards 90% while waiting
    [30, 50, 65, 75, 82, 88].forEach((w, i) => timers.current.push(setTimeout(() => setWidth(w), 250 * (i + 1) ** 1.4)));
    timers.current.push(setTimeout(done, 12_000)); // never stay stuck
  };

  const done = () => {
    clear();
    setWidth(100);
    timers.current.push(setTimeout(() => setVisible(false), 250));
    timers.current.push(setTimeout(() => setWidth(0), 550));
  };

  // finish when the URL changes
  useEffect(() => {
    if (visible) done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a");
      if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page / hash link
      start();
    };
    const onSubmit = (e: SubmitEvent) => {
      const f = e.target as HTMLFormElement;
      if (!e.defaultPrevented && f.method.toLowerCase() === "get" && f.action.startsWith(location.origin)) start();
    };
    window.addEventListener("click", onClick, true);
    window.addEventListener("submit", onSubmit);
    window.addEventListener(START, start);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("submit", onSubmit);
      window.removeEventListener(START, start);
      clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[110] h-[3px]">
      <div className="route-progress h-full rounded-r-full" style={{ width: `${width}%`, opacity: visible ? 1 : 0 }} />
    </div>
  );
}

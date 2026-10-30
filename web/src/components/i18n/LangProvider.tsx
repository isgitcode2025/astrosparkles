"use client";

import { useRouter, usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useMemo } from "react";
import { DEFAULT_LANG, localePath, splitLang, t, type DictKey, type Lang } from "@/lib/i18n";

const LangContext = createContext<Lang>(DEFAULT_LANG);

/** Publishes the language chosen in the URL to every client component below. */
export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const pathname = usePathname();
  const current = pathname ? splitLang(pathname).lang : lang;
  return <LangContext.Provider value={current}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

/** Translate a dictionary key in the current language. */
export function useT(): (key: DictKey) => string {
  const lang = useLang();
  return useCallback((key: DictKey) => t(lang, key), [lang]);
}

/** Prefixes a site path with the current language, for use in href props. */
export function useHref(): (href: string) => string {
  const lang = useLang();
  return useCallback((href: string) => localePath(lang, href), [lang]);
}

/**
 * The current page in another language, so the switcher keeps the reader
 * where they are instead of sending them back to the home page.
 */
export function useSwitchTo(): (target: Lang) => string {
  const pathname = usePathname() ?? "/";
  return useMemo(() => {
    const { path } = splitLang(pathname);
    return (target: Lang) => localePath(target, path);
  }, [pathname]);
}

/**
 * next/navigation's router, but push/replace keep the reader in their current
 * language. Use this instead of useRouter() for any programmatic navigation
 * to a site path (e.g. after a form submits) so "/hi/..." isn't lost.
 */
export function useLocaleRouter() {
  const router = useRouter();
  const href = useHref();
  return useMemo(
    () => ({
      ...router,
      push: (url: string, options?: Parameters<typeof router.push>[1]) => router.push(href(url), options),
      replace: (url: string, options?: Parameters<typeof router.replace>[1]) => router.replace(href(url), options),
    }),
    [router, href],
  );
}

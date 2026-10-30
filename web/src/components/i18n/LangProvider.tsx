"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useMemo } from "react";
import { DEFAULT_LANG, localePath, splitLang, t, type DictKey, type Lang } from "@/lib/i18n";

const LangContext = createContext<Lang>(DEFAULT_LANG);

/** Publishes the language chosen in the URL to every client component below. */
export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
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

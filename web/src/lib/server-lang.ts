import { headers } from "next/headers";
import { DEFAULT_LANG, isLang, type Lang } from "./i18n";

/**
 * The language for the current request, set from the URL prefix by middleware.
 * Server components and generateMetadata read it from here.
 */
export function serverLang(): Lang {
  const value = headers().get("x-lang");
  return isLang(value) ? value : DEFAULT_LANG;
}

/**
 * Language for a page that also accepts ?lang=. The URL prefix wins, so a reader
 * browsing /hi stays in Hindi; the query parameter is kept for older links.
 */
export function pageLang(query?: string): Lang {
  const fromPath = serverLang();
  if (fromPath !== DEFAULT_LANG) return fromPath;
  return isLang(query) ? query : DEFAULT_LANG;
}

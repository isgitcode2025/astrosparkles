import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LANG, splitLang } from "@/lib/i18n";

/**
 * Language lives in the URL: "/panchang" is English, "/hi/panchang" is Hindi.
 * The prefix is stripped here and passed on as the x-lang header, so every page
 * keeps a single file and both languages share one route tree.
 */
export function middleware(req: NextRequest) {
  const { lang, path } = splitLang(req.nextUrl.pathname);

  const headers = new Headers(req.headers);
  headers.set("x-lang", lang);
  headers.set("x-pathname", req.nextUrl.pathname);

  if (lang === DEFAULT_LANG) return NextResponse.next({ request: { headers } });

  const url = req.nextUrl.clone();
  url.pathname = path;
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  // everything except Next internals, the API proxy and files with an extension
  matcher: ["/((?!_next/|api/|.*\.[\w]+$).*)"],
};

"use client";

import { Link, useLang } from "@/components/i18n";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const lang = useLang();
  return (
    <div className="container-site flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="font-heading text-3xl font-bold text-brand-primary">{lang === "hi" ? "कुछ गड़बड़ हो गई" : "Something went wrong"}</h1>
      <p className="max-w-md text-brand-text/70">
        {lang === "hi" ? "कृपया पुनः प्रयास करें या होम पेज पर वापस जाएं।" : "Please try again or go back to the home page."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => reset()} className="btn-primary">
          {lang === "hi" ? "पुनः प्रयास करें" : "Try again"}
        </button>
        <Link href="/" className="btn-outline">
          {lang === "hi" ? "होम पर जाएं" : "Go home"}
        </Link>
      </div>
    </div>
  );
}

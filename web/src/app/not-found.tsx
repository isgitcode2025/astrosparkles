import { Link } from "@/components/i18n";
import { serverLang } from "@/lib/server-lang";

export default function NotFound() {
  const lang = serverLang();
  return (
    <div className="container-site flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="font-heading text-3xl font-bold text-brand-primary">{lang === "hi" ? "पेज नहीं मिला" : "Page not found"}</h1>
      <p className="max-w-md text-brand-text/70">
        {lang === "hi" ? "आप जिस पेज को खोज रहे हैं वह मौजूद नहीं है या हटा दिया गया है।" : "The page you're looking for doesn't exist or has been removed."}
      </p>
      <Link href="/" className="btn-primary">
        {lang === "hi" ? "होम पर जाएं" : "Go home"}
      </Link>
    </div>
  );
}

import { pageLang } from "@/lib/server-lang";
import type { Metadata } from "next";
import { Link } from "@/components/i18n";
import { TarotReader } from "@/components/home/TarotReader";

export const metadata: Metadata = {
  title: "Free 3-Card Tarot Reading",
  description: "Pick three cards for Past, Present and Future and read what the Major Arcana say. Free, for self-reflection.",
};

export default function TarotPage({ searchParams }: { searchParams: { lang?: string } }) {
  const lang = pageLang(searchParams.lang);
  return (
    <div className="container-site py-10">
      <TarotReader lang={lang} />
      <p className="mt-6 text-center text-sm text-slate-600">
        {lang === "hi" ? "गहराई से जानना चाहते हैं?" : "Want a deeper reading?"}{" "}
        <Link href="/astrologers?expertise=tarot-reading" className="font-semibold text-brand-primary underline">
          {lang === "hi" ? "टैरो रीडर से बात करें" : "Talk to a tarot reader"}
        </Link>
      </p>
    </div>
  );
}

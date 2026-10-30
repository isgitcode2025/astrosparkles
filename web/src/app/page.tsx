import { HomeContent } from "@/components/HomeContent";
import { serverLang } from "@/lib/server-lang";

// Live astrologer presence, horoscope and panchang: render on request (each API call has its own cache time).
export const dynamic = "force-dynamic";

export default function HomePage() {
  return <HomeContent lang={serverLang()} />;
}

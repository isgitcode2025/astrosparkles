"use client";

import { Link } from "@/components/i18n";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiRequestError, session, type Master } from "@/lib/api";
import { InfoList, ToolHero } from "@/components/site/ToolHero";
import { useAuth } from "@/components/auth/AuthProvider";
import { Btn } from "@/components/ui/Button";
import { startNavProgress } from "@/components/ui/RouteProgress";
import { Loading as SkelLoading, Skel, SkelText } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toaster";

type Mine = {
  status: "pending" | "approved" | "rejected" | "suspended";
  rejectionReason?: string;
};

const field = "field";

function Pills({ items, value, onChange }: { items: { key: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((i) => {
        const on = value.includes(i.key);
        return (
          <button
            key={i.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== i.key) : [...value, i.key])}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${on ? "bg-brand-primary text-white" : "border border-brand-border bg-white text-slate-600 hover:border-brand-saffron hover:text-brand-saffron"}`}
          >
            {i.label}
          </button>
        );
      })}
    </div>
  );
}

/** Apply to join as an astrologer. The application goes to the admin for review. */
export default function JoinAstrologerPage() {
  const router = useRouter();
  const [master, setMaster] = useState<Master | null>(null);
  const [mine, setMine] = useState<Mine | null | undefined>(undefined);
  const [form, setForm] = useState({
    displayName: "",
    gender: "male",
    bioEn: "",
    experienceYears: "",
    chat: "",
    call: "",
  });
  const [expertise, setExpertise] = useState<string[]>([]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["hi"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { status, me } = useAuth();
  useEffect(() => {
    api<Master>("/config/master")
      .then(setMaster)
      .catch(() => undefined);
  }, []);
  // follows the session: after a logout or a different login the status shown is never stale
  useEffect(() => {
    if (status === "loading") return setMine(undefined);
    if (status !== "ready") return setMine(null);
    let live = true;
    setMine(undefined);
    api<Mine>("/astrologers/me/profile", { auth: true })
      .then((m) => live && setMine(m))
      .catch(() => live && setMine(null));
    return () => {
      live = false;
    };
  }, [status, me?.id]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.get()) {
      startNavProgress();
      return router.push("/login?next=/join-astrologer");
    }
    if (!expertise.length || !concerns.length || !languages.length) return setError("Pick at least one skill, one concern and one language.");
    setBusy(true);
    setError(null);
    try {
      const r = await api<Mine>("/astrologers/apply", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          displayName: form.displayName,
          gender: form.gender,
          bioEn: form.bioEn,
          expertise,
          concerns,
          languages,
          experienceYears: Number(form.experienceYears),
          rates: {
            chat: Number(form.chat),
            call: Number(form.call || form.chat),
          },
        }),
      });
      setMine(r);
      toast.success("Application submitted. We will review it and get back to you.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not submit the application");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ToolHero
        crumbs={[["Become an astrologer"]]}
        eyebrow="Join our panel"
        title="Become a verified astrologer"
        subtitle="Share your expertise and set your own per-minute rate. Our team reviews every application before the profile goes live."
      />
      <div className="container-site relative -mt-16 grid items-start gap-6 pb-16 lg:grid-cols-[1fr_320px]">
        <div>
          {mine === undefined ? (
            <SkelLoading label="Loading" className="card space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Skel className="h-11 !rounded-xl" />
                <Skel className="h-11 !rounded-xl" />
              </div>
              <Skel className="h-28 !rounded-xl" />
              <SkelText lines={3} />
              <Skel className="h-12 !rounded-full" />
            </SkelLoading>
          ) : mine && mine.status !== "rejected" ? (
            <div className="card">
              <p className="font-semibold text-brand-primary">
                Application status: <span className="capitalize text-brand-accent">{mine.status}</span>
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {mine.status === "approved" ? "You are live. Manage your availability from the dashboard." : "We will review your profile and get back to you."}
              </p>
              {mine.status === "approved" && (
                <Link href="/astro-dashboard" className="btn-primary mt-3">
                  Open dashboard
                </Link>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="card space-y-5">
              {mine?.status === "rejected" && (
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                  Your earlier application was not approved
                  {mine.rejectionReason ? `: ${mine.rejectionReason}` : ""}. You can update and apply again.
                </p>
              )}
              {!session.get() && (
                <p className="rounded-xl bg-brand-cream/60 p-3 text-sm">
                  You will be asked to{" "}
                  <Link href="/login?next=/join-astrologer" className="font-semibold text-brand-saffron hover:underline">
                    log in with your mobile number
                  </Link>{" "}
                  before submitting.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="label">
                  Display name
                  <input
                    required
                    minLength={3}
                    maxLength={60}
                    value={form.displayName}
                    onChange={set("displayName")}
                    className={field}
                    placeholder="e.g. Acharya Mohan Tiwari"
                  />
                </label>
                <label className="label">
                  Gender
                  <select value={form.gender} onChange={set("gender")} className={field}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>
              <label className="label">
                About you (at least 50 characters)
                <textarea required minLength={50} maxLength={3000} rows={4} value={form.bioEn} onChange={set("bioEn")} className={field} />
              </label>
              <div className="label">
                Skills
                <Pills
                  items={(master?.expertise ?? []).map((x) => ({
                    key: x.slug,
                    label: x.en,
                  }))}
                  value={expertise}
                  onChange={setExpertise}
                />
              </div>
              <div className="label">
                Concerns you help with
                <Pills
                  items={(master?.concerns ?? []).map((x) => ({
                    key: x.slug,
                    label: x.en,
                  }))}
                  value={concerns}
                  onChange={setConcerns}
                />
              </div>
              <div className="label">
                Languages
                <Pills
                  items={(master?.languages ?? []).map((x) => ({
                    key: x.code,
                    label: x.en,
                  }))}
                  value={languages}
                  onChange={setLanguages}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="label">
                  Experience (years)
                  <input required type="number" min={0} max={70} value={form.experienceYears} onChange={set("experienceYears")} className={field} />
                </label>
                <label className="label">
                  Chat rate (₹/min)
                  <input required type="number" min={1} max={1000} value={form.chat} onChange={set("chat")} className={field} />
                </label>
                <label className="label">
                  Call rate (₹/min)
                  <input type="number" min={1} max={1000} value={form.call} onChange={set("call")} className={field} placeholder="Same as chat" />
                </label>
              </div>
              {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <Btn type="submit" busy={busy} busyText="Submitting…" icon="fa-paper-plane" className="btn-primary w-full">
                Submit application
              </Btn>
            </form>
          )}
        </div>
        <InfoList
          title="How it works"
          items={[
            ["fa-file-signature", "Apply", "Tell us about your practice, skills, languages and rates."],
            ["fa-user-check", "Review", "Our team checks the profile before it goes live."],
            ["fa-toggle-on", "Go online", "Switch online from your dashboard to take chat requests."],
            ["fa-calendar-days", "Open bookable hours", "Set weekly hours so users can pre-book paid sessions."],
            ["fa-indian-rupee-sign", "Earn", "You keep your share of every paid minute and gift, after the platform commission."],
          ]}
        />
      </div>
    </>
  );
}

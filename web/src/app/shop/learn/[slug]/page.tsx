"use client";

import { Link, useLang } from "@/components/i18n";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/AuthProvider";
import { Btn } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { toast } from "@/components/ui/Toaster";
import { api, ApiRequestError } from "@/lib/api";
import { LearnSkeleton } from "@/components/ui/AppSkeletons";

type Lesson = {
  id: string;
  title: string;
  durationMinutes: number;
  videoUrl: string | null;
  notes: string | null;
  completed: boolean;
};
type Course = { title: string; slug: string; lessons: Lesson[] };

/** YouTube / Vimeo links become embeds; anything else plays as a normal video file. */
function Player({ url, lang }: { url: string | null; lang: "en" | "hi" }) {
  if (!url)
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-black/80 text-white/70">
        {lang === "hi" ? "वीडियो जल्द जोड़ा जाएगा" : "Video will be added soon"}
      </div>
    );
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  const src = yt ? `https://www.youtube-nocookie.com/embed/${yt[1]}` : vimeo ? `https://player.vimeo.com/video/${vimeo[1]}` : null;
  return src ? (
    <iframe
      src={src}
      className="aspect-video w-full rounded-xl"
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      title={lang === "hi" ? "पाठ वीडियो" : "Lesson video"}
    />
  ) : (
    <video src={url} controls controlsList="nodownload" className="aspect-video w-full rounded-xl bg-black" />
  );
}

function Learn() {
  const lang = useLang();
  const { slug } = useParams<{ slug: string }>();
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [course, setCourse] = useState<Course | null>(null);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    api<Course>(`/shop/courses/${slug}/learn`, { auth: true })
      .then((c) => {
        setCourse(c);
        const next = c.lessons.findIndex((l) => !l.completed);
        setCurrent(next >= 0 ? next : 0);
      })
      .catch((e) => setError(e instanceof ApiRequestError ? e.message : lang === "hi" ? "कोर्स लोड नहीं हो सका" : "Could not load the course"));
  }, [slug, attempt, lang]);

  const toggle = async (l: Lesson) => {
    setSaving(true);
    try {
      await api(`/shop/courses/${slug}/progress`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ lessonId: l.id, completed: !l.completed }),
      });
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.message : lang === "hi" ? "आपकी प्रगति सहेजी नहीं जा सकी" : "Could not save your progress");
      return;
    } finally {
      setSaving(false);
    }
    if (!l.completed) toast.success(lang === "hi" ? "पाठ पूर्ण के रूप में चिह्नित किया गया।" : "Lesson marked as complete.");
    setCourse((c) =>
      c
        ? {
            ...c,
            lessons: c.lessons.map((x) => (x.id === l.id ? { ...x, completed: !x.completed } : x)),
          }
        : c,
    );
  };

  if (error)
    return (
      <div className="mx-auto max-w-xl space-y-3 px-4 py-16 text-center">
        <ErrorState lang={lang} title={lang === "hi" ? "यह कोर्स नहीं खुल सका" : "Could not open this course"} text={error} onRetry={() => setAttempt((a) => a + 1)} />
        <Link href={`/shop/${slug}`} className="inline-block text-sm font-semibold text-brand-saffron hover:underline">
          {lang === "hi" ? "कोर्स पेज पर जाएं" : "Go to the course page"}
        </Link>
      </div>
    );
  if (!course) return <LearnSkeleton />;

  const lesson = course.lessons[current];
  const done = course.lessons.filter((l) => l.completed).length;

  return (
    <div className="container-site grid gap-6 py-8 lg:grid-cols-3">
      <section className="space-y-4 lg:col-span-2">
        <h1 className="text-2xl font-bold text-brand-primary">{course.title}</h1>
        {lesson && (
          <>
            <Player url={lesson.videoUrl} lang={lang} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-lg font-bold text-brand-primary">
                {current + 1}. {lesson.title}
              </h2>
              <Btn
                onClick={() => toggle(lesson)}
                busy={saving}
                busyText={lang === "hi" ? "सहेजा जा रहा है…" : "Saving…"}
                className={lesson.completed ? "btn-outline px-4 py-1.5 text-sm" : "btn-primary px-4 py-1.5 text-sm"}
              >
                {lesson.completed ? (lang === "hi" ? "पूर्ण ✓" : "Completed ✓") : lang === "hi" ? "पूर्ण के रूप में चिह्नित करें" : "Mark as complete"}
              </Btn>
            </div>
            {lesson.notes && <p className="card whitespace-pre-line text-sm">{lesson.notes}</p>}
          </>
        )}
      </section>
      <aside className="card h-fit">
        <p className="text-sm text-slate-500">
          {lang === "hi" ? (
            <>
              {course.lessons.length} में से {done} पाठ पूर्ण
            </>
          ) : (
            <>
              {done} of {course.lessons.length} lessons done
            </>
          )}
        </p>
        <ol className="mt-3 space-y-1">
          {course.lessons.map((l, i) => (
            <li key={l.id}>
              <button
                onClick={() => setCurrent(i)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${i === current ? "bg-brand-primary text-white" : "hover:bg-brand-cream/60"}`}
              >
                <span>
                  {i + 1}. {l.title}
                </span>
                {l.completed && <span className={i === current ? "text-white" : "text-green-600"}>✓</span>}
              </button>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}

export default function LearnPage() {
  return (
    <RequireAuth skeleton={<LearnSkeleton />}>
      <Learn />
    </RequireAuth>
  );
}

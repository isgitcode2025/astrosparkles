"use client";

import { Link } from "@/components/i18n";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RequireAuth } from "@/components/auth/AuthProvider";
import { Btn } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { toast } from "@/components/ui/Toaster";
import { api, ApiRequestError, type ChatMessage, type Consultation } from "@/lib/api";
import { getSocket, type Ack } from "@/lib/socket";
import { ChatSkeleton } from "@/components/ui/AppSkeletons";

const fmt = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const endedText: Record<string, string> = {
  rejected: "The astrologer could not take this consultation. You were not charged.",
  missed: "The astrologer did not respond in time. You were not charged.",
  cancelled: "You cancelled this request. You were not charged.",
};

function ConsultationRoom() {
  const { id } = useParams<{ id: string }>();
  const [c, setC] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [now, setNow] = useState(Date.now());
  const [typing, setTyping] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const bottom = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();

  const role = c?.myRole ?? "user";
  const otherName = role === "user" ? c?.astrologerName : c?.userName || "User";

  const addMessage = useCallback((m: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((p) => p.id === m.id)) return prev;
      const i = m.clientId ? prev.findIndex((p) => p.clientId === m.clientId && p.id.startsWith("tmp_")) : -1;
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = m;
        return copy;
      }
      return [...prev, m];
    });
  }, []);

  // connect, join the room and keep state in sync
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    // show a retry option if the live connection cannot be made
    const slowTimer = setTimeout(() => setSlow(true), 10_000);

    const join = () =>
      socket.emit("consultation:join", { consultationId: id }, (ack: Ack<{ consultation: Consultation; messages: ChatMessage[] }>) => {
        clearTimeout(slowTimer);
        setSlow(false);
        if (!ack.ok) return setError(ack.error);
        setError(null);
        setC(ack.data.consultation);
        setMessages(ack.data.messages);
      });

    const onUpdated = (u: Consultation) => u.id === id && setC((prev) => ({ ...u, myRole: prev?.myRole ?? u.myRole }));
    const onMessage = (m: ChatMessage) => m.consultationId === id && addMessage(m);
    const onTyping = (t: { consultationId: string }) => {
      if (t.consultationId !== id) return;
      setTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 2500);
    };
    const onWarning = (w: { consultationId: string; message: string }) => w.consultationId === id && setWarning(w.message);

    socket.on("connect", join);
    socket.on("consultation:updated", onUpdated);
    socket.on("message:new", onMessage);
    socket.on("typing", onTyping);
    socket.on("consultation:warning", onWarning);
    if (socket.connected) join();

    return () => {
      clearTimeout(slowTimer);
      socket.off("connect", join);
      socket.off("consultation:updated", onUpdated);
      socket.off("message:new", onMessage);
      socket.off("typing", onTyping);
      socket.off("consultation:warning", onWarning);
    };
  }, [id, addMessage, attempt]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // keep the newest message in view by scrolling only the message list, not the whole page
  useEffect(() => {
    const list = bottom.current?.parentElement;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, typing]);

  const timing = useMemo(() => {
    if (!c?.startedAt) return null;
    // clamp: "now" may be a tick older than startedAt, or the PC clock slightly behind the server
    const elapsed = Math.max(0, (Math.max(now, Date.now()) - new Date(c.startedAt).getTime()) / 1000);
    const remaining = c.maxMinutes * 60 - elapsed;
    const freeLeft = c.freeMinutes * 60 - elapsed;
    return { elapsed, remaining, freeLeft };
  }, [c, now]);

  const waitLeft = c?.status === "requested" ? Math.max(0, 60 - (now - new Date(c.requestedAt).getTime()) / 1000) : 0;

  const send = () => {
    const socket = getSocket();
    const clean = text.trim();
    if (!socket || !clean || c?.status !== "active") return;
    const clientId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    addMessage({
      id: `tmp_${clientId}`,
      consultationId: id,
      sender: role,
      text: clean,
      clientId,
      createdAt: new Date().toISOString(),
    });
    setText("");
    socket.emit("message:send", { consultationId: id, text: clean, clientId }, (ack: Ack<ChatMessage>) => {
      if (ack.ok) addMessage(ack.data);
      else setError(ack.error);
    });
  };

  const onType = (v: string) => {
    setText(v);
    getSocket()?.emit("typing", { consultationId: id });
  };

  const act = async (path: "end" | "cancel" | "accept" | "reject") => {
    setError(null);
    setBusy(path);
    try {
      const u = await api<Consultation>(`/consultations/${id}/${path}`, {
        method: "POST",
        auth: true,
        body: path === "end" ? "{}" : undefined,
      });
      setC((prev) => ({ ...u, myRole: prev?.myRole }));
      if (path === "end") toast.success("Consultation ended.");
      if (path === "cancel") toast.info("Request cancelled. You were not charged.");
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const submitReview = async () => {
    setBusy("review");
    try {
      await api(`/consultations/${id}/review`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ rating, comment: comment || undefined }),
      });
      setReviewed(true);
      toast.success("Thank you! Your review is published.");
    } catch (e) {
      toast.error(e instanceof ApiRequestError ? e.message : "Could not submit review");
    } finally {
      setBusy(null);
    }
  };

  if (error && !c) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <ErrorState title="Could not open this consultation" text={error} onRetry={() => setAttempt((a) => a + 1)} />
      </div>
    );
  }
  if (!c && slow)
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <ErrorState title="Connecting is taking longer than usual" onRetry={() => (setSlow(false), setAttempt((a) => a + 1))} />
      </div>
    );
  if (!c) return <ChatSkeleton />;

  return (
    <div className="container-site grid gap-5 py-6 lg:grid-cols-3">
      <section className="flex h-[calc(100vh-11rem)] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-elevated lg:col-span-2">
        {/* header */}
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-brand-indigo to-brand-midnight px-4 py-3 text-white sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-brand-gold bg-white/10 font-heading font-bold">
              {(otherName ?? "?").charAt(0)}
              {c.status === "active" && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-brand-indigo bg-emerald-400" />}
            </span>
            <div className="min-w-0">
              <p className="truncate font-heading font-bold">{otherName}</p>
              <p className="text-xs text-white/70">
                {c.status === "active"
                  ? typing
                    ? "typing…"
                    : c.prepaid
                      ? "Scheduled session"
                      : "In consultation"
                  : c.status === "requested"
                    ? "Waiting to accept"
                    : `Consultation ${c.status}`}
              </p>
            </div>
          </div>
          {c.status === "active" && timing && (
            <div className="ml-auto rounded-xl bg-white/10 px-3 py-1.5 text-right text-sm ring-1 ring-white/15">
              <p className="font-mono text-lg font-bold leading-tight">{fmt(timing.elapsed)}</p>
              <p className="text-[11px] text-white/70">
                {c.prepaid
                  ? `Prepaid · ${fmt(timing.remaining)} left`
                  : timing.freeLeft > 0
                    ? `Free for ${fmt(timing.freeLeft)}`
                    : `₹${c.ratePerMin}/min · ${fmt(timing.remaining)} left`}
              </p>
            </div>
          )}
          {c.status === "active" && (
            <Btn busy={busy === "end"} busyText="Ending…" onClick={() => act("end")} className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white shadow hover:bg-red-600">
              End
            </Btn>
          )}
        </div>

        {warning && c.status === "active" && role === "user" && (
          <p className="bg-amber-50 px-5 py-2 text-sm text-amber-800">
            {warning}{" "}
            <Link href="/wallet" target="_blank" className="font-semibold underline">
              Recharge
            </Link>
          </p>
        )}

        {/* body */}
        <div className="flex-1 space-y-2.5 overflow-y-auto bg-[#fbf7f2] px-4 py-4 sm:px-5">
          {c.status === "requested" && (
            <div className="mx-auto mt-10 max-w-sm text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
              {role === "user" ? (
                <>
                  <p className="mt-4 font-heading font-bold text-brand-indigo">Waiting for {c.astrologerName} to accept…</p>
                  <p className="mt-1 text-sm text-slate-500">This usually takes under a minute ({Math.ceil(waitLeft)}s).</p>
                  <Btn busy={busy === "cancel"} busyText="Cancelling…" onClick={() => act("cancel")} className="btn-outline mt-5">
                    Cancel request
                  </Btn>
                </>
              ) : (
                <>
                  <p className="mt-4 font-heading font-bold text-brand-indigo">
                    {c.userName || "A user"} wants to {c.mode}
                  </p>
                  <div className="mt-5 flex justify-center gap-3">
                    <Btn busy={busy === "accept"} busyText="Accepting…" disabled={!!busy} onClick={() => act("accept")} className="btn-primary">
                      Accept
                    </Btn>
                    <Btn busy={busy === "reject"} busyText="Declining…" disabled={!!busy} onClick={() => act("reject")} className="btn-outline">
                      Decline
                    </Btn>
                  </div>
                </>
              )}
            </div>
          )}

          {endedText[c.status] && <p className="mx-auto mt-10 max-w-sm text-center text-slate-600">{endedText[c.status]}</p>}

          {messages.map((m) =>
            m.sender === "system" ? (
              <p key={m.id} className="mx-auto max-w-md rounded-full bg-white px-3 py-1 text-center text-xs text-slate-500 ring-1 ring-brand-border">
                {m.text}
              </p>
            ) : (
              <div key={m.id} className={`flex ${m.sender === role ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    m.sender === role ? "rounded-br-sm bg-brand-indigo text-white" : "rounded-bl-sm bg-white text-slate-800 ring-1 ring-brand-border"
                  } ${m.id.startsWith("tmp_") ? "opacity-60" : ""}`}
                >
                  {m.text}
                  <span className={`mt-0.5 block text-right text-[10px] ${m.sender === role ? "text-white/60" : "text-slate-400"}`}>
                    {new Date(m.createdAt).toLocaleTimeString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ),
          )}
          <div ref={bottom} />
        </div>

        {/* composer */}
        {c.status === "active" && (
          <form
            className="flex gap-2 border-t border-brand-border bg-white p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              value={text}
              onChange={(e) => onType(e.target.value)}
              maxLength={4000}
              placeholder="Type your message"
              className="flex-1 rounded-full border border-brand-border bg-brand-cream/40 px-4 py-2.5 text-sm outline-none focus:border-brand-saffron focus:ring-2 focus:ring-brand-saffron/20"
            />
            <button type="submit" disabled={!text.trim()} aria-label="Send" className="btn-primary px-5">
              <i className="fa-solid fa-paper-plane" aria-hidden />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        )}
        {error && <p className="bg-red-50 px-5 py-2 text-sm text-red-700">{error}</p>}
      </section>

      {/* side panel */}
      <aside className="space-y-4">
        {(c.status === "active" || c.status === "requested") && (
          <div className="card text-sm">
            <h2 className="font-heading font-bold text-brand-primary">This session</h2>
            <ul className="mt-3 space-y-2 text-slate-600">
              <li className="flex gap-2">
                <i className="fa-solid fa-comments mt-0.5 text-brand-saffron" aria-hidden />
                <span className="capitalize">{c.mode}</span>
                {c.prepaid ? " · scheduled, prepaid" : ` · ₹${c.ratePerMin}/min`}
              </li>
              {c.freeMinutes > 0 && (
                <li className="flex gap-2">
                  <i className="fa-solid fa-gift mt-0.5 text-brand-saffron" aria-hidden />
                  First {c.freeMinutes} minutes free
                </li>
              )}
              <li className="flex gap-2">
                <i className="fa-solid fa-clock mt-0.5 text-brand-saffron" aria-hidden />
                Up to {c.maxMinutes} min {c.prepaid ? "in this slot" : "with your balance"}
              </li>
              <li className="flex gap-2">
                <i className="fa-solid fa-user-shield mt-0.5 text-brand-saffron" aria-hidden />
                Chats are private to you and your {role === "user" ? "astrologer" : "client"}. Do not share phone numbers or payment details here.
              </li>
            </ul>
          </div>
        )}
        {role === "astrologer" && c.intake && (
          <div className="card text-sm">
            <h2 className="font-heading font-bold text-brand-primary">User details</h2>
            <dl className="mt-2 space-y-1 text-slate-700">
              <div>Name: {c.intake.name || "—"}</div>
              <div>Gender: {c.intake.gender || "—"}</div>
              <div>Date of birth: {c.intake.birth?.dateOfBirth || "—"}</div>
              <div>Time of birth: {c.intake.birth?.timeOfBirth || "—"}</div>
              <div>Place of birth: {c.intake.birth?.place || "—"}</div>
              {c.intake.topic && <div>Question: {c.intake.topic}</div>}
            </dl>
          </div>
        )}

        {c.status === "completed" && (
          <div className="card text-sm">
            <h2 className="font-heading font-bold text-brand-primary">Summary</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-brand-cream/60 p-3">
                <dt className="text-xs text-slate-500">Duration</dt>
                <dd className="font-heading text-lg font-bold text-brand-indigo">{c.billedMinutes} min</dd>
              </div>
              <div className="rounded-xl bg-brand-cream/60 p-3">
                <dt className="text-xs text-slate-500">{role === "user" ? (c.prepaid ? "Prepaid" : "Charged") : "Your earning"}</dt>
                <dd className="font-heading text-lg font-bold text-brand-indigo">₹{role === "user" ? c.amount : c.astrologerEarning}</dd>
              </div>
            </dl>
            {role === "user" && !c.review && !reviewed && (
              <div className="mt-4">
                <p className="font-semibold text-brand-indigo">Rate {c.astrologerName}</p>
                <div className="mt-1 flex gap-1 text-2xl">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`} className={n <= rating ? "text-brand-accent" : "text-slate-200"}>
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Share your experience (optional)"
                  className="field"
                />
                <Btn onClick={submitReview} busy={busy === "review"} busyText="Submitting…" disabled={rating === 0} className="btn-primary mt-3">
                  Submit review
                </Btn>
              </div>
            )}
            {(reviewed || c.review) && <p className="mt-3 text-emerald-700">Thanks for your feedback.</p>}
          </div>
        )}

        {c.status !== "active" && c.status !== "requested" && (
          <Link href={role === "user" ? "/astrologers" : "/astro-dashboard"} className="btn-outline w-full">
            {role === "user" ? "Talk to another astrologer" : "Back to dashboard"}
          </Link>
        )}
      </aside>
    </div>
  );
}

export default function ConsultationRoomPage() {
  return (
    <RequireAuth skeleton={<ChatSkeleton />}>
      <ConsultationRoom />
    </RequireAuth>
  );
}

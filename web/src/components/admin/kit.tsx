"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { api, ApiRequestError, type Paged } from "@/lib/api";
import { Btn } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Loading as SkelLoading, SkelTable } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toaster";

export const inr = (n: number) =>
  `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export const when = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";
export const day = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export const input =
  "rounded-xl border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-saffron focus:ring-2 focus:ring-brand-saffron/20";
export const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
export const btnPrimary = `${btn} bg-brand-saffron text-white hover:bg-brand-saffronHover`;
export const btnDark = `${btn} bg-brand-indigo text-white hover:bg-brand-midnight`;
export const btnGhost = `${btn} border border-brand-border bg-white text-slate-700 hover:border-brand-saffron hover:text-brand-saffron`;
export const btnDanger = `${btn} border border-red-200 bg-white text-red-600 hover:bg-red-50`;

/** Loads a paged admin list; re-fetches when the query string changes. */
export function useAdminList<T>(
  path: string,
  params: Record<string, string | number | undefined>,
) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "") as [
      string,
      string,
    ][],
  ).toString();
  const [data, setData] = useState<Paged<T> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(() => {
    setError(null);
    api<Paged<T>>(`${path}${qs ? `?${qs}` : ""}`, { auth: true })
      .then(setData)
      .catch((e) =>
        setError(e instanceof ApiRequestError ? e.message : "Could not load"),
      );
  }, [path, qs]);
  useEffect(() => {
    setData(null);
    reload();
  }, [reload]);
  return { data, error, reload };
}

export function AdminTitle({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-brand-indigo sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-brand-border bg-white shadow-soft ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-brand-border px-5 py-3.5">
          {title && (
            <h2 className="font-heading text-base font-bold text-brand-indigo">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Tabs<K extends string>({
  value,
  onChange,
  options,
}: {
  value: K;
  onChange: (k: K) => void;
  options: [K, string][];
}) {
  return (
    <div className="mb-4">
      <div className="thin-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-brand-border bg-white p-1 text-sm font-semibold">
        {options.map(([k, label]) => (
          <button
            key={k || "all"}
            type="button"
            onClick={() => onChange(k)}
            aria-pressed={value === k}
            className={`shrink-0 rounded-full px-3.5 py-1.5 transition-colors ${value === k ? "bg-brand-indigo text-white" : "text-slate-600 hover:text-brand-indigo"}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Table with consistent styling; pass header labels and rows. */
export function Table({
  head,
  children,
  empty,
  minWidth = 720,
}: {
  head: string[];
  children: ReactNode;
  empty?: boolean;
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className="bg-brand-cream/60 text-[11px] uppercase tracking-wider text-slate-500">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-4 py-2.5 font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border">{children}</tbody>
      </table>
      {empty && (
        <p className="px-5 py-10 text-center text-sm text-slate-500">
          Nothing here yet.
        </p>
      )}
    </div>
  );
}
export const td = "px-4 py-3 align-top";

export function Pager({
  page,
  total,
  limit,
  onPage,
}: {
  page: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex items-center justify-between gap-3 border-t border-brand-border px-5 py-3 text-sm text-slate-500">
      <span>
        {total.toLocaleString("en-IN")} total · page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className={btnGhost}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Prev
        </button>
        <button
          type="button"
          className={btnGhost}
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

/** Table shimmer while a list loads, or an error with Retry. */
export function Loading({ error, onRetry, rows = 6, cols = 5 }: { error?: string | null; onRetry?: () => unknown; rows?: number; cols?: number }) {
  if (error)
    return (
      <div className="p-5">
        <ErrorState compact text={error} onRetry={onRetry} />
      </div>
    );
  return (
    <SkelLoading label="Loading">
      <SkelTable rows={rows} cols={cols} />
    </SkelLoading>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-elevated"
      >
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-3.5">
          <h2 className="font-heading text-base font-bold text-brand-indigo">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/**
 * Runs one admin action at a time. `run(fn, okText, key)` marks `key` as busy (so only the
 * clicked button spins), shows `okText` as a toast on success, and keeps the error in `msg`
 * (shown inside modals by <Flash>) as well as a toast.
 */
export function useAction() {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = async (fn: () => Promise<unknown>, ok?: string, key = "default") => {
    setBusyKey(key);
    setMsg(null);
    try {
      await fn();
      if (ok) toast.success(ok);
      return true;
    } catch (e) {
      const text = e instanceof ApiRequestError ? e.message : "Something went wrong";
      setMsg({ ok: false, text });
      toast.error(text);
      return false;
    } finally {
      setBusyKey(null);
    }
  };
  return { busy: busyKey !== null, is: (key: string) => busyKey === key, msg, setMsg, run };
}

/** Error line inside a modal (success messages are toasts). */
export function Flash({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg || msg.ok) return null;
  return <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{msg.text}</p>;
}

export { Btn };

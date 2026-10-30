"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Spinner({ className = "" }: { className?: string }) {
  return <i className={`fa-solid fa-circle-notch animate-spin ${className}`} aria-hidden />;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Shows a spinner, swaps the label and blocks clicks while true. */
  busy?: boolean;
  busyText?: ReactNode;
  /** Font Awesome icon class shown before the label (replaced by the spinner while busy). */
  icon?: string;
};

/**
 * Button with a built-in working state. While `busy` the icon becomes a spinner, the label
 * changes to `busyText`, the button is disabled (no double clicks) and screen readers hear it.
 */
export function Btn({ busy = false, busyText, icon, children, disabled, className = "btn-primary", type = "button", ...rest }: Props) {
  return (
    <button type={type} disabled={disabled || busy} aria-busy={busy || undefined} className={`${className} ${busy ? "cursor-wait" : ""}`} {...rest}>
      {busy ? <Spinner /> : icon ? <i className={`fa-solid ${icon}`} aria-hidden /> : null}
      <span>{busy && busyText ? busyText : children}</span>
    </button>
  );
}

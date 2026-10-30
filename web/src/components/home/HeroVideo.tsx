"use client";

import { useEffect, useRef } from "react";
import { FIG } from "./fig";

/**
 * Animated celestial chart behind the hero title (replaces the still mandala).
 * Muted, looping and inline so it autoplays on phones; it stays on the still frame
 * for visitors who ask their device to reduce motion.
 */
export function HeroVideo({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (mq.matches) {
        v.pause();
      } else {
        v.play().catch(() => {});
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <video
      ref={ref}
      aria-hidden
      tabIndex={-1}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      poster={`${FIG}/hero-celestial.jpg`}
      width={1280}
      height={720}
      className={`pointer-events-none select-none mix-blend-multiply ${className}`}
    >
      <source src={`${FIG}/hero-celestial.webm`} type="video/webm" />
      <source src={`${FIG}/hero-celestial.mp4`} type="video/mp4" />
    </video>
  );
}

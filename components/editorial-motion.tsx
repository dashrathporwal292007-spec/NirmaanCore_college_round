"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Decorative motion only: never intercepts scrolling or pointer actions. */
export function EditorialMotion() {
  const path = usePathname();
  const dot = useRef<HTMLSpanElement>(null);
  const ring = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(
        "main .section, main .receipt, main .run-index, main .rule-list, main .live-columns",
      ),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("scroll-visible");
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.06 },
    );
    elements.forEach((el) => {
      el.classList.add("scroll-reveal");
      observer.observe(el);
    });
    let frame = 0;
    const heading = document.querySelector<HTMLElement>("main h1");
    const update = () => {
      frame = 0;
      heading?.style.setProperty(
        "--scroll-heading",
        `${Math.min(scrollY * 0.07, 28)}px`,
      );
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const disable = () => {
      if (preference.matches) {
        elements.forEach((el) => el.classList.remove("scroll-reveal"));
        heading?.style.removeProperty("--scroll-heading");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    preference.addEventListener("change", disable);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      preference.removeEventListener("change", disable);
      elements.forEach((el) =>
        el.classList.remove("scroll-reveal", "scroll-visible"),
      );
      heading?.style.removeProperty("--scroll-heading");
    };
  }, [path]);

  useEffect(() => {
    const allowed = matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    let stop = () => {};
    const start = () => {
      stop();
      if (!allowed.matches) return;
      let x = 0,
        y = 0,
        rx = 0,
        ry = 0,
        frame = 0,
        active = false;
      const hide = () => {
        active = false;
        document.documentElement.classList.remove("editorial-pointer");
      };
      const move = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        x = event.clientX;
        y = event.clientY;
        if (!active) {
          rx = x;
          ry = y;
        }
        const target = event.target instanceof Element ? event.target : null;
        // Native caret, native form feedback and iframe boundaries stay intact.
        active = !target?.closest("input, textarea, select, iframe");
        document.documentElement.classList.toggle("editorial-pointer", active);
        ring.current?.classList.toggle(
          "pointer-interactive",
          !!target?.closest("a, button, summary"),
        );
      };
      const draw = () => {
        rx += (x - rx) * 0.16;
        ry += (y - ry) * 0.16;
        const dx = x - rx,
          dy = y - ry;
        const stretch = Math.min(Math.hypot(dx, dy) / 180, 0.35);
        if (dot.current)
          dot.current.style.transform = `translate3d(${x}px,${y}px,0)`;
        if (ring.current)
          ring.current.style.transform = `translate3d(${rx}px,${ry}px,0) rotate(${Math.atan2(dy, dx)}rad) scale(${1 + stretch},${1 - stretch * 0.5})`;
        frame = requestAnimationFrame(draw);
      };
      window.addEventListener("pointermove", move, { passive: true });
      document.addEventListener("pointerleave", hide);
      window.addEventListener("blur", hide);
      window.addEventListener("keydown", hide);
      frame = requestAnimationFrame(draw);
      stop = () => {
        cancelAnimationFrame(frame);
        hide();
        window.removeEventListener("pointermove", move);
        document.removeEventListener("pointerleave", hide);
        window.removeEventListener("blur", hide);
        window.removeEventListener("keydown", hide);
      };
    };
    start();
    allowed.addEventListener("change", start);
    return () => {
      stop();
      allowed.removeEventListener("change", start);
    };
  }, []);
  return (
    <>
      <span ref={dot} className="pointer-dot" aria-hidden="true" />
      <span ref={ring} className="pointer-ring" aria-hidden="true" />
    </>
  );
}

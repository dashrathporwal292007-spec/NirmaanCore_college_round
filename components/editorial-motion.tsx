"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

/** Decorative motion only: never intercepts scrolling or pointer actions. */
export function EditorialMotion() {
  const path = usePathname();
  const [cursorHost, setCursorHost] = useState<Element | null>(null);
  useEffect(() => {
    const sync = () => setCursorHost(document.querySelector("dialog[open]"));
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["open"],
      childList: true,
      subtree: true,
    });
    sync();
    return () => observer.disconnect();
  }, [path]);
  const dot = useRef<HTMLSpanElement>(null);
  const ring = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let stop = () => {};
    const start = () => {
      stop();
      if (preference.matches) return;
      const elements = new Set<HTMLElement>();
      let frame = 0,
        scanFrame = 0;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries)
            if (entry.isIntersecting) {
              entry.target.classList.add("scroll-visible");
            } else if (entry.boundingClientRect.top > innerHeight) {
              // Re-entering from below replays the reveal; content above stays readable.
              entry.target.classList.remove("scroll-visible");
            }
        },
        { threshold: 0, rootMargin: "0px 0px -48px 0px" },
      );
      const scan = () => {
        scanFrame = 0;
        document
          .querySelectorAll<HTMLElement>(
            "main .scroll-territory, main .section, main .receipt, main .command, main .list-row, main .contact-table tbody tr, main .rules-index > details, main .live-columns, main .rule-stages, main .timeline-spine > li, main .analytics-ledger > div, main form",
          )
          .forEach((el) => {
            if (elements.has(el)) return;
            // Avoid stacking reveals on a parent and its children.
            if (el.classList.contains("scroll-territories") || el.classList.contains("home-territories")) return;
            if (el.parentElement?.closest(".scroll-reveal")) return;
            elements.add(el);
            el.classList.add("scroll-reveal");
            observer.observe(el);
          });
      };
      scan();
      // API responses insert content after route entry; observe those too.
      const mutations = new MutationObserver(() => {
        if (!scanFrame) scanFrame = requestAnimationFrame(scan);
      });
      mutations.observe(document.body, { childList: true, subtree: true });
      const update = () => {
        frame = 0;
        document.querySelectorAll<HTMLElement>(".zoom-scene").forEach((el) => {
          const box = el.getBoundingClientRect();
          const progress = Math.max(0, Math.min(1, -box.top / Math.max(1, box.height - innerHeight)));
          el.style.setProperty("--scene-progress", String(progress));
          el.style.setProperty("--scene-rotation", `${(1 - progress) * -5}deg`);
          el.querySelectorAll<HTMLElement>(".zoom-line").forEach((line, index) => {
            const reveal = Math.max(0, Math.min(1, (progress - .12 - index * .16) / .18));
            line.style.opacity = String(reveal);
            line.style.transform = `translateY(${(1 - reveal) * 48}px)`;
          });
        });
        document.querySelectorAll<HTMLElement>("main h1, main .scroll-territory").forEach((el) => {
          const box = el.getBoundingClientRect();
          const progress = Math.max(0, Math.min(1, (innerHeight - box.top) / (innerHeight + box.height)));
          el.style.setProperty("--scene-scale", String(1.08 - progress * 0.12));
          el.style.setProperty("--title-progress", String(progress));
          el.style.setProperty("--title-art-scale", String(1.16 - progress * .16));
          el.style.setProperty("--art-scale", String(1.22 - progress * 0.22));
          el.style.setProperty("--art-shift", `${(progress - .5) * 48}px`);
        });
        document
          .querySelector<HTMLElement>("main h1")
          ?.style.setProperty(
            "--scroll-heading",
            `${Math.min(scrollY * 0.1, 48)}px`,
          );
      };
      const onScroll = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      update();
      stop = () => {
        observer.disconnect();
        mutations.disconnect();
        cancelAnimationFrame(frame);
        cancelAnimationFrame(scanFrame);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        document.querySelectorAll<HTMLElement>("main h1, main .scroll-territory").forEach((el) => {
          ["--scene-scale", "--art-scale", "--art-shift", "--title-progress", "--title-art-scale"].forEach((name) => el.style.removeProperty(name));
        });
        document.querySelectorAll<HTMLElement>(".zoom-scene").forEach((el) => {
          el.style.removeProperty("--scene-progress");
          el.style.removeProperty("--scene-rotation");
          el.querySelectorAll<HTMLElement>(".zoom-line").forEach((line) => {
            line.style.removeProperty("opacity");
            line.style.removeProperty("transform");
          });
        });
        elements.forEach((el) =>
          el.classList.remove("scroll-reveal", "scroll-visible"),
        );
        document
          .querySelector<HTMLElement>("main h1")
          ?.style.removeProperty("--scroll-heading");
      };
    };
    start();
    preference.addEventListener("change", start);
    return () => {
      stop();
      preference.removeEventListener("change", start);
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
      window.addEventListener("pointermove", move, { passive: true, capture: true });
      document.addEventListener("pointerleave", hide);
      window.addEventListener("blur", hide);
      window.addEventListener("keydown", hide);
      const restore = () => {
        cancelAnimationFrame(frame);
        hide();
        frame = requestAnimationFrame(draw);
      };
      window.addEventListener("pageshow", restore);
      frame = requestAnimationFrame(draw);
      stop = () => {
        window.removeEventListener("pageshow", restore);
        cancelAnimationFrame(frame);
        hide();
        window.removeEventListener("pointermove", move, true);
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
  }, [path, cursorHost]);
  const cursor = (
    <>
      <span ref={dot} className="pointer-dot" aria-hidden="true" />
      <span ref={ring} className="pointer-ring" aria-hidden="true" />
    </>
  );
  return cursorHost ? createPortal(cursor, cursorHost) : cursor;
}

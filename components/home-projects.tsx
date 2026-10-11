"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
const items = [
  { title: "Live view", slug: "live", description: "Watch a customer act, a rule fire and the business correct itself." },
  { title: "Contacts", slug: "contacts", description: "Follow every customer through a timeline of recorded decisions." },
  { title: "Webinars", slug: "webinars", description: "Bring people together, then review the next action." },
  { title: "Runs", slug: "runs", description: "Every approved action leaves a receipt. Review what can be rewound." },
];
export function HomeProjects() {
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);
  const scene = useRef<HTMLElement>(null);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      setReduced(preference.matches);
      const el = scene.current;
      if (!el || preference.matches) return;
      const box = el.getBoundingClientRect();
      const progress = Math.max(0, Math.min(.999, -box.top / Math.max(1, box.height - innerHeight)));
      setActive(Math.floor(progress * items.length));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    preference.addEventListener("change", schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); preference.removeEventListener("change", schedule); };
  }, []);
  return <section ref={scene} className={`section home-projects scroll-projects ${reduced ? "static-projects" : ""}`} aria-label="Workspace highlights">
    <div className="project-pin">
    <h2>The work.<br /><em>In motion.</em></h2>
    <div className="project-window">
      <div className="project-track" style={{ transform: `translateX(-${active * 100}%)` }}>
        {items.map((item, i) => <article className="project-slide" key={item.slug} inert={!reduced && i !== active} aria-hidden={!reduced && i !== active}>
          {/* Original local illustration; no reference brand assets. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/menu/${item.slug}.svg`} alt="" width={800} height={1000} />
          <div className="project-copy"><span>{String(i + 1).padStart(2, "0")} / Workspace</span><h3>{item.title}</h3><p>{item.description}</p><Link href={`/${item.slug}`}>Open {item.title}</Link></div>
        </article>)}
      </div>
    </div>
    <div className="project-progress" aria-hidden="true">{items.map((item,i)=><span key={item.slug} className={active===i ? "is-active" : ""}>{String(i+1).padStart(2,"0")}</span>)}</div>
    <p className="project-announcement" aria-live="polite">{String(active+1).padStart(2,"0")} · {items[active].title}</p>
    </div>
  </section>;
}

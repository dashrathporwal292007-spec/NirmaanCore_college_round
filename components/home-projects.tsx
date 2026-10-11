"use client";
import { useState } from "react";
import Link from "next/link";
const items = [
  { title: "Live view", slug: "live", description: "Watch a customer act, a rule fire and the business correct itself." },
  { title: "Contacts", slug: "contacts", description: "Follow every customer through a timeline of recorded decisions." },
  { title: "Webinars", slug: "webinars", description: "Bring people together, then review the next action." },
  { title: "Runs", slug: "runs", description: "Every approved action leaves a receipt. Review what can be rewound." },
];
export function HomeProjects() {
  const [active, setActive] = useState(0);
  return <section className="section home-projects" aria-label="Workspace highlights">
    <h2>The work.<br /><em>In motion.</em></h2>
    <div className="project-window">
      <div className="project-track" style={{ transform: `translateX(-${active * 100}%)` }}>
        {items.map((item, i) => <article className="project-slide" key={item.slug} inert={i !== active} aria-hidden={i !== active}>
          {/* Original local illustration; no reference brand assets. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/menu/${item.slug}.svg`} alt="" width={800} height={1000} />
          <div className="project-copy"><span>{String(i + 1).padStart(2, "0")} / Workspace</span><h3>{item.title}</h3><p>{item.description}</p><Link href={`/${item.slug}`}>Open {item.title}</Link></div>
        </article>)}
      </div>
    </div>
    <div className="project-navigation" aria-label="Choose a highlight">{items.map((item,i)=><button key={item.slug} aria-label={`Show ${item.title}`} aria-pressed={active===i} onClick={()=>setActive(i)}>{String(i+1).padStart(2,"0")}</button>)}<button onClick={()=>setActive((active+items.length-1)%items.length)}>Previous</button><button onClick={()=>setActive((active+1)%items.length)}>Next</button></div>
    <p className="project-announcement" aria-live="polite">{String(active+1).padStart(2,"0")} · {items[active].title}</p>
  </section>;
}

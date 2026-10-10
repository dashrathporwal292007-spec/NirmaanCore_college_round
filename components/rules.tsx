"use client";
import { useEffect } from "react";
import { ruleCatalogue } from "@/lib/rule-catalogue";
const names = [
  "Stop reminders after registration",
  "Respect an opt-out",
  "Stop offering what they own",
  "Ask before offering",
  "Follow up with care",
];
const ids = Object.keys(ruleCatalogue).slice(0, 5);
export function Rules() {
  useEffect(() => {
    const reveal = () => {
      const el = document.getElementById(
        decodeURIComponent(location.hash.slice(1)),
      );
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        el.querySelector<HTMLElement>("summary")?.focus({
          preventScroll: true,
        });
      }
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, []);
  return (
    <>
      <h1>
        Five rules,
        <br />
        <em>one</em> promise.
      </h1>
      <p>The business reacts to the evidence. A person stays in control.</p>
      <div className="rules-index">
        {ids.map((id, i) => {
          const rule = ruleCatalogue[id];
          return (
            <details
              id={id}
              key={id}
              onFocusCapture={(e) => {
                if ((e.target as HTMLElement).matches(":focus-visible"))
                  e.currentTarget.open = true;
              }}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") e.currentTarget.open = true;
              }}
              onPointerLeave={(e) => {
                if (
                  e.pointerType === "mouse" &&
                  !e.currentTarget.contains(document.activeElement)
                )
                  e.currentTarget.open = false;
              }}
            >
              <summary>
                <span className="index-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{names[i]}</span>
              </summary>
              <div className="rule-hover-banner" aria-hidden="true">
                <div className="rule-hover-track">
                  {[0, 1, 2, 3].map((copy) => (
                    <span key={copy}>
                      {names[i]} <em>{String(i + 1).padStart(2, "0")}</em>
                    </span>
                  ))}
                </div>
              </div>
              <div className="rule-explanation">
                <p className="rule-reason">{rule.why}</p>
                <div className="rule-explanation-columns">
                  <section>
                    <h2>What triggers it</h2>
                    <p>{rule.trigger}</p>
                  </section>
                  <section>
                    <h2>What happens</h2>
                    <p>{rule.action}</p>
                  </section>
                </div>
                <code>{id}</code>
                <p>
                  <small>
                    Confirmed against {rule.source}. Attendance is recorded
                    evidence; attendance is not simulated in this prototype.
                  </small>
                </p>
              </div>
            </details>
          );
        })}
      </div>
      <section className="section">
        <h2>When a person stops a run</h2>
        <p>
          These are explicit user actions, separate from the five adaptive
          rules.
        </p>
        {Object.entries(ruleCatalogue)
          .slice(5)
          .map(([id, r]) => (
            <details id={id} key={id} className="manual-rule">
              <summary>
                <code>{id}</code>
              </summary>
              <p>{r.trigger}</p>
              <p>{r.action}</p>
              <p>{r.why}</p>
            </details>
          ))}
      </section>
    </>
  );
}

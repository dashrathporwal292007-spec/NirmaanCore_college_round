"use client";
import { useId, useRef } from "react";
import { ruleCatalogue } from "@/lib/rule-catalogue";
export function RuleId({ id }: { id: string }) {
  const ref = useRef<HTMLDialogElement>(null),
    title = useId(),
    rule = ruleCatalogue[id];
  return (
    <>
      <button
        className="rule-id"
        onClick={() => ref.current?.showModal()}
        aria-haspopup="dialog"
      >
        <code>{id}</code>
      </button>
      <dialog className="rule-drawer" ref={ref} aria-labelledby={title}>
        <div className="actions">
          <button onClick={() => ref.current?.close()}>
            Close rule inspector
          </button>
        </div>
        <h2 id={title}>Why this rule exists</h2>
        <code>{id}</code>
        {rule ? (
          <>
            <section className="section">
              <h3>What triggers it</h3>
              <p>{rule.trigger}</p>
            </section>
            <section className="section">
              <h3>What it does</h3>
              <p>{rule.action}</p>
            </section>
            <section className="section">
              <h3>Why</h3>
              <p>{rule.why}</p>
            </section>
            <small>Confirmed against the backend rule catalogue.</small>
          </>
        ) : (
          <p className="section tone-blocked">
            This ID was recorded by the server, but its behavior is not
            confirmed in the catalogue. Read its recorded reason and evidence;
            do not infer another action.
          </p>
        )}
      </dialog>
    </>
  );
}

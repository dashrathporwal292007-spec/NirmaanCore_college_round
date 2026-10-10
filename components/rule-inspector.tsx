"use client";
import { useRef } from "react";
import Link from "next/link";
import { ruleCatalogue } from "@/lib/rule-catalogue";
export function RuleId({ id }: { id: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const rule = ruleCatalogue[id];
  return (
    <>
      <Link
        className="rule-id"
        href={"/rules#" + encodeURIComponent(id)}
        aria-haspopup="dialog"
        onClick={(e) => {
          if (
            e.ctrlKey ||
            e.metaKey ||
            e.shiftKey ||
            e.altKey ||
            e.button !== 0
          )
            return;
          e.preventDefault();
          dialog.current?.showModal();
        }}
      >
        <code>{id}</code>
      </Link>
      {!rule && (
        <small>
          Recorded ID; behavior is not confirmed in the rule catalogue. Read the
          recorded reason and evidence.
        </small>
      )}
      <dialog
        ref={dialog}
        className="rule-drawer"
        aria-label="Rule inspector"
        onKeyDown={(e) => {
          if (e.key !== "Tab") return;
          const controls = Array.from(
            e.currentTarget.querySelectorAll<HTMLElement>("button, a[href]"),
          );
          const first = controls[0],
            last = controls.at(-1);
          if (e.shiftKey && document.activeElement === first && last) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last && first) {
            e.preventDefault();
            first.focus();
          }
        }}
      >
        <button
          className="drawer-close"
          onClick={() => dialog.current?.close()}
        >
          Close rule
        </button>
        <h2>
          A rule.
          <br />
          <em>A reason.</em>
        </h2>
        <code>{id}</code>
        {rule ? (
          <>
            <h3>Why it exists</h3>
            <p>{rule.why}</p>
            <h3>What triggers it</h3>
            <p>{rule.trigger}</p>
            <h3>What happens</h3>
            <p>{rule.action}</p>
            <p className="deferred">Confirmed against {rule.source}.</p>
          </>
        ) : (
          <p>
            This rule is not confirmed in the static catalogue. Use the recorded
            reason and evidence; no behavior has been inferred.
          </p>
        )}
        <Link
          href={"/rules#" + encodeURIComponent(id)}
          onClick={() => dialog.current?.close()}
        >
          Read all rules
        </Link>
      </dialog>
    </>
  );
}

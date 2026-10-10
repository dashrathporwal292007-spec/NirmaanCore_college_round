"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Message } from "@/lib/api";
import { useWorkspace } from "./workspace";
import {
  EmptyState,
  ErrorState,
  StatusPill,
  SimulatedMark,
  RuleMarker,
} from "./shared";
export function Outbox() {
  const { revision } = useWorkspace();
  const [items, setItems] = useState<Message[]>([]),
    [status, setStatus] = useState(""),
    [offset, setOffset] = useState(0),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) setLoading(true);
    });
    api
      .outbox({ status, offset, limit: 50 })
      .then((r) => {
        if (active) {
          setItems(r.outbox);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [status, offset, revision]);
  return (
    <>
      <h1>Outbox</h1>
      <p>
        <SimulatedMark /> · These emails are database records. No external mail
        is delivered.
      </p>
      <label>
        Message state
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setOffset(0);
          }}
        >
          <option value="">All states</option>
          {["queued", "sent", "cancelled", "failed"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      {error && <ErrorState message={error} />}{" "}
      {loading ? (
        <p role="status">Reading messages…</p>
      ) : !items.length ? (
        <EmptyState>
          <Link href="/">Approve an invitation plan</Link> to queue messages, or
          choose another state.
        </EmptyState>
      ) : (
        items.map((m) => (
          <div className="list-row" key={m.id}>
            <div>
              <Link href={"/contacts/" + m.contact_id}>{m.contact_name}</Link>
              <p>{m.payload.subject}</p>
              <small>
                {m.kind.replaceAll("_", " ")} ·{" "}
                {m.dispatched_at
                  ? "Sent " + new Date(m.dispatched_at).toLocaleString()
                  : "Scheduled " + new Date(m.dispatch_after).toLocaleString()}
              </small>
              {m.cancel_reason && (
                <RuleMarker
                  id={
                    m.cancel_reason.ruleId ??
                    m.cancel_reason.rule ??
                    "Unspecified rule"
                  }
                  reason={m.cancel_reason.reason ?? "No reason was recorded."}
                  evidence={m.cancel_reason.evidence}
                />
              )}
              <details>
                <summary>Read message</summary>
                <p>{m.payload.body}</p>
              </details>
            </div>
            <div>
              <StatusPill status={m.status} />
              <p>
                <SimulatedMark />
              </p>
            </div>
          </div>
        ))
      )}
      <div className="toolbar">
        <button
          disabled={loading || !offset}
          onClick={() => setOffset(offset - 50)}
        >
          Previous 50
        </button>
        <button
          disabled={loading || items.length < 50}
          onClick={() => setOffset(offset + 50)}
        >
          Next 50
        </button>
      </div>
      <p>
        Rule-blocked messages remain cancelled in the outbox. Their stored rule
        and reason explain the block.
      </p>
    </>
  );
}

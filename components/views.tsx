"use client";
import { useEffect, useState, type CSSProperties } from "react";
import {
  api,
  type Contact,
  type Event,
  type RunSummary,
  type Message,
  type Pending,
} from "@/lib/api";
import {
  EmptyState,
  ErrorState,
  RuleMarker,
  StatusPill,
  SimulatedMark,
} from "./shared";
export function DataView({
  view,
  openRun,
}: {
  view: string;
  openRun: (id: string) => void;
}) {
  const [error, setError] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [contactId, setContactId] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (view === "Runs") {
          const d = await api.runs({ limit: 50, offset });
          if (active) setRuns(d.runs);
        } else if (view === "Outbox") {
          const d = await api.outbox({ limit: 50, offset, status });
          if (active) setMessages(d.outbox);
        } else {
          const d = await api.contacts({ limit: 50, offset });
          if (active) setContacts(d.contacts);
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [view, offset, status]);
  async function timeline(id: string) {
    setContactId(id);
    setError("");
    try {
      setEvents((await api.timeline(id, { limit: 200 })).events);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <h1>{view === "Live view" ? "Every change leaves a receipt." : view}</h1>
      {error && <ErrorState message={error} />}
      <div className="toolbar">
        {view === "Outbox" && (
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
        )}
        <button
          disabled={loading || offset === 0}
          onClick={() => (
            setLoading(true),
            setOffset(Math.max(0, offset - 50))
          )}
        >
          Previous 50
        </button>
        <button
          disabled={
            loading ||
            (view === "Runs"
              ? runs.length
              : view === "Outbox"
                ? messages.length
                : contacts.length) < 50
          }
          onClick={() => (setLoading(true), setOffset(offset + 50))}
        >
          Next 50
        </button>
      </div>
      {loading ? (
        <p role="status">Reading the database…</p>
      ) : view === "Runs" ? (
        runs.length ? (
          runs.map((r) => (
            <div className="list-row" key={r.id}>
              <div>
                <button className="run-link" onClick={() => openRun(r.id)}>
                  Run {r.id.slice(0, 8)}
                </button>
                <p>{r.instruction}</p>
              </div>
              <StatusPill status={r.status} />
            </div>
          ))
        ) : (
          <EmptyState>
            Plan a request in Agent to create your first run.
          </EmptyState>
        )
      ) : view === "Outbox" ? (
        messages.length ? (
          messages.map((m) => (
            <div className="list-row" key={m.id}>
              <div>
                <strong>{m.contact_name}</strong>
                <p>{m.payload.subject}</p>
                <small>
                  {m.kind} · due {new Date(m.dispatch_after).toLocaleString()}
                </small>
                {m.cancel_reason && (
                  <RuleMarker
                    id={
                      m.cancel_reason.ruleId ??
                      m.cancel_reason.rule ??
                      "Unspecified rule"
                    }
                    reason={m.cancel_reason.reason ?? "Cancelled by run rewind"}
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
                <br />
                <SimulatedMark />
              </div>
            </div>
          ))
        ) : (
          <EmptyState>
            Approve a campaign in Agent to queue simulated messages.
          </EmptyState>
        )
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>State</th>
                  <th>Consent</th>
                  <th>Tags</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <button
                        className="run-link"
                        onClick={() => void timeline(c.id)}
                      >
                        {c.name}
                      </button>
                      <br />
                      <small>{c.email}</small>
                    </td>
                    <td>{c.status}</td>
                    <td>{c.unsubscribed ? "Opted out" : "Eligible"}</td>
                    <td>{c.tags.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!contacts.length && (
            <EmptyState>
              No contacts found. Restore the demo seed to begin.
            </EmptyState>
          )}
          <section className="section">
            <h2>{view === "Live view" ? "Rule trace" : "Contact timeline"}</h2>
            {!contactId ? (
              <EmptyState>
                Select a contact to inspect their recorded decisions.
              </EmptyState>
            ) : !events.length ? (
              <EmptyState>
                This contact has no recorded events yet. Run a workflow to start
                their timeline.
              </EmptyState>
            ) : (
              <div className={view === "Live view" ? "trace" : ""}>
                {events.map((e, i) => (
                  <div
                    key={e.id}
                    style={{ "--delay": `${i * 480}ms` } as CSSProperties}
                  >
                    <small>{new Date(e.created_at).toLocaleString()}</small>
                    {e.rule_id ? (
                      <RuleMarker
                        id={e.rule_id}
                        reason={e.reason ?? "No reason was recorded."}
                        evidence={e.payload.evidence}
                      />
                    ) : (
                      <div className="list-row">
                        <p>{e.type.replaceAll("_", " ")}</p>
                        <details>
                          <summary>Show event</summary>
                          <pre>{JSON.stringify(e.payload, null, 2)}</pre>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
export function WebinarView() {
  const [id, setId] = useState("");
  const [kind, setKind] = useState<"offer" | "followup">("offer");
  const [preview, setPreview] = useState<Pending | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>Webinars</h1>
      <p>
        Use the webinar ID recorded in a completed run. Closing the webinar
        drafts follow-ups; it does not send them.
      </p>
      <div className="toolbar">
        <label>
          Webinar ID
          <input
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setPreview(null);
            }}
            placeholder="Paste the recorded UUID"
          />
        </label>
        <label>
          Draft kind
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as "offer" | "followup");
              setPreview(null);
            }}
          >
            <option value="offer">Attendee offer</option>
            <option value="followup">No-show follow-up</option>
          </select>
        </label>
        <button
          disabled={!id || busy}
          onClick={() =>
            void act(async () => setPreview(await api.pending(id, kind)))
          }
        >
          Preview pending drafts
        </button>
        <button
          disabled={!id || busy}
          onClick={() =>
            void act(async () => {
              const d = await api.close(id);
              setNotice(`${d.drafted} new drafts prepared. Nothing sent.`);
              setPreview(null);
            })
          }
        >
          Close webinar
        </button>
      </div>
      {error && <ErrorState message={error} />}
      <p role="status">{notice}</p>
      {preview ? (
        <section className="receipt">
          <h2>{preview.recipients.length} eligible recipients</h2>
          <p>{preview.subject}</p>
          <p>{preview.body}</p>
          <p>{preview.recipients.map((r) => r.name).join(", ")}</p>
          <button
            disabled={busy || !preview.recipients.length}
            onClick={() =>
              void act(async () => {
                const d = await api.approvePending(
                  id,
                  kind,
                  preview.fingerprint,
                );
                if (d.stale && d.preview) {
                  setPreview(d.preview);
                  setNotice(
                    "Recipients or content changed. Review the fresh preview and approve again.",
                  );
                } else {
                  setNotice(
                    `${d.approved} messages queued. Delivery is simulated.`,
                  );
                  setPreview(null);
                }
              })
            }
          >
            Approve and queue drafts
          </button>
        </section>
      ) : (
        <EmptyState>Preview pending drafts before approving a send.</EmptyState>
      )}
    </>
  );
}

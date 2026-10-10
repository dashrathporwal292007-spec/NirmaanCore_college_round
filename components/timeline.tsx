"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Contact, type Event } from "@/lib/api";
import { allContacts } from "@/lib/client-data";
import { EmptyState, ErrorState, RuleMarker } from "./shared";
import { useWorkspace } from "./workspace";
export function Timeline({ events }: { events: Event[] }) {
  return (
    <ol className="timeline-spine">
      {events.map((e) => (
        <li
          key={e.id}
          className={
            e.type === "automation_decision" ? "automatic" : "ordinary"
          }
        >
          <span className="event-marker" aria-hidden />
          <small>
            {new Date(e.created_at).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })}{" "}
            IST
          </small>
          {e.rule_id ? (
            <RuleMarker
              id={e.rule_id}
              reason={e.reason ?? "No reason was recorded."}
              evidence={e.payload.evidence}
            />
          ) : (
            <>
              <p>{e.type.replaceAll("_", " ")}</p>
              {e.reason && <p>{e.reason}</p>}
              <details>
                <summary>Show recorded event</summary>
                <pre>{JSON.stringify(e.payload, null, 2)}</pre>
              </details>
            </>
          )}
          {e.run_id && <Link href={"/runs/" + e.run_id}>Inspect the run</Link>}
        </li>
      ))}
    </ol>
  );
}
export function ContactDetail({ id }: { id: string }) {
  const { revision } = useWorkspace();
  const [contact, setContact] = useState<Contact | null>(null),
    [events, setEvents] = useState<Event[]>([]),
    [offset, setOffset] = useState(0),
    [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([allContacts(), api.timeline(id, { limit: 50, offset })])
      .then(([cs, t]) => {
        if (active) {
          setContact(cs.find((c) => c.id === id) ?? null);
          setEvents(t.events);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [id, offset, revision]);
  return (
    <>
      <p>
        <Link href="/contacts">All contacts</Link>
      </p>
      <h1>{contact?.name ?? "Contact"}.<br /><em>Every change.</em></h1>
      {contact && (
        <>
          <p>
            {contact.email} · {contact.status}
          </p>
          <p>Tags: {contact.tags.join(", ") || "No tags"}</p>
          <p className={contact.unsubscribed ? "tone-blocked" : ""}>
            {contact.unsubscribed
              ? "Unsubscribed. Promotional messages are blocked."
              : "Eligible for promotional messages."}
          </p>
        </>
      )}
      {error && <ErrorState message={error} />}
      <section className="section">
        <h2>Every recorded change</h2>
        {!loaded ? (
          <p>Loading the contact…</p>
        ) : (
          <>
            <Timeline events={events} />
            {!events.some((e) => e.type === "automation_decision") &&
              offset === 0 && (
                <EmptyState>
                  No automatic decisions yet. Plan a webinar, approve it, then
                  register this contact on its public page.
                </EmptyState>
              )}
            <div className="actions">
              <button
                disabled={!offset}
                onClick={() => setOffset(Math.max(0, offset - 50))}
              >
                Newer events
              </button>
              <button
                disabled={events.length < 50}
                onClick={() => setOffset(offset + 50)}
              >
                Older events
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  api,
  type Contact,
  type Event,
  type Message,
  type Webinar,
} from "@/lib/api";
import { useWorkspace } from "./workspace";
import { EventTicker } from "./event-ticker";
import { Timeline } from "./timeline";
import {
  EmptyState,
  ErrorState,
  RuleMarker,
  StatusPill,
  SimulatedMark,
} from "./shared";
export function LiveView() {
  const { revision } = useWorkspace();
  const [webinars, setWebinars] = useState<Webinar[]>([]),
    [contacts, setContacts] = useState<Contact[]>([]),
    [wid, setWid] = useState(""),
    [cid, setCid] = useState(""),
    [events, setEvents] = useState<Event[]>([]),
    [emails, setEmails] = useState<Message[]>([]),
    [error, setError] = useState(""),
    [trace, setTrace] = useState<Event | null>(null),
    [stage, setStage] = useState(0),
    [playing, setPlaying] = useState(false),
    [loading, setLoading] = useState(true);
  const seen = useRef<Record<string, string>>({});
  useEffect(() => {
    let active = true;
    Promise.all([api.webinars({ limit: 200 }), api.contacts({ limit: 200 })])
      .then(([ws, cs]) => {
        if (!active) return;
        setWebinars(ws.webinars);
        setContacts(cs.contacts);
        setWid(
          (old) =>
            old ||
            ws.webinars.find(
              (w) => w.status === "scheduled" && w.page_status === "published",
            )?.id ||
            "",
        );
        setCid(
          (old) =>
            old ||
            cs.contacts.find((c) => c.tags.includes("trial") && !c.unsubscribed)
              ?.id ||
            "",
        );
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
  }, [revision]);
  useEffect(() => {
    if (!cid) return;
    let active = true,
      inflight = false;
    async function poll() {
      if (document.hidden || inflight) return;
      inflight = true;
      try {
        const [t, o] = await Promise.all([
          api.timeline(cid, { limit: 200 }),
          api.outbox({
            contact_id: cid,
            webinar_id: wid || undefined,
            limit: 200,
          }),
        ]);
        if (!active) return;
        setEvents(t.events);
        setEmails(o.outbox);
        setError("");
        const latest = t.events.find((e) => {
          if (e.type !== "automation_decision" || !e.rule_id) return false;
          const evidence = e.payload.evidence;
          return (
            !wid ||
            !evidence ||
            typeof evidence !== "object" ||
            Array.isArray(evidence) ||
            !("webinar_id" in evidence) ||
            evidence.webinar_id === wid
          );
        });
        const key = cid + wid,
          prior = seen.current[key];
        seen.current[key] = latest?.id ?? "";
        setTrace(latest ?? null);
        if (latest && prior !== undefined && prior !== latest.id) {
          setStage(
            matchMedia("(prefers-reduced-motion: reduce)").matches ? 3 : 1,
          );
          setPlaying(!matchMedia("(prefers-reduced-motion: reduce)").matches);
        } else if (prior === undefined || prior === latest?.id) {
          setStage(latest ? 3 : 0);
          setPlaying(false);
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        inflight = false;
      }
    }
    void poll();
    const timer = setInterval(() => void poll(), 2000);
    const visible = () => {
      if (!document.hidden) void poll();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [cid, wid, revision]);
  useEffect(() => {
    if (!playing || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const a = setTimeout(() => setStage(2), 480),
      b = setTimeout(() => setStage(3), 960),
      c = setTimeout(() => setPlaying(false), 1440);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
      clearTimeout(c);
    };
  }, [playing, trace?.id]);
  const webinar = webinars.find((w) => w.id === wid),
    message = emails.find((m) => m.id === trace?.payload.outbox_id);
  const act =
    trace?.rule_id === "REMINDER_REQUIRES_UNREGISTERED"
      ? "Webinar registration recorded"
      : trace?.rule_id === "OPTED_OUT_BLOCKS_PROMO"
        ? "Opt-out recorded"
        : trace?.rule_id === "PROMO_REQUIRES_NOT_SUBSCRIBED"
          ? "Active subscription recorded"
          : "Customer evidence recorded";
  const effect = trace
    ? (message?.kind
        ? message.kind[0].toUpperCase() + message.kind.slice(1)
        : "Action") +
      " " +
      String(trace.payload.decision ?? "recorded").replaceAll("_", " ")
    : "Waiting for a stored decision";
  return (
    <>
      <h1>
        The business <em>corrects itself.</em>
      </h1>
      {webinars.some(
        (w) => w.page_status === "published" && w.status === "scheduled",
      ) && (
        <p>
          Register a customer. Watch the reminder stop, with its rule and
          evidence.
        </p>
      )}
      {error && <ErrorState message={error} />}
      {loading ? (
        <p>Loading the workspace…</p>
      ) : !webinars.some(
          (w) => w.page_status === "published" && w.status === "scheduled",
        ) ? (
        <EmptyState>
          <p>
            Plan the webinar, approve it, then register on the public page.
            Reset between runs with npm run demo:reset.
          </p>
          <p>
            The demo plan creates a draft page: open Webinars to preview and
            approve its publication. <Link href="/">Open Agent</Link>.
          </p>
        </EmptyState>
      ) : null}
      <EventTicker events={events} />
      <div className="rule-stages" aria-live="polite">
        {[
          <>
            <h2>A customer acts</h2>
            <p>{trace ? act : "Waiting for a customer action"}</p>
          </>,
          <>
            <h2>A rule fires</h2>
            {trace?.rule_id ? (
              <RuleMarker
                id={trace.rule_id}
                reason={trace.reason ?? "No reason was recorded."}
                evidence={trace.payload.evidence}
              />
            ) : (
              <p>Waiting for a named rule</p>
            )}
          </>,
          <>
            <h2>The business corrects itself</h2>
            <p>{effect}</p>
          </>,
        ].map((node, i) => (
          <section
            key={i}
            className={"rule-stage " + (stage > i ? "reached" : "")}
          >
            <small>Stage {i + 1} of 3</small>
            {node}
            <div
              className={"trace-rail " + (stage > i ? "reached" : "")}
              aria-hidden
            />
          </section>
        ))}
      </div>
      <div className="toolbar">
        <label>
          Webinar
          <select
            aria-label="Webinar"
            value={wid}
            onChange={(e) => {
              setWid(e.target.value);
              setStage(0);
              setPlaying(false);
              setTrace(null);
            }}
          >
            <option value="">Choose a webinar</option>
            {webinars.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title} · {w.status}
              </option>
            ))}
          </select>
        </label>
        <label>
          Contact to observe
          <select
            aria-label="Contact to observe"
            value={cid}
            onChange={(e) => {
              setCid(e.target.value);
              setStage(0);
              setPlaying(false);
              setTrace(null);
            }}
          >
            <option value="">Choose a contact</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.unsubscribed ? " · opted out" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="live-columns">
        <section>
          <h2>Public registration</h2>
          {webinar?.slug &&
          webinar.page_status === "published" &&
          webinar.status === "scheduled" ? (
            <>
              <p>
                <Link href={"/register/" + webinar.slug}>
                  Open the public page
                </Link>
              </p>
              <p>
                To observe this contact, register with{" "}
                {contacts.find((c) => c.id === cid)?.email ??
                  "their email address"}
                .
              </p>
              <iframe
                className="phone-frame"
                title="Public webinar registration"
                src={"/register/" + encodeURIComponent(webinar.slug)}
              />
            </>
          ) : (
            <EmptyState>
              Choose a published, scheduled webinar. Draft pages cannot accept
              registrations.
            </EmptyState>
          )}
        </section>
        <section>
          <h2>Contact emails</h2>
          <p>
            <SimulatedMark /> · Updates every 2 seconds while this tab is
            visible.
          </p>
          {emails.length ? (
            emails.map((m) => (
              <div className="list-row" key={m.id}>
                <div>
                  <strong>{m.kind}</strong>
                  <p>{m.payload.subject}</p>
                  {m.cancel_reason?.ruleId && (
                    <RuleMarker
                      id={m.cancel_reason.ruleId}
                      reason={
                        m.cancel_reason.reason ?? "No reason was recorded."
                      }
                      evidence={m.cancel_reason.evidence}
                    />
                  )}
                </div>
                <StatusPill status={m.status} />
              </div>
            ))
          ) : (
            <EmptyState>
              Approve the invitation plan to queue emails for this contact.
            </EmptyState>
          )}
          <h2 className="section">Timeline</h2>
          <Timeline events={events} />
          {!events.some((e) => e.rule_id) && (
            <EmptyState>
              Imported contacts have no automatic decisions yet. Plan the
              webinar, approve it, then register on the public page.
            </EmptyState>
          )}
          {cid && (
            <Link href={"/contacts/" + cid}>
              Read the full contact timeline
            </Link>
          )}
        </section>
      </div>
    </>
  );
}

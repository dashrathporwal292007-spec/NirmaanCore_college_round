"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type Contact, type Pending, type WebinarDetail } from "@/lib/api";
import { allContacts } from "@/lib/client-data";
import { useWorkspace } from "./workspace";
import {
  EmptyState,
  ErrorState,
  StatusPill,
  SimulatedMark,
  inr,
} from "./shared";
export function WebinarScreen({ id }: { id: string }) {
  const { role, revision, refresh, onMode } = useWorkspace(),
    router = useRouter(),
    generation = useRef({ value: 0 });
  const seenDecisions = useRef<Record<string, Set<string>>>({});
  const [data, setData] = useState<WebinarDetail | null>(null),
    [contacts, setContacts] = useState<Contact[]>([]),
    [cid, setCid] = useState(""),
    [kind, setKind] = useState<"offer" | "followup">("followup"),
    [pending, setPending] = useState<Pending | null>(null),
    [plan, setPlan] = useState("Social Growth"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [stale, setStale] = useState(false);
  const load = useCallback(async () => {
    const n = ++generation.current.value;
    const [d, c, p] = await Promise.all([
      api.webinar(id),
      allContacts(),
      role === "owner" ? api.pending(id, kind) : Promise.resolve(null),
    ]);
    if (n !== generation.current.value) return;
    setData(d);
    setContacts(c);
    setPending(p);
    setCid(
      (old) =>
        old ||
        c.find((x) => x.tags.includes("trial") && !x.unsubscribed)?.id ||
        "",
    );
    setError("");
  }, [id, kind, role]);
  useEffect(() => {
    const counter = generation.current;
    void load().catch((e) => setError(e.message));
    return () => {
      counter.value++;
    };
  }, [load, revision]);
  useEffect(() => {
    if (!cid) return;
    let active = true;
    const key = id + cid;
    void api
      .timeline(cid, { limit: 200 })
      .then(({ events }) => {
        if (!active) return;
        const prior = seenDecisions.current[key];
        const decisions = events.filter(
          (e) => e.type === "automation_decision",
        );
        seenDecisions.current[key] = new Set(decisions.map((e) => e.id));
        const latest =
          prior &&
          decisions.find(
            (e) =>
              !prior.has(e.id) &&
              (!e.payload.evidence ||
                typeof e.payload.evidence !== "object" ||
                Array.isArray(e.payload.evidence) ||
                !("webinar_id" in e.payload.evidence) ||
                e.payload.evidence.webinar_id === id),
          );
        if (!latest) return;
        const label =
          latest.payload.decision === "cancelled"
            ? latest.rule_id === "REMINDER_REQUIRES_UNREGISTERED"
              ? "Reminder cancelled."
              : latest.rule_id === "OPTED_OUT_BLOCKS_PROMO"
                ? "Promotional messages cancelled."
                : latest.rule_id === "PROMO_REQUIRES_NOT_SUBSCRIBED"
                  ? "Offer cancelled."
                  : "Action cancelled."
            : (latest.reason ?? "Automatic decision recorded.");
        setNotice((old) =>
          old.includes(label)
            ? old
            : [old, label, latest.reason !== label ? latest.reason : ""]
                .filter(Boolean)
                .join(" "),
        );
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [cid, id, revision]);
  async function act(fn: () => Promise<string>) {
    setBusy(true);
    setError("");
    setStale(false);
    try {
      const note = await fn();
      await load();
      refresh();
      setNotice(note);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function customer(action: () => Promise<string>) {
    const before = await api.timeline(cid, { limit: 200 });
    const note = await action();
    const after = await api.timeline(cid, { limit: 200 });
    const known = new Set(before.events.map((e) => e.id));
    const changes = after.events.filter(
      (e) => !known.has(e.id) && e.type === "automation_decision",
    );
    const decision = changes.find((e) => e.payload.decision === "cancelled");
    return (
      note +
      (decision?.rule_id === "REMINDER_REQUIRES_UNREGISTERED"
        ? " Reminder cancelled."
        : decision?.rule_id === "OPTED_OUT_BLOCKS_PROMO"
          ? " Promotional messages cancelled."
          : decision?.rule_id === "PROMO_REQUIRES_NOT_SUBSCRIBED"
            ? " Offer cancelled."
            : "")
    );
  }
  const w = data?.webinar,
    person = contacts.find((c) => c.id === cid),
    disabled = busy || role !== "owner";
  return (
    <>
      <p>
        <Link href="/webinars">All webinars</Link>
      </p>
      <h1>
        A gathering.
        <br />
        <em>A next step.</em>
      </h1>
      <h2>{w?.title ?? "Webinar"}</h2>
      {error && <ErrorState message={error} />}
      <p role="status" className="notice">
        {notice}
      </p>
      {w && (
        <>
          <p>{w.description}</p>
          <p>
            {new Date(w.starts_at).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })}{" "}
            IST
          </p>
          <StatusPill status={w.status} />
          <div className="section">
            <div className="impact-number">{w.registrant_count}</div>
            <p>Registered people</p>
            <p>
              <SimulatedMark /> · Webinar hosting
            </p>
            {w.page_status === "published" && w.slug ? (
              <Link href={"/register/" + w.slug}>Open registration page</Link>
            ) : (
              <>
                <p>
                  The registration page is a draft. Preview its publication,
                  then approve it deliberately.
                </p>
                <button
                  disabled={disabled || !w.page_id || w.status === "archived"}
                  onClick={() =>
                    void act(async () => {
                      const response = await api.plan(
                        "Publish the registration page",
                        {
                          summary: "Publish this webinar registration page",
                          deferred: [],
                          steps: [
                            {
                              tool: "publish_page",
                              args: { page_id: w.page_id },
                            },
                          ],
                        },
                      );
                      onMode(response);
                      if (!response.runId)
                        throw new Error(
                          "Publication did not produce a run. Try again.",
                        );
                      router.push("/runs/" + response.runId);
                      return "Publication preview created. Nothing is public yet.";
                    })
                  }
                >
                  Preview registration publication
                </button>
              </>
            )}
          </div>
          <section className="section">
            <h2>Customer actions</h2>
            <label>
              Contact
              <select
                aria-label="Contact"
                value={cid}
                onChange={(e) => setCid(e.target.value)}
              >
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.unsubscribed ? " · unsubscribed" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Plan name for checkout
              <input
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                maxLength={120}
              />
            </label>
            <div className="actions">
              <button
                disabled={
                  disabled ||
                  !person ||
                  !w.slug ||
                  w.page_status !== "published" ||
                  w.status !== "scheduled"
                }
                onClick={() =>
                  void act(() =>
                    customer(async () => {
                      const r = await api.register(
                        w.slug!,
                        person!.name,
                        person!.email,
                      );
                      return r.registered
                        ? "Registration recorded."
                        : "Already registered.";
                    }),
                  )
                }
              >
                Simulated registration
              </button>
              <button
                disabled={disabled || !person}
                onClick={() =>
                  void act(() =>
                    customer(async () => {
                      await api.optOut(cid);
                      return "Contact is unsubscribed.";
                    }),
                  )
                }
              >
                Simulated opt-out
              </button>
              <button
                disabled={disabled || !person || !plan.trim()}
                onClick={() =>
                  void act(() =>
                    customer(async () => {
                      const r = await api.checkout(cid, plan);
                      return r.invoice_created
                        ? "Simulated checkout recorded. Invoice " +
                            inr(r.amount_inr) +
                            "."
                        : "Subscription already active; no duplicate invoice.";
                    }),
                  )
                }
              >
                Simulated checkout
              </button>
            </div>
            <p className="section">
              Attendance is not simulated in this prototype.
            </p>
            {role === "viewer" && (
              <small>Switch to owner to perform simulated actions.</small>
            )}
          </section>
          <section className="section">
            <h2>Close and follow up</h2>
            <p>
              Closing prepares drafts from stored registrations. It does not
              send anything.
            </p>
            <button
              disabled={disabled || w.status === "archived"}
              onClick={() =>
                void act(async () => {
                  const r = await api.close(id);
                  return r.drafted + " new drafts prepared. Nothing sent.";
                })
              }
            >
              Close webinar
            </button>
            <label className="section">
              Draft audience
              <select
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value as "offer" | "followup");
                  setStale(false);
                }}
              >
                <option value="followup">Registered no-shows</option>
                <option value="offer">Recorded attendees</option>
              </select>
            </label>
            {stale && (
              <p role="alert" className="error">
                Recipients or content changed. Nothing was queued. Review the
                fresh preview and approve again.
              </p>
            )}
            {pending?.recipients.length ? (
              <div className="receipt">
                <h3>{pending.recipients.length} eligible recipients</h3>
                <p>{pending.subject}</p>
                <p>{pending.body}</p>
                <p>{pending.recipients.map((r) => r.name).join(", ")}</p>
                <button
                  disabled={disabled}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      const r = await api.approvePending(
                        id,
                        kind,
                        pending.fingerprint,
                      );
                      if (r.stale && r.preview) {
                        setPending(r.preview);
                        setStale(true);
                        setNotice("Preview changed. Nothing queued.");
                      } else {
                        await load();
                        refresh();
                        setStale(false);
                        setNotice(
                          r.approved +
                            " messages queued. Delivery is simulated.",
                        );
                      }
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Approve
                </button>
                <p className="deferred">
                  Not approving leaves the draft untouched.
                </p>
              </div>
            ) : (
              <EmptyState>
                {role === "viewer"
                  ? "Owner role is needed to preview and approve drafts."
                  : "No eligible drafts await approval. Close the webinar after registrations to prepare follow-ups."}
              </EmptyState>
            )}
          </section>
          <section className="section">
            <h2>Registrants</h2>
            {data.registrants.length ? (
              data.registrants.map((r) => (
                <div className="list-row" key={r.contact_id}>
                  <Link href={"/contacts/" + r.contact_id}>{r.name}</Link>
                  <span>
                    {r.attended
                      ? "Attendance recorded"
                      : "No attendance recorded"}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState>
                Publish the registration page, then register a contact to begin.
              </EmptyState>
            )}
          </section>
        </>
      )}
    </>
  );
}

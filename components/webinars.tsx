"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Webinar } from "@/lib/api";
import { useWorkspace } from "./workspace";
import { EmptyState, ErrorState, StatusPill, SimulatedMark } from "./shared";
export function WebinarsList() {
  const { revision } = useWorkspace();
  const [items, setItems] = useState<Webinar[]>([]),
    [offset, setOffset] = useState(0),
    [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    api
      .webinars({ limit: 50, offset })
      .then((d) => {
        if (active) {
          setItems(d.webinars);
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
  }, [offset, revision]);
  return (
    <>
      <h1>Webinars</h1>
      <p>
        <SimulatedMark /> · Hosting and delivery are simulated. Registrations
        are stored in the real CRM.
      </p>
      {error && <ErrorState message={error} />}
      <div className="actions">
        <button
          disabled={!offset}
          onClick={() => setOffset(Math.max(0, offset - 50))}
        >
          Previous 50
        </button>
        <button
          disabled={items.length < 50}
          onClick={() => setOffset(offset + 50)}
        >
          Next 50
        </button>
      </div>
      {!loaded ? (
        <p>Loading webinars…</p>
      ) : !items.length ? (
        <EmptyState>
          Plan a webinar in <Link href="/">Agent</Link>, approve it, then
          publish its registration page.
        </EmptyState>
      ) : (
        items.map((w) => (
          <article className="list-row" key={w.id}>
            <div>
              <h2>
                <Link href={"/webinars/" + w.id}>{w.title}</Link>
              </h2>
              <p>
                {new Date(w.starts_at).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}{" "}
                IST
              </p>
              <p>
                {w.registrant_count} registrants · Registration page{" "}
                {w.page_status ?? "unavailable"}
              </p>
            </div>
            <StatusPill status={w.status} />
          </article>
        ))
      )}
    </>
  );
}

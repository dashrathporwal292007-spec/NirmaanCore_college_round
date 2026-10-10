"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Contact, type Event } from "@/lib/api";
import { EventTicker } from "./event-ticker";

/** The API exposes contact timelines, so disclose the feed's real contact scope. */
export function ShellTicker({ revision }: { revision: number }) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true,
      inflight = false;
    let current: Contact | undefined;
    async function poll() {
      if (document.hidden || inflight) return;
      inflight = true;
      try {
        if (!current) {
          const result = await api.contacts({ limit: 200 });
          current =
            result.contacts.find(
              (c) => c.tags.includes("trial") && !c.unsubscribed,
            ) ?? result.contacts[0];
        }
        const result = current
          ? await api.timeline(current.id, { limit: 8 })
          : null;
        if (!active) return;
        setContact(current ?? null);
        setEvents(result?.events ?? []);
        setError("");
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
  }, [revision]);
  return (
    <aside className="shell-events" aria-label="Recorded customer activity">
      {contact && (
        <p className="ticker-scope">
          Activity for{" "}
          <Link href={`/contacts/${contact.id}`}>{contact.name}</Link>. Open
          Live view to choose another customer.
        </p>
      )}
      {error ? (
        <p role="status">Activity could not be loaded. {error}</p>
      ) : (
        <EventTicker events={events} />
      )}
    </aside>
  );
}

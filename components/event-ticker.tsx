import type { Event } from "@/lib/api";
export function EventTicker({ events }: { events: Event[] }) {
  const recent = events.filter(e => e.type !== "imported").slice(0, 8);
  if (!recent.length) return <p className="event-ticker-empty">Recorded events will appear here after a customer acts.</p>;
  return <div className="event-ticker" tabIndex={0} aria-label="Recent events for the selected contact. Focus to pause."><div className="event-track">{[false,true].map(copy => <span className="event-group" key={String(copy)} aria-hidden={copy || undefined}>{recent.map(e => <span key={e.id}>{e.reason ?? e.type.replaceAll("_", " ")}<span className="event-time">{new Date(e.created_at).toLocaleTimeString("en-IN", {timeZone:"Asia/Kolkata"})}</span></span>)}</span>)}</div></div>;
}

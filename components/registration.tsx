"use client";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { EmptyState, ErrorState, SimulatedMark } from "./shared";
type PublicPage = Awaited<ReturnType<typeof api.page>>;
export function Registration({ slug }: { slug: string }) {
  const [data, setData] = useState<PublicPage | null>(null),
    [error, setError] = useState(""),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    api
      .page(slug)
      .then((d) => {
        if (active) setData(d);
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
  }, [slug]);
  async function register() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await api.register(slug, name, email);
      setNotice(
        result.registered
          ? "You are registered. Your place is saved."
          : "You are already registered. Your place is still saved.",
      );
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Registration failed. Check your details and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="registration-page">
      <p className="registration-brand">Nexus</p>
      {!loaded ? (
        <p role="status">Opening registration…</p>
      ) : (
        <>
          <p className="poster-kicker">A place to <em>learn.</em></p>
          <h1>
            {data?.webinar?.title ??
              data?.page.title ??
              "Registration unavailable"}
          </h1>
          {data?.webinar && (
            <>
              <p>{data.webinar.description}</p>
              <p>
                {new Date(data.webinar.starts_at).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}{" "}
                IST
              </p>
            </>
          )}
          {error && <ErrorState message={error} />}
          <p role="status" className="tone-added">
            {notice}
          </p>
          {data?.registration_open ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void register();
              }}
            >
              <label htmlFor="registration-name">
                Your name
                <input
                  id="registration-name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                />
              </label>
              <label htmlFor="registration-email">
                Email address
                <input
                  id="registration-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={200}
                />
              </label>
              <button disabled={busy}>
                {busy ? "Saving registration…" : "Register for the webinar"}
              </button>
            </form>
          ) : (
            data && (
              <EmptyState>
                Registration is closed. Ask the organiser about the next
                webinar.
              </EmptyState>
            )
          )}
          <p className="section">
            <SimulatedMark /> · Webinar hosting is simulated. No payment is
            required.
          </p>
        </>
      )}
    </main>
  );
}

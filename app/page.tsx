"use client";
import { useEffect, useState } from "react";
import { api, setRole, type Mode } from "@/lib/api";
import { Agent } from "@/components/agent";
import { DataView, WebinarView } from "@/components/views";
import { ErrorState } from "@/components/shared";
const tabs = ["Agent", "Live view", "Contacts", "Webinars", "Outbox", "Runs"];
export default function Home() {
  const [view, setView] = useState("Agent");
  const [role, updateRole] = useState<"owner" | "viewer">("owner");
  const [mode, setMode] = useState<Mode | null>(null);
  const [last, setLast] = useState("No tick run this session");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [runId, setRunId] = useState<string>();
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      const cookie = document.cookie
        .split("; ")
        .find((v) => v.startsWith("uid="));
      const r = cookie?.endsWith("000000000003") ? "viewer" : "owner";
      updateRole(r);
      setRole(r);
      const hash = decodeURIComponent(location.hash.slice(1));
      if (tabs.includes(hash)) setView(hash);
    });
    return () => {
      active = false;
    };
  }, []);
  function navigate(tab: string) {
    setView(tab);
    setRunId(undefined);
    location.hash = encodeURIComponent(tab);
  }
  return (
    <>
      <a className="skip" href="#main">
        Skip to workspace
      </a>
      <header>
        <div className="top-row">
          <a
            className="wordmark"
            href="#Agent"
            onClick={() => navigate("Agent")}
          >
            Nexus
          </a>
          <nav className="nav" aria-label="Workspace">
            {tabs.map((tab, i) => (
              <a
                key={tab}
                href={`#${encodeURIComponent(tab)}`}
                aria-current={view === tab ? "page" : undefined}
                onClick={() => navigate(tab)}
              >
                <small>{i + 1} </small>
                {tab}
              </a>
            ))}
          </nav>
        </div>
        <div className="utility">
          <button
            disabled={busy || role === "viewer"}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const d = await api.tick();
                setLast(
                  `${new Date().toLocaleTimeString()}: ${d.sent} sent, ${d.blocked} blocked`,
                );
                setRefresh((n) => n + 1);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Running tick…" : "Run worker tick"}
          </button>
          <span role="status">{last}</span>
          <label>
            Demo role{" "}
            <select
              value={role}
              onChange={(e) => {
                const r = e.target.value as "owner" | "viewer";
                updateRole(r);
                setRole(r);
                setRefresh((n) => n + 1);
              }}
            >
              <option value="owner">Owner</option>
              <option value="viewer">Viewer</option>
            </select>
          </label>
          <span className="mode-wrap">
            <button
              className="mode"
              aria-describedby="planner-reason"
              title={
                mode?.fallbackReason ??
                (mode?.plannerMode === "demo"
                  ? "Offline demo plans"
                  : "Plan a request to see its source")
              }
              aria-label={`Planner mode: ${mode?.plannerMode ?? "not used"}. ${mode?.fallbackReason ?? ""}`}
            >
              Planner:{" "}
              {mode
                ? mode.plannerMode === "gemini"
                  ? "live"
                  : mode.plannerMode === "supplied"
                    ? "supplied"
                    : "fallback"
                : "not used"}
            </button>
            <span role="tooltip" id="planner-reason">
              {mode?.fallbackReason ??
                (mode?.plannerMode === "demo"
                  ? "Offline demo plans"
                  : mode?.plannerMode === "gemini"
                    ? "Live Gemini plan"
                    : mode?.plannerMode === "supplied"
                      ? "Explicit supplied plan"
                      : "Plan a request to see its source")}
            </span>
          </span>
          <span className="simulation-note">
            Email, payments and webinar hosting are simulated.
          </span>
        </div>
      </header>
      <main className="workspace" id="main">
        {error && <ErrorState message={error} />}
        <div hidden={view !== "Agent"}>
          <Agent role={role} onMode={setMode} loadId={runId} />
        </div>
        {view === "Webinars" ? (
          <WebinarView />
        ) : view !== "Agent" ? (
          <DataView
            key={`${view}-${refresh}`}
            view={view}
            openRun={(id) => {
              setRunId(id);
              setView("Agent");
              location.hash = "Agent";
            }}
          />
        ) : null}
      </main>
    </>
  );
}

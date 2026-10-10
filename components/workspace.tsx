"use client";
import { useEffect, useState, useRef } from "react";
import { api, setRole, type Mode } from "@/lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, type ReactNode } from "react";

import { ErrorState } from "@/components/shared";
const tabs = [
  ["Agent", "/"],
  ["Live view", "/live"],
  ["Contacts", "/contacts"],
  ["Webinars", "/webinars"],
  ["Outbox", "/outbox"],
  ["Runs", "/runs"],
  ["Analytics", "/analytics"],
  ["Rules", "/rules"],
];
const WorkspaceContext = createContext({
  role: "owner" as "owner" | "viewer",
  onMode: (m: Mode) => {
    void m;
  },
  revision: 0,
  refresh: () => {},
});
export const useWorkspace = () => useContext(WorkspaceContext);
export function WorkspaceShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [role, updateRole] = useState<"owner" | "viewer">("owner");
  const [mode, setMode] = useState<Mode | null>(null);
  const [last, setLast] = useState("No tick run this session");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const menu = useRef<HTMLDialogElement>(null);
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
    });
    return () => {
      active = false;
    };
  }, []);
  return (
    <WorkspaceContext.Provider
      value={{
        role,
        onMode: setMode,
        revision: refresh,
        refresh: () => setRefresh((n) => n + 1),
      }}
    >
      <a className="skip" href="#main">
        Skip to workspace
      </a>
      <header>
        <div className="top-row">
          <Link className="wordmark" href="/">
            Nexus
          </Link>
          <div className="worker-controls">
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
          </div>
          <button
            className="menu-toggle"
            onClick={() => menu.current?.showModal()}
            aria-haspopup="dialog"
          >
            Menu
          </button>
        </div>
        <div className="utility">
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
      <dialog ref={menu} className="menu-overlay" aria-label="Workspace menu">
        <div className="menu-heading">
          <span className="wordmark">Nexus</span>
          <button onClick={() => menu.current?.close()}>Close menu</button>
        </div>
        <nav aria-label="Workspace">
          {tabs.map(([tab, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              onClick={() => menu.current?.close()}
            >
              <span>{tab}</span>
              <small>
                {
                  (
                    {
                      Agent: "Propose first. Approve second.",
                      "Live view": "Watch the business correct itself.",
                      Contacts: "Every customer, every decision.",
                      Webinars: "Bring people together.",
                      Runs: "Every action leaves a receipt.",
                      Outbox: "See what was sent. See what stopped.",
                      Rules: "Five rules. One promise.",
                      Analytics: "Count what actually happened.",
                    } as Record<string, string>
                  )[tab]
                }
              </small>
            </Link>
          ))}
        </nav>
        <div className="menu-settings">
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
        </div>
      </dialog>
      <main className="workspace" id="main">
        {error && <ErrorState message={error} />}
        {children}
      </main>
    </WorkspaceContext.Provider>
  );
}

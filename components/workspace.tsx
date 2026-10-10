"use client";
import { useEffect, useState, useRef } from "react";
import { api, setRole, type Mode } from "@/lib/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, type ReactNode } from "react";

import { ShellTicker } from "@/components/shell-ticker";
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
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeMenu = (href?: string) => {
    if (closeTimer.current) return;
    const finish = () => {
      menu.current?.close();
      setClosing(false);
      setMenuOpen(false);
      closeTimer.current = null;
      if (href) router.push(href);
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) finish();
    else {
      setClosing(true);
      closeTimer.current = setTimeout(finish, 600);
    }
  };
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );
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
            onClick={() => {
              setClosing(false);
              menu.current?.showModal();
              setMenuOpen(true);
            }}
            aria-expanded={menuOpen}
            aria-controls="workspace-menu"
            aria-haspopup="dialog"
          >
            <span>Menu</span>
            <i className="menu-lines" aria-hidden="true">
              <i />
              <i />
            </i>
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
      <dialog
        ref={menu}
        id="workspace-menu"
        className={`menu-overlay panel-menu ${closing ? "is-closing" : ""}`}
        onCancel={(e) => {
          e.preventDefault();
          closeMenu();
        }}
        aria-label="Workspace menu"
        onKeyDown={(e) => {
          if (e.key !== "Tab") return;
          const controls = Array.from(
            e.currentTarget.querySelectorAll<HTMLElement>(
              "button:not(:disabled), a[href], select:not(:disabled)",
            ),
          ).filter((el) => el.getClientRects().length > 0);
          const first = controls[0],
            last = controls.at(-1);
          if (e.shiftKey && document.activeElement === first && last) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last && first) {
            e.preventDefault();
            first.focus();
          }
        }}
      >
        <div className="menu-heading">
          <span className="wordmark">Nexus</span>
          <button className="menu-close" onClick={() => closeMenu()}>
            Close menu<span aria-hidden="true">×</span>
          </button>
        </div>
        <nav aria-label="Workspace">
          {tabs.map(([tab, href], index) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              style={{ "--panel-order": index } as React.CSSProperties}
              onClick={(e) => {
                if (
                  e.ctrlKey ||
                  e.metaKey ||
                  e.shiftKey ||
                  e.altKey ||
                  e.button !== 0
                )
                  return;
                e.preventDefault();
                closeMenu(href);
              }}
            >
              {/* Original local artwork, decorative rather than invented business data. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="panel-art"
                src={`/menu/${href === "/" ? "agent" : href.slice(1)}.svg`}
                alt=""
                width={800}
                height={1000}
              />
              <span className="panel-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="panel-title">
                <span>{tab}</span>
                <span aria-hidden="true">{tab}</span>
              </span>
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
      {path !== "/live" && <ShellTicker revision={refresh} />}
      <main className="workspace" id="main" key={path}>
        {error && <ErrorState message={error} />}
        {children}
        <section className="section scroll-territories" aria-label="Explore the workspace">
          <h2>One business.<br /><em>Every moving part.</em></h2>
          <nav aria-label="Explore screens">
            {tabs.map(([tab, href], index) => (
              <Link key={href} href={href} className="scroll-territory">
                <span className="territory-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="territory-name">{tab}<em aria-hidden="true">{tab}</em></span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/menu/${href === "/" ? "agent" : href.slice(1)}.svg`} alt="" width={800} height={1000} />
              </Link>
            ))}
          </nav>
        </section>
      </main>
    </WorkspaceContext.Provider>
  );
}

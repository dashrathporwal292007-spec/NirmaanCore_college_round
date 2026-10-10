import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNexus } from "../context/NexusContext.jsx";

const MODULES = [
  {
    label: "Overview",
    tab: "overview",
    icon: "dashboard",
    keywords: "home dashboard summary",
  },
  {
    label: "AI Command Center",
    tab: "ai-command-center",
    icon: "auto_awesome",
    keywords: "ai prompt assistant generate",
  },
  {
    label: "CRM Contacts",
    tab: "crm",
    icon: "group",
    keywords: "customers leads people contacts",
  },
  {
    label: "Websites",
    tab: "websites",
    icon: "language",
    keywords: "landing pages web",
  },
  {
    label: "Webinars",
    tab: "webinars",
    icon: "videocam",
    keywords: "events registrations students",
  },
  {
    label: "Marketing",
    tab: "marketing",
    icon: "campaign",
    keywords: "campaign email promotion",
  },
  {
    label: "Visual Workflow Builder",
    tab: "workflows",
    icon: "account_tree",
    keywords: "automation workflows processes",
  },
  {
    label: "Approvals",
    tab: "approvals",
    icon: "verified_user",
    keywords: "review approve pending",
  },
  {
    label: "Activity Logs",
    tab: "activity-logs",
    icon: "history",
    keywords: "audit history events logs",
  },
  {
    label: "Analytics",
    tab: "analytics",
    icon: "monitoring",
    keywords: "reports metrics insights",
  },
  {
    label: "Subscriptions",
    tab: "subscriptions",
    icon: "payments",
    keywords: "billing plans payments",
  },
];

export default function GlobalSearch({ open, onClose, onNavigate }) {
  const { contacts = [], activeWorkspace, setPromptText } = useNexus();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    setQuery("");
    setSelectedIndex(0);

    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const moduleResults = MODULES.filter((module) => {
      if (!normalizedQuery) return true;

      return `${module.label} ${module.keywords} ${module.tab}`
        .toLowerCase()
        .includes(normalizedQuery);
    }).map((module) => ({
      type: "module",
      id: `module-${module.tab}`,
      title: module.label,
      subtitle: "Navigate to module",
      icon: module.icon,
      tab: module.tab,
    }));

    const contactResults = (Array.isArray(contacts) ? contacts : [])
      .filter((contact) => {
        if (!normalizedQuery) return false;

        return [
          contact.name,
          contact.email,
          contact.company,
          contact.status,
          ...(Array.isArray(contact.tags) ? contact.tags : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .slice(0, 8)
      .map((contact) => ({
        type: "contact",
        id: `contact-${contact.id}`,
        title: contact.name || "Unnamed contact",
        subtitle: [contact.email, contact.company].filter(Boolean).join(" · "),
        icon: "person",
        tab: "crm",
      }));

    const commands = [
      {
        id: "command-new-contact",
        title: "Create a new contact",
        subtitle: "Open CRM and add a contact",
        icon: "person_add",
        tab: "crm",
        type: "command",
      },
      {
        id: "command-ai",
        title: "Generate a workflow with AI",
        subtitle: "Open the AI Command Center",
        icon: "auto_awesome",
        tab: "ai-command-center",
        type: "command",
      },
      {
        id: "command-approvals",
        title: "Review pending approvals",
        subtitle: "Open the approval queue",
        icon: "verified_user",
        tab: "approvals",
        type: "command",
      },
    ].filter((command) => {
      if (!normalizedQuery) return true;

      return `${command.title} ${command.subtitle}`
        .toLowerCase()
        .includes(normalizedQuery);
    });

    return [...moduleResults, ...contactResults, ...commands].slice(0, 12);
  }, [query, contacts]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((index) =>
          results.length ? (index + 1) % results.length : 0
        );
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((index) =>
          results.length ? (index - 1 + results.length) % results.length : 0
        );
      }

      if (event.key === "Enter" && results[selectedIndex]) {
        event.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, results, selectedIndex, onClose]);

  const handleSelect = (item) => {
    if (item.type === "contact") {
      onNavigate("crm");
    } else {
      if (item.id === "command-ai") {
        setPromptText?.("");
      }
      onNavigate(item.tab);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/40 px-4 pt-[12vh] backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global search and command palette"
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#E1E5EB] bg-white shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-[#E1E5EB] px-5">
          <span className="material-symbols-outlined text-[#697386]">search</span>

          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search NEXUS${activeWorkspace?.name ? ` in ${activeWorkspace.name}` : ""}...`}
            className="h-14 min-w-0 flex-1 bg-transparent text-sm text-[#20242C] outline-none placeholder:text-[#9AA3B2]"
          />

          <button
            onClick={onClose}
            className="rounded-md border border-[#E1E5EB] px-2 py-1 text-xs text-[#697386] hover:bg-[#F7F8FA]"
          >
            ESC
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-3">
          <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#9AA3B2]">
            {query ? "Search results" : "Quick navigation"}
          </p>

          {results.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-[#9AA3B2]">
                search_off
              </span>
              <p className="mt-3 text-sm font-medium text-[#20242C]">
                No results found
              </p>
              <p className="mt-1 text-xs text-[#697386]">
                Try another search term.
              </p>
            </div>
          ) : (
            results.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                  selectedIndex === index
                    ? "bg-[#EEF2FF]"
                    : "hover:bg-[#F7F8FA]"
                }`}
              >
                <span
                  className={`material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    selectedIndex === index
                      ? "bg-white text-[#3659C9]"
                      : "bg-[#F1F3F6] text-[#697386]"
                  }`}
                >
                  {item.icon}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-[#20242C]">
                    {item.title}
                  </span>
                  <span className="mt-1 block truncate text-xs text-[#697386]">
                    {item.subtitle}
                  </span>
                </span>

                <span className="text-[10px] uppercase tracking-wide text-[#9AA3B2]">
                  {item.type === "contact"
                    ? "Contact"
                    : item.type === "command"
                      ? "Command"
                      : "Module"}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#E1E5EB] bg-[#FAFBFC] px-5 py-3 text-[11px] text-[#697386]">
          <span>
            <kbd className="rounded border border-[#D8DDE5] bg-white px-1.5 py-0.5">
              ↑
            </kbd>{" "}
            <kbd className="rounded border border-[#D8DDE5] bg-white px-1.5 py-0.5">
              ↓
            </kbd>{" "}
            Navigate
          </span>
          <span>
            <kbd className="rounded border border-[#D8DDE5] bg-white px-1.5 py-0.5">
              ↵
            </kbd>{" "}
            Open
          </span>
          <span>
            <kbd className="rounded border border-[#D8DDE5] bg-white px-1.5 py-0.5">
              ESC
            </kbd>{" "}
            Close
          </span>
          <span className="ml-auto">NEXUS Command Palette</span>
        </div>
      </div>
    </div>
  );
}


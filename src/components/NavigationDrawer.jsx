import React from "react";
import { useNexus } from "../context/NexusContext.jsx";

export default function NavigationDrawer({
  isOpen,
  onClose,
  currentTab,
  onNavigateTab,
}) {
  const { pendingApprovalsCount, resetDemoState } = useNexus();

  // Navigate to a page and close the drawer.
  const handleNav = (tab) => {
    if (typeof onNavigateTab === "function") {
      onNavigateTab(tab);
    }

    onClose();
  };

  // Reusable navigation item.
  const MenuItem = ({
    label,
    icon,
    tab,
    badge,
    badgeStyle = "",
  }) => {
    const isActive = currentTab === tab;

    return (
      <button
        type="button"
        onClick={() => handleNav(tab)}
        aria-current={isActive ? "page" : undefined}
        className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left transition-colors duration-150 ${
          isActive
            ? "bg-[#EAF0FF] font-medium text-[#3659C9]"
            : "text-[#465064] hover:bg-[#F1F3F6] hover:text-[#20242C]"
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">
            {icon}
          </span>

          <span className="truncate text-sm">{label}</span>
        </span>

        {badge && (
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${badgeStyle}`}
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close navigation menu"
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* Navigation Drawer */}
      <aside
        id="nexus-navigation-drawer"
        aria-label="NEXUS navigation"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 left-0 z-[60] flex w-72 max-w-[85vw] flex-col border-r border-[#E1E5EB] bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#E1E5EB] px-5">
          <div className="flex items-center gap-2">
            <img
              alt=""
              aria-hidden="true"
              className="h-7 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida/AEtjO1WGgaOz44aWrsvH2Qleb7JLGDKgKqkwtDMlNTUKZwKqvJ1LdrdEsNfALD0gBCkknAYNw9h__0RtmpKeMx2OX8u90e-4vTK32h2fF11cVp0cI_E2I55q-7HYiDdXQp0MJK7vD_JHM8OuHoYi2CNbtgH8WPIDahW8fmfcZUZWofaiaVPJTmec8SUyYQ9sxYldC2id4Au8pPfGYRX14IGSBsqhGvGSkPbi4P1o5OpHDdVO0Y3Qt4gsawAxZseq"
            />

            <span className="text-base font-semibold tracking-wide text-[#20242C]">
              NEXUS
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-md text-[#697386] transition-colors hover:bg-[#F1F3F6] hover:text-[#20242C]"
          >
            <span className="material-symbols-outlined text-[21px]">
              close
            </span>
          </button>
        </div>

        {/* Drawer Menu */}
        <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {/* Workspace */}
          <section>
            <h2 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9299A5]">
              Workspace
            </h2>

            <div className="space-y-1">
              <MenuItem
                label="Overview"
                icon="space_dashboard"
                tab="overview"
              />

              <MenuItem
                label="AI Command Center"
                icon="smart_toy"
                tab="ai-command-center"
              />
            </div>
          </section>

          {/* Manage */}
          <section>
            <h2 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9299A5]">
              Manage
            </h2>

            <div className="space-y-1">
              <MenuItem
                label="CRM"
                icon="groups"
                tab="crm"
              />

              <MenuItem
                label="Websites"
                icon="language"
                tab="websites"
                badgeStyle="bg-[#F1F3F6] text-[#697386]"
              />

              <MenuItem
                label="Webinars"
                icon="videocam"
                tab="webinars"
                badgeStyle="bg-[#F1F3F6] text-[#697386]"
              />

              <MenuItem
                label="Marketing"
                icon="campaign"
                tab="marketing"
                badge={
                  pendingApprovalsCount > 0
                    ? `${pendingApprovalsCount} pending`
                    : undefined
                }
                badgeStyle="bg-[#FFF7E6] text-[#956000]"
              />

              <MenuItem
                label="Subscriptions"
                icon="credit_card"
                tab="subscriptions"
                badge="Coming soon"
                badgeStyle="bg-[#F1F3F6] text-[#697386]"
              />
            </div>
          </section>

          {/* Automation */}
          <section>
            <h2 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9299A5]">
              Automation
            </h2>

            <div className="space-y-1">
              {/* NEW: Visual Workflow Builder */}
              <MenuItem
                label="Visual Workflow Builder"
                icon="account_tree"
                tab="workflows"
                badge="Builder"
                badgeStyle="bg-[#EAF0FF] text-[#3659C9]"
              />

              <MenuItem
                label="Approvals"
                icon="verified"
                tab="approvals"
                badge={
                  pendingApprovalsCount > 0
                    ? `${pendingApprovalsCount} req`
                    : "0"
                }
                badgeStyle={
                  pendingApprovalsCount > 0
                    ? "bg-[#FFF7E6] text-[#956000]"
                    : "bg-[#E8F5EE] text-[#21865B]"
                }
              />

              <MenuItem
                label="Activity Logs"
                icon="receipt_long"
                tab="activity-logs"
              />
            </div>
          </section>

          {/* Insights */}
          <section>
            <h2 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9299A5]">
              Insights
            </h2>

            <div className="space-y-1">
              <MenuItem
                label="Analytics"
                icon="monitoring"
                tab="analytics"
              />
            </div>
          </section>
        </div>

        {/* Drawer Footer */}
        <div className="shrink-0 border-t border-[#E1E5EB] bg-[#F7F8FA] p-4">
          <div className="mb-3 flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[19px] text-[#697386]">
                business
              </span>

              <span className="text-sm font-medium text-[#20242C]">
                Acme Corp
              </span>
            </div>

            <span className="text-xs text-[#697386]">
              Pro Plan
            </span>
          </div>

          {/* Reset Demo */}
          <button
            type="button"
            onClick={() => {
              const shouldReset = window.confirm(
                "Reset the demo to its initial state? This will clear your current demo changes."
              );

              if (shouldReset) {
                resetDemoState();
                onClose();
              }
            }}
            className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-[#465064] transition-colors hover:bg-white hover:text-[#3659C9]"
          >
            <span className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[19px]">
                restart_alt
              </span>

              <span className="text-sm">
                Reset Demo State
              </span>
            </span>

            <span className="rounded bg-[#EAF0FF] px-1.5 py-0.5 text-[10px] font-medium text-[#3659C9]">
              Demo
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}

import React from 'react';
import { useNexus } from '../context/NexusContext.jsx';

export default function BottomNav({ currentTab, onSelectTab }) {
  const { pendingApprovalsCount } = useNexus();

  const handleApprovalsClick = () => {
    onSelectTab('overview');

    // Scroll to the approvals section after returning to Overview.
    window.setTimeout(() => {
      const element = document.getElementById(
        'pending-approvals-section'
      );

      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 200);
  };

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'space_dashboard',
    },
    {
      id: 'ai-command-center',
      label: 'AI Agent',
      icon: 'smart_toy',
    },
    {
      id: 'crm',
      label: 'CRM',
      icon: 'groups',
    },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E1E5EB] bg-white pb-safe"
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-around px-3">

        {/* Overview, AI Agent and CRM */}
        {navItems.map((item) => {
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex h-12 min-w-[64px] flex-col items-center justify-center gap-1 rounded-md px-3 transition-colors duration-150 ${
                isActive
                  ? 'font-semibold text-[#3659C9]'
                  : 'text-[#697386] hover:bg-[#F7F8FA] hover:text-[#20242C]'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {item.icon}
              </span>

              <span className="text-[11px] leading-tight">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Approvals */}
        <button
          type="button"
          onClick={handleApprovalsClick}
          className="flex h-12 min-w-[64px] flex-col items-center justify-center gap-1 rounded-md px-3 text-[#697386] transition-colors duration-150 hover:bg-[#F7F8FA] hover:text-[#20242C]"
        >
          <span className="relative">
            <span className="material-symbols-outlined text-[22px]">
              verified
            </span>

            {pendingApprovalsCount > 0 && (
              <span
                aria-label={`${pendingApprovalsCount} pending approvals`}
                className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-[#F59E0B] ring-2 ring-white"
              />
            )}
          </span>

          <span className="text-[11px] leading-tight">
            Approvals
          </span>
        </button>

      </div>
    </nav>
  );
}
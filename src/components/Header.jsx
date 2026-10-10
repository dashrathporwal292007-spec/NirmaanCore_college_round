import React, { useEffect, useRef, useState } from 'react';
import { useNexus } from '../context/NexusContext';

const initialNotifications = [
  {
    id: 1,
    title: 'Approval required',
    message: 'Review the pending AI-generated action.',
    time: 'Recently',
    icon: 'fact_check',
    unread: true,
  },
  {
    id: 2,
    title: 'NEXUS is ready',
    message: 'Your workspace is running in demo mode.',
    time: 'Today',
    icon: 'check_circle',
    unread: true,
  },
  {
    id: 3,
    title: 'CRM workspace',
    message: 'Manage your contacts from the CRM section.',
    time: 'Today',
    icon: 'groups',
    unread: false,
  },
];

const PROFILE_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDNCeXJIztQO1NpzXlvhFEsg_YDXT8Durt2yeV30bv7mpNJhJs5Amfi1-GucD0h49wRLJ_fwbFHCoJh7xJYvTFLs7qWIvxpFMGQASR4XUbSSHZIgIdXeQRgbpbb802G8jFfFs6wDjXLrWAo2KeUXQL6tbMBbRu6_uTQcH7gark20kWcHCOuQo1HxtncGJjgVlyesxm8_jLiCfTAfZJ8i6KGZYKVvNSN2XmUFYgmKgOZbcbGc1IJKQ6_eg';

const WORKSPACE_ICONS = {
  acme: 'business',
  marketing: 'campaign',
  webinars: 'video_camera_front',
  demo: 'science',
};

export default function Header({ currentTab, onOpenMenu }) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [notifications, setNotifications] = useState(initialNotifications);

  const headerRef = useRef(null);

  const {
    workspaces = [],
    activeWorkspace,
    activeWorkspaceId,
    switchWorkspace,
  } = useNexus();

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  const getPageTitle = () => {
    switch (currentTab) {
      case 'overview':
        return 'Overview';
      case 'ai-command-center':
        return 'AI Command Center';
      case 'crm':
        return 'CRM';
      default:
        return 'Overview';
    }
  };

  // Close dropdowns only when clicking outside the entire header.
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target)
      ) {
        setActiveDropdown(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const toggleDropdown = (dropdown) => {
    setActiveDropdown((current) =>
      current === dropdown ? null : dropdown
    );
  };

  const handleWorkspaceSwitch = (workspaceId) => {
    if (typeof switchWorkspace !== 'function') {
      console.error(
        'NEXUS: switchWorkspace is missing from NexusContext.'
      );
      return;
    }

    switchWorkspace(workspaceId);
    setActiveDropdown(null);
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };

  const markAsRead = (notificationId) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, unread: false }
          : notification
      )
    );
  };

  const renderBackButton = () => (
    <button
      type="button"
      onClick={() => setActiveDropdown('profile')}
      className="mb-4 flex items-center gap-1 text-xs font-medium text-[#3659C9] hover:underline"
    >
      <span className="material-symbols-outlined text-base">
        arrow_back
      </span>
      Back to profile
    </button>
  );

  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-40 w-full border-b border-[#E1E5EB] bg-white"
    >
      {/* Main Header */}
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">

        {/* Left: Menu, Branding and Workspace */}
        <div className="flex min-w-0 flex-1 items-center gap-3">

          {/* Menu Button */}
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open navigation menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#E1E5EB] bg-white text-[#20242C] transition-colors hover:bg-[#F7F8FA] active:bg-[#ECEFF3]"
          >
            <span className="material-symbols-outlined text-[22px]">
              menu
            </span>
          </button>

          {/* NEXUS Branding */}
          <div className="flex min-w-0 items-center gap-2">
            <img
              alt="NEXUS Logo"
              className="h-7 w-auto shrink-0 object-contain"
              src="https://lh3.googleusercontent.com/aida/AEtjO1WGgaOz44aWrsvH2Qleb7JLGDKgKqkwtDMlNTUKZwKqvJ1LdrdEsNfALD0gBCkknAYNw9h__0RtmpKeMx2OX8u90e-4vTK32h2fF11cVp0cI_E2I55q-7HYiDdXQp0MJK7vD_JHM8OuHoYi2CNbtgH8WPIDahW8fmfcZUZWofaiaVPJTmec8SUyYQ9sxYldC2id4Au8pPfGYRX14IGSBsqhGvGSkPbi4P1o5OpHDdVO0Y3Qt4gsawAxZseq"
            />

            <span className="whitespace-nowrap text-base font-semibold tracking-wide text-[#20242C]">
              NEXUS
            </span>
          </div>

          {/* Workspace Selector: Desktop */}
          <div className="hidden h-6 w-px shrink-0 bg-[#E1E5EB] lg:block" />

          <div className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => toggleDropdown('workspace')}
              aria-label="Switch workspace"
              aria-expanded={activeDropdown === 'workspace'}
              className="flex max-w-[220px] items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-[#F7F8FA]"
            >
              <span className="material-symbols-outlined text-[19px] text-[#697386]">
                domain
              </span>

              <span className="max-w-[150px] truncate text-sm font-medium text-[#697386]">
                {activeWorkspace?.name || 'Select Workspace'}
              </span>

              <span className="material-symbols-outlined text-[18px] text-[#697386]">
                expand_more
              </span>
            </button>

            {/* Workspace Dropdown */}
            {activeDropdown === 'workspace' && (
              <div
                role="dialog"
                aria-label="Switch workspace"
                className="absolute left-0 top-full z-[80] mt-2 w-72 overflow-hidden rounded-xl border border-[#E1E5EB] bg-white shadow-xl"
              >
                <div className="border-b border-[#E1E5EB] px-4 py-3">
                  <p className="text-xs text-[#697386]">
                    Current workspace
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#20242C]">
                    {activeWorkspace?.name || 'Select Workspace'}
                  </p>
                </div>

                <div className="p-2">
                  {workspaces.length > 0 ? (
                    workspaces.map((workspace) => {
                      const selected =
                        workspace.id === activeWorkspaceId;

                      return (
                        <button
                          key={workspace.id}
                          type="button"
                          onClick={() =>
                            handleWorkspaceSwitch(workspace.id)
                          }
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                            selected
                              ? 'bg-[#F0F3FF]'
                              : 'hover:bg-[#F7F8FA]'
                          }`}
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              selected
                                ? 'bg-white text-[#3659C9]'
                                : 'bg-[#F7F8FA] text-[#697386]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {WORKSPACE_ICONS[workspace.id] || 'domain'}
                            </span>
                          </span>

                          <span className="min-w-0 flex-1">
                            <span
                              className={`block truncate text-sm ${
                                selected
                                  ? 'font-semibold text-[#3659C9]'
                                  : 'font-medium text-[#20242C]'
                              }`}
                            >
                              {workspace.name}
                            </span>

                            <span className="mt-0.5 block text-xs text-[#8992A2]">
                              {workspace.description}
                            </span>
                          </span>

                          {selected && (
                            <span className="material-symbols-outlined text-[20px] text-[#21865B]">
                              check_circle
                            </span>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <p className="px-3 py-4 text-sm text-[#697386]">
                      No workspaces found.
                    </p>
                  )}
                </div>

                <div className="border-t border-[#E1E5EB] bg-[#F7F8FA] px-4 py-2">
                  <p className="text-center text-[11px] text-[#697386]">
                    NEXUS Workspace Management
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Notifications and Profile */}
        <div className="relative flex shrink-0 items-center gap-1 sm:gap-2">

          {/* Notifications Button */}
          <button
            type="button"
            onClick={() => toggleDropdown('notifications')}
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={activeDropdown === 'notifications'}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[#697386] transition-colors hover:bg-[#F7F8FA] hover:text-[#20242C]"
          >
            <span className="material-symbols-outlined text-[22px]">
              notifications
            </span>

            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#3659C9] ring-2 ring-white" />
            )}
          </button>

          {/* Profile Button */}
          <button
            type="button"
            onClick={() => toggleDropdown('profile')}
            aria-label="Open profile menu"
            aria-expanded={activeDropdown === 'profile'}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[#F7F8FA]"
          >
            <img
              alt="Profile"
              className="h-8 w-8 rounded-full border border-[#E1E5EB] object-cover"
              src={PROFILE_IMAGE}
            />
          </button>

          {/* Notifications Dropdown */}
          {activeDropdown === 'notifications' && (
            <div
              role="dialog"
              aria-label="Notifications"
              className="absolute right-0 top-12 z-[70] w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-xl border border-[#E1E5EB] bg-white shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-[#E1E5EB] px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-[#20242C]">
                    Notifications
                  </h2>

                  <p className="mt-0.5 text-xs text-[#697386]">
                    {unreadCount > 0
                      ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                      : 'You are all caught up'}
                  </p>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="rounded-md px-2 py-1.5 text-xs font-medium text-[#3659C9] hover:bg-[#F0F3FF]"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-[320px] overflow-y-auto">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => markAsRead(notification.id)}
                    className="flex w-full items-start gap-3 border-b border-[#ECEFF3] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[#F7F8FA]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F0F3FF] text-[#3659C9]">
                      <span className="material-symbols-outlined text-[20px]">
                        {notification.icon}
                      </span>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#20242C]">
                          {notification.title}
                        </span>

                        {notification.unread && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3659C9]" />
                        )}
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-[#697386]">
                        {notification.message}
                      </span>

                      <span className="mt-1 block text-[11px] text-[#8992A2]">
                        {notification.time}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="border-t border-[#E1E5EB] bg-[#F7F8FA] px-4 py-2">
                <p className="text-center text-[11px] text-[#697386]">
                  NEXUS Demo Notifications
                </p>
              </div>
            </div>
          )}

          {/* Profile Dropdown */}
          {activeDropdown === 'profile' && (
            <div className="absolute right-0 top-12 z-[70] w-[min(280px,calc(100vw-32px))] overflow-hidden rounded-xl border border-[#E1E5EB] bg-white shadow-xl">
              <div className="flex items-center gap-3 border-b border-[#E1E5EB] px-4 py-4">
                <img
                  alt="Profile"
                  className="h-11 w-11 rounded-full border border-[#E1E5EB] object-cover"
                  src={PROFILE_IMAGE}
                />

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#20242C]">
                    Vaibhav Singh
                  </p>

                  <p className="mt-0.5 text-xs text-[#697386]">
                    Workspace Administrator
                  </p>
                </div>
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={() => setActiveDropdown('account')}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#20242C] transition-colors hover:bg-[#F7F8FA]"
                >
                  <span className="material-symbols-outlined text-[20px] text-[#697386]">
                    account_circle
                  </span>
                  Account information
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDropdown('settings')}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#20242C] transition-colors hover:bg-[#F7F8FA]"
                >
                  <span className="material-symbols-outlined text-[20px] text-[#697386]">
                    settings
                  </span>
                  Settings
                </button>
              </div>

              <div className="border-t border-[#E1E5EB] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#21865B]" />
                  <span className="text-xs font-medium text-[#697386]">
                    Demo Environment
                  </span>
                </div>

                <p className="mt-1.5 text-[11px] leading-4 text-[#8992A2]">
                  Profile details are for demonstration purposes.
                </p>
              </div>
            </div>
          )}

          {/* Account Information */}
          {activeDropdown === 'account' && (
            <div className="absolute right-0 top-12 z-[70] w-[min(300px,calc(100vw-32px))] rounded-xl border border-[#E1E5EB] bg-white p-4 shadow-xl">
              {renderBackButton()}

              <h2 className="text-sm font-semibold text-[#20242C]">
                Account information
              </h2>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs text-[#697386]">Name</p>
                  <p className="mt-1 text-sm text-[#20242C]">
                    Vaibhav Singh
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#697386]">Role</p>
                  <p className="mt-1 text-sm text-[#20242C]">
                    Workspace Administrator
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#697386]">Workspace</p>
                  <p className="mt-1 text-sm text-[#20242C]">
                    {activeWorkspace?.name || 'No workspace selected'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Settings */}
          {activeDropdown === 'settings' && (
            <div className="absolute right-0 top-12 z-[70] w-[min(300px,calc(100vw-32px))] rounded-xl border border-[#E1E5EB] bg-white p-4 shadow-xl">
              {renderBackButton()}

              <h2 className="text-sm font-semibold text-[#20242C]">
                Workspace Settings
              </h2>

              <p className="mt-2 text-xs leading-5 text-[#697386]">
                This demo workspace uses predefined settings. Editable
                account and security settings can be connected when
                backend support is added.
              </p>

              <div className="mt-4 rounded-lg border border-[#E1E5EB] bg-[#F7F8FA] p-3">
                <p className="text-xs font-medium text-[#20242C]">
                  Environment
                </p>

                <p className="mt-1 text-xs text-[#697386]">
                  Demo mode enabled
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Page Title */}
      <div className="flex min-h-[52px] items-center justify-between gap-3 border-t border-[#ECEFF3] px-4 py-3 sm:px-6">
        <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight text-[#20242C] sm:text-xl">
          {getPageTitle()}
        </h1>

        <span className="inline-flex shrink-0 items-center gap-2 rounded-md border border-[#E1E5EB] bg-[#F7F8FA] px-2 py-1 text-[11px] font-medium text-[#697386] sm:px-2.5 sm:text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-[#21865B]" />
          Demo Environment
        </span>
      </div>
    </header>
  );
}

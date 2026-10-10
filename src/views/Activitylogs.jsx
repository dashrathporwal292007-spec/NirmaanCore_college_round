import React, { useState, useMemo } from 'react';
import { useNexus } from '../context/NexusContext.jsx';

export default function Activitylogs() {
  const { activities = [], auditLogs = [], activeWorkspace } = useNexus();
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Combine activities and audit logs into a unified timeline
  const combinedLogs = useMemo(() => {
    const list = [];

    // Map activities
    activities.forEach((act) => {
      list.push({
        id: act.id,
        title: act.title,
        highlight: act.highlight || '',
        meta: act.meta || 'Recent • System',
        icon: act.icon || 'receipt_long',
        iconColor: act.iconColor || 'text-primary',
        category: act.url ? 'web' : act.title.toLowerCase().includes('crm') ? 'crm' : 'agent',
        badge: act.url ? 'Web Page' : act.highlight ? 'Sync Event' : 'Task',
        badgeColor: 'bg-[#EAF0FF] text-[#3659C9]',
        timestamp: 'Recent',
      });
    });

    // Map audit logs
    auditLogs.forEach((aud) => {
      list.push({
        id: aud.id,
        title: aud.entityName || 'System Entity Mutation',
        highlight: aud.meta || '',
        meta: `${aud.meta} • Audit Trail`,
        icon: aud.badge === 'Webinars' ? 'videocam' : 'verified_user',
        iconColor: 'text-[#21865B]',
        category: 'audit',
        badge: aud.badge || 'Audit Log',
        badgeColor: aud.badgeType === 'neutral' ? 'bg-[#F1F3F6] text-[#697386]' : 'bg-[#E8F5EE] text-[#21865B]',
        timestamp: 'Verified',
      });
    });

    // Filter by type
    return list.filter((item) => {
      const matchesCategory =
        filterType === 'all' ||
        (filterType === 'agent' && item.category === 'agent') ||
        (filterType === 'crm' && item.category === 'crm') ||
        (filterType === 'audit' && item.category === 'audit') ||
        (filterType === 'web' && item.category === 'web');

      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.meta.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.highlight.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [activities, auditLogs, filterType, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E1E5EB] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-[#3659C9]">receipt_long</span>
            <h1 className="text-xl font-bold text-[#20242C]">Activity & Audit Logs</h1>
          </div>
          <p className="mt-1 text-xs text-[#697386]">
            Immutable chronological ledger of AI dispatches, entity mutations, and security checkpoints in{' '}
            <span className="font-semibold text-[#20242C]">{activeWorkspace?.name || 'Workspace'}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5EE] px-3 py-1 text-xs font-semibold text-[#21865B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#21865B] animate-pulse"></span>
            Real-time Audit Active
          </span>
        </div>
      </div>

      {/* METRIC HIGHLIGHTS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E1E5EB] bg-white p-4 shadow-sm">
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#9299A5]">Total Logged</div>
          <div className="mt-1 text-2xl font-bold text-[#20242C]">{activities.length + auditLogs.length}</div>
          <div className="mt-1 text-[11px] text-[#21865B]">Verified events</div>
        </div>

        <div className="rounded-xl border border-[#E1E5EB] bg-white p-4 shadow-sm">
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#9299A5]">Audit Checkpoints</div>
          <div className="mt-1 text-2xl font-bold text-[#3659C9]">{auditLogs.length}</div>
          <div className="mt-1 text-[11px] text-[#697386]">State mutations</div>
        </div>

        <div className="rounded-xl border border-[#E1E5EB] bg-white p-4 shadow-sm">
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#9299A5]">Agent Operations</div>
          <div className="mt-1 text-2xl font-bold text-[#20242C]">{activities.length}</div>
          <div className="mt-1 text-[11px] text-[#21865B]">Autonomous runs</div>
        </div>

        <div className="rounded-xl border border-[#E1E5EB] bg-white p-4 shadow-sm">
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#9299A5]">ACID Guarantee</div>
          <div className="mt-1 text-2xl font-bold text-[#21865B]">100%</div>
          <div className="mt-1 text-[11px] text-[#697386]">Atomic rollback ready</div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-[#E1E5EB] bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterType('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-[#3659C9] text-white shadow-sm'
                : 'text-[#697386] hover:bg-[#F1F3F6] hover:text-[#20242C]'
            }`}
          >
            All Logs ({activities.length + auditLogs.length})
          </button>
          <button
            onClick={() => setFilterType('agent')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filterType === 'agent'
                ? 'bg-[#3659C9] text-white shadow-sm'
                : 'text-[#697386] hover:bg-[#F1F3F6] hover:text-[#20242C]'
            }`}
          >
            AI Agent
          </button>
          <button
            onClick={() => setFilterType('crm')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filterType === 'crm'
                ? 'bg-[#3659C9] text-white shadow-sm'
                : 'text-[#697386] hover:bg-[#F1F3F6] hover:text-[#20242C]'
            }`}
          >
            CRM Sync
          </button>
          <button
            onClick={() => setFilterType('audit')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filterType === 'audit'
                ? 'bg-[#3659C9] text-white shadow-sm'
                : 'text-[#697386] hover:bg-[#F1F3F6] hover:text-[#20242C]'
            }`}
          >
            Audit Checkpoints
          </button>
        </div>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-lg text-[#9299A5]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities & entities..."
            className="w-full sm:w-64 rounded-lg border border-[#E1E5EB] bg-[#F7F8FA] pl-8 pr-3 py-1.5 text-xs text-[#20242C] placeholder-[#9299A5] focus:border-[#3659C9] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* ACTIVITY FEED TABLE */}
      <div className="rounded-xl border border-[#E1E5EB] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#E1E5EB] bg-[#F7F8FA] px-5 py-3 flex justify-between items-center text-xs font-semibold text-[#697386] uppercase tracking-wider">
          <span>Action & Entity</span>
          <span className="hidden sm:inline">Classification</span>
        </div>

        <div className="divide-y divide-[#E1E5EB]">
          {combinedLogs.length > 0 ? (
            combinedLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start sm:items-center justify-between p-4 hover:bg-[#F9FAFC] transition-colors gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F1F3F6] text-[#465064]">
                    <span className="material-symbols-outlined text-[20px]">{log.icon}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#20242C]">{log.title}</span>
                      {log.highlight && (
                        <span className="rounded bg-[#EAF0FF] px-2 py-0.5 text-[10px] font-medium text-[#3659C9]">
                          {log.highlight}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[#697386]">{log.meta}</p>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col sm:flex-row items-end sm:items-center gap-2">
                  <span className={`rounded-md px-2.5 py-1 text-[11px] font-medium ${log.badgeColor}`}>
                    {log.badge}
                  </span>
                  <span className="text-[11px] font-mono text-[#9299A5]">{log.timestamp}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-[#697386]">
              <span className="material-symbols-outlined text-4xl text-[#9299A5]">find_in_page</span>
              <p className="mt-2 text-sm font-medium text-[#20242C]">No matching activity logs</p>
              <p className="mt-1 text-xs">Try adjusting your search terms or filter criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

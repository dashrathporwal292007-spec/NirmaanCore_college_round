import React, { useMemo } from 'react';
import { useNexus } from '../context/NexusContext.jsx';

export default function Analytics() {
  const {
    totalContacts = 0,
    qualifiedContacts = 0,
    customerContacts = 0,
    leadContacts = 0,
    webinar = { capacity: 100, seatsClaimed: 0 },
    activeCampaignsCount = 0,
    workflowRate = 94,
    contacts = [],
    activeWorkspace,
  } = useNexus();

  // Compute conversion rates and distribution metrics
  const stats = useMemo(() => {
    const conversionRate = totalContacts > 0 ? Math.round((customerContacts / totalContacts) * 100) : 0;
    const qualificationRate = totalContacts > 0 ? Math.round((qualifiedContacts / totalContacts) * 100) : 0;
    const fillRate = webinar.capacity > 0 ? Math.min(100, Math.round((webinar.seatsClaimed / webinar.capacity) * 100)) : 0;

    // Source breakdown
    const sources = {};
    contacts.forEach((c) => {
      const src = c.source ? c.source.split(' ')[0] : 'Inbound';
      sources[src] = (sources[src] || 0) + 1;
    });

    // Score segments
    const highIntent = contacts.filter((c) => Number(c.score || 0) >= 80).length;
    const mediumIntent = contacts.filter((c) => Number(c.score || 0) >= 50 && Number(c.score || 0) < 80).length;
    const nurturing = contacts.filter((c) => Number(c.score || 0) < 50).length;

    return {
      conversionRate,
      qualificationRate,
      fillRate,
      sources,
      highIntent,
      mediumIntent,
      nurturing,
    };
  }, [totalContacts, qualifiedContacts, customerContacts, webinar, contacts]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E1E5EB] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-[#3659C9]">monitoring</span>
            <h1 className="text-xl font-bold text-[#20242C]">Platform Analytics & Insights</h1>
          </div>
          <p className="mt-1 text-xs text-[#697386]">
            Real-time pipeline metrics, conversion velocity, and autonomous agent performance for{' '}
            <span className="font-semibold text-[#20242C]">{activeWorkspace?.name || 'Workspace'}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-[#E1E5EB] bg-white px-3 py-1.5 text-xs font-medium text-[#465064] shadow-sm">
            Live Database Sync: Active
          </span>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E1E5EB] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#9299A5]">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Pipeline</span>
            <span className="material-symbols-outlined text-lg">groups</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#20242C]">{totalContacts}</div>
          <div className="mt-1 text-[11px] text-[#21865B]">
            {qualifiedContacts} qualified • {customerContacts} customers
          </div>
        </div>

        <div className="rounded-xl border border-[#E1E5EB] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#9299A5]">
            <span className="text-[11px] font-medium uppercase tracking-wider">Customer Conversion</span>
            <span className="material-symbols-outlined text-lg text-[#21865B]">trending_up</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#21865B]">{stats.conversionRate}%</div>
          <div className="mt-1 text-[11px] text-[#697386]">
            {stats.qualificationRate}% qualification velocity
          </div>
        </div>

        <div className="rounded-xl border border-[#E1E5EB] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#9299A5]">
            <span className="text-[11px] font-medium uppercase tracking-wider">Webinar Capacity</span>
            <span className="material-symbols-outlined text-lg text-[#3659C9]">event_seat</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#3659C9]">{stats.fillRate}%</div>
          <div className="mt-1 text-[11px] text-[#697386]">
            {webinar.seatsClaimed} / {webinar.capacity} seats filled
          </div>
        </div>

        <div className="rounded-xl border border-[#E1E5EB] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#9299A5]">
            <span className="text-[11px] font-medium uppercase tracking-wider">Agent Efficiency</span>
            <span className="material-symbols-outlined text-lg text-amber-500">bolt</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#20242C]">{workflowRate}%</div>
          <div className="mt-1 text-[11px] text-[#21865B]">Zero unverified mutations</div>
        </div>
      </div>

      {/* DETAILED GRAPHS & FUNNELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PIPELINE CONVERSION FUNNEL */}
        <div className="rounded-xl border border-[#E1E5EB] bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E1E5EB] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#20242C]">Lifecycle Conversion Funnel</h2>
              <p className="text-xs text-[#697386]">Stage progression from lead capture to paying customer</p>
            </div>
            <span className="rounded bg-[#EAF0FF] px-2 py-0.5 text-[11px] font-semibold text-[#3659C9]">
              4 Stages
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {/* Stage 1: Inbound Leads */}
            <div>
              <div className="flex justify-between text-xs font-medium text-[#465064] mb-1">
                <span>Inbound Inquiries & Leads</span>
                <span className="font-bold text-[#20242C]">{leadContacts} (100%)</span>
              </div>
              <div className="h-3 w-full rounded-full bg-[#F1F3F6] overflow-hidden">
                <div className="h-full bg-[#3659C9] rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Stage 2: Qualified Leads */}
            <div>
              <div className="flex justify-between text-xs font-medium text-[#465064] mb-1">
                <span>Qualified Decision-Makers</span>
                <span className="font-bold text-[#20242C]">
                  {qualifiedContacts} ({stats.qualificationRate}%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-[#F1F3F6] overflow-hidden">
                <div
                  className="h-full bg-[#5C7CE6] rounded-full"
                  style={{ width: `${Math.max(10, stats.qualificationRate)}%` }}
                ></div>
              </div>
            </div>

            {/* Stage 3: Webinar Attendees */}
            <div>
              <div className="flex justify-between text-xs font-medium text-[#465064] mb-1">
                <span>Webinar Registrants</span>
                <span className="font-bold text-[#20242C]">
                  {webinar.seatsClaimed} ({stats.fillRate}%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-[#F1F3F6] overflow-hidden">
                <div
                  className="h-full bg-[#8EAAFF] rounded-full"
                  style={{ width: `${Math.max(8, stats.fillRate)}%` }}
                ></div>
              </div>
            </div>

            {/* Stage 4: Converted Customers */}
            <div>
              <div className="flex justify-between text-xs font-medium text-[#465064] mb-1">
                <span>Converted Customers</span>
                <span className="font-bold text-[#21865B]">
                  {customerContacts} ({stats.conversionRate}%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-[#F1F3F6] overflow-hidden">
                <div
                  className="h-full bg-[#21865B] rounded-full"
                  style={{ width: `${Math.max(5, stats.conversionRate)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* INTENT SCORE & CHANNEL ACQUISITION */}
        <div className="rounded-xl border border-[#E1E5EB] bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E1E5EB] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#20242C]">Lead Intent Scoring Breakdown</h2>
              <p className="text-xs text-[#697386]">AI propensity score calculated from touchpoints</p>
            </div>
            <span className="rounded bg-[#E8F5EE] px-2 py-0.5 text-[11px] font-semibold text-[#21865B]">
              Propensity Engine
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="rounded-lg border border-[#E1E5EB] bg-[#F7F8FA] p-3 text-center">
              <div className="text-[11px] font-semibold uppercase text-[#21865B]">High Intent (80+)</div>
              <div className="mt-1 text-xl font-bold text-[#20242C]">{stats.highIntent}</div>
              <div className="mt-1 text-[10px] text-[#697386]">Immediate outreach</div>
            </div>

            <div className="rounded-lg border border-[#E1E5EB] bg-[#F7F8FA] p-3 text-center">
              <div className="text-[11px] font-semibold uppercase text-[#3659C9]">Warm (50-79)</div>
              <div className="mt-1 text-xl font-bold text-[#20242C]">{stats.mediumIntent}</div>
              <div className="mt-1 text-[10px] text-[#697386]">Nurture via email</div>
            </div>

            <div className="rounded-lg border border-[#E1E5EB] bg-[#F7F8FA] p-3 text-center">
              <div className="text-[11px] font-semibold uppercase text-[#697386]">Cold (&lt; 50)</div>
              <div className="mt-1 text-xl font-bold text-[#20242C]">{stats.nurturing}</div>
              <div className="mt-1 text-[10px] text-[#697386]">Retargeting pool</div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E1E5EB]">
            <h3 className="text-xs font-semibold text-[#465064] uppercase tracking-wider mb-2">
              Acquisition Channels
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.sources).map(([channel, count]) => (
                <span
                  key={channel}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#E1E5EB] bg-white px-2.5 py-1 text-xs font-medium text-[#20242C]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3659C9]"></span>
                  {channel}: <span className="font-bold">{count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

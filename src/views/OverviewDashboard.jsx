import React, { useMemo, useState } from 'react';
import { useNexus } from '../context/NexusContext';

export default function OverviewDashboard({
  onNavigateTab,
  onOpenReviewModal,
}) {
  const {
    totalContacts,
    qualifiedContacts,
    customerContacts,
    leadContacts,
    webinar,
    activeCampaignsCount,
    pendingApprovalsCount,
    workflowRate,
    approvals = [],
    contacts = [],
    pipeline,
    activities = [],
    approveAction,
    activeWorkspace,
  } = useNexus();

  const [performanceTab, setPerformanceTab] = useState('reg');

  const pendingApprovals = approvals.filter(
    (approval) => approval.status === 'pending'
  );

  const activeApproval = pendingApprovals[0];

  const completedSteps = pipeline.steps.filter(
    (step) => step.status === 'completed'
  ).length;

  const totalSteps = pipeline.steps.length;

  const pipelineProgress =
    totalSteps > 0
      ? Math.round((completedSteps / totalSteps) * 100)
      : 0;

  const registrationPercentage =
    webinar.capacity > 0
      ? Math.min(
          100,
          Math.round((webinar.seatsClaimed / webinar.capacity) * 100)
        )
      : 0;

  const inactiveContacts = contacts.filter(
    (contact) => contact.status === 'Inactive'
  ).length;

  const highScoreLeads = contacts.filter(
    (contact) =>
      ['Lead', 'Qualified'].includes(contact.status) &&
      Number(contact.score) >= 80
  ).length;

  const readySteps = pipeline.steps.filter(
    (step) => step.status === 'ready'
  ).length;

  const blockedSteps = pipeline.steps.filter(
    (step) => step.status === 'blocked'
  ).length;

  const insights = useMemo(() => {
    const results = [];

    if (pendingApprovalsCount > 0) {
      results.push({
        icon: 'approval',
        tone: 'warning',
        title: 'Approvals need attention',
        description: `${pendingApprovalsCount} action${pendingApprovalsCount === 1 ? '' : 's'} ${pendingApprovalsCount === 1 ? 'is' : 'are'} waiting for review. Review them before proceeding.`,
        action: 'Review approvals',
        onClick: 'approvals',
      });
    }

    if (highScoreLeads > 0) {
      results.push({
        icon: 'trending_up',
        tone: 'success',
        title: 'High-intent contacts identified',
        description: `${highScoreLeads} lead${highScoreLeads === 1 ? '' : 's'} have a score of 80 or above. Consider prioritising these contacts for follow-up.`,
        action: 'Open CRM',
        onClick: 'crm',
      });
    }

    if (inactiveContacts > 0) {
      results.push({
        icon: 'person_alert',
        tone: 'neutral',
        title: 'Inactive contacts detected',
        description: `${inactiveContacts} contact${inactiveContacts === 1 ? '' : 's'} ${inactiveContacts === 1 ? 'is' : 'are'} marked inactive. Review their records before planning a re-engagement campaign.`,
        action: 'Review contacts',
        onClick: 'crm',
      });
    }

    if (registrationPercentage >= 80 && webinar.capacity > 0) {
      results.push({
        icon: 'event_available',
        tone: 'success',
        title: 'Webinar approaching capacity',
        description: `${registrationPercentage}% of available seats have been claimed. Check remaining capacity before promoting the event further.`,
        action: 'Review webinar',
        onClick: 'ai-command-center',
      });
    } else if (
      webinar.capacity > 0 &&
      webinar.seatsClaimed < webinar.capacity
    ) {
      results.push({
        icon: 'event',
        tone: 'neutral',
        title: 'Webinar registration opportunity',
        description: `${webinar.capacity - webinar.seatsClaimed} seats remain available. Consider reviewing the registration campaign.`,
        action: 'Review workflow',
        onClick: 'ai-command-center',
      });
    }

    if (blockedSteps > 0) {
      results.push({
        icon: 'account_tree',
        tone: 'warning',
        title: 'Workflow steps are blocked',
        description: `${blockedSteps} workflow step${blockedSteps === 1 ? '' : 's'} ${blockedSteps === 1 ? 'is' : 'are'} blocked. Check the preceding steps and required approvals.`,
        action: 'View workflow',
        onClick: 'ai-command-center',
      });
    }

    if (results.length === 0) {
      results.push({
        icon: 'check_circle',
        tone: 'success',
        title: 'No immediate issues identified',
        description:
          'There are no pending approvals or obvious issues in the currently available workspace data.',
        action: 'View workflow',
        onClick: 'ai-command-center',
      });
    }

    return results.slice(0, 4);
  }, [
    pendingApprovalsCount,
    highScoreLeads,
    inactiveContacts,
    registrationPercentage,
    webinar.capacity,
    webinar.seatsClaimed,
    blockedSteps,
  ]);

  const panel =
    'rounded-md border border-[#E1E5EB] bg-white p-5 sm:p-6';

  const sectionTitle =
    'text-base font-semibold tracking-tight text-[#20242C]';

  const secondaryText = 'text-sm text-[#697386]';

  const primaryButton =
    'inline-flex items-center justify-center gap-2 rounded-md bg-[#3659C9] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2947A3] disabled:cursor-not-allowed disabled:opacity-50';

  const secondaryButton =
    'inline-flex items-center justify-center gap-2 rounded-md border border-[#D9DEE7] bg-white px-3 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-[#F7F8FA]';

  const statusStyle = {
    success: 'border-[#C9E5D4] bg-[#F2F8F4] text-[#286747]',
    warning: 'border-[#E9D7AF] bg-[#FCF8EF] text-[#89651D]',
    neutral: 'border-[#E1E5EB] bg-[#F7F8FA] text-[#697386]',
  };

  const insightStyle = {
    success: {
      icon: 'border-[#C9E5D4] bg-[#F2F8F4] text-[#286747]',
      badge: 'border-[#C9E5D4] bg-[#F2F8F4] text-[#286747]',
    },
    warning: {
      icon: 'border-[#E9D7AF] bg-[#FCF8EF] text-[#89651D]',
      badge: 'border-[#E9D7AF] bg-[#FCF8EF] text-[#89651D]',
    },
    neutral: {
      icon: 'border-[#E1E5EB] bg-[#F7F8FA] text-[#697386]',
      badge: 'border-[#E1E5EB] bg-[#F7F8FA] text-[#697386]',
    },
  };

  const navigateToInsight = (destination) => {
    if (destination === 'approvals') {
      document
        .getElementById('pending-approvals-section')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    onNavigateTab(destination);
  };

  const registrationPoints = '10,76 75,61 145,67 220,39 310,19';
  const leadPoints = '10,80 75,46 145,55 220,27 310,13';

  const chartPoints =
    performanceTab === 'reg' ? registrationPoints : leadPoints;

  const isCurrentApprovalApproved =
    approvals.length > 0 &&
    approvals.every((approval) => approval.status === 'approved');

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-6 pb-10 sm:px-6 lg:px-8">
      {/* Page header */}
      <header className="flex flex-col justify-between gap-4 border-b border-[#E1E5EB] pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[25px] font-semibold leading-tight tracking-tight text-[#20242C]">
              Overview
            </h1>

            <span className="rounded border border-[#D9DEE7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#697386]">
              Demo
            </span>
          </div>

          <p className="mt-1.5 text-sm text-[#697386]">
            Your business overview for {activeWorkspace?.name || 'your workspace'}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('ai-command-center')}
          className={primaryButton}
        >
          <span className="material-symbols-outlined text-[18px]">
            smart_toy
          </span>
          Open AI Agent
        </button>
      </header>

      {/* Business metrics */}
      <section
        aria-label="Business metrics"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          {
            label: 'Total contacts',
            value: totalContacts.toLocaleString(),
            note: `${qualifiedContacts} qualified · ${customerContacts} customers`,
            icon: 'groups',
            navigate: 'crm',
          },
          {
            label: 'Webinar signups',
            value: webinar.seatsClaimed.toLocaleString(),
            note: `${registrationPercentage}% of capacity`,
            icon: 'videocam',
            navigate: 'ai-command-center',
          },
          {
            label: 'Active campaigns',
            value: activeCampaignsCount.toLocaleString(),
            note:
              pendingApprovalsCount > 0
                ? `${pendingApprovalsCount} awaiting approval`
                : 'No pending approvals',
            icon: 'campaign',
            warning: pendingApprovalsCount > 0,
          },
          {
            label: 'Workflow rate',
            value: `${workflowRate}%`,
            note: `${completedSteps}/${totalSteps} steps completed`,
            icon: 'account_tree',
            navigate: 'ai-command-center',
          },
        ].map((metric) => (
          <div
            key={metric.label}
            role={metric.navigate ? 'button' : undefined}
            tabIndex={metric.navigate ? 0 : undefined}
            onClick={
              metric.navigate
                ? () => onNavigateTab(metric.navigate)
                : undefined
            }
            onKeyDown={
              metric.navigate
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onNavigateTab(metric.navigate);
                    }
                  }
                : undefined
            }
            className={`rounded-md border border-[#E1E5EB] bg-white p-4 ${
              metric.navigate
                ? 'cursor-pointer transition-colors hover:border-[#B9C8EC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3659C9]'
                : ''
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-medium text-[#697386]">
                {metric.label}
              </span>

              <span className="material-symbols-outlined text-[19px] text-[#7A8494]">
                {metric.icon}
              </span>
            </div>

            <p className="mt-4 text-[29px] font-semibold leading-none tracking-tight text-[#20242C]">
              {metric.value}
            </p>

            <p
              className={`mt-2 text-xs ${
                metric.warning
                  ? 'text-[#89651D]'
                  : 'text-[#697386]'
              }`}
            >
              {metric.note}
            </p>
          </div>
        ))}
      </section>

      {/* AI Business Insights */}
      <section className={panel}>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#D9E2FF] bg-[#EDF2FF]">
              <span className="material-symbols-outlined text-[22px] text-[#3659C9]">
                auto_awesome
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={sectionTitle}>NEXUS Business Insights</h2>

                <span className="rounded border border-[#D9DEE7] bg-[#F7F8FA] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#697386]">
                  Data-driven demo
                </span>
              </div>

              <p className={`mt-1 ${secondaryText}`}>
                Suggested next steps based on your current workspace data.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('ai-command-center')}
            className={secondaryButton}
          >
            <span className="material-symbols-outlined text-[17px]">
              smart_toy
            </span>
            Ask AI Agent
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {insights.map((insight, index) => (
            <article
              key={`${insight.title}-${index}`}
              className="flex min-w-0 flex-col justify-between gap-4 rounded-md border border-[#E1E5EB] p-4 transition-colors hover:border-[#CDD5E1]"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${
                    insightStyle[insight.tone].icon
                  }`}
                >
                  <span className="material-symbols-outlined text-[19px]">
                    {insight.icon}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#20242C]">
                      {insight.title}
                    </h3>

                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                        insightStyle[insight.tone].badge
                      }`}
                    >
                      {insight.tone === 'warning'
                        ? 'Attention'
                        : insight.tone === 'success'
                          ? 'Opportunity'
                          : 'Insight'}
                    </span>
                  </div>

                  <p className="mt-1.5 text-sm leading-6 text-[#697386]">
                    {insight.description}
                  </p>
                </div>
              </div>

              <div className="pl-12">
                <button
                  type="button"
                  onClick={() => navigateToInsight(insight.onClick)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#3659C9] hover:text-[#2947A3]"
                >
                  {insight.action}
                  <span className="material-symbols-outlined text-[15px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-4 border-t border-[#E1E5EB] pt-3 text-xs leading-5 text-[#697386]">
          These are rule-based suggestions generated from available demo data.
          They are not live AI predictions or external business analytics.
        </p>
      </section>

      {/* Attention required */}
      <section className={panel}>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className={sectionTitle}>Attention required</h2>
            <p className={`mt-1 ${secondaryText}`}>
              Items that may need your review before the workflow proceeds.
            </p>
          </div>

          <span
            className={`w-fit rounded border px-2.5 py-1 text-xs font-medium ${
              pendingApprovalsCount > 0 || blockedSteps > 0
                ? statusStyle.warning
                : statusStyle.success
            }`}
          >
            {pendingApprovalsCount + blockedSteps} item
            {pendingApprovalsCount + blockedSteps === 1 ? '' : 's'}
          </span>
        </div>

        <div className="mt-4 divide-y divide-[#E1E5EB] border-t border-[#E1E5EB]">
          {pendingApprovalsCount > 0 && (
            <button
              type="button"
              onClick={onOpenReviewModal}
              className="flex w-full items-start gap-3 py-4 text-left hover:bg-[#FAFBFC] sm:px-2"
            >
              <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#89651D]">
                approval
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-[#20242C]">
                  {pendingApprovalsCount} approval
                  {pendingApprovalsCount === 1 ? '' : 's'} pending
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#697386]">
                  Review sensitive actions before authorising them.
                </span>
              </span>

              <span className="material-symbols-outlined text-[18px] text-[#697386]">
                chevron_right
              </span>
            </button>
          )}

          {blockedSteps > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab('ai-command-center')}
              className="flex w-full items-start gap-3 py-4 text-left hover:bg-[#FAFBFC] sm:px-2"
            >
              <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#89651D]">
                account_tree
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-[#20242C]">
                  Blocked workflow steps
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#697386]">
                  Review dependencies in {pipeline.objective}.
                </span>
              </span>

              <span className="material-symbols-outlined text-[18px] text-[#697386]">
                chevron_right
              </span>
            </button>
          )}

          {pendingApprovalsCount === 0 && blockedSteps === 0 && (
            <div className="flex items-start gap-3 py-4">
              <span className="material-symbols-outlined text-[20px] text-[#286747]">
                check_circle
              </span>

              <div>
                <p className="text-sm font-medium text-[#20242C]">
                  No immediate attention items
                </p>
                <p className="mt-1 text-xs text-[#697386]">
                  There are no pending approvals or blocked steps in this workspace.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Performance chart */}
      <section className={panel}>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 className={sectionTitle}>Business performance</h2>
            <p className={`mt-1 ${secondaryText}`}>
              Illustrative monthly activity · Sample chart
            </p>
          </div>

          <div className="inline-flex w-fit rounded-md border border-[#E1E5EB] p-1">
            <button
              type="button"
              onClick={() => setPerformanceTab('reg')}
              aria-pressed={performanceTab === 'reg'}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                performanceTab === 'reg'
                  ? 'bg-[#EDF2FF] text-[#2947A3]'
                  : 'text-[#697386] hover:bg-[#F7F8FA]'
              }`}
            >
              Registrations
            </button>

            <button
              type="button"
              onClick={() => setPerformanceTab('leads')}
              aria-pressed={performanceTab === 'leads'}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                performanceTab === 'leads'
                  ? 'bg-[#EDF2FF] text-[#2947A3]'
                  : 'text-[#697386] hover:bg-[#F7F8FA]'
              }`}
            >
              Leads
            </button>
          </div>
        </div>

        <div className="mt-6 h-40 w-full">
          <svg
            className="h-full w-full"
            viewBox="0 0 320 100"
            preserveAspectRatio="none"
            role="img"
            aria-label={`Illustrative ${
              performanceTab === 'reg' ? 'registration' : 'lead'
            } trend`}
          >
            {[15, 50, 85].map((y) => (
              <line
                key={y}
                x1="0"
                x2="320"
                y1={y}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="0.8"
                strokeDasharray="3 4"
              />
            ))}

            <polyline
              points={chartPoints}
              fill="none"
              stroke="#3659C9"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            {(performanceTab === 'reg'
              ? [[75, 61], [220, 39], [310, 19]]
              : [[75, 46], [220, 27], [310, 13]]
            ).map(([cx, cy], index) => (
              <circle
                key={index}
                cx={cx}
                cy={cy}
                r="2.7"
                fill="#FFFFFF"
                stroke="#3659C9"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        </div>

        <div className="mt-2 flex justify-between border-t border-[#E1E5EB] pt-3 text-xs text-[#697386]">
          <span>Jan</span>
          <span>Feb</span>
          <span>Mar</span>
          <span>Apr</span>
          <span className="font-medium text-[#3659C9]">May</span>
        </div>
      </section>

      {/* Approvals */}
      <section
        id="pending-approvals-section"
        className={panel}
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className={sectionTitle}>Pending approvals</h2>
            <p className={`mt-1 ${secondaryText}`}>
              Review actions before they are authorised.
            </p>
          </div>

          <span
            className={`w-fit rounded border px-2.5 py-1 text-xs font-medium ${
              pendingApprovalsCount > 0
                ? statusStyle.warning
                : statusStyle.success
            }`}
          >
            {pendingApprovalsCount > 0
              ? `${pendingApprovalsCount} awaiting review`
              : 'No pending approvals'}
          </span>
        </div>

        <div className="mt-4 border-t border-[#E1E5EB] pt-4">
          {activeApproval ? (
            <>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#697386]">
                    mail
                  </span>

                  <div>
                    <h3 className="text-sm font-medium text-[#20242C]">
                      {activeApproval.title}
                    </h3>

                    <p className="mt-1 text-xs text-[#697386]">
                      Requested by {activeApproval.requestedBy || 'NEXUS Agent'} ·{' '}
                      {activeApproval.requestedAgo || 'Recently'}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-[#697386]">
                      This action requires approval. External operations are not
                      performed by this demo.
                    </p>
                  </div>
                </div>

                <span
                  className={`w-fit shrink-0 rounded border px-2 py-1 text-xs font-medium ${statusStyle.warning}`}
                >
                  Awaiting review
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-[#E1E5EB] pt-4">
                <button
                  type="button"
                  onClick={onOpenReviewModal}
                  className={secondaryButton}
                >
                  Review details
                </button>

                <button
                  type="button"
                  onClick={() => approveAction(activeApproval.id)}
                  className={primaryButton}
                >
                  Approve action
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 py-2">
              <span className="material-symbols-outlined text-[22px] text-[#286747]">
                check_circle
              </span>
              <div>
                <p className="text-sm font-medium text-[#20242C]">
                  No pending approvals
                </p>
                <p className="mt-1 text-xs text-[#697386]">
                  New actions requiring review will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Webinar */}
      <section className={panel}>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className={sectionTitle}>Upcoming webinar</h2>
            <p className={`mt-1 ${secondaryText}`}>
              Current registration status
            </p>
          </div>

          <span
            className={`w-fit rounded border px-2.5 py-1 text-xs font-medium ${statusStyle.success}`}
          >
            {webinar.status || 'Registration open'}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-[#E1E5EB] pt-4 sm:grid-cols-[180px_1fr]">
          <div className="h-32 overflow-hidden rounded-md border border-[#E1E5EB] bg-[#F7F8FA] sm:h-full sm:min-h-[135px]">
            {webinar.imageUrl ? (
              <img
                src={webinar.imageUrl}
                alt={webinar.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[#697386]">
                <span className="material-symbols-outlined text-4xl">
                  videocam
                </span>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-center">
            <p className="text-xs font-medium text-[#3659C9]">
              {webinar.dateFormatted}
            </p>

            <h3 className="mt-1 text-lg font-semibold text-[#20242C]">
              {webinar.title}
            </h3>

            <p className={`mt-2 ${secondaryText}`}>
              {webinar.seatsClaimed} of {webinar.capacity} seats claimed
            </p>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#E9EDF3]">
              <div
                className="h-full rounded-full bg-[#3659C9] transition-all"
                style={{ width: `${registrationPercentage}%` }}
              />
            </div>

            <p className="mt-1 text-right text-xs text-[#697386]">
              {registrationPercentage}% of capacity
            </p>
          </div>
        </div>
      </section>

      {/* Workflows */}
      <section className={panel}>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className={sectionTitle}>Recent workflows</h2>
            <p className={`mt-1 ${secondaryText}`}>
              Recent workflow execution and status
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('ai-command-center')}
            className="w-fit text-sm font-medium text-[#3659C9] hover:text-[#2947A3]"
          >
            View all workflows
          </button>
        </div>

        <div className="mt-4 divide-y divide-[#E1E5EB] border-t border-[#E1E5EB]">
          <div className="flex flex-col justify-between gap-2 py-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-medium text-[#20242C]">
                AI Webinar Launch &amp; Follow-up
              </h3>
              <p className="mt-1 text-xs text-[#697386]">
                Illustrative workflow · Demo environment
              </p>
            </div>

            <span
              className={`w-fit rounded border px-2 py-1 text-xs font-medium ${statusStyle.neutral}`}
            >
              Sample
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('ai-command-center')}
            className="flex w-full flex-col justify-between gap-2 py-4 text-left transition-colors hover:bg-[#FAFBFC] sm:flex-row sm:items-center sm:px-2"
          >
            <div className="min-w-0">
              <h3 className="truncate text-sm font-medium text-[#20242C]">
                {pipeline.objective}
              </h3>

              <p className="mt-1 text-xs text-[#697386]">
                Pipeline #{pipeline.id} · {completedSteps}/{totalSteps} steps
                completed
              </p>
            </div>

            <span
              className={`w-fit shrink-0 rounded border px-2 py-1 text-xs font-medium ${
                pipeline.status === 'completed'
                  ? statusStyle.success
                  : statusStyle.warning
              }`}
            >
              {pipeline.status === 'completed'
                ? 'Completed'
                : pipeline.status === 'paused_for_approval'
                  ? 'Paused for approval'
                  : pipeline.status === 'running'
                    ? 'Running'
                    : 'In progress'}
            </span>
          </button>

          <div className="flex flex-col justify-between gap-2 py-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-medium text-[#20242C]">
                Enterprise lead enrichment
              </h3>
              <p className="mt-1 text-xs text-[#697386]">
                Illustrative workflow · Simulated activity
              </p>
            </div>

            <span
              className={`w-fit rounded border px-2 py-1 text-xs font-medium ${statusStyle.neutral}`}
            >
              Demo
            </span>
          </div>
        </div>

        <div className="mt-4 border-t border-[#E1E5EB] pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#697386]">
              Current workflow progress
            </span>
            <span className="text-sm font-semibold text-[#20242C]">
              {pipelineProgress}%
            </span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E9EDF3]">
            <div
              className="h-full rounded-full bg-[#3659C9] transition-all"
              style={{ width: `${pipelineProgress}%` }}
            />
          </div>

          {readySteps > 0 && (
            <p className="mt-2 text-xs text-[#697386]">
              {readySteps} step{readySteps === 1 ? '' : 's'} ready to proceed
              when supported.
            </p>
          )}
        </div>
      </section>

      {/* Activity */}
      <section className={panel}>
        <div>
          <h2 className={sectionTitle}>Recent activity</h2>
          <p className={`mt-1 ${secondaryText}`}>
            Latest recorded events in the demonstration environment
          </p>
        </div>

        <div className="mt-4 divide-y divide-[#E1E5EB] border-t border-[#E1E5EB]">
          {activities.slice(0, 5).map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 py-3.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#E1E5EB] bg-[#F7F8FA]">
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    activity.iconColor || 'text-[#697386]'
                  }`}
                >
                  {activity.icon || 'history'}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm leading-5 text-[#20242C]">
                  {activity.title}

                  {activity.highlight && (
                    <span className="ml-1 font-medium text-[#3659C9]">
                      {activity.highlight}
                    </span>
                  )}
                </p>

                {activity.url && (
                  <p className="mt-1 break-all text-xs text-[#3659C9]">
                    {activity.url}
                  </p>
                )}

                <p className="mt-1 text-xs text-[#697386]">
                  {activity.meta}
                </p>
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <p className="py-6 text-sm text-[#697386]">
              No activity has been recorded yet.
            </p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E1E5EB] pt-4 text-center text-xs text-[#697386]">
        NEXUS · Business operations workspace · Demonstration environment
      </footer>
    </main>
  );
}


import React, { useMemo, useState } from "react";
import { useNexus } from "../context/NexusContext.jsx";

const STATUS_STYLES = {
  completed: {
    label: "Completed",
    icon: "check_circle",
    className: "border-[#B9E4CC] bg-[#E8F5EE] text-[#21865B]",
  },
  "pending approval": {
    label: "Pending approval",
    icon: "schedule",
    className: "border-[#F1D9A8] bg-[#FFF7E6] text-[#956000]",
  },
  ready: {
    label: "Ready",
    icon: "radio_button_unchecked",
    className: "border-[#D5DDF2] bg-[#EEF2FF] text-[#3659C9]",
  },
  blocked: {
    label: "Blocked",
    icon: "lock",
    className: "border-[#E1E5EB] bg-[#F1F3F6] text-[#697386]",
  },
};

const STEP_TEMPLATES = [
  {
    title: "Create Webinar",
    description: "Prepare the webinar details and session configuration.",
    icon: "videocam",
  },
  {
    title: "Generate Landing Page",
    description: "Prepare a registration page for the target audience.",
    icon: "language",
  },
  {
    title: "Connect CRM",
    description: "Organize registrants and synchronize contact information.",
    icon: "groups",
  },
  {
    title: "Prepare Campaign",
    description: "Prepare promotional messaging for review and approval.",
    icon: "campaign",
  },
  {
    title: "Prepare Follow-up",
    description: "Prepare follow-up communication for registered attendees.",
    icon: "mark_email_read",
  },
];

function normalizeStatus(status = "") {
  const value = status.toLowerCase();

  if (value.includes("complete")) return "completed";
  if (value.includes("approval") || value.includes("pending")) {
    return "pending approval";
  }
  if (value.includes("block")) return "blocked";

  return "ready";
}

function getStepTitle(step) {
  return step.title || step.name || step.label || "Workflow step";
}

function getStepDescription(step) {
  return (
    step.description ||
    step.detail ||
    "Review this step and its current workflow status."
  );
}

function getStepIcon(step, index) {
  if (step.icon) return step.icon;

  const title = getStepTitle(step).toLowerCase();

  if (title.includes("webinar")) return "videocam";
  if (title.includes("landing") || title.includes("website")) return "language";
  if (title.includes("crm") || title.includes("contact")) return "groups";
  if (title.includes("campaign") || title.includes("market")) return "campaign";
  if (title.includes("follow")) return "mark_email_read";
  if (title.includes("approval")) return "verified";

  return STEP_TEMPLATES[index % STEP_TEMPLATES.length].icon;
}

export default function VisualWorkflowBuilder({ onNavigateTab }) {
  const {
    pipeline,
    executePlan,
    activeWorkspace,
    pendingApprovalsCount,
  } = useNexus();

  const [selectedStepId, setSelectedStepId] = useState(null);
  const [showAddStep, setShowAddStep] = useState(false);
  const [customStepName, setCustomStepName] = useState("");
  const [customStepType, setCustomStepType] = useState("Connect CRM");
  const [notice, setNotice] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const initialSteps = useMemo(() => {
    const source = Array.isArray(pipeline?.steps) ? pipeline.steps : [];

    return source.map((step, index) => ({
      ...step,
      id: step.id ?? `workflow-step-${index}`,
      title: getStepTitle(step),
      description: getStepDescription(step),
      icon: getStepIcon(step, index),
      normalizedStatus: normalizeStatus(step.status),
    }));
  }, [pipeline]);

  const [customSteps, setCustomSteps] = useState([]);

  const steps = useMemo(
    () => [
      ...initialSteps,
      ...customSteps.map((step) => ({
        ...step,
        normalizedStatus: normalizeStatus(step.status),
      })),
    ],
    [initialSteps, customSteps]
  );

  const selectedStep =
    steps.find((step) => step.id === selectedStepId) || steps[0];

  const completedCount = steps.filter(
    (step) => step.normalizedStatus === "completed"
  ).length;

  const progress = steps.length
    ? Math.round((completedCount / steps.length) * 100)
    : 0;

  const handleAddStep = (event) => {
    event.preventDefault();

    const title = customStepName.trim() || customStepType;

    const template =
      STEP_TEMPLATES.find((item) => item.title === customStepType) ||
      STEP_TEMPLATES[2];

    const newStep = {
      id: `custom-${Date.now()}`,
      title,
      description: template.description,
      icon: template.icon,
      status: "ready",
      normalizedStatus: "ready",
      isCustom: true,
    };

    setCustomSteps((current) => [...current, newStep]);
    setSelectedStepId(newStep.id);
    setCustomStepName("");
    setShowAddStep(false);
    setNotice(
      `"${title}" was added to this builder session. It has not been added to the saved execution pipeline.`
    );
  };

  const handleRunWorkflow = () => {
    if (isRunning) return;

    if (typeof executePlan !== "function") {
      setNotice("Workflow execution is not available in the current context.");
      return;
    }

    setIsRunning(true);
    setNotice("");

    try {
      executePlan(
        "Create a webinar workflow, prepare its landing page, connect CRM contacts, prepare a promotional marketing campaign, and prepare follow-up communication. Require approval before sending promotional messages."
      );

      setNotice(
        "Workflow execution was requested. Review the updated workflow and any pending approvals. Actions in the current demo may be simulated."
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to start the workflow."
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      {/* Page heading */}
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#697386]">
            <span>Automation</span>
            <span>/</span>
            <span className="text-[#3659C9]">Workflow Builder</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#20242C] sm:text-3xl">
            Visual Workflow Builder
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#697386]">
            View workflow steps, inspect their status, and prepare your
            business automation.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAddStep((value) => !value)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#E1E5EB] bg-white px-4 text-sm font-medium text-[#20242C] transition hover:bg-[#F1F3F6]"
          >
            <span className="material-symbols-outlined text-[19px]">
              add
            </span>
            Add step
          </button>

          <button
            type="button"
            onClick={handleRunWorkflow}
            disabled={isRunning}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#3659C9] px-4 text-sm font-semibold text-white transition hover:bg-[#2947A3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[19px]">
              play_arrow
            </span>
            {isRunning ? "Starting..." : "Run workflow"}
          </button>
        </div>
      </div>

      {/* Workspace and pipeline */}
      <div className="mb-5 flex flex-col gap-4 rounded-lg border border-[#E1E5EB] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#EAF0FF] text-[#3659C9]">
            <span className="material-symbols-outlined text-2xl">
              account_tree
            </span>
          </div>

          <div className="min-w-0">
            <p className="text-xs text-[#697386]">
              Active workspace
            </p>
            <h2 className="mt-1 truncate text-base font-semibold text-[#20242C]">
              {activeWorkspace?.name || "Current workspace"}
            </h2>
            <p className="mt-1 text-xs text-[#697386]">
              {pipeline?.name || pipeline?.title || "Business workflow"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:min-w-[270px]">
          <div className="rounded-md bg-[#F7F8FA] p-3">
            <p className="text-xs text-[#697386]">Total steps</p>
            <p className="mt-1 text-xl font-semibold text-[#20242C]">
              {steps.length}
            </p>
          </div>

          <div className="rounded-md bg-[#F7F8FA] p-3">
            <p className="text-xs text-[#697386]">Completed</p>
            <p className="mt-1 text-xl font-semibold text-[#21865B]">
              {completedCount}
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6 rounded-lg border border-[#E1E5EB] bg-white p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#20242C]">
              Workflow progress
            </h3>
            <p className="mt-1 text-xs text-[#697386]">
              Based on the current pipeline step statuses
            </p>
          </div>

          <span className="text-sm font-semibold text-[#3659C9]">
            {progress}%
          </span>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-[#E9ECF2]"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Workflow completion"
        >
          <div
            className="h-full rounded-full bg-[#3659C9] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Add step form */}
      {showAddStep && (
        <form
          onSubmit={handleAddStep}
          className="mb-6 rounded-lg border border-[#D5DDF2] bg-white p-4 sm:p-5"
        >
          <div className="mb-4">
            <h3 className="font-semibold text-[#20242C]">
              Add a workflow step
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#697386]">
              New steps are currently local to this builder session. They
              are not yet saved to the execution pipeline.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#465064]">
                Step type
              </span>
              <select
                value={customStepType}
                onChange={(event) => setCustomStepType(event.target.value)}
                className="min-h-11 w-full rounded-md border border-[#E1E5EB] bg-white px-3 text-sm text-[#20242C] outline-none focus:border-[#3659C9] focus:ring-2 focus:ring-[#3659C9]/10"
              >
                {STEP_TEMPLATES.map((template) => (
                  <option key={template.title} value={template.title}>
                    {template.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#465064]">
                Custom title (optional)
              </span>
              <input
                value={customStepName}
                onChange={(event) => setCustomStepName(event.target.value)}
                placeholder="e.g. Review registrations"
                maxLength={80}
                className="min-h-11 w-full rounded-md border border-[#E1E5EB] bg-white px-3 text-sm text-[#20242C] outline-none placeholder:text-[#9299A5] focus:border-[#3659C9] focus:ring-2 focus:ring-[#3659C9]/10"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddStep(false)}
              className="min-h-10 rounded-md border border-[#E1E5EB] px-4 text-sm font-medium text-[#465064] hover:bg-[#F7F8FA]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-10 rounded-md bg-[#3659C9] px-4 text-sm font-semibold text-white hover:bg-[#2947A3]"
            >
              Add to canvas
            </button>
          </div>
        </form>
      )}

      {/* Workflow canvas */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
        <section className="min-w-0 overflow-hidden rounded-lg border border-[#E1E5EB] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E1E5EB] px-4 py-4 sm:px-5">
            <div>
              <h2 className="text-sm font-semibold text-[#20242C]">
                Workflow canvas
              </h2>
              <p className="mt-1 text-xs text-[#697386]">
                Select a node to inspect its details.
              </p>
            </div>

            <span className="rounded-md border border-[#E1E5EB] px-2.5 py-1 text-xs text-[#697386]">
              {steps.length} nodes
            </span>
          </div>

          <div className="p-4 sm:p-6">
            {steps.length === 0 ? (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined text-4xl text-[#9299A5]">
                  account_tree
                </span>
                <p className="mt-3 text-sm font-medium text-[#20242C]">
                  No workflow steps yet
                </p>
                <p className="mt-1 text-xs text-[#697386]">
                  Add a step to start building your workflow.
                </p>
              </div>
            ) : (
              <div className="mx-auto flex max-w-lg flex-col items-center">
                {steps.map((step, index) => {
                  const status =
                    STATUS_STYLES[step.normalizedStatus] ||
                    STATUS_STYLES.ready;

                  const isSelected = selectedStep?.id === step.id;

                  return (
                    <React.Fragment key={step.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedStepId(step.id)}
                        aria-pressed={isSelected}
                        className={`w-full rounded-lg border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-[#3659C9]/30 sm:p-5 ${
                          isSelected
                            ? "border-[#3659C9] bg-[#F8FAFF] ring-1 ring-[#3659C9]/20"
                            : "border-[#E1E5EB] bg-white hover:border-[#B8C5E8] hover:bg-[#FAFBFD]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                              step.normalizedStatus === "completed"
                                ? "bg-[#E8F5EE] text-[#21865B]"
                                : step.normalizedStatus === "pending approval"
                                  ? "bg-[#FFF7E6] text-[#956000]"
                                  : "bg-[#EAF0FF] text-[#3659C9]"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[22px]">
                              {step.icon}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9299A5]">
                                Step {index + 1}
                              </span>

                              {step.isCustom && (
                                <span className="rounded bg-[#F1F3F6] px-1.5 py-0.5 text-[10px] text-[#697386]">
                                  Session only
                                </span>
                              )}
                            </div>

                            <h3 className="mt-1 break-words text-sm font-semibold text-[#20242C]">
                              {step.title}
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-[#697386]">
                              {step.description}
                            </p>

                            <span
                              className={`mt-3 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium ${status.className}`}
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                {status.icon}
                              </span>
                              {status.label}
                            </span>
                          </div>

                          <span className="material-symbols-outlined shrink-0 text-[#9299A5]">
                            chevron_right
                          </span>
                        </div>
                      </button>

                      {index < steps.length - 1 && (
                        <div
                          aria-hidden="true"
                          className="flex h-10 flex-col items-center justify-center"
                        >
                          <div className="h-5 w-px bg-[#CBD2DE]" />
                          <span className="material-symbols-outlined -mt-1 text-[18px] text-[#9299A5]">
                            arrow_downward
                          </span>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#E1E5EB] bg-[#FAFBFD] px-4 py-3 sm:px-5">
            {Object.entries(STATUS_STYLES).map(([key, status]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 text-xs text-[#697386]"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    key === "completed"
                      ? "bg-[#21865B]"
                      : key === "pending approval"
                        ? "bg-[#D49A26]"
                        : key === "blocked"
                          ? "bg-[#9299A5]"
                          : "bg-[#3659C9]"
                  }`}
                />
                {status.label}
              </span>
            ))}
          </div>
        </section>

        {/* Step details */}
        <aside className="rounded-lg border border-[#E1E5EB] bg-white p-4 sm:p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF0FF] text-[#3659C9]">
              <span className="material-symbols-outlined text-xl">
                tune
              </span>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-[#20242C]">
                Step details
              </h2>
              <p className="mt-1 text-xs text-[#697386]">
                Selected node information
              </p>
            </div>
          </div>

          {selectedStep ? (
            <>
              <span className="text-xs font-medium text-[#9299A5]">
                {selectedStep.isCustom
                  ? "Custom builder step"
                  : `Step ${steps.findIndex((step) => step.id === selectedStep.id) + 1}`}
              </span>

              <h3 className="mt-2 break-words text-lg font-semibold text-[#20242C]">
                {selectedStep.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#697386]">
                {selectedStep.description}
              </p>

              <div className="mt-5 border-t border-[#E1E5EB] pt-4">
                <p className="mb-2 text-xs font-medium text-[#697386]">
                  Current status
                </p>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium ${
                    (
                      STATUS_STYLES[selectedStep.normalizedStatus] ||
                      STATUS_STYLES.ready
                    ).className
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {
                      (
                        STATUS_STYLES[selectedStep.normalizedStatus] ||
                        STATUS_STYLES.ready
                      ).icon
                    }
                  </span>

                  {
                    (
                      STATUS_STYLES[selectedStep.normalizedStatus] ||
                      STATUS_STYLES.ready
                    ).label
                  }
                </span>
              </div>

              {selectedStep.normalizedStatus === "pending approval" && (
                <div className="mt-4 rounded-md border border-[#F1D9A8] bg-[#FFF7E6] p-3">
                  <p className="text-xs leading-5 text-[#79520A]">
                    This step requires approval before its protected action
                    can proceed.
                  </p>

                  <p className="mt-2 text-xs text-[#79520A]">
                    {pendingApprovalsCount} approval
                    {pendingApprovalsCount === 1 ? "" : "s"} pending
                  </p>

                  {typeof onNavigateTab === "function" && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab("ai-command-center")}
                      className="mt-3 text-xs font-semibold text-[#3659C9] hover:underline"
                    >
                      Review workflow approvals
                    </button>
                  )}
                </div>
              )}

              {selectedStep.isCustom && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomSteps((current) =>
                      current.filter((step) => step.id !== selectedStep.id)
                    );
                    setSelectedStepId(null);
                    setNotice("The custom step was removed from this session.");
                  }}
                  className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-[#F0C7C7] px-3 text-sm font-medium text-[#B42318] hover:bg-[#FFF5F5]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    delete
                  </span>
                  Remove custom step
                </button>
              )}
            </>
          ) : (
            <p className="text-sm text-[#697386]">
              Select a workflow node to inspect its details.
            </p>
          )}

          <div className="mt-6 rounded-md bg-[#F7F8FA] p-3">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#697386]">
                info
              </span>
              <p className="text-xs leading-5 text-[#697386]">
                This builder visualizes your current pipeline. Custom steps
                are session-only until persistent workflow editing is
                implemented.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Notices */}
      {notice && (
        <div
          role="status"
          className="mt-5 flex items-start gap-3 rounded-lg border border-[#D5DDF2] bg-[#EEF2FF] p-4"
        >
          <span className="material-symbols-outlined text-[20px] text-[#3659C9]">
            info
          </span>

          <p className="min-w-0 flex-1 text-sm leading-6 text-[#344B8E]">
            {notice}
          </p>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
            className="rounded p-1 text-[#697386] hover:bg-white"
          >
            <span className="material-symbols-outlined text-[18px]">
              close
            </span>
          </button>
        </div>
      )}

      <p className="mt-5 text-center text-xs leading-5 text-[#9299A5]">
        NEXUS Demo Environment · Workflow actions may be simulated and do not
        send external communications.
      </p>
    </section>
  );
}


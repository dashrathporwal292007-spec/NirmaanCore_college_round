import React, { useState } from "react";
import { useNexus } from "../context/NexusContext";

const SUGGESTED_PROMPTS = [
  {
    title: "Launch an AI Webinar",
    description:
      "Plan a webinar, prepare a registration website, and track registrations.",
    icon: "event",
    prompt:
      "Create an AI webinar for 100 students, prepare a registration website, and track registrations.",
    color: "bg-blue-50 text-blue-700",
  },
  {
    title: "Create a Marketing Campaign",
    description:
      "Prepare promotional content and organize a product marketing campaign.",
    icon: "campaign",
    prompt:
      "Create a marketing campaign to promote our new product and prepare promotional content.",
    color: "bg-purple-50 text-purple-700",
  },
  {
    title: "Organize CRM Contacts",
    description:
      "Organize customer information and prepare a customer follow-up workflow.",
    icon: "group",
    prompt:
      "Organize our CRM contacts and prepare a customer follow-up workflow.",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Build a Business Website",
    description:
      "Prepare a website plan with a landing page and customer registration form.",
    icon: "language",
    prompt:
      "Create a business website with a landing page, registration form, and CRM integration.",
    color: "bg-amber-50 text-amber-700",
  },
];

function createOutput(prompt, workspaceName) {
  const text = prompt.toLowerCase();
  const outputs = [];

  const isWebinar =
    text.includes("webinar") ||
    text.includes("masterclass") ||
    text.includes("event");

  const isWebsite =
    text.includes("website") ||
    text.includes("webpage") ||
    text.includes("landing page") ||
    text.includes("registration page");

  const isMarketing =
    text.includes("marketing") ||
    text.includes("campaign") ||
    text.includes("promotional") ||
    text.includes("promotion");

  const isCRM =
    text.includes("crm") ||
    text.includes("contact") ||
    text.includes("customer") ||
    text.includes("registrations");

  const isFollowUp =
    text.includes("follow-up") ||
    text.includes("follow up") ||
    text.includes("reminder");

  if (isWebinar) {
    outputs.push({
      type: "Webinar Plan",
      icon: "event",
      status: "Draft",
      title: "AI-Powered Webinar",
      description:
        "A structured webinar plan generated from your instructions.",
      details: [
        {
          label: "Target Audience",
          value: text.includes("student") ? "Students" : "Target customers",
        },
        {
          label: "Expected Attendance",
          value: text.match(/\d+/)?.[0]
            ? `${text.match(/\d+/)[0]} participants`
            : "To be configured",
        },
        {
          label: "Registration",
          value: "Registration workflow planned",
        },
        {
          label: "Workspace",
          value: workspaceName || "Demo Workspace",
        },
      ],
    });
  }

  if (isWebsite) {
    outputs.push({
      type: "Website Preview",
      icon: "language",
      status: "Preview",
      title: "Registration & Landing Page",
      description:
        "A proposed website structure for your business workflow.",
      details: [
        {
          label: "Hero Section",
          value: "Headline, introduction, and primary call to action",
        },
        {
          label: "Registration Form",
          value: "Name, email, and relevant customer information",
        },
        {
          label: "Integration",
          value: "CRM connection planned",
        },
        {
          label: "Publishing",
          value: "Not published",
        },
      ],
    });
  }

  if (isMarketing) {
    outputs.push({
      type: "Marketing Campaign",
      icon: "campaign",
      status: "Awaiting Approval",
      title: "Promotional Campaign",
      description:
        "A campaign outline with promotional content and an approval checkpoint.",
      details: [
        {
          label: "Campaign Goal",
          value: "Increase awareness and engagement",
        },
        {
          label: "Content",
          value: "Email copy and social media messaging",
        },
        {
          label: "Audience",
          value: "Target customers",
        },
        {
          label: "External Sending",
          value: "Requires approval",
        },
      ],
    });
  }

  if (isCRM) {
    outputs.push({
      type: "CRM Workflow",
      icon: "group",
      status: "Ready for Review",
      title: "Contact Management",
      description:
        "A proposed workflow for organizing and tracking customer records.",
      details: [
        {
          label: "Contact Records",
          value: "Use existing CRM records",
        },
        {
          label: "Organization",
          value: "Group contacts using relevant tags",
        },
        {
          label: "Tracking",
          value: "Monitor registration and engagement status",
        },
        {
          label: "Data Changes",
          value: "No external records modified",
        },
      ],
    });
  }

  if (isFollowUp) {
    outputs.push({
      type: "Follow-Up Plan",
      icon: "schedule",
      status: "Draft",
      title: "Customer Follow-Up Workflow",
      description:
        "A proposed process for keeping track of customer communication.",
      details: [
        {
          label: "Step 1",
          value: "Identify customers requiring follow-up",
        },
        {
          label: "Step 2",
          value: "Prepare personalized messages",
        },
        {
          label: "Step 3",
          value: "Review messages before sending",
        },
        {
          label: "Step 4",
          value: "Track follow-up status",
        },
      ],
    });
  }

  if (outputs.length === 0) {
    outputs.push({
      type: "Business Workflow",
      icon: "account_tree",
      status: "Draft",
      title: "Custom Business Workflow",
      description:
        "Your request has been converted into a proposed business workflow.",
      details: [
        {
          label: "Objective",
          value: prompt,
        },
        {
          label: "Next Step",
          value: "Review the request and configure the required actions",
        },
        {
          label: "Execution",
          value: "Pending review",
        },
      ],
    });
  }

  return outputs;
}

function SectionHeading({ icon, title, description, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-gray-700">
            {icon}
          </span>

          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>

        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>

      {action}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Draft: "bg-gray-100 text-gray-700",
    Preview: "bg-blue-50 text-blue-700",
    "Ready for Review": "bg-emerald-50 text-emerald-700",
    "Awaiting Approval": "bg-amber-50 text-amber-800",
    Pending: "bg-amber-50 text-amber-800",
    Approved: "bg-emerald-50 text-emerald-700",
    Completed: "bg-emerald-50 text-emerald-700",
    Failed: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status || "In Progress"}
    </span>
  );
}

export default function AICommandCenter() {
  const {
    promptText,
    setPromptText,
    executePlan,
    activeWorkspace,
    approvals = [],
    pipelines = [],
    activities = [],
    totalContacts,
    approveAction,
  } = useNexus();

  const [generatedOutputs, setGeneratedOutputs] = useState([]);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("outputs");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const currentPrompt = promptText || "";
  const workspaceName =
    typeof activeWorkspace === "object"
      ? activeWorkspace?.name
      : activeWorkspace || "Demo Workspace";

  const pendingApprovals = approvals.filter(
    (approval) => approval.status === "pending"
  );

  function handleSuggestedPrompt(prompt) {
    setErrorMessage("");
    setSuccessMessage("");
    setPromptText(prompt);

    // Show the prompt in the editor and focus attention on it.
    setActiveTab("outputs");
  }

  function handleClearPrompt() {
    setPromptText("");
    setErrorMessage("");
    setSuccessMessage("");
    setGeneratedOutputs([]);
    setGeneratedPrompt("");
  }

  function handleGenerate() {
    const cleanPrompt = currentPrompt.trim();

    if (!cleanPrompt) {
      setErrorMessage(
        "Please enter a business request or select one of the suggested templates."
      );
      setSuccessMessage("");
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Create the workflow in the shared application state.
      executePlan(cleanPrompt);

      // Create local demonstration previews for the requested workflow.
      const outputs = createOutput(cleanPrompt, workspaceName);

      setGeneratedOutputs(outputs);
      setGeneratedPrompt(cleanPrompt);
      setActiveTab("outputs");
      setSuccessMessage(
        "Your workflow plan has been generated successfully."
      );
    } catch (error) {
      console.error("Workflow generation failed:", error);

      setErrorMessage(
        "Something went wrong while generating your workflow. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleApprove(approvalId) {
    if (typeof approveAction !== "function") {
      setErrorMessage(
        "The approval action is not available in the current application state."
      );
      return;
    }

    try {
      approveAction(approvalId);
      setErrorMessage("");
      setSuccessMessage("The approval action has been processed.");
    } catch (error) {
      console.error("Approval action failed:", error);
      setErrorMessage("Unable to process this approval. Please try again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8">
      {/* Page Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined rounded-xl bg-blue-50 p-2 text-2xl text-blue-700">
              auto_awesome
            </span>

            <span className="text-xs font-semibold uppercase tracking-widest text-blue-700">
              Intelligent Automation
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            AI Command Center
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Turn business instructions into organized workflows, website
            plans, CRM operations, and marketing campaign previews.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <span className="material-symbols-outlined text-lg text-blue-700">
            apartment
          </span>

          <div>
            <p className="text-xs text-gray-500">Active workspace</p>
            <p className="text-sm font-semibold text-gray-900">
              {workspaceName}
            </p>
          </div>
        </div>
      </section>

      {/* Prompt Builder */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
          <SectionHeading
            icon="edit_note"
            title="What would you like NEXUS to do?"
            description="Describe the business outcome you want to achieve."
          />

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 sm:p-4">
            <textarea
              id="nexus-workflow-prompt"
              value={currentPrompt}
              onChange={(event) => {
                setPromptText(event.target.value);
                setErrorMessage("");
                setSuccessMessage("");
              }}
              onKeyDown={(event) => {
                if (
                  (event.ctrlKey || event.metaKey) &&
                  event.key === "Enter"
                ) {
                  event.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="Example: Create an AI webinar for 100 students, prepare a registration website, and track registrations..."
              rows={5}
              className="w-full resize-y border-0 bg-transparent text-sm leading-6 text-gray-800 outline-none placeholder:text-gray-400 focus:ring-0"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-3">
              <p className="text-xs text-gray-500">
                <span className="material-symbols-outlined mr-1 inline-block align-middle text-sm">
                  keyboard
                </span>
                Ctrl + Enter to generate
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearPrompt}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-lg">
                    {isGenerating ? "progress_activity" : "auto_awesome"}
                  </span>

                  {isGenerating ? "Generating..." : "Generate Workflow"}
                </button>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <span className="material-symbols-outlined text-lg">
                error
              </span>
              <p>{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
            >
              <span className="material-symbols-outlined text-lg">
                check_circle
              </span>
              <p>{successMessage}</p>
            </div>
          )}
        </div>

        {/* Suggested Templates */}
        <div className="px-5 py-5 sm:px-7 sm:py-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-800">
              Start with a template
            </h3>

            <span className="text-xs text-gray-400">
              {SUGGESTED_PROMPTS.length} templates
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {SUGGESTED_PROMPTS.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => handleSuggestedPrompt(item.prompt)}
                className="group flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {item.icon}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-gray-900 transition group-hover:text-blue-700">
                  {item.title}
                </h4>

                <p className="mt-2 flex-1 text-xs leading-5 text-gray-500">
                  {item.description}
                </p>

                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-700">
                  Use template
                  <span className="material-symbols-outlined text-base transition group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Generated Outputs */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <SectionHeading
          icon="description"
          title="Generated Output"
          description="Review the plans created from your instructions."
          action={
            generatedOutputs.length > 0 ? (
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                {generatedOutputs.length}{" "}
                {generatedOutputs.length === 1 ? "output" : "outputs"}
              </span>
            ) : null
          }
        />

        <div className="mb-5 flex flex-wrap gap-2 border-b border-gray-100 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("outputs")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === "outputs"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
            }`}
          >
            Workflow Outputs
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("execution")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === "execution"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
            }`}
          >
            Workflow Execution
          </button>
        </div>

        {activeTab === "outputs" && (
          <>
            {generatedOutputs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-12 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <span className="material-symbols-outlined text-3xl text-gray-400">
                    auto_awesome
                  </span>
                </div>

                <h3 className="text-base font-semibold text-gray-800">
                  Your generated outputs will appear here
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                  Select a template above or enter a business request and
                  click Generate Workflow to see your plan.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Original Request
                  </p>

                  <p className="text-sm leading-6 text-gray-800">
                    {generatedPrompt}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {generatedOutputs.map((output, index) => (
                    <article
                      key={`${output.type}-${index}`}
                      className="overflow-hidden rounded-xl border border-gray-200"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                            <span className="material-symbols-outlined text-xl">
                              {output.icon}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-500">
                              {output.type}
                            </p>

                            <h3 className="mt-1 font-semibold text-gray-900">
                              {output.title}
                            </h3>
                          </div>
                        </div>

                        <StatusBadge status={output.status} />
                      </div>

                      <div className="p-4">
                        <p className="mb-4 text-sm leading-6 text-gray-500">
                          {output.description}
                        </p>

                        <div className="space-y-3">
                          {output.details.map((detail) => (
                            <div
                              key={detail.label}
                              className="grid grid-cols-1 gap-1 sm:grid-cols-[125px_1fr] sm:gap-3"
                            >
                              <span className="text-xs font-medium text-gray-500">
                                {detail.label}
                              </span>

                              <span className="break-words text-sm text-gray-800">
                                {detail.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="material-symbols-outlined text-base text-amber-600">
                            info
                          </span>
                          Preview only — no external action performed.
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "execution" && (
          <div>
            {pipelines.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center">
                <span className="material-symbols-outlined text-3xl text-gray-400">
                  account_tree
                </span>

                <h3 className="mt-3 font-semibold text-gray-800">
                  No workflow executions yet
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Generate a workflow to see its execution record here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pipelines.map((pipeline, index) => (
                  <article
                    key={pipeline.id || index}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {pipeline.name ||
                            pipeline.title ||
                            "Business Workflow"}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          {pipeline.id || "Workflow record"}
                        </p>
                      </div>

                      <StatusBadge
                        status={pipeline.status || "In Progress"}
                      />
                    </div>

                    {pipeline.prompt && (
                      <p className="mt-3 text-sm leading-6 text-gray-600">
                        {pipeline.prompt}
                      </p>
                    )}

                    {Array.isArray(pipeline.steps) &&
                      pipeline.steps.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {pipeline.steps.map((step, stepIndex) => (
                            <div
                              key={step.id || stepIndex}
                              className="flex items-start gap-3"
                            >
                              <span className="material-symbols-outlined mt-0.5 text-lg text-blue-700">
                                {step.status === "completed"
                                  ? "check_circle"
                                  : step.requiresApproval
                                    ? "approval"
                                    : "radio_button_unchecked"}
                              </span>

                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {step.title ||
                                    step.name ||
                                    `Step ${stepIndex + 1}`}
                                </p>

                                {step.description && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    {step.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Approvals */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <SectionHeading
          icon="verified_user"
          title="Pending Approvals"
          description="Review actions that require approval before proceeding."
          action={
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
              {pendingApprovals.length} pending
            </span>
          }
        />

        {pendingApprovals.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5">
            <span className="material-symbols-outlined text-2xl text-gray-400">
              task_alt
            </span>

            <div>
              <p className="text-sm font-medium text-gray-800">
                You're all caught up
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Any actions requiring approval will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingApprovals.map((approval, index) => (
              <article
                key={approval.id || index}
                className="rounded-xl border border-amber-200 bg-amber-50/50 p-4"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined rounded-lg bg-amber-100 p-2 text-xl text-amber-800">
                      approval
                    </span>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {approval.title ||
                          approval.name ||
                          "Action requires approval"}
                      </h3>

                      <p className="mt-1 text-sm leading-5 text-gray-600">
                        {approval.description ||
                          approval.message ||
                          "Review this action before proceeding."}
                      </p>

                      <p className="mt-2 text-xs text-gray-500">
                        External actions should only proceed after appropriate
                        review.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApprove(approval.id)}
                    disabled={!approval.id}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">
                      check
                    </span>
                    Approve
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Workspace Summary and Activity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading
            icon="dashboard"
            title="Workspace Summary"
            description="A quick overview of your current workspace."
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <span className="material-symbols-outlined text-xl text-blue-700">
                account_tree
              </span>

              <p className="mt-3 text-2xl font-bold text-gray-900">
                {pipelines.length}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Workflow records
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <span className="material-symbols-outlined text-xl text-emerald-700">
                group
              </span>

              <p className="mt-3 text-2xl font-bold text-gray-900">
                {typeof totalContacts === "number" ? totalContacts : "—"}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                CRM contacts
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <span className="material-symbols-outlined text-xl text-amber-700">
                pending_actions
              </span>

              <p className="mt-3 text-2xl font-bold text-gray-900">
                {pendingApprovals.length}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Pending approvals
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <span className="material-symbols-outlined text-xl text-purple-700">
                history
              </span>

              <p className="mt-3 text-2xl font-bold text-gray-900">
                {activities.length}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Recent activities
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading
            icon="history"
            title="Recent Activity"
            description="Recent events recorded in your workspace."
          />

          {activities.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-5">
              <span className="material-symbols-outlined text-2xl text-gray-400">
                history
              </span>

              <p className="text-sm leading-6 text-gray-500">
                Your workflow and workspace activity will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.slice(0, 6).map((activity, index) => (
                <div
                  key={activity.id || index}
                  className="flex items-start gap-3"
                >
                  <span className="material-symbols-outlined mt-0.5 text-lg text-blue-700">
                    {activity.icon || "check_circle"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium text-gray-800">
                      {activity.title ||
                        activity.message ||
                        activity.description ||
                        "Workspace activity recorded"}
                    </p>

                    {activity.description &&
                      activity.title &&
                      activity.description !== activity.title && (
                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          {activity.description}
                        </p>
                      )}

                    {activity.timestamp && (
                      <p className="mt-1 text-xs text-gray-400">
                        {activity.timestamp}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Demo Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
        <span className="material-symbols-outlined mt-0.5 text-xl text-blue-700">
          info
        </span>

        <div>
          <p className="text-sm font-semibold text-blue-900">
            NEXUS Demonstration Mode
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-800">
            Workflow previews are generated locally using predefined
            demonstration logic. This interface does not connect to a live AI
            service, publish websites, send marketing messages, or perform
            external business operations. Approval actions update the
            application's demo state.
          </p>
        </div>
      </div>
    </div>
  );
}


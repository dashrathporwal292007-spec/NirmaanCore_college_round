import React, { useState } from "react";
import { useNexus } from "../context/NexusContext.jsx";

export default function Approvals() {
  const {
    approvals = [],
    approveAction,
    activeWorkspace,
    pipeline = [],
  } = useNexus();

  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");

  const approvalList = Array.isArray(approvals) ? approvals : [];

  const filteredApprovals = approvalList.filter((item) => {
    if (filter === "all") return true;
    return (item.status || "pending").toLowerCase() === filter;
  });

  const pendingCount = approvalList.filter(
    (item) => (item.status || "pending").toLowerCase() === "pending"
  ).length;

  const handleApprove = (id) => {
    if (typeof approveAction !== "function") {
      setNotice("Approval action is unavailable. Please check NexusContext.");
      return;
    }

    approveAction(id);
    setNotice("Approval processed. Check the updated status below.");
  };

  const getTitle = (item) =>
    item.title || item.name || item.action || item.description || "Action requiring review";

  const getDescription = (item) =>
    item.description || item.details || item.message || "Review this action before proceeding.";

  const getStatusStyle = (status) => {
    switch ((status || "pending").toLowerCase()) {
      case "approved":
        return "bg-green-50 text-green-700";
      case "rejected":
        return "bg-red-50 text-red-700";
      default:
        return "bg-amber-50 text-amber-700";
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-[#3659C9]">WORKSPACE / GOVERNANCE</p>
        <h1 className="mt-2 text-3xl font-bold text-[#20242C]">Approvals</h1>
        <p className="mt-2 text-sm text-[#697386]">
          Review and approve actions before they are executed.
        </p>
      </div>

      {notice && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          {notice}
          <button
            onClick={() => setNotice("")}
            className="ml-3 font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E1E5EB] bg-white p-5">
          <p className="text-sm text-[#697386]">Total requests</p>
          <p className="mt-3 text-3xl font-bold text-[#20242C]">
            {approvalList.length}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-5">
          <p className="text-sm text-[#697386]">Pending review</p>
          <p className="mt-3 text-3xl font-bold text-amber-600">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-green-100 bg-white p-5">
          <p className="text-sm text-[#697386]">Approved</p>
          <p className="mt-3 text-3xl font-bold text-green-600">
            {
              approvalList.filter(
                (item) => (item.status || "").toLowerCase() === "approved"
              ).length
            }
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E1E5EB] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#20242C]">
              Approval queue
            </h2>
            <p className="mt-1 text-sm text-[#697386]">
              Workspace: {activeWorkspace?.name || "Current workspace"}
            </p>
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-lg border border-[#E1E5EB] bg-white px-3 py-2 text-sm"
          >
            <option value="all">All requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="mt-5 space-y-4">
          {filteredApprovals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E1E5EB] py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-[#9AA3B2]">
                task_alt
              </span>
              <p className="mt-3 font-medium text-[#20242C]">
                No approval requests found
              </p>
              <p className="mt-1 text-sm text-[#697386]">
                New actions requiring approval will appear here.
              </p>
            </div>
          ) : (
            filteredApprovals.map((item, index) => {
              const status = (item.status || "pending").toLowerCase();
              const id = item.id ?? item.approvalId ?? index;

              return (
                <div
                  key={id}
                  className="rounded-xl border border-[#E1E5EB] p-4 sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#3659C9]">
                        <span className="material-symbols-outlined">
                          verified_user
                        </span>
                      </div>

                      <div>
                        <h3 className="font-semibold text-[#20242C]">
                          {getTitle(item)}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-[#697386]">
                          {getDescription(item)}
                        </p>
                        <p className="mt-2 text-xs text-[#9AA3B2]">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString()
                            : item.requestedAt
                              ? new Date(item.requestedAt).toLocaleString()
                              : "Timestamp not available"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(status)}`}
                    >
                      {status}
                    </span>
                  </div>

                  {status === "pending" && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleApprove(item.id ?? item.approvalId)}
                        disabled={item.id == null && item.approvalId == null}
                        className="rounded-lg bg-[#3659C9] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2948AB] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Approve action
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
        <strong>Demo mode:</strong> Approving an item updates the local NEXUS
        workflow and audit history. It does not send emails or perform external
        actions.
      </div>
    </div>
  );
}

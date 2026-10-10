import React, { useState } from "react";
import { useNexus } from "../context/NexusContext.jsx";

const INITIAL_CAMPAIGNS = [
  {
    id: "CP-401",
    name: "AI Masterclass Promotion",
    channel: "Email",
    status: "Pending Approval",
    audience: 684,
  },
  {
    id: "CP-402",
    name: "Student Growth Campaign",
    channel: "Social",
    status: "Draft",
    audience: 186,
  },
];

export default function Marketing() {
  const {
    activeWorkspace,
    contacts = [],
    approvals = [],
    activities = [],
  } = useNexus();

  const [campaigns, setCampaigns] = useState(INITIAL_CAMPAIGNS);
  const [showForm, setShowForm] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [channel, setChannel] = useState("Email");
  const [notice, setNotice] = useState("");

  const pendingApprovals = approvals.filter(
    (approval) => approval.status === "pending"
  );

  const createCampaign = (event) => {
    event.preventDefault();

    const name = campaignName.trim();

    if (!name) return;

    const newCampaign = {
      id: `CP-${Date.now()}`,
      name,
      channel,
      status: "Draft",
      audience: contacts.length,
    };

    setCampaigns((previous) => [newCampaign, ...previous]);
    setCampaignName("");
    setChannel("Email");
    setShowForm(false);
    setNotice("Campaign draft created. Review it before any external sending.");
  };

  const campaignActivities = activities.filter((activity) =>
    /campaign|marketing|email|promotion/i.test(
      `${activity.title || ""} ${activity.meta || ""}`
    )
  );

  return (
    <div className="mx-auto max-w-7xl px-5 pb-10 md:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-[#3659C9]">
            {activeWorkspace.name}
          </p>

          <h1 className="mt-1 text-3xl font-bold text-[#20242C]">
            Marketing
          </h1>

          <p className="mt-2 text-sm text-[#697386]">
            Prepare campaigns, review audiences, and manage campaign drafts.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm((value) => !value);
            setNotice("");
          }}
          className="rounded-xl bg-[#3659C9] px-5 py-3 text-sm font-semibold text-white hover:bg-[#2947A3]"
        >
          + Create Campaign
        </button>
      </div>

      {notice && (
        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          {notice}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={createCampaign}
          className="mt-6 rounded-2xl border border-[#E1E5EB] bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-[#20242C]">
            New Campaign Draft
          </h2>

          <label className="mt-4 block text-sm font-medium text-[#697386]">
            Campaign name
          </label>

          <input
            value={campaignName}
            onChange={(event) => setCampaignName(event.target.value)}
            placeholder="e.g. Campus Innovation Webinar"
            className="mt-2 w-full rounded-lg border border-[#E1E5EB] px-4 py-3 text-sm outline-none focus:border-[#3659C9]"
            required
          />

          <label className="mt-4 block text-sm font-medium text-[#697386]">
            Channel
          </label>

          <select
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#E1E5EB] bg-white px-4 py-3 text-sm"
          >
            <option>Email</option>
            <option>Social</option>
            <option>SMS</option>
            <option>Web</option>
          </select>

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-[#3659C9] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Save Draft
            </button>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-[#E1E5EB] px-4 py-2.5 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Campaign Drafts" value={campaigns.length} />

        <Metric label="Pending Approvals" value={pendingApprovals.length} />

        <Metric label="CRM Contacts" value={contacts.length} />

        <Metric label="Audience Records" value={contacts.length} />
      </div>

      <section className="mt-8 rounded-2xl border border-[#E1E5EB] bg-white p-5">
        <h2 className="text-xl font-bold text-[#20242C]">Campaigns</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-[#E1E5EB] text-xs uppercase tracking-wide text-[#697386]">
                <th className="px-3 py-3 font-semibold">Campaign</th>
                <th className="px-3 py-3 font-semibold">Channel</th>
                <th className="px-3 py-3 font-semibold">Audience</th>
                <th className="px-3 py-3 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody>
              {campaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="border-b border-[#E1E5EB] last:border-0"
                >
                  <td className="px-3 py-4">
                    <p className="font-semibold text-[#20242C]">
                      {campaign.name}
                    </p>
                    <p className="mt-1 text-xs text-[#697386]">
                      {campaign.id}
                    </p>
                  </td>

                  <td className="px-3 py-4 text-sm text-[#697386]">
                    {campaign.channel}
                  </td>

                  <td className="px-3 py-4 text-sm text-[#697386]">
                    {campaign.audience}
                  </td>

                  <td className="px-3 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        campaign.status === "Pending Approval"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-blue-50 text-blue-800"
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#E1E5EB] bg-white p-5">
          <h2 className="text-lg font-bold text-[#20242C]">Approval Queue</h2>

          {pendingApprovals.length === 0 ? (
            <p className="mt-4 text-sm text-[#697386]">
              No pending campaign approvals.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {pendingApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="rounded-xl border border-[#E1E5EB] p-4"
                >
                  <p className="font-semibold text-[#20242C]">
                    {approval.title}
                  </p>

                  <p className="mt-2 text-sm text-[#697386]">
                    {approval.recipientCount ?? 0} recipients • {approval.requestedBy}
                  </p>

                  <span className="mt-3 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    Awaiting Review
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#E1E5EB] bg-white p-5">
          <h2 className="text-lg font-bold text-[#20242C]">
            Recent Marketing Activity
          </h2>

          {campaignActivities.length === 0 ? (
            <p className="mt-4 text-sm text-[#697386]">
              No marketing activity recorded.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {campaignActivities.slice(0, 6).map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <span className="material-symbols-outlined text-[#3659C9]">
                    {activity.icon || "campaign"}
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-[#20242C]">
                      {activity.title}
                    </p>

                    <p className="mt-1 text-xs text-[#697386]">
                      {activity.meta}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Demo mode: campaigns are stored locally in this screen. Creating a
        campaign does not send emails, publish advertisements, or contact customers.
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#E1E5EB] bg-white p-5">
      <span className="material-symbols-outlined text-2xl text-[#3659C9]">
        monitoring
      </span>

      <p className="mt-4 text-sm text-[#697386]">{label}</p>

      <p className="mt-2 text-3xl font-bold text-[#20242C]">{value}</p>
    </div>
  );
}

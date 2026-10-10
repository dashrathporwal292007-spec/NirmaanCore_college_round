import React, { useState } from "react";
import { useNexus } from "../context/NexusContext.jsx";

const INITIAL_WEBSITES = [
  {
    id: "web-1",
    name: "AI Masterclass Registration",
    url: "/events/ai-students",
    type: "Landing Page",
    status: "Published",
    icon: "language",
  },
  {
    id: "web-2",
    name: "Product Launch Page",
    url: "/product-launch",
    type: "Marketing Website",
    status: "Draft",
    icon: "rocket_launch",
  },
];

export default function Websites() {
  const { activeWorkspace, webinar, activities = [] } = useNexus();

  const [websites, setWebsites] = useState(INITIAL_WEBSITES);
  const [showForm, setShowForm] = useState(false);
  const [websiteName, setWebsiteName] = useState("");
  const [notice, setNotice] = useState("");

  const createWebsite = (event) => {
    event.preventDefault();

    const name = websiteName.trim();

    if (!name) return;

    const newWebsite = {
      id: `web-${Date.now()}`,
      name,
      url: `/preview/${Date.now()}`,
      type: "Website Draft",
      status: "Draft",
      icon: "web",
    };

    setWebsites((previous) => [newWebsite, ...previous]);
    setWebsiteName("");
    setShowForm(false);
    setNotice("Website draft created successfully.");
  };

  const openPreview = (website) => {
    setNotice(
      `Demo preview selected: ${website.name}. No external website was published.`
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-5 pb-10 md:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-[#3659C9]">
            {activeWorkspace.name}
          </p>

          <h1 className="mt-1 text-3xl font-bold text-[#20242C]">
            Websites
          </h1>

          <p className="mt-2 text-sm text-[#697386]">
            Manage your website drafts and registration landing pages.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm((value) => !value);
            setNotice("");
          }}
          className="rounded-xl bg-[#3659C9] px-5 py-3 text-sm font-semibold text-white hover:bg-[#2947A3]"
        >
          + Create Website
        </button>
      </div>

      {notice && (
        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          {notice}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={createWebsite}
          className="mt-6 rounded-2xl border border-[#E1E5EB] bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-[#20242C]">
            Create a website draft
          </h2>

          <label className="mt-4 block text-sm font-medium text-[#697386]">
            Website name
          </label>

          <input
            value={websiteName}
            onChange={(event) => setWebsiteName(event.target.value)}
            placeholder="e.g. Student Innovation Summit"
            className="mt-2 w-full rounded-lg border border-[#E1E5EB] px-4 py-3 text-sm outline-none focus:border-[#3659C9]"
            required
          />

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-[#3659C9] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Create Draft
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

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-[#E1E5EB] bg-white p-5">
          <p className="text-sm text-[#697386]">Total Websites</p>
          <p className="mt-3 text-3xl font-bold text-[#20242C]">
            {websites.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E1E5EB] bg-white p-5">
          <p className="text-sm text-[#697386]">Published</p>
          <p className="mt-3 text-3xl font-bold text-[#21865B]">
            {websites.filter((site) => site.status === "Published").length}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E1E5EB] bg-white p-5">
          <p className="text-sm text-[#697386]">Current Webinar</p>
          <p className="mt-3 text-lg font-bold text-[#20242C]">
            {webinar.title}
          </p>
          <p className="mt-1 text-sm text-[#697386]">
            {webinar.landingPageUrl}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-[#20242C]">
          Your Websites
        </h2>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {websites.map((website) => (
            <article
              key={website.id}
              className="rounded-2xl border border-[#E1E5EB] bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#3659C9]">
                    <span className="material-symbols-outlined">
                      {website.icon}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-[#20242C]">
                      {website.name}
                    </h3>

                    <p className="mt-1 text-sm text-[#697386]">
                      {website.type}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    website.status === "Published"
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {website.status}
                </span>
              </div>

              <p className="mt-4 break-all text-sm text-[#697386]">
                {website.url}
              </p>

              <button
                onClick={() => openPreview(website)}
                className="mt-5 w-full rounded-lg border border-[#E1E5EB] px-4 py-3 text-sm font-semibold text-[#3659C9] hover:bg-blue-50"
              >
                Preview Details
              </button>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Demo mode: website creation generates a local draft. Publishing,
        hosting, and external website deployment are not connected.
      </div>
    </div>
  );
}

import React, { useMemo, useState } from "react";
import { useNexus } from "../context/NexusContext";

const filters = ["All Contacts", "Qualified", "Customers", "Webinar"];

const statusStyles = {
  Qualified: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Customer: "bg-blue-50 text-blue-700 ring-blue-600/20",
  Lead: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Webinar: "bg-violet-50 text-violet-700 ring-violet-600/20",
  Inactive: "bg-gray-100 text-gray-600 ring-gray-500/20",
};

function StatusBadge({ status }) {
  const style =
    statusStyles[status] ||
    "bg-gray-100 text-gray-600 ring-gray-500/20";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {status}
    </span>
  );
}

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "CT"
  );
}

function formatSource(source = "") {
  if (source.startsWith("Webinar")) return "Webinar";
  if (source.toLowerCase().includes("campaign")) return "Campaign";
  if (source.toLowerCase().includes("referral")) return "Referral";
  if (source.toLowerCase().includes("website")) return "Website";
  return source || "Manual";
}

function StatCard({ title, value, description, icon, iconStyle }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
            {value.toLocaleString()}
          </p>

          <p className="mt-2 text-xs text-gray-500">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconStyle}`}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
    </div>
  );
}

export default function CRMContacts() {
  const { contacts = [], addContact, activeWorkspace } = useNexus();

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Contacts");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [notification, setNotification] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    status: "Lead",
    source: "Website",
    tags: "",
  });

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return contacts.filter((contact) => {
      const matchesSearch =
        !query ||
        [
          contact.name,
          contact.email,
          contact.company,
          contact.status,
          contact.source,
          ...(Array.isArray(contact.tags) ? contact.tags : []),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      let matchesFilter = true;

      if (activeFilter === "Qualified") {
        matchesFilter = contact.status === "Qualified";
      } else if (activeFilter === "Customers") {
        matchesFilter = contact.status === "Customer";
      } else if (activeFilter === "Webinar") {
        matchesFilter =
          String(contact.source || "").toLowerCase().includes("webinar") ||
          (Array.isArray(contact.tags) &&
            contact.tags.some((tag) =>
              String(tag).toLowerCase().includes("webinar")
            ));
      }

      return matchesSearch && matchesFilter;
    });
  }, [contacts, search, activeFilter]);

  const totalContacts = contacts.length;

  const qualifiedCount = contacts.filter(
    (contact) => contact.status === "Qualified"
  ).length;

  const customerCount = contacts.filter(
    (contact) => contact.status === "Customer"
  ).length;

  const webinarCount = contacts.filter(
    (contact) =>
      String(contact.source || "").toLowerCase().includes("webinar") ||
      (Array.isArray(contact.tags) &&
        contact.tags.some((tag) =>
          String(tag).toLowerCase().includes("webinar")
        ))
  ).length;

  function showMessage(message) {
    setNotification(message);

    window.setTimeout(() => {
      setNotification("");
    }, 3000);
  }

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleAddContact(event) {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email) {
      showMessage("Please enter the contact's name and email.");
      return;
    }

    const emailExists = contacts.some(
      (contact) =>
        String(contact.email).toLowerCase() === email.toLowerCase()
    );

    if (emailExists) {
      showMessage("A contact with this email already exists.");
      return;
    }

    const newContact = addContact({
      name,
      email,
      company: form.company.trim() || "Direct Contact",
      status: form.status,
      source: form.source,
      tags: form.tags,
    });

    if (!newContact) {
      showMessage("Unable to add the contact. Please try again.");
      return;
    }

    setForm({
      name: "",
      email: "",
      company: "",
      status: "Lead",
      source: "Website",
      tags: "",
    });

    setSearch("");
    setActiveFilter("All Contacts");
    setShowAddForm(false);

    showMessage(`${name} added to ${activeWorkspace.name}.`);
  }

  function exportContacts() {
    if (contacts.length === 0) {
      showMessage("There are no contacts to export.");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Company",
      "Status",
      "Source",
      "Score",
      "Tags",
    ];

    const escapeCSV = (value) => {
      const text = Array.isArray(value)
        ? value.join(", ")
        : String(value ?? "");

      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = contacts.map((contact) =>
      [
        contact.name,
        contact.email,
        contact.company,
        contact.status,
        contact.source,
        contact.score,
        contact.tags,
      ]
        .map(escapeCSV)
        .join(",")
    );

    const csv = [headers.map(escapeCSV).join(","), ...rows].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const workspaceSlug = (activeWorkspace.name || "workspace")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    link.href = url;
    link.download = `nexus-${workspaceSlug}-contacts.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    showMessage(`${contacts.length} contacts exported successfully.`);
  }

  function resetFilters() {
    setSearch("");
    setActiveFilter("All Contacts");
  }

  return (
    <div className="min-h-full space-y-6 bg-[#F7F8FA] p-4 text-gray-900 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3659C9]">
              NEXUS CRM
            </span>

            <span className="rounded-full border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Demo Data
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Contacts
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage relationships and track your contacts in{" "}
            <span className="font-medium text-gray-700">
              {activeWorkspace.name}
            </span>
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportContacts}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <span className="material-symbols-outlined text-lg">
              download
            </span>
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3659C9] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#2948AD]"
          >
            <span className="material-symbols-outlined text-lg">
              person_add
            </span>
            Add Contact
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Contacts"
          value={totalContacts}
          description="Contacts in this workspace"
          icon="groups"
          iconStyle="bg-blue-50 text-blue-700"
        />

        <StatCard
          title="Qualified Leads"
          value={qualifiedCount}
          description="Contacts marked Qualified"
          icon="trending_up"
          iconStyle="bg-emerald-50 text-emerald-700"
        />

        <StatCard
          title="Customers"
          value={customerCount}
          description="Contacts marked Customer"
          icon="handshake"
          iconStyle="bg-violet-50 text-violet-700"
        />

        <StatCard
          title="Webinar Contacts"
          value={webinarCount}
          description="Contacts from webinar sources"
          icon="event"
          iconStyle="bg-amber-50 text-amber-700"
        />
      </div>

      {/* Contacts Table */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-semibold">All Contacts</h2>
              <p className="mt-1 text-sm text-gray-500">
                {filteredContacts.length} of {totalContacts} contacts
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400">
                search
              </span>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search contacts..."
                aria-label="Search contacts"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#3659C9] focus:bg-white focus:ring-2 focus:ring-[#3659C9]/10"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {filters.map((filter) => {
              const selected = activeFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                    selected
                      ? "bg-[#3659C9] text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {filter}
                </button>
              );
            })}

            {(search || activeFilter !== "All Contacts") && (
              <button
                type="button"
                onClick={resetFilters}
                className="ml-auto inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                <span className="material-symbols-outlined text-base">
                  restart_alt
                </span>
                Reset filters
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="border-b border-gray-100 bg-gray-50/80">
              <tr className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Tags</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredContacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="transition hover:bg-gray-50/80"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700 ${
                          contact.avatarGradient || ""
                        }`}
                      >
                        {contact.initials || getInitials(contact.name)}
                      </div>

                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">
                          {contact.name}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {contact.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {contact.company || "—"}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={contact.status} />
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatSource(contact.source)}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex max-w-xs flex-wrap gap-1.5">
                      {(Array.isArray(contact.tags)
                        ? contact.tags
                        : []
                      )
                        .slice(0, 3)
                        .map((tag, index) => (
                          <span
                            key={`${contact.id}-${tag}-${index}`}
                            className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] text-gray-600"
                          >
                            {String(tag).replace(/^#/, "")}
                          </span>
                        ))}

                      {Array.isArray(contact.tags) &&
                        contact.tags.length > 3 && (
                          <span className="px-1 py-1 text-[11px] text-gray-400">
                            +{contact.tags.length - 3}
                          </span>
                        )}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedContact(contact)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-[#3659C9] hover:text-[#3659C9]"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredContacts.length === 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                <span className="material-symbols-outlined text-3xl">
                  person_search
                </span>
              </div>

              <h3 className="mt-4 font-semibold text-gray-900">
                No contacts found
              </h3>

              <p className="mt-1 max-w-sm text-sm text-gray-500">
                Try another search or reset your filters to see more contacts.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 text-sm font-semibold text-[#3659C9] hover:underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/70 px-5 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {filteredContacts.length} of {totalContacts} contacts
          </span>

          <span>
            Workspace: {activeWorkspace.name} · Changes are saved locally
          </span>
        </div>
      </section>

      {/* Demo Notice */}
      <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
        <span className="material-symbols-outlined mt-0.5 text-blue-600">
          info
        </span>

        <div>
          <p className="text-sm font-semibold text-blue-900">
            Demo environment
          </p>

          <p className="mt-1 text-sm leading-6 text-blue-800/80">
            Contact records and statistics come from the active NEXUS
            workspace. New contacts are saved in this browser. No external CRM
            service is connected.
          </p>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowAddForm(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-contact-title"
            className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2
                  id="add-contact-title"
                  className="text-lg font-semibold"
                >
                  Add Contact
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add a contact to {activeWorkspace.name}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddContact} className="p-6">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Full Name *
                  </label>

                  <input
                    id="contact-name"
                    name="name"
                    value={form.name}
                    onChange={updateForm}
                    required
                    autoFocus
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#3659C9] focus:ring-2 focus:ring-[#3659C9]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Email Address *
                  </label>

                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={updateForm}
                    required
                    placeholder="rahul@example.com"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#3659C9] focus:ring-2 focus:ring-[#3659C9]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-company"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Company
                  </label>

                  <input
                    id="contact-company"
                    name="company"
                    value={form.company}
                    onChange={updateForm}
                    placeholder="Company or organization"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#3659C9] focus:ring-2 focus:ring-[#3659C9]/10"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-status"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Status
                    </label>

                    <select
                      id="contact-status"
                      name="status"
                      value={form.status}
                      onChange={updateForm}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#3659C9] focus:ring-2 focus:ring-[#3659C9]/10"
                    >
                      <option value="Lead">Lead</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Customer">Customer</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-source"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Source
                    </label>

                    <select
                      id="contact-source"
                      name="source"
                      value={form.source}
                      onChange={updateForm}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#3659C9] focus:ring-2 focus:ring-[#3659C9]/10"
                    >
                      <option value="Website">Website</option>
                      <option value="Webinar Registration">
                        Webinar
                      </option>
                      <option value="Marketing Campaign">
                        Campaign
                      </option>
                      <option value="Referral">Referral</option>
                      <option value="Inbound Form">Inbound Form</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-tags"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Tags
                  </label>

                  <input
                    id="contact-tags"
                    name="tags"
                    value={form.tags}
                    onChange={updateForm}
                    placeholder="e.g. student, AI, high-intent"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#3659C9] focus:ring-2 focus:ring-[#3659C9]/10"
                  />

                  <p className="mt-1.5 text-xs text-gray-400">
                    Separate multiple tags with commas.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-[#3659C9] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#2948AD]"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Details Modal */}
      {selectedContact && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedContact(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-details-title"
            className="my-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-gray-100 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-lg font-semibold text-blue-700">
                  {selectedContact.initials ||
                    getInitials(selectedContact.name)}
                </div>

                <div>
                  <h2
                    id="contact-details-title"
                    className="text-lg font-semibold"
                  >
                    {selectedContact.name}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {selectedContact.company || "Direct Contact"}
                  </p>

                  <div className="mt-2">
                    <StatusBadge status={selectedContact.status} />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                aria-label="Close contact details"
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Email Address
                </p>

                <p className="mt-1 break-all text-sm font-medium text-gray-800">
                  {selectedContact.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Contact Source
                </p>

                <p className="mt-1 text-sm font-medium text-gray-800">
                  {selectedContact.source || "Manual"}
                </p>
              </div>

              {selectedContact.score !== undefined && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Contact Score
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {selectedContact.score}/100
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Tags
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {Array.isArray(selectedContact.tags) &&
                  selectedContact.tags.length > 0 ? (
                    selectedContact.tags.map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600"
                      >
                        {String(tag).replace(/^#/, "")}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">
                      No tags added
                    </span>
                  )}
                </div>
              </div>

              {selectedContact.activity && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Recent Activity
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {selectedContact.activity}
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">
                  Workspace: {activeWorkspace.name}
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="rounded-xl bg-[#3659C9] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#2948AD]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[60] flex max-w-[calc(100vw-3rem)] items-center gap-3 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-xl"
        >
          <span className="material-symbols-outlined text-emerald-400">
            check_circle
          </span>

          {notification}
        </div>
      )}
    </div>
  );
}


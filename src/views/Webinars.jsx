import React from "react";
import { useNexus } from "../context/NexusContext.jsx";

export default function Webinars() {
  const { activeWorkspace, webinar, contacts = [], activities = [] } = useNexus();

  const remainingSeats = Math.max(0, webinar.capacity - webinar.seatsClaimed);

  const registrationRate =
    webinar.capacity > 0
      ? Math.round((webinar.seatsClaimed / webinar.capacity) * 100)
      : 0;

  const webinarContacts = contacts.filter((contact) =>
    /webinar|registr/i.test(`${contact.source || ""} ${contact.activity || ""}`)
  );

  const recentActivities = activities.filter((activity) =>
    /webinar|registr|attendee|landing page/i.test(
      `${activity.title || ""} ${activity.meta || ""}`
    )
  );

  return (
    <div className="mx-auto max-w-7xl px-5 pb-10 md:px-8">
      <p className="text-sm font-medium text-[#3659C9]">
        {activeWorkspace.name}
      </p>

      <h1 className="mt-1 text-3xl font-bold text-[#20242C]">
        Webinars
      </h1>

      <p className="mt-2 text-sm text-[#697386]">
        Manage webinar registrations, capacity, and attendee activity.
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Total Registrations"
          value={webinar.seatsClaimed}
          icon="groups"
        />

        <Metric
          label="Total Capacity"
          value={webinar.capacity}
          icon="event_seat"
        />

        <Metric
          label="Seats Remaining"
          value={remainingSeats}
          icon="airline_seat_recline_normal"
        />

        <Metric
          label="Capacity Used"
          value={`${registrationRate}%`}
          icon="monitoring"
        />
      </div>

      <section className="mt-8 rounded-2xl border border-[#E1E5EB] bg-white p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              {webinar.status}
            </span>

            <h2 className="mt-4 text-2xl font-bold text-[#20242C]">
              {webinar.title}
            </h2>

            <p className="mt-2 text-sm text-[#697386]">
              {webinar.subtitle}
            </p>

            <p className="mt-4 text-sm text-[#697386]">
              Event ID: {webinar.id}
            </p>

            <p className="mt-1 text-sm text-[#697386]">
              Schedule: {webinar.dateFormatted}
            </p>
          </div>

          <div className="rounded-xl bg-blue-50 p-5 sm:min-w-48">
            <p className="text-sm text-[#697386]">Registration progress</p>

            <p className="mt-2 text-3xl font-bold text-[#3659C9]">
              {registrationRate}%
            </p>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-[#3659C9]"
                style={{
                  width: `${Math.min(100, registrationRate)}%`,
                }}
              />
            </div>

            <p className="mt-2 text-xs text-[#697386]">
              {webinar.seatsClaimed} of {webinar.capacity} registrations
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => {
              if (webinar.landingPageUrl) {
                window.history.pushState({}, "", webinar.landingPageUrl);
                window.dispatchEvent(new PopStateEvent("popstate"));
              }
            }}
            className="rounded-lg bg-[#3659C9] px-4 py-3 text-sm font-semibold text-white hover:bg-[#2947A3]"
          >
            View Registration URL
          </button>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(webinar.landingPageUrl || "");
            }}
            className="rounded-lg border border-[#E1E5EB] px-4 py-3 text-sm font-semibold text-[#20242C]"
          >
            Copy Registration URL
          </button>
        </div>

        <p className="mt-4 break-all text-sm text-[#697386]">
          Registration URL: {webinar.landingPageUrl || "Not configured"}
        </p>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#E1E5EB] bg-white p-5">
          <h2 className="text-lg font-bold text-[#20242C]">
            CRM Registration Records
          </h2>

          <p className="mt-1 text-sm text-[#697386]">
            Contacts whose source or activity indicates webinar registration.
          </p>

          {webinarContacts.length === 0 ? (
            <p className="mt-5 text-sm text-[#697386]">
              No matching registration contacts are available in this workspace.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {webinarContacts.slice(0, 6).map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#E1E5EB] p-3"
                >
                  <div>
                    <p className="font-semibold text-[#20242C]">
                      {contact.name}
                    </p>
                    <p className="mt-1 text-xs text-[#697386]">
                      {contact.email}
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-[#3659C9]">
                    {contact.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#E1E5EB] bg-white p-5">
          <h2 className="text-lg font-bold text-[#20242C]">
            Recent Webinar Activity
          </h2>

          {recentActivities.length === 0 ? (
            <p className="mt-5 text-sm text-[#697386]">
              No webinar-related activities found.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {recentActivities.slice(0, 6).map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <span className="material-symbols-outlined text-[#3659C9]">
                    {activity.icon || "event"}
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
        Demo mode: registration figures come from the selected workspace.
        External webinar hosting and live registration collection are not connected.
      </div>
    </div>
  );
}

function Metric({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-[#E1E5EB] bg-white p-5">
      <span className="material-symbols-outlined text-2xl text-[#3659C9]">
        {icon}
      </span>

      <p className="mt-4 text-sm text-[#697386]">{label}</p>

      <p className="mt-2 text-3xl font-bold text-[#20242C]">{value}</p>
    </div>
  );
}

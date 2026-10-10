"use client";
import { useEffect, useState } from "react";
import { api, type Analytics } from "@/lib/api";
import { useWorkspace } from "./workspace";
import { ErrorState, SimulatedMark, inr } from "./shared";
export function AnalyticsScreen() {
  const { revision } = useWorkspace();
  const [data, setData] = useState<Analytics | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api
      .analytics()
      .then((r) => {
        if (active) {
          setData(r);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [revision]);
  return (
    <>
      <h1>Count what<br /><em>happened.</em></h1>
      <p>
        Computed from the current database, including retained history.
        Rewinding a run does not erase irreversible records.
      </p>
      {error && <ErrorState message={error} />}{" "}
      {!data ? (
        <p role="status">Reading results…</p>
      ) : (
        <>
          <section className="analytics-ledger">
            <div>
              <strong className="impact-number">{data.funnel.leads}</strong>
              <h2>Contacts</h2>
              <p>
                {data.funnel.registered} registered · {data.funnel.attended}{" "}
                recorded attendees · {data.funnel.subscribed} active subscribers
              </p>
            </div>
            <div>
              <strong className="impact-number">{data.campaigns.sent}</strong>
              <h2>Messages marked sent</h2>
              <p>
                {data.campaigns.queued} queued · {data.campaigns.cancelled}{" "}
                cancelled · {data.campaigns.failed} failed
              </p>
              <p>
                <SimulatedMark /> · No external delivery.
              </p>
            </div>
            <div>
              <strong className="impact-number">
                {inr(data.billing.invoiced_inr)}
              </strong>
              <h2>Invoiced</h2>
              <p>
                {inr(data.billing.mrr_inr)} monthly recurring amount ·{" "}
                {data.billing.usage_units} usage units
              </p>
              <p>
                <SimulatedMark /> · No payment collection.
              </p>
            </div>
          </section>
          <section className="section">
            <h2>Measured and estimated</h2>
            <p>
              {data.campaigns.opened} recorded opens · {data.campaigns.clicked}{" "}
              recorded clicks. No external tracking is connected.
            </p>
            <p>
              {data.automation.estimated_minutes_saved} estimated minutes saved.
              This is the backend estimate, not a measured time trial.
            </p>
          </section>
        </>
      )}
    </>
  );
}

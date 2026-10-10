"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { allRuns, runNumber } from "@/lib/client-data";
import type { RunSummary } from "@/lib/api";
import { EmptyState, ErrorState, StatusPill } from "./shared";
import { useWorkspace } from "./workspace";
export function Runs() {
  const { revision } = useWorkspace();
  const [items, setItems] = useState<RunSummary[]>([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    allRuns()
      .then((r) => {
        if (active) {
          setItems(r);
          setLoaded(true);
          setError("");
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [revision]);
  return (
    <>
      <h1>
        Every action.
        <br />
        <em>A receipt.</em>
      </h1>
      <p>
        Every request, approval and rewind stays recorded. Run numbers follow
        creation order in this demo.
      </p>
      {error && <ErrorState message={error} />}{" "}
      {!loaded ? (
        <p role="status">Reading runs…</p>
      ) : !items.length ? (
        <EmptyState>
          <Link href="/">Plan a request</Link> to create your first run.
        </EmptyState>
      ) : (
        items.map((r) => (
          <Link
            className="list-row run-index-row"
            href={"/runs/" + r.id}
            key={r.id}
          >
            <div>
              <span className="run-index-label">{runNumber(items, r.id)}</span>
              <p className="run-summary">{r.instruction}</p>
              <small>
                {new Date(r.created_at).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}{" "}
                IST
              </small>
            </div>
            <StatusPill status={r.status} />
          </Link>
        ))
      )}
    </>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { allContacts } from "@/lib/client-data";
import type { Contact } from "@/lib/api";
import { EmptyState, ErrorState } from "./shared";
import { useWorkspace } from "./workspace";
export function ContactsList() {
  const { revision } = useWorkspace();
  const [items, setItems] = useState<Contact[]>([]),
    [search, setSearch] = useState(""),
    [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    allContacts()
      .then((d) => {
        if (active) {
          setItems(d);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [revision]);
  const match = search.trim().toLowerCase(),
    shown = items.filter((c) =>
      [
        c.name,
        c.email,
        ...c.tags,
        c.unsubscribed ? "unsubscribed opted out" : "eligible",
      ]
        .join(" ")
        .toLowerCase()
        .includes(match),
    );
  return (
    <>
      <h1>Every customer.<br /> Every <em>decision.</em></h1>
      <p>One customer record. Every business decision follows it.</p>
      <label htmlFor="contact-search">
        Search names, email addresses or tags
        <input
          id="contact-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts"
        />
      </label>
      {error && <ErrorState message={error} />}
      <p role="status">
        {loaded ? shown.length + " contacts" : "Loading contacts…"}
      </p>
      {loaded && !shown.length ? (
        <EmptyState>
          No contacts match. Clear the search or try another name or tag.
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="contact-table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Tags</th>
                <th>State</th>
                <th>Consent</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link className="run-link" href={"/contacts/" + c.id}>
                      {c.name}
                    </Link>
                    <br />
                    <small>{c.email}</small>
                  </td>
                  <td data-label="Tags">{c.tags.join(", ") || "No tags"}</td>
                  <td data-label="State">{c.status}</td>
                  <td
                    data-label="Consent"
                    className={c.unsubscribed ? "tone-blocked" : ""}
                  >
                    {c.unsubscribed ? "Unsubscribed" : "Eligible"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

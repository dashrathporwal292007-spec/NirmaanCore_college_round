import { api, type Contact, type RunSummary } from "./api";
export async function allContacts() {
  const items: Contact[] = [];
  for (let offset = 0; ; offset += 200) {
    const page = await api.contacts({ limit: 200, offset });
    items.push(...page.contacts);
    if (page.contacts.length < 200) return items;
  }
}
export async function allRuns() {
  const items: RunSummary[] = [];
  for (let offset = 0; ; offset += 200) {
    const page = await api.runs({ limit: 200, offset });
    items.push(...page.runs);
    if (page.runs.length < 200) return items;
  }
}
export const runNumber = (items: RunSummary[], id: string) => {
  const i = items.findIndex((r) => r.id === id);
  return i < 0
    ? "Run " + id.slice(0, 8)
    : "Run " + String(items.length - i).padStart(4, "0");
};

import type { Diff } from "./agent/runner";
import type { Plan } from "./agent/plan";
export type Risk = "LOW" | "MEDIUM" | "HIGH";
export type Json =
  null | boolean | number | string | Json[] | { [key: string]: Json };
export interface Mode {
  plannerMode: "supplied" | "gemini" | "demo" | "fallback";
  fallbackReason: string | null;
}
export interface Run {
  id: string;
  user_id: string;
  instruction: string;
  status: string;
  risk: Risk | null;
  required_role: string;
  created_at: string;
  completed_at: string | null;
  error: string | null;
  plan: Plan | null;
  diff: Diff | null;
}
export type RunSummary = Omit<Run, "plan" | "diff">;
export interface Step {
  id: string;
  seq: number;
  tool: string;
  args: Record<string, Json>;
  result: Record<string, Json>;
  compensation: Json;
  status: string;
}
export interface Detail {
  run: Run;
  steps: Step[];
  approvals: Record<string, Json>[];
  audit: Record<string, Json>[];
  notes: string[];
}
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  tags: string[];
  source: string;
  status: string;
  unsubscribed: boolean;
  created_at: string;
}
export interface Event {
  id: string;
  type: string;
  payload: Record<string, Json>;
  run_id: string | null;
  created_at: string;
  instruction: string | null;
  rule_id: string | null;
  reason: string | null;
}
export interface Rule {
  ruleId?: string;
  rule?: string;
  reason?: string;
  evidence?: Json;
}
export interface Message {
  id: string;
  campaign_id: string;
  contact_id: string;
  contact_name: string;
  kind: string;
  webinar_id: string | null;
  payload: { subject: string; body: string };
  dispatch_after: string;
  status: string;
  cancel_reason: Rule | null;
  dispatched_at: string | null;
}
export interface Pending {
  recipients: { id: string; name: string }[];
  subject: string;
  body: string;
  fingerprint: string;
}
export interface Analytics {
  funnel: {
    leads: number;
    registered: number;
    attended: number;
    subscribed: number;
  };
  campaigns: {
    queued: number;
    sent: number;
    cancelled: number;
    failed: number;
    opened: number;
    clicked: number;
  };
  billing: { mrr_inr: number; usage_units: number; invoiced_inr: number };
  automation: {
    estimated_minutes_saved: number;
    by_run: { run_id: string; estimated_minutes: number }[];
  };
  simulated: true;
  savings_are_estimates: true;
}
export type PlanResponse = Mode & {
  summary: string;
  deferred?: string[];
  source: string;
  clarification?: string;
  runId?: string;
  status?: string;
  diff?: Diff;
  risk?: Risk;
  requiredRole?: string;
};
export interface Decision {
  runId: string;
  status: string;
  changed?: boolean;
  duplicate?: boolean;
  diff?: Diff;
  risk?: Risk;
}
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}
async function request<T>(
  path: string,
  body?: unknown,
  publicRequest = false,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      credentials: publicRequest ? "omit" : "same-origin",
      cache: "no-store",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "NETWORK",
      "Could not reach Nexus. Check the connection and try again.",
    );
  }
  const result = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      result?.error?.code ?? "HTTP_ERROR",
      result?.error?.message ?? "The server could not complete this request.",
      result?.error?.details,
    );
  return result as T;
}
function query(values: Record<string, string | number | undefined> = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(values))
    if (v !== undefined && v !== "") q.set(k, String(v));
  return q.size ? "?" + q : "";
}
export const users = {
  owner: "00000000-0000-0000-0000-000000000001",
  viewer: "00000000-0000-0000-0000-000000000003",
};
export function setRole(role: keyof typeof users) {
  document.cookie = `uid=${users[role]}; Path=/; SameSite=Lax`;
}
export const api = {
  plan: (instruction: string, plan?: Plan) =>
    request<PlanResponse>("/api/agent/plan", {
      instruction,
      ...(plan ? { plan } : {}),
    }),
  approve: (
    run_id: string,
    decision: "approved" | "rejected",
    typed?: string,
  ) => request<Decision>("/api/agent/approve", { run_id, decision, typed }),
  decision: (id: string, decision: "approved" | "rejected", typed?: string) =>
    request<Decision>(`/api/runs/${encodeURIComponent(id)}/decision`, {
      decision,
      typed,
    }),
  rewind: (id: string) =>
    request<{ runId: string; status: string; notes: string[] }>(
      `/api/runs/${encodeURIComponent(id)}/rewind`,
      {},
    ),
  runs: (filters: Record<string, string | number | undefined> = {}) =>
    request<{ runs: RunSummary[]; limit: number; offset: number }>(
      "/api/runs" + query(filters),
    ),
  run: (id: string) => request<Detail>(`/api/runs/${encodeURIComponent(id)}`),
  close: (id: string) =>
    request<{ drafted: number }>(
      `/api/webinars/${encodeURIComponent(id)}/close`,
      {},
    ),
  pending: (id: string, kind: "offer" | "followup") =>
    request<Pending>(
      `/api/webinars/${encodeURIComponent(id)}/pending` + query({ kind }),
    ),
  approvePending: (
    id: string,
    kind: "offer" | "followup",
    fingerprint: string,
  ) =>
    request<{ approved?: number; stale?: boolean; preview?: Pending }>(
      `/api/webinars/${encodeURIComponent(id)}/pending/approve`,
      { kind, fingerprint },
    ),
  checkout: (contact_id: string, plan: string) =>
    request<{
      simulated: true;
      subscription_id: string;
      invoice_id: string | null;
      invoice_created: boolean;
      amount_inr: number;
    }>("/api/billing/checkout", { contact_id, plan }),
  cancelPending: (id: string) =>
    request<{ cancelled: number; already_sent: number }>(
      `/api/runs/${encodeURIComponent(id)}/cancel-pending`,
      {},
    ),
  tick: () =>
    request<{ simulated: true; sent: number; blocked: number }>(
      "/api/worker/tick",
      {},
    ),
  outbox: (filters: Record<string, string | number | undefined> = {}) =>
    request<{
      outbox: Message[];
      limit: number;
      offset: number;
      simulated: true;
    }>("/api/outbox" + query(filters)),
  page: (slug: string) =>
    request<{
      page: {
        id: string;
        slug: string;
        title: string;
        blocks: Record<string, Json>[];
        version: number;
      };
      webinar: {
        id: string;
        title: string;
        description: string;
        starts_at: string;
        status: string;
      } | null;
      registration_open: boolean;
    }>(`/s/${encodeURIComponent(slug)}`, undefined, true),
  register: (slug: string, name: string, email: string) =>
    request<{ registered: boolean }>(
      `/s/${encodeURIComponent(slug)}/register`,
      { name, email },
      true,
    ),
  contacts: (filters: Record<string, string | number | undefined> = {}) =>
    request<{ contacts: Contact[]; limit: number; offset: number }>(
      "/api/contacts" + query(filters),
    ),
  timeline: (
    id: string,
    filters: Record<string, string | number | undefined> = {},
  ) =>
    request<{ events: Event[]; limit: number; offset: number }>(
      `/api/contacts/${encodeURIComponent(id)}/timeline` + query(filters),
    ),
  analytics: () => request<Analytics>("/api/analytics/summary"),
};

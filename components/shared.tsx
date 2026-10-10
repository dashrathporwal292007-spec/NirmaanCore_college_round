import type { CSSProperties, ReactNode } from "react";
import type { Risk, Json } from "@/lib/api";
export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
export function RiskBadge({ risk }: { risk: Risk }) {
  const level = { LOW: 1, MEDIUM: 2, HIGH: 3 }[risk];
  return (
    <div
      className={`risk tone-${risk === "HIGH" ? "blocked" : risk === "MEDIUM" ? "decision" : "added"}`}
    >
      <span>{risk.toLowerCase()} risk</span>
      <span className="meter" aria-hidden>
        {[1, 2, 3].map((n) => (
          <i key={n} className={n <= level ? "on" : ""} />
        ))}
      </span>
    </div>
  );
}
export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`pill tone-${/cancel|fail|reject/.test(status) ? "blocked" : /await|pending/.test(status) ? "decision" : "added"}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
export function SimulatedMark() {
  return <span className="simulated">Simulated</span>;
}
export function RuleMarker({
  id,
  reason,
  evidence,
}: {
  id: string;
  reason: string;
  evidence?: Json;
}) {
  return (
    <div className="rule">
      <code>{id}</code>
      <p>{reason}</p>
      {evidence != null && (
        <details>
          <summary>Show evidence</summary>
          <pre>{JSON.stringify(evidence, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
export function ReceiptLine({
  kind,
  title,
  detail,
  index,
  reverse = false,
}: {
  kind: "add" | "change" | "remove" | "blocked";
  title: string;
  detail: ReactNode;
  index: number;
  reverse?: boolean;
}) {
  return (
    <div
      className={`receipt-line tone-${kind === "add" ? "added" : kind === "change" ? "changed" : "blocked"} ${reverse ? "undo" : ""}`}
      style={{ "--delay": `${index * 170}ms` } as CSSProperties}
    >
      <span className="line-sign" aria-label={kind}>
        {kind === "add" ? "+" : kind === "change" ? "~" : "−"}
      </span>
      <span>{title}</span>
      <span className="leaders" aria-hidden />
      <strong>{detail}</strong>
    </div>
  );
}
export function Stamp({ status, id }: { status: string; id?: string }) {
  return (
    <div
      className={`stamp tone-${status === "completed" ? "added" : status === "awaiting_approval" ? "decision" : "changed"}`}
    >
      {status === "awaiting_approval"
        ? "Preview. Nothing has happened yet."
        : status === "completed"
          ? `Committed, run ${id?.slice(0, 8)}`
          : status === "rewound"
            ? "Rewound. See the limits below."
            : status.replaceAll("_", " ")}
    </div>
  );
}
export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="error" role="alert">
      <p>{message}</p>
      <p>Check your role and request, then try again.</p>
      {onRetry && <button onClick={onRetry}>Try again</button>}
    </div>
  );
}

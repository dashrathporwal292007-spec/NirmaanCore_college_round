import { Suspense } from "react";
import { WorkspaceShell } from "@/components/workspace";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p>Opening workspace…</p>}>
      <WorkspaceShell>{children}</WorkspaceShell>
    </Suspense>
  );
}

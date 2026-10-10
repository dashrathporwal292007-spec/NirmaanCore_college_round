"use client";
import { Agent } from "@/components/agent";
import { useWorkspace } from "@/components/workspace";
export default function Page() {
  const { role, onMode } = useWorkspace();
  return <Agent role={role} onMode={onMode} />;
}

"use client";
import { useParams } from "next/navigation";
import { Agent } from "@/components/agent";
import { useWorkspace } from "@/components/workspace";
export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { role, onMode } = useWorkspace();
  return <Agent role={role} onMode={onMode} loadId={id} />;
}

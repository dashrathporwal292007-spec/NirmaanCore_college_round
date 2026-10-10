"use client";
import { useRouter } from "next/navigation";
import { DataView } from "@/components/views";
import { useWorkspace } from "@/components/workspace";
export default function Page() {
  const router = useRouter();
  const { revision } = useWorkspace();
  return (
    <DataView
      key={revision}
      view="Live view"
      openRun={(id) => router.push(`/runs/${id}`)}
    />
  );
}

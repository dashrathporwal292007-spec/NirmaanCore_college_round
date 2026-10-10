"use client";
import { useEffect, useState } from "react";
import { allRuns, runNumber } from "@/lib/client-data";
import { Agent } from "./agent";
import { useWorkspace } from "./workspace";
export function RunDetail({ id }: { id: string }) {
  const { role, onMode } = useWorkspace();
  const [title, setTitle] = useState("Run " + id.slice(0, 8));
  useEffect(() => {
    let active = true;
    allRuns()
      .then((r) => {
        if (active) setTitle(runNumber(r, id));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id]);
  return <Agent role={role} onMode={onMode} loadId={id} detailTitle={title} />;
}

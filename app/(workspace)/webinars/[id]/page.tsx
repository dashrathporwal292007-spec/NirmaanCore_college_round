"use client";
import { useParams } from "next/navigation";
import { WebinarScreen } from "@/components/webinar-detail";
export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <WebinarScreen key={id} id={id} />;
}

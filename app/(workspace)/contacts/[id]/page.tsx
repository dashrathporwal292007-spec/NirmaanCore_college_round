"use client";
import { useParams } from "next/navigation";
import { ContactDetail } from "@/components/timeline";
export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <ContactDetail key={id} id={id} />;
}

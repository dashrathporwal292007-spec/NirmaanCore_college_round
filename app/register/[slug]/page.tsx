"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import { Registration } from "@/components/registration";
function Form() {
  const { slug } = useParams<{ slug: string }>();
  return <Registration key={slug} slug={slug} />;
}
export default function Page() {
  return (
    <Suspense fallback={<p>Opening registration…</p>}>
      <Form />
    </Suspense>
  );
}

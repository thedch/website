import { lazy, Suspense } from "react";

const LocalInference = lazy(
  () => import("@content/projects/local-inference/LocalInference"),
);

export default function LazyLocalInference() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center">Loading LLM interface...</div>}
    >
      <LocalInference />
    </Suspense>
  );
}

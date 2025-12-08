import { lazy, Suspense } from "react";

const MNISTViz = lazy(() => import("@/content/projects/mnist-viz/MNIST.tsx"));

const LazyMNIST: React.FC = () => {
  return (
    <Suspense
      fallback={<div className="p-8 text-center">Loading LLM interface...</div>}
    >
      <MNISTViz />
    </Suspense>
  );
};

export default LazyMNIST;

import { lazy, Suspense } from "react";

const EmbeddingVisualization = lazy(() => import("./EmbeddingVisualization"));

const LazyEmbeddingViz: React.FC = () => {
  return (
    <div className="w-full">
      <Suspense
        fallback={
          <div className="flex min-h-[600px] w-full items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
              <div className="text-gray-600 dark:text-gray-400">
                Loading 3D Embedding Visualizer...
              </div>
            </div>
          </div>
        }
      >
        <EmbeddingVisualization />
      </Suspense>
    </div>
  );
};

export default LazyEmbeddingViz;

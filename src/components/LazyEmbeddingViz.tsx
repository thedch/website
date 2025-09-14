import { lazy, Suspense } from 'react';

const EmbeddingVisualization = lazy(() => import('./EmbeddingVisualization'));

const LazyEmbeddingViz: React.FC = () => {
  return (
    <div className="w-full">
      <Suspense
        fallback={
          <div className="w-full min-h-[600px] bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div className="text-gray-600 dark:text-gray-400">Loading 3D Embedding Visualizer...</div>
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
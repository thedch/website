import { lazy, Suspense } from "react";

const AsciiBuddy = lazy(() => import("./AsciiBuddy"));

const LazyAsciiBuddy: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="flex h-[420px] w-full items-center justify-center rounded-3xl bg-gray-50 dark:bg-gray-900">
          <div className="text-center text-gray-600 dark:text-gray-400">
            Loading animation...
          </div>
        </div>
      }
    >
      <AsciiBuddy />
    </Suspense>
  );
};

export default LazyAsciiBuddy;

import { Skeleton } from "@/components/ui/skeleton";

export function LoadingSpinner() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm flex flex-col flex-1">
        <div className="bg-gray-700 flex items-center gap-4 px-3 py-3">
          {[100, 80, 40, 70, 60, 65, 60, 80, 100, 55, 70].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded bg-gray-500 animate-pulse"
              style={{ width: w, animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
        <div className="flex flex-col flex-1 gap-1 p-1">
          {Array.from({ length: 14 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-11 w-full"
              style={{ animationDelay: `${i * 75}ms` }}
            />
          ))}
          <div className="flex-1">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

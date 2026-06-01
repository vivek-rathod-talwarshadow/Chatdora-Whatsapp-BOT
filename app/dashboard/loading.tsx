function SkeletonCard({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[2rem] border border-border/60 bg-card/70 ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <SkeletonCard className="h-40 w-full" />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonCard key={index} className="h-36" />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SkeletonCard className="h-72" />
        <SkeletonCard className="h-72" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
      </div>
    </div>
  );
}

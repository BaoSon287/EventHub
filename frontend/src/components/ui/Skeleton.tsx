import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />
);

export const EventCardSkeleton: React.FC = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
    <Skeleton className="aspect-video w-full rounded-none" />
    <div className="space-y-3 p-5">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="grid grid-cols-12 gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
          <Skeleton className="col-span-5 h-10" />
          <Skeleton className="col-span-3 h-10" />
          <Skeleton className="col-span-2 h-10" />
          <Skeleton className="col-span-2 h-10" />
        </div>
      ))}
    </div>
  </div>
);

export const DetailSkeleton: React.FC = () => (
  <div className="min-h-screen bg-slate-50">
    <Skeleton className="h-80 w-full rounded-none" />
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 lg:grid-cols-12">
      <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 lg:col-span-8">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 lg:col-span-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  </div>
);

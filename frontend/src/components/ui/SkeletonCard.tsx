import React from 'react';
import { Skeleton } from './skeleton';

export const SkeletonCard: React.FC = () => (
  <div className="card-primary p-6 animate-pulse">
    {/* Image placeholder */}
    <Skeleton className="w-full h-48 mb-4 rounded-lg" />
    {/* Title */}
    <Skeleton className="h-6 w-2/3 mb-2 rounded" />
    {/* Description */}
    <Skeleton className="h-4 w-full mb-1 rounded" />
    <Skeleton className="h-4 w-5/6 mb-4 rounded" />
    {/* Details */}
    <div className="space-y-2 mb-4">
      <Skeleton className="h-4 w-1/2 rounded" />
      <Skeleton className="h-4 w-1/3 rounded" />
      <Skeleton className="h-4 w-1/4 rounded" />
    </div>
    {/* Buttons */}
    <Skeleton className="h-10 w-full mb-2 rounded" />
    <Skeleton className="h-10 w-full rounded" />
  </div>
);

export default SkeletonCard; 
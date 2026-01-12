import React from 'react';
import SkeletonLoader from './SkeletonLoader';
import '../styles/SkeletonLoader.css';

const AdminSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <SkeletonLoader type="title" width="250px" />

        <div className="skeleton-admin-stats mt-6">
          <SkeletonLoader type="card" count={4} />
        </div>

        <div className="mt-8">
          <SkeletonLoader type="title" width="180px" />
          <div className="skeleton-admin-table mt-4">
            <SkeletonLoader type="link" count={8} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSkeleton;

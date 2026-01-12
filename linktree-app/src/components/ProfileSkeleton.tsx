import React from 'react';
import SkeletonLoader from './SkeletonLoader';
import '../styles/SkeletonLoader.css';

const ProfileSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="skeleton-profile-header">
        <SkeletonLoader type="avatar" />
        <SkeletonLoader type="title" width="200px" />
        <SkeletonLoader type="text" width="300px" />
      </div>

      <div className="skeleton-profile-links">
        <SkeletonLoader type="link" count={5} />
      </div>
    </div>
  );
};

export default ProfileSkeleton;

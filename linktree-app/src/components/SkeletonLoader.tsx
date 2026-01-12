import React from 'react';
import '../styles/SkeletonLoader.css';

interface SkeletonLoaderProps {
  type?: 'text' | 'title' | 'avatar' | 'image' | 'card' | 'link' | 'button';
  width?: string;
  height?: string;
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'text',
  width,
  height,
  count = 1,
}) => {
  const getSkeletonClass = () => {
    switch (type) {
      case 'title':
        return 'skeleton skeleton-title';
      case 'avatar':
        return 'skeleton skeleton-avatar';
      case 'image':
        return 'skeleton skeleton-image';
      case 'card':
        return 'skeleton skeleton-card';
      case 'link':
        return 'skeleton skeleton-link';
      case 'button':
        return 'skeleton skeleton-button';
      case 'text':
      default:
        return 'skeleton skeleton-text';
    }
  };

  const skeletonStyle = {
    width: width || undefined,
    height: height || undefined,
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={getSkeletonClass()} style={skeletonStyle} />
      ))}
    </>
  );
};

export default SkeletonLoader;

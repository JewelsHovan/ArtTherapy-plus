const Skeleton = ({ className = '', variant = 'text', width, height }) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';

  const variantClasses = {
    text: 'h-4',
    title: 'h-8',
    avatar: 'rounded-full',
    card: 'rounded-lg',
    image: 'aspect-square rounded-lg'
  };

  const style = {
    width: width || (variant === 'avatar' ? '40px' : '100%'),
    height: height || (variant === 'avatar' ? '40px' : undefined)
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant] || ''} ${className}`}
      style={style}
    />
  );
};

// Preset skeleton layouts
export const CardSkeleton = () => (
  <div className="card-clean p-6 space-y-4">
    <Skeleton variant="title" width="60%" />
    <Skeleton variant="text" />
    <Skeleton variant="text" />
    <Skeleton variant="text" width="80%" />
  </div>
);

export const GalleryItemSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden">
    <Skeleton variant="image" />
    <div className="p-4">
      <Skeleton variant="text" width="40%" />
    </div>
  </div>
);

export const GalleryGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <GalleryItemSkeleton key={i} />
    ))}
  </div>
);

export default Skeleton;

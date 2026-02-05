const Skeleton = ({ className = '', variant = 'default' }) => {
  const baseClasses = 'animate-pulse bg-dark-600';
  
  const variants = {
    default: 'rounded',
    card: 'rounded-lg h-64',
    text: 'rounded h-4',
    title: 'rounded h-8 w-3/4',
    circle: 'rounded-full',
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`} />
  );
};

export default Skeleton;

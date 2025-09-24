
import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-solid border-brand-blue border-t-transparent`}
        role="status"
        aria-label="loading"
      ></div>
      {text && <p className="text-brand-gray-600 animate-pulse">{text}</p>}
    </div>
  );
};

export default Spinner;

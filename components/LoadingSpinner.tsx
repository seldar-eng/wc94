
import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text = "LOADING..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 my-5">
      <div className="text-3xl font-bold text-cm-yellow animate-pulse">
        {text}
      </div>
    </div>
  );
};

export default LoadingSpinner;
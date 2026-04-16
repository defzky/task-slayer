import React from 'react';

interface LoadingProps {
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center min-h-[200px] bg-[#151515] rounded-lg">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#d4af37] border-t-transparent mb-3"></div>
        <div className="text-[#d4af37] text-sm font-mono">{message}</div>
      </div>
    </div>
  );
};

export default Loading;

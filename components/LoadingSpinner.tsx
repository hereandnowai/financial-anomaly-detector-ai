
import React from 'react';
import { BRANDING_CONFIG } from '../constants';

const LoadingSpinner: React.FC = () => {
  const { brand } = BRANDING_CONFIG;
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div 
        className="w-16 h-16 border-4 border-dashed rounded-full animate-spin" 
        style={{ borderColor: brand.colors.primary, borderTopColor: 'transparent' }}
      ></div>
      <p className="text-lg font-semibold" style={{ color: brand.colors.secondary }}>Processing data...</p>
    </div>
  );
};

export default LoadingSpinner;

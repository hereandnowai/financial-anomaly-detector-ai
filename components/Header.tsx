
import React from 'react';
import { BRANDING_CONFIG } from '../constants';

const Header: React.FC = () => {
  const { brand } = BRANDING_CONFIG;

  return (
    <header className="p-4 shadow-md" style={{ backgroundColor: brand.colors.secondary }}>
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <a href={brand.website} target="_blank" rel="noopener noreferrer">
            <img 
              src={brand.logo.title} 
              alt={`${brand.shortName} Logo`} 
              className="h-12 mr-3" // Adjusted height
            />
          </a>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: brand.colors.primary }}>
          Financial Anomaly Detector
        </h1>
      </div>
    </header>
  );
};

export default Header;

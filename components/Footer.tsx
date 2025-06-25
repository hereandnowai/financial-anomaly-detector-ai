
import React from 'react';
import { BRANDING_CONFIG } from '../constants';
import { BlogIcon, LinkedInIcon, InstagramIcon, GithubIcon, XIcon, YouTubeIcon } from './icons/SocialMediaIcons';

const Footer: React.FC = () => {
  const { brand } = BRANDING_CONFIG;

  return (
    <footer className="py-8 text-center" style={{ backgroundColor: brand.colors.secondary, color: 'white' }}>
      <div className="container mx-auto">
        <p className="mb-2 text-lg italic" style={{ color: brand.colors.primary }}>
          "{brand.slogan}"
        </p>
        <div className="flex justify-center space-x-6 my-4">
          {brand.socialMedia.blog && <a href={brand.socialMedia.blog} target="_blank" rel="noopener noreferrer" aria-label="Blog"><BlogIcon /></a>}
          {brand.socialMedia.linkedin && <a href={brand.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><LinkedInIcon /></a>}
          {brand.socialMedia.instagram && <a href={brand.socialMedia.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><InstagramIcon /></a>}
          {brand.socialMedia.github && <a href={brand.socialMedia.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub"><GithubIcon /></a>}
          {brand.socialMedia.x && <a href={brand.socialMedia.x} target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)"><XIcon /></a>}
          {brand.socialMedia.youtube && <a href={brand.socialMedia.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><YouTubeIcon /></a>}
        </div>
        <p className="text-sm mb-1">
          Contact: <a href={`mailto:${brand.email}`} className={`hover:text-[${brand.colors.primary}]`}>{brand.email}</a> | <a href={`tel:${brand.mobile.replace(/\s/g, '')}`} className={`hover:text-[${brand.colors.primary}]`}>{brand.mobile}</a>
        </p>
        <p className="text-sm">
          &copy; {new Date().getFullYear()} {brand.shortName}. All rights reserved.
        </p>
        <p className="text-xs mt-1">
          Developed by Sakthi Kannan [ AI Products Engineering Team ]
        </p>
         <div className="mt-4 text-xs">
          <p>Upload your finance data to spot errors and risks instantly.</p>
          <p>Strengthen your audits and uncover hidden insights.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import React from 'react';

export const ScrollIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 3C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3" />
    <path d="M3 7H21" />
    <path d="M3 17H21" />
    <path d="M7 3V7" />
    <path d="M17 3V7" />
    <path d="M7 17V21" />
    <path d="M17 17V21" />
    <path d="M9 11H15" />
    <path d="M9 14H13" />
  </svg>
);

export const QuillIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20.24 12.24C21.3658 11.1142 21.9983 9.58722 21.9983 7.99499C21.9983 6.40277 21.3658 4.87578 20.24 3.75C19.1142 2.62422 17.5872 1.99173 15.995 1.99173C14.4028 1.99173 12.8758 2.62422 11.75 3.75L5 10.5V19H13.5L20.24 12.24Z" />
    <path d="M16 8L2 22" />
    <path d="M17.5 15H9" />
  </svg>
);

export const SealIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
    <path d="M12 2V4" />
    <path d="M12 20V22" />
    <path d="M2 12H4" />
    <path d="M20 12H22" />
    <path d="M4.93 4.93L6.34 6.34" />
    <path d="M17.66 17.66L19.07 19.07" />
    <path d="M4.93 19.07L6.34 17.66" />
    <path d="M17.66 6.34L19.07 4.93" />
  </svg>
);

export const HashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);

export const TreeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="4" r="2" />
    <circle cx="6" cy="12" r="2" />
    <circle cx="18" cy="12" r="2" />
    <circle cx="3" cy="20" r="2" />
    <circle cx="9" cy="20" r="2" />
    <circle cx="15" cy="20" r="2" />
    <circle cx="21" cy="20" r="2" />
    <path d="M12 6V8L6 10V12" />
    <path d="M12 6V8L18 10V12" />
    <path d="M6 14V16L3 18" />
    <path d="M6 14V16L9 18" />
    <path d="M18 14V16L15 18" />
    <path d="M18 14V16L21 18" />
  </svg>
);

export const VerifiedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
    <path d="M9 12L11 14L15 10" />
  </svg>
);

export const OmIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="currentColor"
    className={className}
  >
    <text x="50" y="70" textAnchor="middle" fontSize="60" fontFamily="serif">ॐ</text>
  </svg>
);

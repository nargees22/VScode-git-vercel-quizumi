import React from 'react';

// FIX: Add title prop for accessibility and to fix TS error.
export const FiftyFiftyIcon: React.FC<{ className?: string; title?: string }> = ({ className = 'w-6 w-6', title }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 100 100" fill="currentColor">
        {title && <title>{title}</title>}
        <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="6" fill="none" />
        <text x="50" y="58" fontSize="30" fontWeight="bold" textAnchor="middle" fill="currentColor">50:50</text>
    </svg>
);

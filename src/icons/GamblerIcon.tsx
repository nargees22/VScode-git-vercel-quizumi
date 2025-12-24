import React from 'react';

export const GamblerIcon: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,2L2,12L12,22L22,12L12,2Z" />
    </svg>
);
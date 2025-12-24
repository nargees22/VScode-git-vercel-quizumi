import React from 'react';

export const HighRollerIcon: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M7,5A2,2 0 0,1 9,7A2,2 0 0,1 7,9A2,2 0 0,1 5,7A2,2 0 0,1 7,5M17,19A2,2 0 0,1 15,17A2,2 0 0,1 17,15A2,2 0 0,1 19,17A2,2 0 0,1 17,19M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10Z" />
    </svg>
);
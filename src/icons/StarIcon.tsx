import React from 'react';

export const StarIcon: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
    <svg viewBox="0 0 260 245" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="starGradient" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#FDE047"/>
                <stop offset="50%" stopColor="#F59E0B"/>
                <stop offset="100%" stopColor="#D97706"/>
            </linearGradient>
            <filter id="starShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000" floodOpacity="0.3"/>
            </filter>
        </defs>
        <g filter="url(#starShadow)">
            <polygon points="130,5 160,95 255,95 180,150 205,240 130,185 55,240 80,150 5,95 100,95" fill="url(#starGradient)"/>
            {/* Highlights */}
            <polygon points="130,5 160,95 130,90" fill="rgba(255,255,255,0.6)"/>
            <polygon points="130,185 180,150 205,240" fill="rgba(255,255,255,0.2)"/>
            {/* Shadows */}
            <polygon points="130,5 100,95 130,90" fill="rgba(0,0,0,0.3)"/>
            <polygon points="130,185 80,150 55,240" fill="rgba(0,0,0,0.4)"/>
        </g>
    </svg>
);

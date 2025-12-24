import React, { useMemo } from 'react';

export const Trophy3D: React.FC = () => {
    const particles = useMemo(() => {
        return Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            style: {
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 10 + 5}px`, // 5px to 15px
                height: `${Math.random() * 10 + 5}px`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${Math.random() * 2 + 3}s` // 3-5s
            }
        }));
    }, []);

    return (
        <div className="trophy-container">
            <div className="trophy-glow"></div>
            {particles.map(p => (
                <div key={p.id} className="sparkle-particle" style={p.style}></div>
            ))}
            <div className="trophy-3d">
                <svg className="trophy-svg" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="trophyGold" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#BF953F" />
                      <stop offset="25%" stopColor="#FCF6BA" />
                      <stop offset="50%" stopColor="#B38728" />
                      <stop offset="75%" stopColor="#FBF5B7" />
                      <stop offset="100%" stopColor="#AA771C" />
                    </linearGradient>
                    <linearGradient id="plinth" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#6D4C41" />
                        <stop offset="100%" stopColor="#4E342E" />
                    </linearGradient>
                  </defs>

                  {/* Plinth */}
                  <path d="M 20 220 H 180 L 170 200 H 30 Z" fill="url(#plinth)" />
                  <rect x="40" y="203" width="120" height="12" rx="2" fill="#FDD835" />
                  
                  {/* Base of Trophy */}
                  <path d="M 50 200 H 150 L 140 180 H 60 Z" fill="url(#trophyGold)" />

                  {/* Stem */}
                  <path d="M 90 180 L 80 140 H 120 L 110 180 Z" fill="url(#trophyGold)" />
                  <rect x="85" y="130" width="30" height="10" rx="5" fill="url(#trophyGold)" />
                  
                  {/* Handles */}
                  <path d="M 40 120 C 0 100, 0 40, 40 20 L 50 25 C 20 45, 20 95, 50 115 Z" fill="url(#trophyGold)" />
                  <path d="M 160 120 C 200 100, 200 40, 160 20 L 150 25 C 180 45, 180 95, 150 115 Z" fill="url(#trophyGold)" />
                  
                  {/* Cup */}
                  <path d="M 50 130 C 20 110, 20 50, 50 10 C 70 0, 130 0, 150 10 C 180 50, 180 110, 150 130 H 50 Z" fill="url(#trophyGold)" />
                  
                  {/* Cup Inner */}
                  <path d="M 60 20 C 80 12, 120 12, 140 20 C 160 50, 160 100, 140 125 H 60 C 40 100, 40 50, 60 20 Z" fill="rgba(0,0,0,0.25)" />
                </svg>
            </div>
        </div>
    );
};

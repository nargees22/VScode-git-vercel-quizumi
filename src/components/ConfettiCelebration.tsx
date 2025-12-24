import React, { useMemo } from 'react';

const CONFETTI_COLORS = ['#ef4444', '#3b82f6', '#facc15', '#4ade80', '#fb923c', '#a78bfa', '#ec4899'];

export const ConfettiCelebration: React.FC = () => {
    const confettiPieces = useMemo(() => {
        const pieces = [];
        const count = 150;
        for (let i = 0; i < count; i++) {
            pieces.push({
                id: i,
                color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${Math.random() * 4 + 5}s`, // 5s to 9s
                transform: `rotate(${Math.random() * 360}deg) scale(${Math.random() * 0.5 + 0.75})`,
                shape: Math.random() > 0.2 ? 'rect' : 'circle', // 80% rects, 20% circles
            });
        }
        return pieces;
    }, []);

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50">
            {confettiPieces.map(piece => (
                <div
                    key={piece.id}
                    className="confetti-piece"
                    style={{
                        backgroundColor: piece.color,
                        left: piece.left,
                        animationDelay: piece.animationDelay,
                        animationDuration: piece.animationDuration,
                        transform: piece.transform,
                        width: piece.shape === 'rect' ? '8px' : '16px',
                        height: piece.shape === 'rect' ? '16px' : '10px',
                        borderRadius: piece.shape === 'circle' ? '50%' : '0',
                    }}
                />
            ))}
        </div>
    );
};

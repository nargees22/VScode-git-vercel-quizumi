import React, { useState } from 'react';

export const ReactionSender: React.FC<{ onSend: (emoji: string) => void }> = ({ onSend }) => {
    const reactions = ['👏', '👍', '❤️', '🎉', '🏆', '🥳'];
    const [lastReactionTime, setLastReactionTime] = useState(0);

    const handleSend = (emoji: string) => {
        const now = Date.now();
        if (now - lastReactionTime < 1000) { // Throttle to 1 reaction per second
            return;
        }
        setLastReactionTime(now);
        onSend(emoji);
    };

    return (
        <div className="w-full mt-8 sm:mt-0 sm:fixed sm:bottom-16 sm:left-0 sm:right-0 bg-white/80 backdrop-blur-sm p-4 z-20">
            <div className="max-w-md mx-auto flex justify-around">
                {reactions.map(emoji => (
                    <button 
                        key={emoji}
                        onClick={() => handleSend(emoji)}
                        className="text-3xl transform transition-transform duration-150 hover:scale-125 focus:scale-125 focus:outline-none"
                        aria-label={`Send ${emoji} reaction`}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
};

export const FloatingReaction: React.FC<{ emoji: string; onComplete: () => void }> = ({ emoji, onComplete }) => {
    const style = {
        left: `${Math.random() * 90 + 5}%`, // 5% to 95%
        animationDuration: `${Math.random() * 2 + 4}s`, // 4-6s
        fontSize: `${Math.random() * 1.5 + 1.5}rem` // 1.5rem to 3rem
    };

    return (
        <div 
            className="reaction-emoji" 
            style={style}
            onAnimationEnd={onComplete}
        >
            {emoji}
        </div>
    );
};

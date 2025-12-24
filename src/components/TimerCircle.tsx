import React, { useState, useEffect } from 'react';

// Fix: Renamed 'key' to 'resetKey' to avoid conflict with React's reserved key prop
export const TimerCircle: React.FC<{ duration: number; start: boolean; resetKey: any }> = ({ duration, start, resetKey }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const circumference = 2 * Math.PI * 45;

    useEffect(() => {
        if (!start) return;
        setTimeLeft(duration);
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [start, duration, resetKey]);

    const offset = circumference - (timeLeft / duration) * circumference;

    return (
        <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="absolute w-full h-full transform -rotate-90 text-slate-200" viewBox="0 0 112 112">
                <circle cx="56" cy="56" r="45" stroke="currentColor" strokeWidth="10" fill="transparent" />
                <circle
                    cx="56" cy="56" r="45"
                    stroke="#E8632A"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
            </svg>
            <span className="text-4xl font-bold z-10">{timeLeft}</span>
        </div>
    );
};
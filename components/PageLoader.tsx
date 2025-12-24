import React from 'react';
import { LoadingSpinner } from '../icons/LoadingSpinner.tsx';

export const PageLoader: React.FC<{ message: string }> = ({ message }) => (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-slate-50/50 backdrop-blur-sm">
        <LoadingSpinner />
        <p className="text-xl mt-6 font-semibold text-slate-600 animate-pulse">{message}</p>
    </div>
);
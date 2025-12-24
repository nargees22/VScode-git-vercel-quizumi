import React from 'react';

export const Footer = () => {
    return (
        <footer className="bg-white/80 backdrop-blur-sm shadow-[0_-2px_5px_rgba(0,0,0,0.05)] w-full p-3 text-xs sm:text-sm text-slate-600 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-2 sm:gap-0 z-10">
            <p>&copy; 2025 GlobalLogic Inc.</p>
            <p>
                For access issues, please reach out to{' '}
                <a href="mailto:shubham.gondane@globallogic.com" className="font-semibold text-gl-orange-600 hover:underline">
                    shubham.gondane@globallogic.com
                </a>.
            </p>
        </footer>
    );
};

import React, { useState, useRef, useEffect } from 'react';
import { DownArrowIcon } from '../icons/DownArrowIcon.tsx';

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder: string;
    showPlaceholderOption?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, placeholder, showPlaceholderOption = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayValue = value === 'all' ? placeholder : value;

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-100 border border-slate-300 rounded-md p-2 text-left flex justify-between items-center focus:ring-2 focus:ring-gl-orange-500 transition-all shadow-sm hover:border-slate-400"
            >
                <span className="truncate text-slate-700 font-medium">{displayValue}</span>
                <DownArrowIcon className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-xl max-h-60 overflow-y-auto animate-fade-in custom-scrollbar">
                    {showPlaceholderOption && (
                        <button
                            type="button"
                            onClick={() => { onChange('all'); setIsOpen(false); }}
                            className="w-full text-left p-2 hover:bg-slate-100 text-slate-500 text-sm font-medium border-b border-slate-50"
                        >
                            {placeholder}
                        </button>
                    )}
                    {options.map(opt => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => { onChange(opt); setIsOpen(false); }}
                            className={`w-full text-left p-2 hover:bg-gl-orange-50 hover:text-gl-orange-700 transition-colors text-sm ${value === opt ? 'bg-gl-orange-50 text-gl-orange-600 font-bold' : 'text-slate-600'}`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
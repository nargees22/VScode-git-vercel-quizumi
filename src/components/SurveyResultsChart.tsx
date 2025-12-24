import React from 'react';

// Fix: Corrected component implementation to export SurveyResultsChart as expected by QuizHostPage
export const SurveyResultsChart: React.FC<{ options: string[]; answerCounts: number[] }> = ({ options, answerCounts }) => {
    const total = answerCounts.reduce((a, b) => a + b, 0);

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4 p-4">
            {options.map((opt, i) => {
                const count = answerCounts[i] || 0;
                const percentage = total > 0 ? (count / total) * 100 : 0;
                
                return (
                    <div key={i} className="relative">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-slate-700">{opt}</span>
                            <span className="text-sm font-bold text-slate-500">{count} {count === 1 ? 'response' : 'responses'} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-6 overflow-hidden border border-slate-200 shadow-inner">
                            <div 
                                className="bg-gl-orange-500 h-full transition-all duration-1000 ease-out rounded-full flex items-center px-2"
                                style={{ width: `${percentage}%` }}
                            >
                                {percentage > 10 && <div className="w-full h-1 bg-white/30 rounded-full"></div>}
                            </div>
                        </div>
                    </div>
                );
            })}
            <div className="mt-6 pt-4 border-t border-slate-200 text-center">
                <p className="text-slate-500 font-bold text-lg">Total Responses: {total}</p>
            </div>
        </div>
    );
};
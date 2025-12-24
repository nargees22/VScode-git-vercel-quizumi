import React, { useState, useMemo } from 'react';
import Card from './Card.tsx';
import Button from './Button.tsx';
import { QuestionType } from '../types.ts';
import { LoadingSpinner } from '../icons/LoadingSpinner.tsx';

interface TagPerformance {
    tagName: string;
    correctAnswers: number;
    totalAnswers: number;
    percentage: number;
    level: 'Good' | 'Moderate' | 'Needs Improvement';
}

interface ToughestQuestion {
    text: string;
    correct: number;
    total: number;
    percentage: number;
}

interface QuestionAnalyticsData {
    id: string;
    text: string;
    type: QuestionType;
    correctness: number;
    avgScore: number;
    avgTime: number;
}

export interface PerformanceReportData {
    totalJoined: number;
    totalParticipated: number;
    nonParticipants: { name: string; avatar: string; }[];
    averageScore: number;
    scoreDistribution: number[];
    maxPossibleScore: number;
    bySkill: TagPerformance[];
    byTechnology: TagPerformance[];
    toughestQuestions: ToughestQuestion[];
    questionAnalytics: QuestionAnalyticsData[];
    competency: {
        achieved: number;
        total: number;
        percentage: number;
    };
}

const levelConfig = {
    'Good': {
        bg: 'bg-green-100',
        text: 'text-green-800',
        progress: 'bg-green-500',
    },
    'Moderate': {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        progress: 'bg-yellow-500',
    },
    'Needs Improvement': {
        bg: 'bg-red-100',
        text: 'text-red-800',
        progress: 'bg-red-500',
    }
};

const DownloadIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
    </svg>
);

const ReportSection: React.FC<{ title: string; data: TagPerformance[] }> = ({ title, data }) => {
    return (
        <div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">{title}</h3>
            <div className="space-y-4">
                {data.map(item => (
                    <div key={item.tagName} className="bg-white p-4 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-slate-700">{item.tagName}</span>
                            <span className={`${levelConfig[item.level].bg} ${levelConfig[item.level].text} text-xs font-bold px-2 py-1 rounded-full`}>
                                {item.level.replace(' ', '\u00A0')}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex-grow bg-slate-200 rounded-full h-3 overflow-hidden">
                                <div 
                                    className={`${levelConfig[item.level].progress} h-3 rounded-full transition-all duration-500`}
                                    style={{ width: `${item.percentage}%` }}
                                ></div>
                            </div>
                            <span className="font-bold text-slate-600 w-16 text-right">{item.percentage.toFixed(0)}%</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{`(${item.correctAnswers} / ${item.totalAnswers} correct answers)`}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const QuestionLevelAnalytics: React.FC<{ data: QuestionAnalyticsData[] }> = ({ data }) => {
    type SortKey = keyof QuestionAnalyticsData;
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'correctness', direction: 'ascending' });

    const sortedData = useMemo(() => {
        const sortableData = [...data];
        sortableData.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        return sortableData;
    }, [data, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (columnKey: SortKey) => {
        if (sortConfig.key !== columnKey) return null;
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };

    const getCorrectnessColor = (percentage: number) => {
        if (percentage >= 75) return 'text-green-600';
        if (percentage >= 40) return 'text-yellow-600';
        return 'text-red-600';
    };
    
    if (!data || data.length === 0) {
        return (
            <div className="text-center p-8">
                <p className="text-slate-500">No scorable questions were found to analyze.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                    <tr>
                        <th scope="col" className="px-4 py-3 cursor-pointer" onClick={() => requestSort('text')}>
                            Question {getSortIndicator('text')}
                        </th>
                        <th scope="col" className="px-4 py-3 cursor-pointer text-center" onClick={() => requestSort('correctness')}>
                            Correctness {getSortIndicator('correctness')}
                        </th>
                        <th scope="col" className="px-4 py-3 cursor-pointer text-center" onClick={() => requestSort('avgScore')}>
                            Avg. Score {getSortIndicator('avgScore')}
                        </th>
                        <th scope="col" className="px-4 py-3 cursor-pointer text-center" onClick={() => requestSort('avgTime')}>
                            Avg. Time (s) {getSortIndicator('avgTime')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((item) => (
                        <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                            <td className="px-4 py-4 font-medium text-slate-900 max-w-sm truncate">{item.text}</td>
                            <td className={`px-4 py-4 font-bold text-center ${getCorrectnessColor(item.correctness)}`}>
                                {item.correctness.toFixed(0)}%
                            </td>
                            <td className="px-4 py-4 font-semibold text-center">{item.avgScore.toFixed(0)}</td>
                            <td className="px-4 py-4 font-semibold text-center">{item.avgTime.toFixed(1)}s</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const CompetencyGauge: React.FC<{ percentage: number }> = ({ percentage }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const getColor = (p: number) => {
        if (p >= 70) return '#16a34a'; // green-600
        if (p >= 40) return '#f59e0b'; // amber-500
        return '#ef4444'; // red-500
    };
    const strokeColor = getColor(percentage);

    return (
        <div className="relative w-40 h-40">
            <svg className="w-full h-full" viewBox="0 0 140 140">
                <circle
                    className="text-slate-200"
                    strokeWidth="12"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="70"
                    cy="70"
                />
                <circle
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke={strokeColor}
                    fill="transparent"
                    r={radius}
                    cx="70"
                    cy="70"
                    className="transform-gpu -rotate-90 origin-center transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold" style={{ color: strokeColor }}>
                    {percentage.toFixed(0)}%
                </span>
            </div>
        </div>
    );
};

const EducatorAnalytics: React.FC<{
    competency: PerformanceReportData['competency'];
    recommendations: { loading: boolean; text: string };
}> = ({ competency, recommendations }) => {
    const [activeSlide, setActiveSlide] = useState(0);

    interface ParsedRecommendations {
        strengths: string[];
        weaknesses: string[];
        recommendations: string[];
    }

    const parsedRecommendations = useMemo((): ParsedRecommendations => {
        if (recommendations.loading || !recommendations.text) {
            return { strengths: [], weaknesses: [], recommendations: [] };
        }

        const text = recommendations.text;
        const strengthsMatch = text.match(/\*\*Strengths\*\*\s*([\s\S]*?)(?=\*\*Weaknesses\*\*|\*\*Recommendations\*\*|$)/i);
        const weaknessesMatch = text.match(/\*\*Weaknesses\*\*\s*([\s\S]*?)(?=\*\*Strengths\*\*|\*\*Recommendations\*\*|$)/i);
        const recommendationsMatch = text.match(/\*\*Recommendations\*\*\s*([\s\S]*?)(?=\*\*Strengths\*\*|\*\*Weaknesses\*\*|$)/i);

        const parseSection = (match: RegExpMatchArray | null): string[] => {
            if (!match || !match[1]) return [];
            return match[1]
                .trim()
                .split('\n')
                .map(line => line.trim().replace(/^\* |^- /, '').trim())
                .filter(line => line);
        };

        return {
            strengths: parseSection(strengthsMatch),
            weaknesses: parseSection(weaknessesMatch),
            recommendations: parseSection(recommendationsMatch),
        };
    }, [recommendations]);

    const slides = useMemo(() => {
        const potentialSlides = [
            { title: 'Strengths', icon: '💪', items: parsedRecommendations.strengths },
            { title: 'Weaknesses', icon: '⚠️', items: parsedRecommendations.weaknesses },
            { title: 'Recommendations', icon: '💡', items: parsedRecommendations.recommendations },
        ];
        return potentialSlides.filter(slide => slide.items.length > 0);
    }, [parsedRecommendations]);

    const hasRecommendations = slides.length > 0;

    const handleNext = () => {
        if (slides.length > 1) {
            setActiveSlide((prev) => (prev + 1) % slides.length);
        }
    };

    const handlePrev = () => {
        if (slides.length > 1) {
            setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
        }
    };
    
    const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
    );

    const ArrowRightIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col items-center p-6 bg-slate-50 rounded-xl border">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Competency Achievement</h3>
                <p className="text-slate-600 text-center mb-6">Percentage of participants who achieved the target competency level (70% or more correct answers).</p>
                <CompetencyGauge percentage={competency.percentage} />
                <p className="text-lg font-semibold text-slate-700 mt-4">{competency.achieved} out of {competency.total} participants</p>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border flex flex-col">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="text-3xl">🧞</span> Genie Speaks
                </h3>
                {recommendations.loading ? (
                    <div className="flex flex-col items-center justify-center flex-grow min-h-[200px]">
                        <LoadingSpinner />
                        <p className="text-slate-500 mt-3">Analyzing results...</p>
                    </div>
                ) : hasRecommendations ? (
                    <div className="flex flex-col flex-grow justify-between">
                        <div className="relative overflow-hidden h-56">
                            <div
                                className="absolute top-0 left-0 w-full h-full flex transition-transform duration-500 ease-in-out"
                                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                            >
                                {slides.map((slide, index) => (
                                    <div key={index} className="w-full flex-shrink-0 h-full overflow-y-auto pr-4 custom-scrollbar">
                                        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                            <span>{slide.icon}</span> {slide.title}
                                        </h4>
                                        <ul className="list-disc list-inside space-y-1 text-slate-700 pl-4">
                                            {slide.items.map((item, i) => <li key={`${slide.title}-${i}`}>{item}</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {slides.length > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <button
                                    onClick={handlePrev}
                                    className="p-2 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors"
                                    aria-label="Previous slide"
                                >
                                    <ArrowLeftIcon />
                                </button>
                                <div className="flex items-center gap-2">
                                    {slides.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setActiveSlide(index)}
                                            className={`w-2.5 h-2.5 rounded-full transition-colors ${activeSlide === index ? 'bg-slate-800' : 'bg-slate-300 hover:bg-slate-400'}`}
                                            aria-label={`Go to slide ${index + 1}`}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={handleNext}
                                    className="p-2 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors"
                                    aria-label="Next slide"
                                >
                                    <ArrowRightIcon />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center flex-grow min-h-[150px]">
                        <p className="text-slate-500 text-center">{recommendations.text || "No specific recommendations at this time."}</p>
                    </div>
                )}
                 <p className="text-xs text-slate-400 text-right mt-auto pt-4">Powered by Generative AI</p>
            </div>
        </div>
    );
};


const StatCard: React.FC<{ title: string; value: React.ReactNode; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-4">
        <div className="bg-gl-orange-100 text-gl-orange-600 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500">{title}</p>
            <div className="font-bold text-slate-800 text-2xl">{value}</div>
        </div>
    </div>
);

const ScoreDistributionChart: React.FC<{ distribution: number[]; maxScore: number; }> = ({ distribution, maxScore }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (maxScore === 0) {
        return (
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">Score Distribution</h3>
                <div className="bg-white p-4 rounded-lg border border-slate-200 text-center text-slate-500">
                    No scorable questions were included in this quiz.
                </div>
            </div>
        );
    }

    const totalParticipantsInDistribution = distribution.reduce((sum, count) => sum + count, 0);
    
    if (totalParticipantsInDistribution === 0) {
        return (
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">Score Distribution</h3>
                <div className="bg-white p-4 rounded-lg border border-slate-200 text-center text-slate-500">
                    No scorable answers were submitted to display a distribution.
                </div>
            </div>
        );
    }

    const labels = ["0-20%", "21-40%", "41-60%", "61-80%", "81-100%"];
    const colors = ['#f87171', '#fb923c', '#facc15', '#a3e639', '#22c55e'];

    const data = useMemo(() => distribution
        .map((count, index) => ({
            count,
            label: labels[index],
            color: colors[index],
            percentage: totalParticipantsInDistribution > 0 ? (count / totalParticipantsInDistribution) * 100 : 0,
        }))
        .filter(item => item.count > 0), [distribution, totalParticipantsInDistribution]);

    const pieSlices = useMemo(() => {
        const getCoordinatesForPercent = (percent: number) => {
            const x = Math.cos(2 * Math.PI * percent);
            const y = Math.sin(2 * Math.PI * percent);
            return [x, y];
        };

        let cumulativePercent = 0;
        return data.map((slice) => {
            const startPercent = cumulativePercent / 100;
            cumulativePercent += slice.percentage;
            const endPercent = cumulativePercent / 100;

            const [startX, startY] = getCoordinatesForPercent(startPercent);
            const [endX, endY] = getCoordinatesForPercent(endPercent);

            const largeArcFlag = slice.percentage > 50 ? 1 : 0;

            const pathData = `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`;

            return { ...slice, pathData };
        });
    }, [data]);
    
    const darkenHex = (hex: string, percent: number) => {
        let [r, g, b] = hex.match(/\w\w/g)?.map(x => parseInt(x, 16)) || [0, 0, 0];
        const factor = 1 - percent / 100;
        r = Math.max(0, Math.floor(r * factor));
        g = Math.max(0, Math.floor(g * factor));
        b = Math.max(0, Math.floor(b * factor));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };

    const depth = 0.1;
    const hoveredSliceData = hoveredIndex !== null ? data[hoveredIndex] : null;

    return (
        <div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">Score Distribution</h3>
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-slate-200 flex flex-col md:flex-row items-center justify-center gap-8 min-h-[320px]">
                <div className="relative w-64 h-64 flex-shrink-0">
                    <svg viewBox="-1.2 -1.2 2.4 2.4" className="transform -rotate-90">
                        {pieSlices.slice().reverse().map((slice, i) => {
                            const index = pieSlices.length - 1 - i;
                            const isHovered = hoveredIndex === index;
                            return (
                                <g
                                    key={index}
                                    transform={isHovered ? 'translate(0, -0.05)' : ''}
                                    className="transition-transform duration-200 ease-out"
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                >
                                    <path d={slice.pathData} fill={darkenHex(slice.color, 20)} transform={`translate(0, ${depth})`} />
                                    <path d={slice.pathData} fill={slice.color} className="cursor-pointer" />
                                </g>
                            );
                        })}
                    </svg>
                    {hoveredSliceData && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-slate-800 text-white rounded-lg p-3 text-center shadow-lg animate-pop-in">
                                <p className="font-bold text-lg">{hoveredSliceData.label}</p>
                                <p>{hoveredSliceData.count} participants</p>
                                <p className="text-sm opacity-80">({hoveredSliceData.percentage.toFixed(1)}%)</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="w-full md:w-auto self-center">
                    <ul className="space-y-2">
                        {data.slice().reverse().map((item, i) => {
                            const originalIndex = data.length - 1 - i;
                             return (
                                 <li 
                                    key={originalIndex} 
                                    className="flex items-center text-sm cursor-pointer p-1 rounded-md transition-colors"
                                    onMouseEnter={() => setHoveredIndex(originalIndex)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    style={{ backgroundColor: hoveredIndex === originalIndex ? `${item.color}33` : 'transparent' }}
                                >
                                    <span className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: item.color }}></span>
                                    <span className="font-semibold text-slate-700 w-16 text-right mr-2">{item.label}:</span>
                                    <span className="text-slate-500 font-medium">{item.count} ({item.percentage.toFixed(1)}%)</span>
                                </li>
                             );
                        })}
                    </ul>
                </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">Distribution of participants across score ranges. Based on a max score of {maxScore}.</p>
        </div>
    );
};

const OverallQuizInsights: React.FC<{ data: PerformanceReportData }> = ({ data }) => {
    const [participantsDropdownOpen, setParticipantsDropdownOpen] = useState(false);

    const UsersIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>;
    const AvgIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 16v-2m8-8h2M4 12H2m15.364 6.364l1.414 1.414M4.222 4.222l1.414 1.414m12.728 0l-1.414 1.414M5.636 18.364l-1.414 1.414M12 18a6 6 0 100-12 6 6 0 000 12z" /></svg>;

    const hasNonParticipants = data.nonParticipants && data.nonParticipants.length > 0;
    const hasSkillData = data.bySkill && data.bySkill.length > 0;
    const hasTechData = data.byTechnology && data.byTechnology.length > 0;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="bg-gl-orange-100 text-gl-orange-600 p-3 rounded-full">
                            <UsersIcon />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Participants</p>
                            <div className="font-bold text-slate-800 text-xl leading-tight">
                                <div>
                                    <span className="text-slate-600 font-medium">Joined: </span>
                                    <span>{data.totalJoined}</span>
                                </div>
                                <div>
                                    <span className="text-slate-600 font-medium">Participated: </span>
                                    <span>{data.totalParticipated}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {hasNonParticipants && (
                        <div className="mt-3">
                            <button
                                onClick={() => setParticipantsDropdownOpen(!participantsDropdownOpen)}
                                className="w-full text-left text-sm font-semibold text-slate-600 hover:text-slate-800 flex justify-between items-center p-2 bg-slate-50 rounded-md"
                            >
                                <span>{data.nonParticipants.length} player(s) did not participate</span>
                                <svg className={`w-4 h-4 transition-transform ${participantsDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {participantsDropdownOpen && (
                                <ul className="mt-2 max-h-40 overflow-y-auto space-y-1 pr-2">
                                    {data.nonParticipants.map((player, index) => (
                                        <li key={index} className="flex items-center bg-slate-100 p-2 rounded-md">
                                            <img src={player.avatar} alt={player.name} className="w-6 h-6 rounded-full mr-2" />
                                            <span className="text-sm text-slate-800">{player.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
                <StatCard title="Average Score" value={data.averageScore.toFixed(0)} icon={<AvgIcon />} />
            </div>

            <ScoreDistributionChart distribution={data.scoreDistribution} maxScore={data.maxPossibleScore} />

            {(hasSkillData || hasTechData) && (
                <div className={`grid grid-cols-1 ${hasSkillData && hasTechData ? 'md:grid-cols-2' : ''} gap-8`}>
                    {hasSkillData && <ReportSection title="Performance by Skill" data={data.bySkill} />}
                    {hasTechData && <ReportSection title="Performance by Technology" data={data.byTechnology} />}
                </div>
            )}
        </div>
    );
};

export const PerformanceReport: React.FC<{ 
    report: PerformanceReportData | null; 
    quizTitle?: string; 
    quizId?: string;
    recommendations: { loading: boolean; text: string };
}> = ({ report, quizTitle, quizId, recommendations }) => {
    const [activeTab, setActiveTab] = useState<'insights' | 'questions' | 'educator'>('insights');
    const [showGenieDisclaimer, setShowGenieDisclaimer] = useState(true);

    if (!report) {
        return null;
    }

    const handleDownload = () => {
        if (!report || !quizTitle || !quizId) return;

        const { bySkill, byTechnology, questionAnalytics } = report;

        const toCsv = (headers: string[], data: any[], rowMapper: (item: any) => (string | number)[]) => {
            const headerRow = headers.join(',');
            const dataRows = data.map(rowMapper).map(row => row.join(','));
            return [headerRow, ...dataRows].join('\n');
        };

        let csvContent = `Quiz Report: ${quizTitle.replace(/,/g, '')}\n`;
        csvContent += `Quiz ID: ${quizId}\n\n`;

        if (activeTab === 'insights') {
            csvContent += "Overall Insights\n";
            csvContent += `Participants Joined,${report.totalJoined}\n`;
            csvContent += `Participants Participated,${report.totalParticipated}\n`;
            csvContent += `Average Score,${report.averageScore.toFixed(2)}\n\n`;
            
            csvContent += "Score Distribution\n";
            csvContent += "Range (%),Count\n";
            const labels = ["0-20", "21-40", "41-60", "61-80", "81-100"];
            report.scoreDistribution.forEach((count, index) => {
                csvContent += `${labels[index]},${count}\n`;
            });
            csvContent += '\n\n';

            if (bySkill.length > 0) {
                csvContent += "Performance by Skill\n";
                csvContent += toCsv(
                    ['Skill', 'Correct Answers', 'Total Answers', 'Accuracy (%)'],
                    bySkill,
                    item => [item.tagName, item.correctAnswers, item.totalAnswers, item.percentage.toFixed(2)]
                );
                csvContent += '\n\n';
            }
            if (byTechnology.length > 0) {
                csvContent += "Performance by Technology\n";
                csvContent += toCsv(
                    ['Technology', 'Correct Answers', 'Total Answers', 'Accuracy (%)'],
                    byTechnology,
                    item => [item.tagName, item.correctAnswers, item.totalAnswers, item.percentage.toFixed(2)]
                );
            }
        } else if (activeTab === 'questions') {
             if (questionAnalytics.length > 0) {
                csvContent += "Question-Level Analytics\n";
                csvContent += toCsv(
                    ['Question', 'Correctness (%)', 'Average Score', 'Average Time (s)'],
                    questionAnalytics,
                    item => [`"${item.text.replace(/"/g, '""')}"`, item.correctness.toFixed(2), item.avgScore.toFixed(2), item.avgTime.toFixed(2)]
                );
            }
        } else if (activeTab === 'educator') {
            csvContent += "Competency Achievement\n";
            csvContent += "Target Competency,70%\n";
            csvContent += `Participants Achieved,${report.competency.achieved}\n`;
            csvContent += `Total Participants,${report.competency.total}\n`;
            csvContent += `Achievement Rate (%),${report.competency.percentage.toFixed(2)}\n\n`;

            csvContent += "AI-Powered Insights\n";
            const recommendationText = recommendations.text.replace(/"/g, '""');
            csvContent += `"${recommendationText}"\n`;
        }


        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `quiz-report-${quizId}-${activeTab}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const hasScorableData = report.maxPossibleScore > 0;

    if (!hasScorableData) {
        return (
             <Card>
                <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">Performance Report</h2>
                <p className="text-slate-500 text-center">No scorable questions were answered in this quiz, so there is no performance data to report.</p>
            </Card>
        );
    }

    return (
        <Card>
            {activeTab === 'educator' && showGenieDisclaimer && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowGenieDisclaimer(false)}>
                    <Card className="w-full max-w-md animate-pop-in text-center" onClick={e => e.stopPropagation()}>
                        <span role="img" aria-label="Genie emoji" className="text-5xl">🧞</span>
                        <h2 className="text-2xl font-bold text-slate-800 mt-4">Hello! I’m Genie, your AI assistant for smart suggestions.</h2>
                        <p className="text-slate-600 mt-4">I’ll do my best to guide you — but since my insights are AI-generated, make sure to double-check before making decisions.</p>
                        <div className="mt-6 flex justify-center">
                            <Button onClick={() => setShowGenieDisclaimer(false)} className="bg-gl-orange-600 hover:bg-gl-orange-700 w-auto px-8">
                                Got It
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Performance Report</h2>
                <button
                    onClick={handleDownload}
                    className="flex-shrink-0 flex items-center gap-2 bg-gl-orange-100 text-gl-orange-700 font-semibold px-4 py-2 rounded-lg hover:bg-gl-orange-200 transition-colors"
                >
                    <DownloadIcon />
                    Download Report
                </button>
            </div>
            
            <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-6 overflow-x-auto custom-scrollbar" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('insights')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'insights' ? 'border-gl-orange-500 text-gl-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    >
                        Overall Quiz Insights
                    </button>
                    <button
                        onClick={() => setActiveTab('questions')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'questions' ? 'border-gl-orange-500 text-gl-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    >
                        Question-Level Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab('educator')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'educator' ? 'border-gl-orange-500 text-gl-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    >
                        Educator Analytics
                    </button>
                </nav>
            </div>
            
            {activeTab === 'insights' && <OverallQuizInsights data={report} />}
            
            {activeTab === 'questions' && (
                <QuestionLevelAnalytics data={report.questionAnalytics} />
            )}

            {activeTab === 'educator' && report.competency && (
                <EducatorAnalytics 
                    competency={report.competency} 
                    recommendations={recommendations} 
                />
            )}
        </Card>
    );
};
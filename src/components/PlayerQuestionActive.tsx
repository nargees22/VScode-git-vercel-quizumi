import React, { useState, useEffect, useMemo } from 'react';
import type { Quiz, Player, Question, PlayerAnswer } from '../../types.ts';
import { QuestionType, GameState } from '../../types.ts';
import Button from './Button.tsx';
import Card from './Card.tsx';
import { FiftyFiftyIcon } from '../icons/FiftyFiftyIcon.tsx';
import { PointDoublerIcon } from '../icons/PointDoublerIcon.tsx';
import { MemoizedPlayerConsole } from './PlayerConsole.tsx';

interface PlayerQuestionActiveProps {
    quiz: Quiz;
    player: Player;
    question: Question;
    allPlayers: Player[];
    submitAnswer: (answer: PlayerAnswer['answer']) => void;
    lifelineUsedThisTurn: 'fiftyFifty' | 'pointDoubler' | null;
    eliminatedOptions: number[];
    handleLifelineClick: (type: 'fiftyFifty' | 'pointDoubler') => void;
    isUsingLifeline: boolean;
    canUseFiftyFifty: boolean;
    canUsePointDoubler: boolean;
    fiftyFiftyCost: number;
    confirmingLifeline: 'fiftyFifty' | 'pointDoubler' | null;
    setConfirmingLifeline: React.Dispatch<React.SetStateAction<'fiftyFifty' | 'pointDoubler' | null>>;
    handleUseLifeline: (type: 'fiftyFifty' | 'pointDoubler') => void;
}

export const PlayerQuestionActive: React.FC<PlayerQuestionActiveProps> = ({
    quiz, player, question, allPlayers, submitAnswer, lifelineUsedThisTurn, eliminatedOptions,
    handleLifelineClick, isUsingLifeline, canUseFiftyFifty, canUsePointDoubler, fiftyFiftyCost,
    confirmingLifeline, setConfirmingLifeline, handleUseLifeline
}) => {
    const [selectedMatches, setSelectedMatches] = useState<Array<number | null>>([]);
    const [wordCloudInput, setWordCloudInput] = useState('');
    const [showGoAnimation, setShowGoAnimation] = useState(false);
    
    const [playerStats, setPlayerStats] = useState({ rank: '-', pointsBehind: 0, isLeader: false });

     useEffect(() => {
        if (!allPlayers || !player || !quiz || allPlayers.length === 0) {
            return;
        }
    
        if (quiz.gameState !== GameState.QUESTION_ACTIVE) {
            const sortedPlayers = [...allPlayers].sort((a, b) => b.score - a.score);
            const playerIndex = sortedPlayers.findIndex(p => p.id === player.id);
            
            if (playerIndex === -1) return;
    
            const rank = playerIndex + 1;
            const isLeader = rank === 1;
            const leaderScore = sortedPlayers[0].score;
            const playerScore = sortedPlayers[playerIndex].score;
            const pointsBehind = leaderScore - playerScore;
    
            setPlayerStats({ rank: rank.toString(), pointsBehind, isLeader });
        }
    }, [allPlayers, player, quiz.gameState]);

    useEffect(() => {
        if (question.type === QuestionType.MATCH) {
            const numPairs = question.matchPairs?.length || 0;
            setSelectedMatches(Array(numPairs).fill(null));
        } else if (question.type === QuestionType.WORD_CLOUD) {
            setWordCloudInput('');
        }
    }, [question]);

    useEffect(() => {
        if (quiz.gameState === GameState.QUESTION_ACTIVE) {
            setShowGoAnimation(true);
            const timer = setTimeout(() => setShowGoAnimation(false), 1500); // Animation lasts 1.5s
            return () => clearTimeout(timer);
        }
    }, [quiz.gameState]);
    
    const optionBgColors = useMemo(() => ['bg-red-500', 'bg-gl-orange-500', 'bg-yellow-400', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'], []);
    const isInteractive = quiz.gameState === GameState.QUESTION_ACTIVE;

    const renderQuestionBody = () => {
        const lifelinesBlock = (
            question.type === QuestionType.MCQ && quiz.gameState === GameState.QUESTION_ACTIVE &&
            <div className="lifeline-bar">
                {/* 50:50 Lifeline */}
                <div className="lifeline-item">
                    <button
                        onClick={() => handleLifelineClick('fiftyFifty')}
                        disabled={isUsingLifeline || lifelineUsedThisTurn !== null}
                        className={`lifeline-button fifty-fifty-lifeline ${!canUseFiftyFifty && lifelineUsedThisTurn === null ? 'opacity-60' : ''}`}
                        aria-label={`Use 50-50 Lifeline for ${fiftyFiftyCost} points`}
                    >
                        <FiftyFiftyIcon />
                        {lifelineUsedThisTurn === 'fiftyFifty' && (
                            <div className="lifeline-used-overlay">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        )}
                    </button>
                    <span className="lifeline-label">-{fiftyFiftyCost} pts</span>
                </div>
        
                {/* Point Doubler Lifeline */}
                <div className="lifeline-item">
                    <button
                        onClick={() => handleLifelineClick('pointDoubler')}
                        disabled={isUsingLifeline || lifelineUsedThisTurn !== null}
                        className={`lifeline-button point-doubler-lifeline ${lifelineUsedThisTurn === 'pointDoubler' ? 'active-lifeline-glow' : ''} ${!canUsePointDoubler && lifelineUsedThisTurn === null ? 'opacity-60' : ''}`}
                        aria-label="Use Point Doubler Lifeline"
                    >
                        <PointDoublerIcon />
                        {player.lifelines.pointDoubler > 0 && lifelineUsedThisTurn === null && (
                             <span className="lifeline-badge">
                                {player.lifelines.pointDoubler}
                            </span>
                        )}
                    </button>
                    <span className="lifeline-label">Use 2x</span>
                </div>
            </div>
        );

        switch (question.type) {
             case QuestionType.WORD_CLOUD:
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                         <div className="flex-grow flex items-center justify-center w-full">
                            <div className="relative w-full max-w-md">
                                <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-slate-800 bg-white/70 backdrop-blur-sm p-4 rounded-xl">{question.text}</h1>
                                {!isInteractive && (
                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/75 text-white p-4 animate-fade-in rounded-lg" aria-live="polite">
                                        <h2 className="text-4xl font-bold animate-pulse">Get Ready</h2>
                                    </div>
                                )}
                                <div className="space-y-6">
                                     <input
                                        type="text"
                                        value={wordCloudInput}
                                        onChange={(e) => setWordCloudInput(e.target.value)}
                                        disabled={!isInteractive}
                                        className="w-full bg-white border border-slate-300 rounded-md p-4 text-xl focus:ring-2 focus:ring-[#ff5f2d] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                                        placeholder="Type your answer here..."
                                        maxLength={50}
                                     />
                                     <Button onClick={() => submitAnswer(wordCloudInput)} disabled={!isInteractive || !wordCloudInput.trim()} className="bg-[#ff5f2d] hover:bg-orange-600">Submit</Button>
                                 </div>
                             </div>
                        </div>
                         <div className="flex-shrink-0 w-full pt-4"><MemoizedPlayerConsole player={player} playerStats={playerStats} isDarkTheme={false} /></div>
                    </div>
                );
            case QuestionType.MATCH:
                if (!question.matchPairs) return <div>Error: Match question is missing data.</div>;
                
                const handleMatchSelection = (promptIndex: number, selectedValue: string) => {
                    const newMatches = [...selectedMatches];
                    const valueAsNumber = parseInt(selectedValue, 10);
                    newMatches[promptIndex] = isNaN(valueAsNumber) ? null : valueAsNumber;
                    setSelectedMatches(newMatches);
                };

                return (
                     <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        <div className="flex-grow flex items-center justify-center w-full">
                            <div className="relative w-full max-w-lg">
                                 <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 text-slate-800 bg-white/70 backdrop-blur-sm p-4 rounded-xl">{question.text}</h1>
                                {!isInteractive && (
                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/75 text-white p-4 animate-fade-in rounded-lg" aria-live="polite">
                                        <h2 className="text-4xl font-bold animate-pulse">Get Ready</h2>
                                    </div>
                                )}
                                 <div>
                                     <div className={`w-full space-y-3 overflow-y-auto px-2 pb-4 max-h-[50vh] ${!isInteractive ? 'opacity-60' : ''}`}>
                                        {question.matchPairs.map((pair, promptIndex) => {
                                            const usedOptionIndices = selectedMatches.filter(
                                                (m, i) => m !== null && i !== promptIndex
                                            ) as number[];
                                            
                                            return (
                                                <div key={promptIndex} className="grid grid-cols-2 gap-2 items-center bg-white/90 p-3 rounded-lg shadow-sm">
                                                    <div className="font-semibold text-slate-700 pr-2">{pair.prompt}</div>
                                                    <select
                                                        value={selectedMatches[promptIndex] ?? ''}
                                                        onChange={(e) => handleMatchSelection(promptIndex, e.target.value)}
                                                        disabled={!isInteractive}
                                                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 focus:ring-2 focus:ring-[#ff5f2d] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                                                    >
                                                        <option value="" disabled>Select a match...</option>
                                                        {question.options.map((optionText, optionIndex) => (
                                                            <option
                                                                key={optionIndex}
                                                                value={optionIndex}
                                                                disabled={usedOptionIndices.includes(optionIndex)}
                                                            >
                                                                {optionText}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            );
                                        })}
                                    </div>
                                     <div className="mt-4 w-full">
                                        <Button onClick={() => submitAnswer(selectedMatches)} disabled={!isInteractive || selectedMatches.some(m => m === null)} className="bg-[#ff5f2d] hover:bg-orange-600">Submit Answer</Button>
                                     </div>
                                 </div>
                             </div>
                        </div>
                        <div className="flex-shrink-0 w-full pt-4"><MemoizedPlayerConsole player={player} playerStats={playerStats} isDarkTheme={false} /></div>
                    </div>
                );

            case QuestionType.MCQ:
            case QuestionType.SURVEY:
                return !quiz.config.showQuestionToPlayers ? (
                    <div className="w-full h-full flex flex-col p-4 relative">
                        {!isInteractive && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 text-white p-4 animate-fade-in" aria-live="polite">
                                <h2 className="text-5xl font-bold animate-pulse">Get Ready</h2>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                            {question.options.map((opt, i) => {
                                const isEliminated = eliminatedOptions.includes(i);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => submitAnswer(i)}
                                        disabled={!isInteractive || isEliminated}
                                        className={`flex items-center justify-center p-3 text-lg font-bold text-center rounded-xl shadow-lg transform transition-all duration-300 disabled:cursor-not-allowed text-white ${optionBgColors[i % optionBgColors.length]} ${isEliminated ? 'animate-strike-out bg-slate-400' : 'hover:scale-105 hover:ring-4 ring-offset-2 ring-white'}`}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex-shrink-0 pt-4 relative">
                            {lifelinesBlock}
                            <MemoizedPlayerConsole player={player} playerStats={playerStats} isDarkTheme={false} />
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col p-4">
                        <div className="flex-grow flex items-center justify-center">
                            <div className="w-full max-w-3xl mx-auto flex flex-col">
                                <div className="w-full bg-slate-800 text-white p-4 sm:p-6 flex items-center justify-center text-center shadow-lg rounded-t-xl z-10 flex-shrink-0">
                                    <h1 className="text-lg sm:text-xl font-bold">{question.text}</h1>
                                </div>
                                <div className="relative p-4 bg-slate-100/80 backdrop-blur-sm shadow-lg rounded-b-xl">
                                    {!isInteractive && (
                                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 text-white p-4 animate-fade-in rounded-b-xl" aria-live="polite">
                                            <h2 className="text-5xl font-bold animate-pulse">Get Ready</h2>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {question.options.map((opt, i) => {
                                            const isEliminated = eliminatedOptions.includes(i);
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => submitAnswer(i)}
                                                    disabled={!isInteractive || isEliminated}
                                                    className={`text-white flex items-center p-3 text-left font-semibold rounded-lg shadow-md transform transition-all duration-200 disabled:cursor-not-allowed w-full min-h-[64px] ${optionBgColors[i % optionBgColors.length]} ${isEliminated ? 'animate-strike-out bg-slate-400' : 'hover:brightness-110 hover:scale-[1.02]'}`}
                                                >
                                                    <span className="flex-1 break-words">{opt}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-shrink-0 w-full pt-4 relative">
                            {lifelinesBlock}
                            <MemoizedPlayerConsole player={player} playerStats={playerStats} isDarkTheme={false} />
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="w-full h-full relative">
            {isInteractive && showGoAnimation && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 pointer-events-none animate-fade-in">
                    <span className="text-9xl font-extrabold text-white animate-pop-in" style={{ textShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
                        GO!
                    </span>
                </div>
            )}
            {confirmingLifeline && (
                <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 animate-fade-in">
                    <Card className="text-center">
                        <h2 className="text-2xl font-bold mb-2">Confirm Lifeline</h2>
                        <p className="text-slate-600 mb-6">
                            {confirmingLifeline === 'fiftyFifty' ? `Use 50:50 and spend ${fiftyFiftyCost} points?` : `Use your Point Doubler?`}
                        </p>
                        <div className="flex gap-4">
                            <Button onClick={() => setConfirmingLifeline(null)} className="bg-slate-300 hover:bg-slate-400 text-slate-800">Cancel</Button>
                            <Button onClick={() => handleUseLifeline(confirmingLifeline)} className="bg-gl-orange-600 hover:bg-gl-orange-700">Confirm</Button>
                        </div>
                    </Card>
                </div>
            )}
            {renderQuestionBody()}
        </div>
    );
};
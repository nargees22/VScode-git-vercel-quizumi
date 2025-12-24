import React, { useEffect } from 'react';
import type { Question } from '../types.ts';
import { QuestionType } from '../types.ts';
import { CheckIcon } from '../icons/CheckIcon.tsx';
import { XIcon } from '../icons/XIcon.tsx';
import { PointDoublerIcon } from '../icons/PointDoublerIcon.tsx';

const LifelineAward: React.FC<{ type: 'pointDoubler'; onClose: () => void }> = ({ type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000); // Display for 3 seconds
        return () => clearTimeout(timer);
    }, [onClose]);

    const Icon = PointDoublerIcon;
    const text = 'Point Doubler';
    const color = 'text-yellow-400';

    return (
        <div className="lifeline-award-overlay animate-fade-in">
            <div className="lifeline-award-card relative text-center bg-slate-800 border-2 border-yellow-400 rounded-2xl shadow-2xl p-8 w-80 overflow-hidden">
                <div className="pulse-bg bg-yellow-400"></div>
                <h2 className="text-white text-2xl font-bold mb-4">LIFELINE EARNED!</h2>
                <Icon className={`w-32 h-32 mx-auto lifeline-icon-glow relative z-10 ${color}`} />
                <p className="text-white text-3xl font-extrabold mt-4 relative z-10">{text}</p>
            </div>
        </div>
    );
};

interface PlayerQuestionResultProps {
    question: Question;
    isCorrect: boolean;
    correctMatchesCount: number;
    currentResultMessage: string;
    lifelineEarned: 'pointDoubler' | null;
    setLifelineEarned: React.Dispatch<React.SetStateAction<'pointDoubler' | null>>;
}

export const PlayerQuestionResult: React.FC<PlayerQuestionResultProps> = ({
    question, isCorrect, correctMatchesCount, currentResultMessage, lifelineEarned, setLifelineEarned
}) => {
    const isPositiveResult = question.type === QuestionType.MATCH ? correctMatchesCount > 0
        : question.type === QuestionType.SURVEY || question.type === QuestionType.WORD_CLOUD ? true
            : isCorrect;
            
    return (
        <div className={`w-full flex-grow flex flex-col items-center justify-center p-4 animate-fade-in ${isPositiveResult ? 'bg-green-500' : 'bg-red-500'}`}>
            {lifelineEarned === 'pointDoubler' && <LifelineAward type="pointDoubler" onClose={() => setLifelineEarned(null)} />}
            <div className="text-center animate-pop-in text-white">
                {question.type === QuestionType.MATCH ?
                    <span className="text-7xl font-bold">{correctMatchesCount}/{question.matchPairs?.length}</span> :
                    (question.type === QuestionType.SURVEY || question.type === QuestionType.WORD_CLOUD) ?
                        <CheckIcon className="h-24 w-24 mx-auto" />
                        : isCorrect ? <CheckIcon className="h-24 w-24 mx-auto" /> : <XIcon className="h-24 w-24 mx-auto" />
                }
                <h1 className="text-5xl font-bold mt-4">{
                    question.type === QuestionType.MATCH ? "Results"
                        : question.type === QuestionType.SURVEY || question.type === QuestionType.WORD_CLOUD ? "Submitted!"
                            : isCorrect ? "Correct!" : "Incorrect"
                }</h1>
                <p className="text-2xl mt-4 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>{currentResultMessage}</p>

                <p className="text-xl mt-8 opacity-80 animate-fade-in" style={{ animationDelay: '0.5s' }}>Waiting for next question...</p>
            </div>
        </div>
    );
};
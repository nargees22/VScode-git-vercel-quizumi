import React, { useState } from 'react';
import Card from './Card';
import Button from './Button';
import { Question, QuestionType } from '../../types.ts';

const countWords = (str: string) => str ? str.trim().split(/\s+/).filter(Boolean).length : 0;

export const EditQuestionModal: React.FC<{
    question: Question | Omit<Question, 'id'>;
    onClose: () => void;
    onSave: (data: Omit<Question, 'id'>) => void;
}> = ({ question, onClose, onSave }) => {
    const [editedQuestion, setEditedQuestion] = useState(question);
    const [errors, setErrors] = useState({ technology: '', skill: '' });

    const handleInputChange = (field: keyof Omit<Question, 'id'>, value: any) => {
        if (field === 'technology' || field === 'skill') {
            if (countWords(value) > 2) {
                setErrors(prev => ({ ...prev, [field]: 'Max 2 words allowed' }));
            } else {
                setErrors(prev => ({ ...prev, [field]: '' }));
            }
        }
        setEditedQuestion(prev => ({ ...prev, [field]: value }));
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...editedQuestion.options];
        newOptions[index] = value;
        setEditedQuestion(prev => ({ ...prev, options: newOptions }));
    };

    const handleSaveChanges = () => {
        const { id, ...dataToSave } = editedQuestion as Question;
        onSave(dataToSave);
    };

    const handleQuestionTypeChange = (newType: QuestionType) => {
        const baseState: Omit<Question, 'id'> = {
            ...editedQuestion,
            type: newType,
            options: [],
            correctAnswerIndex: undefined,
            matchPairs: undefined,
            correctAnswers: undefined,
        };

        if (newType === QuestionType.MCQ) {
            baseState.options = ['', '', '', ''];
            baseState.correctAnswerIndex = 0;
        } else if (newType === QuestionType.SURVEY) {
            baseState.options = ['', ''];
        } else if (newType === QuestionType.MATCH) {
            baseState.matchPairs = [{ prompt: '', correctMatch: '' }, { prompt: '', correctMatch: '' }];
        } else if (newType === QuestionType.WORD_CLOUD) {
            baseState.correctAnswers = [];
        }
        setEditedQuestion(baseState);
    };

    const handleMatchPairChange = (index: number, field: 'prompt' | 'correctMatch', value: string) => {
        const newPairs = [...(editedQuestion.matchPairs || [])];
        newPairs[index] = { ...newPairs[index], [field]: value };
        setEditedQuestion(prev => ({ ...prev, matchPairs: newPairs }));
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">Review Question</h2>
                <div className="space-y-4">
                     <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input type="radio" value={QuestionType.MCQ} checked={editedQuestion.type === QuestionType.MCQ} onChange={() => handleQuestionTypeChange(QuestionType.MCQ)} className="form-radio text-gl-orange-500" /> MCQ
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="radio" value={QuestionType.SURVEY} checked={editedQuestion.type === QuestionType.SURVEY} onChange={() => handleQuestionTypeChange(QuestionType.SURVEY)} className="form-radio text-gl-orange-500"/> Survey
                        </label>
                         <label className="flex items-center gap-2">
                            <input type="radio" value={QuestionType.MATCH} checked={editedQuestion.type === QuestionType.MATCH} onChange={() => handleQuestionTypeChange(QuestionType.MATCH)} className="form-radio text-gl-orange-500"/> Match
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="radio" value={QuestionType.WORD_CLOUD} checked={editedQuestion.type === QuestionType.WORD_CLOUD} onChange={() => handleQuestionTypeChange(QuestionType.WORD_CLOUD)} className="form-radio text-gl-orange-500"/> Word Cloud
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{editedQuestion.type === QuestionType.MATCH ? 'Instruction Text' : 'Question / Prompt'}</label>
                        <textarea
                            value={editedQuestion.text}
                            onChange={e => handleInputChange('text', e.target.value)}
                            className="w-full bg-slate-100 border border-slate-300 rounded-md p-2 h-24 resize-none focus:ring-2 focus:ring-gl-orange-500 focus:outline-none"
                        />
                    </div>

                    {editedQuestion.type === QuestionType.MCQ && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Options (select correct answer)</label>
                            {editedQuestion.options.map((opt, i) => (
                                <div key={i} className="flex items-center space-x-2 mb-2">
                                    <input
                                        type="radio"
                                        name="correctAnswer"
                                        checked={editedQuestion.correctAnswerIndex === i}
                                        onChange={() => handleInputChange('correctAnswerIndex', i)}
                                        className="form-radio h-5 w-5 text-gl-orange-600 bg-slate-200 border-slate-400 focus:ring-gl-orange-500"
                                    />
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={e => handleOptionChange(i, e.target.value)}
                                        className="w-full bg-slate-100 border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {editedQuestion.type === QuestionType.SURVEY && (
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Options</label>
                            {editedQuestion.options.map((opt, i) => (
                                <div key={i} className="flex items-center space-x-2 mb-2">
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={e => handleOptionChange(i, e.target.value)}
                                        className="w-full bg-slate-100 border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {editedQuestion.type === QuestionType.MATCH && (
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-2">Matching Pairs</label>
                           <div className="space-y-3">
                                {editedQuestion.matchPairs?.map((pair, i) => (
                                    <div key={i} className="grid grid-cols-2 gap-2 items-center">
                                        <input type="text" value={pair.prompt} onChange={e => handleMatchPairChange(i, 'prompt', e.target.value)} placeholder={`Prompt ${i+1}`} className="w-full bg-slate-100 border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none"/>
                                        <input type="text" value={pair.correctMatch} onChange={e => handleMatchPairChange(i, 'correctMatch', e.target.value)} placeholder={`Match ${i+1}`} className="w-full bg-slate-100 border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none"/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Word Cloud has no specific options */}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Technology</label>
                           <input type="text" value={editedQuestion.technology} onChange={e => handleInputChange('technology', e.target.value)} className="w-full bg-slate-100 border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none" />
                           {errors.technology && <p className="text-red-500 text-xs mt-1">{errors.technology}</p>}
                        </div>
                         <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Skill</label>
                           <input type="text" value={editedQuestion.skill} onChange={e => handleInputChange('skill', e.target.value)} className="w-full bg-slate-100 border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none" />
                           {errors.skill && <p className="text-red-500 text-xs mt-1">{errors.skill}</p>}
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
                    <Button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800">Cancel</Button>
                    <Button onClick={handleSaveChanges} className="bg-gl-orange-600 hover:bg-gl-orange-700" disabled={!!errors.technology || !!errors.skill}>
                         Save Changes
                    </Button>
                </div>
            </Card>
        </div>
    );
};
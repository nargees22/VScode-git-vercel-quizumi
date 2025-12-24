
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../service/supabase";

import { generateQuestions } from '../gemini';
import type { Quiz, Question, QuizConfig } from '../types';
import { GameState, QuestionType, Clan } from '../types';

import Card from '../components/Card';
import Button from '../components/Button';
import { PageLoader } from '../components/PageLoader';
import { CustomSelect } from '../components/CustomSelect';
import { EditQuestionModal } from '../components/EditQuestionModal';
import { LoadingSpinner } from '../icons/LoadingSpinner';
import { DeleteIcon } from '../icons/DeleteIcon';
import { SearchIcon } from '../icons/SearchIcon';

const notAvailable = () => {
    alert("This feature is temporarily disabled during Supabase migration.");
};

const CreateQuizPage = () => {
    const navigate = useNavigate();
    const organizerName = useMemo(() => sessionStorage.getItem('quiz-organizer'), []);

    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState<Array<Question>>([]);
    const [view, setView] = useState<'past' | 'reports' | 'library' | 'custom' | 'ai'>('past');
    const [isCreating, setIsCreating] = useState(false);

    // Library State
    const [libraryQuestions, setLibraryQuestions] = useState<Question[]>([]);
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
    const [technologies, setTechnologies] = useState<string[]>([]);
    const [skillsForFilter, setSkillsForFilter] = useState<string[]>([]);
    const [selectedTechnology, setSelectedTechnology] = useState('all');
    const [selectedSkill, setSelectedSkill] = useState('all');
    const [selectedQuestionType, setSelectedQuestionType] = useState('all');
    const [librarySearchTerm, setLibrarySearchTerm] = useState('');

    const [quizConfig, setQuizConfig] = useState<QuizConfig>({
        showLiveResponseCount: true,
        showQuestionToPlayers: true,
        clanBased: false,
        clanNames: { [Clan.TITANS]: 'Titans', [Clan.DEFENDERS]: 'Defenders' },
        clanAssignment: 'autoBalance',
    });

    // AI Generation State
    const [aiTopic, setAiTopic] = useState('');
    const [aiSkill, setAiSkill] = useState('');
    const [aiNumQuestions, setAiNumQuestions] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
    const [aiUsage, setAiUsage] = useState(0);

    useEffect(() => {
        if (!organizerName) {
            navigate('/');
            return;
        }

        const fetchLibraryData = async () => {
            setIsLoadingLibrary(true);
            try {
                const { data, error } = await supabase.from('question_bank_structured').select('*');
                if (!error && data) {
                    const mapped: Question[] = data.map((row: any) => ({
                        id: row.pk_id.toString(),
                        text: row.question_text,
                        timeLimit: row.time_limit,
                        technology: row.technology,
                        skill: row.skill,
                        type: row.type,
                        organizerName: row.organizer_name,
                        options: [row.option_1, row.option_2, row.option_3, row.option_4].filter(Boolean),
                        correctAnswerIndex: row.correct_answer_index,
                    }));
                    setLibraryQuestions(mapped);

                    const techSet = new Set<string>();
                    mapped.forEach(q => q.technology && techSet.add(q.technology.trim()));
                    setTechnologies(Array.from(techSet).sort());
                }

                const today = new Date().toISOString().split('T')[0];
                const { data: usageData } = await supabase.from('ai_usage').select('number_of_ai_questions').eq('user_id', organizerName).eq('date_of_usage', today).maybeSingle();
                if (usageData) setAiUsage(usageData.number_of_ai_questions);
            } catch (err) {
                console.error(err);
            }
            setIsLoadingLibrary(false);
        };

        fetchLibraryData();
    }, [organizerName, navigate]);

    useEffect(() => {
        const skills = libraryQuestions
            .filter(q => selectedTechnology === 'all' || q.technology === selectedTechnology)
            .map(q => q.skill);
        setSkillsForFilter(Array.from(new Set(skills)).sort());
    }, [selectedTechnology, libraryQuestions]);

    const filteredQuestions = useMemo(() => {
        return libraryQuestions.filter(q => {
            const matchesSearch = !librarySearchTerm.trim() || q.text.toLowerCase().includes(librarySearchTerm.toLowerCase());
            const matchesType = selectedQuestionType === 'all' || q.type === selectedQuestionType;
            const matchesTech = selectedTechnology === 'all' || q.technology === selectedTechnology;
            const matchesSkill = selectedSkill === 'all' || q.skill === selectedSkill;
            return matchesSearch && matchesType && matchesTech && matchesSkill;
        });
    }, [libraryQuestions, selectedTechnology, selectedSkill, selectedQuestionType, librarySearchTerm]);

    const handleStartLiveQuiz = async () => {
        if (!title.trim() || questions.length === 0) return alert("Required fields missing");
        setIsCreating(true);
        const quizId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { error } = await supabase.from('quiz_master').insert({
            quiz_id: quizId, title: title.trim(), organizer_name: organizerName, questions, game_state: GameState.LOBBY, config: quizConfig, created_at: new Date().toISOString(),
        });
        if (!error) navigate(`/lobby/${quizId}`);
        setIsCreating(false);
    };

    if (!organizerName) return <PageLoader message="Loading..." />;

    return (
        <div className="p-4 sm:p-8 animate-fade-in">
            <h1 className="text-4xl font-bold text-center my-8">Create a New Quiz</h1>
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <Card>
                        <label className="block text-lg font-medium text-slate-800 mb-2">Quiz Title</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-100 border border-slate-300 rounded-md p-3 outline-none focus:ring-2 ring-gl-orange-500" placeholder="Quiz Title" />
                    </Card>
                    <Card>
                        <h2 className="text-xl font-bold mb-3 text-slate-800">Your Questions ({questions.length}/10)</h2>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {questions.map((q, i) => (
                                <div key={q.id} className="bg-slate-50 p-2 rounded flex justify-between items-center border">
                                    <p className="truncate text-xs">{i+1}. {q.text}</p>
                                    <button onClick={() => setQuestions(questions.filter(item => item.id !== q.id))} className="text-red-500"><DeleteIcon className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>
                        <Button onClick={handleStartLiveQuiz} disabled={isCreating || questions.length === 0} className="mt-4 bg-gl-orange-600">Start Quiz</Button>
                    </Card>
                </div>
                <Card className="h-[600px] flex flex-col">
                    <div className="flex border-b mb-4 overflow-x-auto shrink-0">
                         {['library', 'ai', 'past'].map(v => (
                             <button key={v} onClick={() => setView(v as any)} className={`py-2 px-4 font-bold capitalize ${view === v ? 'text-gl-orange-600 border-b-2 border-gl-orange-600' : 'text-slate-400'}`}>{v}</button>
                         ))}
                    </div>
                    <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                        {view === 'library' && (
                            <div className="space-y-4">
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input placeholder="Search..." value={librarySearchTerm} onChange={e => setLibrarySearchTerm(e.target.value)} className="w-full bg-slate-50 border p-2 pl-9 rounded outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <CustomSelect options={technologies} value={selectedTechnology} onChange={setSelectedTechnology} placeholder="Tech" />
                                    <CustomSelect options={skillsForFilter} value={selectedSkill} onChange={setSelectedSkill} placeholder="Skill" />
                                </div>
                                {isLoadingLibrary ? <LoadingSpinner /> : (
                                    <div className="space-y-2">
                                        {filteredQuestions.map(q => (
                                            <div key={q.id} className="p-2 border rounded hover:border-gl-orange-300 flex justify-between items-center">
                                                <div className="truncate w-3/4">
                                                    <p className="text-xs font-bold text-slate-700 truncate">{q.text}</p>
                                                    <p className="text-[8px] uppercase text-slate-400">{q.technology} • {q.skill}</p>
                                                </div>
                                                <button onClick={() => setQuestions([...questions, q])} className="text-gl-orange-600 text-[10px] font-bold">+ Add</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {view !== 'library' && <div className="text-center py-20 text-slate-300">Feature coming soon</div>}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default CreateQuizPage;

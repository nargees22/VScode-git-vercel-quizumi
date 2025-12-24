import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../service/supabase";

import { generateQuestions } from '../../gemini';
import type { Quiz, Question, QuizConfig, MatchPair } from '../../types';
import { GameState, QuestionType, Clan } from '../../types';

import Card from '../components/Card';
import Button from '../components/Button';
import { PageLoader } from '../components/PageLoader';
import { CustomSelect } from '../components/CustomSelect';
import { EditQuestionModal } from '../components/EditQuestionModal';
import { LoadingSpinner } from '../icons/LoadingSpinner';
import { DeleteIcon } from '../icons/DeleteIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { WandIcon } from '../icons/WandIcon';
import { EditIcon } from '../icons/EditIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { UpArrowIcon } from '../icons/UpArrowIcon';
import { DownArrowIcon } from '../icons/DownArrowIcon';
import { UsersIcon } from '../icons/UsersIcon';

const EMPTY_CUSTOM_QUESTION = {
  text: '',
  options: ['', '', '', ''],
  correctAnswerIndex: 0,
  matchPairs: [
    { prompt: '', correctMatch: '' },
    { prompt: '', correctMatch: '' },
  ],
  timeLimit: 30,
  technology: '',
  skill: '',
  type: QuestionType.MCQ,
};

const notAvailable = () => {
    alert("This feature is temporarily disabled during Supabase migration.");
};

const countWords = (str: string) => str ? str.trim().split(/\s+/).filter(Boolean).length : 0;

const CreateQuizPage = () => {
    const navigate = useNavigate();
    const organizerName = useMemo(() => sessionStorage.getItem('quiz-organizer'), []);

    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState<Array<Question>>([]);
    const [view, setView] = useState<'past' | 'reports' | 'library' | 'custom' | 'ai'>('past');
    const [isCreating, setIsCreating] = useState(false);

    // ✅ Reuse Quiz (Completed quizzes)
    const [completedQuizzes, setCompletedQuizzes] = useState<
      { quiz_id: string; title: string }[]
    >([]);
    const [selectedQuizId, setSelectedQuizId] = useState<string>('');

    // Library State
    const [libraryQuestions, setLibraryQuestions] = useState<Question[]>([]);
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
    const [libraryView, setLibraryView] = useState<'all' | 'mine'>('all');
    const [technologies, setTechnologies] = useState<string[]>([]);
    const [masterSkills, setMasterSkills] = useState<string[]>([]);
    const [skillsForFilter, setSkillsForFilter] = useState<string[]>([]);
    const [selectedTechnology, setSelectedTechnology] = useState('all');
    const [selectedSkill, setSelectedSkill] = useState('all');
    const [selectedQuestionType, setSelectedQuestionType] = useState('all');
    const [librarySearchTerm, setLibrarySearchTerm] = useState('');

    // My Quizzes & Reports State
    const [draftQuizzes, setDraftQuizzes] = useState<Quiz[]>([]);
    const [pastQuizzes, setPastQuizzes] = useState<Quiz[]>([]);
    const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
    const [pastQuizzesSearchTerm, setPastQuizzesSearchTerm] = useState('');
    const [draftsSearchTerm, setDraftsSearchTerm] = useState('');
    const [reportSearchTerm, setReportSearchTerm] = useState('');
    const [expandedReportGroup, setExpandedReportGroup] = useState<string | null>(null);
    const [expandedPastQuizGroup, setExpandedPastQuizGroup] = useState<string | null>(null);

    // Quiz Config State
    const [quizConfig, setQuizConfig] = useState<QuizConfig>({
        showLiveResponseCount: true,
        showQuestionToPlayers: true,
        clanBased: false,
        clanNames: { [Clan.TITANS]: 'Titans', [Clan.DEFENDERS]: 'Defenders' },
        clanAssignment: 'autoBalance',
    });

    // Custom Question State
    const [customQuestion, setCustomQuestion] = useState(EMPTY_CUSTOM_QUESTION);
    const [isCustomQuestionValid, setIsCustomQuestionValid] = useState(false);
    const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);
    const [customFormErrors, setCustomFormErrors] = useState({ technology: '', skill: '' });

    // AI Generation State
    const [aiTopic, setAiTopic] = useState('');
    const [aiSkill, setAiSkill] = useState('');
    const [aiNumQuestions, setAiNumQuestions] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiUsage, setAiUsage] = useState(0);
    const [isCheckingUsage, setIsCheckingUsage] = useState(true);
    const dailyAiLimit = 15;

    useEffect(() => {
        if (!organizerName) {
            navigate('/');
            return;
        }

        const fetchInitialData = async () => {
            setIsLoadingLibrary(true);
            try {
                const { data: organizerData, error: organizerError } = await supabase
                    .from('organizers_master')
                    .select('organizer_id')
                    .eq('organizer_id', organizerName)
                    .maybeSingle();

                if (organizerError) {
                    console.error('Error fetching organizer data:', organizerError);
                    navigate('/');
                    return;
                }

                if (!organizerData) {
                    console.error('Organizer not found');
                    navigate('/');
                    return;
                }

                const { data: libraryData } = await supabase.from('question_bank_structured').select('*');
                if (libraryData) {
                    const mapped: Question[] = libraryData.map((row: any) => ({
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
                const { data: usageData, error: usageError } = await supabase
                    .from('ai_usage')
                    .select('number_of_ai_questions')
                    .eq('user_id', organizerName)
                    .eq('date_of_usage', today)
                    .maybeSingle();

                if (usageError) {
                    console.error('Error fetching AI usage data:', usageError);
                } else if (usageData) {
                    setAiUsage(usageData.number_of_ai_questions);
                }
                setIsCheckingUsage(false);
            } catch (err) {
                console.error(err);
            }
            setIsLoadingLibrary(false);
        };

        const fetchQuizzes = async () => {
            setIsLoadingQuizzes(true);
            try {
                const { data, error } = await supabase
                    .from('quiz_master_structure')
                    .select('*')
                    .eq('organizer_name', organizerName)
                    .order('created_at', { ascending: false });

                if (data) {
                    const completed = data.filter(q => q.game_state === 'FINISHED');
                    const drafts = data.filter(q => q.is_draft);
                    setPastQuizzes(completed as any[]);
                    setDraftQuizzes(drafts as any[]);
                    setCompletedQuizzes(completed.map(q => ({ quiz_id: q.quiz_id, title: q.title })));
                }
            } catch (err) {
                console.error(err);
            }
            setIsLoadingQuizzes(false);
        };

        fetchInitialData();
        fetchQuizzes();
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
            const matchesView = libraryView === 'all' || q.organizerName === organizerName;
            return matchesSearch && matchesType && matchesTech && matchesSkill && matchesView;
        });
    }, [libraryQuestions, selectedTechnology, selectedSkill, selectedQuestionType, librarySearchTerm, libraryView, organizerName]);

    const groupedPastQuizzes = useMemo(() => {
        const groups: Record<string, any[]> = {};
        pastQuizzes.forEach(q => {
            if (!groups[q.title]) groups[q.title] = [];
            groups[q.title].push(q);
        });
        return groups;
    }, [pastQuizzes]);

    const handleSelectQuestion = (q: Question) => {
        if (questions.length < 10 && !questions.find(item => item.id === q.id)) {
            setQuestions([...questions, q]);
        }
    };

    const handleStartLiveQuiz = async () => {
        if (!title.trim() || questions.length === 0) return alert("Title and at least one question required");
        setIsCreating(true);
        const quizId = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        try {
            const { error: masterError } = await supabase.from('quiz_master_structure').insert({
                quiz_id: quizId,
                title: title.trim(),
                organizer_name: organizerName,
                game_state: GameState.LOBBY,
                show_live_response_count: quizConfig.showLiveResponseCount,
                show_question_to_players: quizConfig.showQuestionToPlayers,
                clan_based: quizConfig.clanBased,
                titan_name: quizConfig.clanNames?.[Clan.TITANS],
                defender_name: quizConfig.clanNames?.[Clan.DEFENDERS],
                clan_assignment: quizConfig.clanAssignment,
                current_question_index: 0,
                is_draft: false,
                start_time: null,
                end_time: null,
                created_at: new Date().toISOString()
            });

            if (masterError) throw masterError;

            const questionRows = questions.map((q, index) => ({
                quiz_id: quizId,
                question_order: index + 1,
                question_text: q.text,
                type: q.type,
                time_limit: q.timeLimit || 30,
                technology: q.technology,
                skill: q.skill,
                option_1: q.options?.[0],
                option_2: q.options?.[1],
                option_3: q.options?.[2],
                option_4: q.options?.[3],
                correct_answer_index: q.correctAnswerIndex
            }));

            const { error: qsError } = await supabase.from('quiz_questions').insert(questionRows);
            if (qsError) throw qsError;

            navigate(`/lobby/${quizId}`);
        } catch (err) {
            console.error(err);
            alert("Failed to start live quiz");
        }
        setIsCreating(false);
    };

    const handleGenerateQuestions = async () => {
        if (!aiTopic || !aiSkill) return setAiError("Topic and skill required");
        if (aiUsage + aiNumQuestions > dailyAiLimit) return setAiError("Daily AI limit reached");
        
        setIsGenerating(true);
        setAiError(null);
        try {
            const generated = await generateQuestions(aiTopic, aiSkill, aiNumQuestions);
            setGeneratedQuestions(generated.map(q => ({ ...q, status: 'new' })));
            setAiUsage(prev => prev + generated.length);
        } catch (err: any) {
            setAiError(err.message || "AI Error");
        }
        setIsGenerating(false);
    };

    if (!organizerName) return <PageLoader message="Loading..." />;

    return (
        <div className="p-4 sm:p-8 animate-fade-in">
            <h1 className="text-4xl font-bold text-center my-8">Create a New Quiz</h1>
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <Card>
                        <label className="block text-lg font-medium text-slate-800 mb-2">Quiz Title</label>
                        <input 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            className="w-full bg-slate-100 border border-slate-300 rounded-md p-3 outline-none focus:ring-2 ring-gl-orange-500" 
                            placeholder="e.g., AWS Cloud Practitioner" 
                        />
                    </Card>
                    <Card>
                        <h2 className="text-xl font-bold mb-3 text-slate-800">Quiz Settings</h2>
                        <div className="space-y-3">
                            <label className="flex items-center justify-between">
                                <span className="text-slate-700">Live response counts</span>
                                <input type="checkbox" checked={quizConfig.showLiveResponseCount} onChange={e => setQuizConfig(p => ({ ...p, showLiveResponseCount: e.target.checked }))} />
                            </label>
                            <label className="flex items-center justify-between">
                                <span className="text-slate-700">Clan-based teams</span>
                                <input type="checkbox" checked={quizConfig.clanBased} onChange={e => setQuizConfig(p => ({ ...p, clanBased: e.target.checked }))} />
                            </label>
                        </div>
                    </Card>
                    <Card>
                        <h2 className="text-xl font-bold mb-3 text-slate-800">Selected Questions ({questions.length}/10)</h2>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {questions.map((q, i) => (
                                <div key={q.id} className="bg-slate-50 p-2 rounded flex justify-between items-center border">
                                    <p className="truncate text-sm flex-grow">{i+1}. {q.text}</p>
                                    <button onClick={() => setQuestions(questions.filter(item => item.id !== q.id))} className="text-red-500 ml-2"><DeleteIcon className="w-4 h-4"/></button>
                                </div>
                            ))}
                            {questions.length === 0 && <p className="text-slate-400 italic">No questions added yet</p>}
                        </div>
                        <Button onClick={handleStartLiveQuiz} disabled={isCreating || questions.length === 0} className="mt-4 bg-gl-orange-600">Start Quiz</Button>
                    </Card>
                </div>

                <Card className="h-[700px] flex flex-col">
                    <div className="flex border-b mb-4 overflow-x-auto shrink-0 no-scrollbar">
                         {['past', 'reports', 'library', 'custom', 'ai'].map(v => (
                             <button key={v} onClick={() => setView(v as any)} className={`py-2 px-4 font-bold capitalize whitespace-nowrap ${view === v ? 'text-gl-orange-600 border-b-2 border-gl-orange-600' : 'text-slate-400'}`}>{v}</button>
                         ))}
                    </div>
                    <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                        {view === 'library' && (
                            <div className="space-y-4">
                                <div className="flex bg-slate-100 rounded p-1 mb-4">
                                    <button onClick={() => setLibraryView('all')} className={`flex-1 py-1 text-xs font-bold rounded ${libraryView === 'all' ? 'bg-white shadow' : ''}`}>All</button>
                                    <button onClick={() => setLibraryView('mine')} className={`flex-1 py-1 text-xs font-bold rounded ${libraryView === 'mine' ? 'bg-white shadow' : ''}`}>Mine</button>
                                </div>
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input placeholder="Search questions..." value={librarySearchTerm} onChange={e => setLibrarySearchTerm(e.target.value)} className="w-full bg-slate-50 border p-2 pl-9 rounded outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <CustomSelect options={technologies} value={selectedTechnology} onChange={setSelectedTechnology} placeholder="Tech" />
                                    <CustomSelect options={skillsForFilter} value={selectedSkill} onChange={setSelectedSkill} placeholder="Skill" />
                                </div>
                                {isLoadingLibrary ? <div className="flex justify-center py-10"><LoadingSpinner /></div> : (
                                    <div className="space-y-3">
                                        {filteredQuestions.map(q => {
                                            const isSelected = !!questions.find(sq => sq.id === q.id);
                                            return (
                                                <div key={q.id} className={`p-3 border rounded transition ${isSelected ? 'bg-gl-orange-50 border-gl-orange-200' : 'hover:border-gl-orange-300'}`}>
                                                    <p className="text-sm font-bold text-slate-700">{q.text}</p>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-[10px] text-slate-400 uppercase font-bold">{q.technology} • {q.skill}</span>
                                                        <button onClick={() => handleSelectQuestion(q)} disabled={isSelected} className={`text-xs font-bold ${isSelected ? 'text-slate-300' : 'text-gl-orange-600'}`}>
                                                            {isSelected ? 'Added' : '+ Add'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                        {view === 'ai' && (
                            <div className="space-y-4">
                                <div className="bg-gl-orange-50 p-3 rounded-lg border border-gl-orange-100">
                                    <p className="text-xs text-gl-orange-800 font-bold">AI Usage: {aiUsage}/{dailyAiLimit} questions today</p>
                                </div>
                                <input placeholder="Topic (e.g., React)" value={aiTopic} onChange={e => setAiTopic(e.target.value)} className="w-full bg-slate-50 border p-2 rounded outline-none" />
                                <input placeholder="Skill/Context (e.g., Hooks)" value={aiSkill} onChange={e => setAiSkill(e.target.value)} className="w-full bg-slate-50 border p-2 rounded outline-none" />
                                <Button onClick={handleGenerateQuestions} disabled={isGenerating || aiUsage >= dailyAiLimit} className="bg-gl-orange-600">
                                    {isGenerating ? 'Generating...' : <><WandIcon /> Generate with AI</>}
                                </Button>
                                {aiError && <p className="text-red-500 text-xs text-center">{aiError}</p>}
                                <div className="space-y-3">
                                    {generatedQuestions.map((q, idx) => (
                                        <div key={idx} className="p-3 border rounded bg-white">
                                            <p className="text-sm font-bold text-slate-800">{q.text}</p>
                                            <div className="flex justify-end mt-2">
                                                <button onClick={() => handleSelectQuestion({ ...q, id: `ai-${idx}` })} className="text-xs font-bold text-gl-orange-600">+ Add to Quiz</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {view === 'past' && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-800">Completed Quizzes</h3>
                                {Object.entries(groupedPastQuizzes).map(([title, instances]) => {
                                    const instancesArray = instances as Array<any>;
                                    return (
                                        <div key={title} className="border rounded p-3 bg-slate-50">
                                            <p className="font-bold text-sm text-slate-700">{title}</p>
                                            <p className="text-xs text-slate-400">{instancesArray.length} previous game(s)</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {['reports', 'custom'].includes(view) && <div className="text-center py-20 text-slate-300">Feature migration in progress</div>}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default CreateQuizPage;
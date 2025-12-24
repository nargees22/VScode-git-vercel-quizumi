import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import { db } from '../../firebase';
// import firebase from '../../firebase';
// import { supabase } from "../services/supabase";
import { supabase } from "../service/supabase.ts";



// const getAuthUserId = async () => {
//   const { data } = await supabase.auth.getSession();
//   return data?.session?.user?.id ?? null;
// };

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

import { generateQuestions } from '../../gemini';

import type { Quiz, Player, Question, PlayerAnswer, QuizConfig, MatchPair } from '../../types';
import { GameState, QuestionType, Clan } from '../../types';

import Card from '../components/Card';
import Button from '../components/Button';
import { PageLoader } from '../components/PageLoader';
import { CustomSelect } from '../components/CustomSelect';
import { EditQuestionModal } from '../components/EditQuestionModal';
import { LoadingSpinner } from '../icons/LoadingSpinner';
import { WandIcon } from '../icons/WandIcon';
import { EditIcon } from '../icons/EditIcon';
import { DeleteIcon } from '../icons/DeleteIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { UpArrowIcon } from '../icons/UpArrowIcon';
import { DownArrowIcon } from '../icons/DownArrowIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { UsersIcon } from '../icons/UsersIcon';
const notAvailable = () => {
    alert("This feature is temporarily disabled during Supabase migration.");
};


const countWords = (str: string) => str ? str.trim().split(/\s+/).filter(Boolean).length : 0;

const CreateQuizPage = () => {
    const navigate = useNavigate();
    const organizerName = useMemo(() => sessionStorage.getItem('quiz-organizer'), []);

    const [title, setTitle] = useState('');
    const [dynamicTitle, setDynamicTitle] = useState('');
    const [questions, setQuestions] = useState<Array<Question>>([]);

    // const [view, setView] = useState<'past' | 'reports' | 'library' | 'custom' | 'ai'>('past');
    const [view, setView] = useState<('past' | 'reports' | 'library' | 'custom' | 'ai')>('past');


    const [isCreating, setIsCreating] = useState(false);

    // Library State
    const [libraryQuestions, setLibraryQuestions] = useState<Question[]>([]);
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);

    const [libraryView, setLibraryView] = useState<('all' | 'mine')>('all');


    const [technologies, setTechnologies] = useState<string[]>([]);
    const [masterSkills, setMasterSkills] = useState<string[]>([]);
    const [skillsForFilter, setSkillsForFilter] = useState<string[]>([]);
    const [selectedTechnology, setSelectedTechnology] = useState('all');
    const [selectedSkill, setSelectedSkill] = useState('all');
    const [selectedQuestionType, setSelectedQuestionType] = useState('all');
    const [editingLibraryQuestion, setEditingLibraryQuestion] = useState<Question | null>(null);
    const [librarySearchTerm, setLibrarySearchTerm] = useState('');

    // My Quizzes State
    const [draftQuizzes, setDraftQuizzes] = useState<Quiz[]>([]);
    const [pastQuizzes, setPastQuizzes] = useState<Quiz[]>([]);
    const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
    const [pastQuizzesSearchTerm, setPastQuizzesSearchTerm] = useState('');
    const [draftsSearchTerm, setDraftsSearchTerm] = useState('');
    const [reportSearchTerm, setReportSearchTerm] = useState('');
    const [expandedReportGroup, setExpandedReportGroup] = useState<string | null>(null);
    //const [expandedPastQuizGroup, setExpandedPastQuizGroup] = useState<string | null>(null);
    const [expandedPastQuizGroup, setExpandedPastQuizGroup] = useState<string | null>(null);

    const [editingDraft, setEditingDraft] = useState<Quiz | null>(null);

    // Quiz Config State
    const [quizConfig, setQuizConfig] = useState<QuizConfig>({
        showLiveResponseCount: true,
        showQuestionToPlayers: true,
        clanBased: false,
        clanNames: { [Clan.TITANS]: 'Titans', [Clan.DEFENDERS]: 'Defenders' },
        clanAssignment: 'autoBalance',
    });

    // LMS Integration State
    const [agendaInfo, setAgendaInfo] = useState<{ agendaId?: string; agendaName?: string; eventId?: string }>({});

    // Custom Question State
    const [customQuestion, setCustomQuestion] = useState<{
        text: string;
        options: string[];
        correctAnswerIndex?: number;
        matchPairs: MatchPair[];
        timeLimit: number;
        technology: string;
        skill: string;
        type: QuestionType;
    }>({
        text: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
        matchPairs: [{ prompt: '', correctMatch: '' }, { prompt: '', correctMatch: '' }],
        timeLimit: 30,
        technology: '',
        skill: '',
        type: QuestionType.MCQ,
    });
    const [isCustomQuestionValid, setIsCustomQuestionValid] = useState(false);
    const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);
    const [customFormErrors, setCustomFormErrors] = useState({ technology: '', skill: '' });

    // AI Generation State
    const [aiTopic, setAiTopic] = useState('');
    const [aiSkill, setAiSkill] = useState('');
    const [aiNumQuestions, setAiNumQuestions] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<(Omit<Question, 'id'> & { status?: 'adding' | 'added' })[]>([]);
    const [aiError, setAiError] = useState<string | null>(null);
    const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
    const [aiUsage, setAiUsage] = useState(0);
    const [isCheckingUsage, setIsCheckingUsage] = useState(true);
    const dailyAiLimit = 15;
    const [aiFormErrors, setAiFormErrors] = useState({ topic: '', skill: '' });

    const finalTitle = useMemo(() => {
        if (agendaInfo.agendaName) {
            // A dynamic part is required if an agenda is specified
            return dynamicTitle.trim() ? `${agendaInfo.agendaName} - ${dynamicTitle.trim()}` : '';
        }
        return title.trim();
    }, [agendaInfo.agendaName, dynamicTitle, title]);

    useEffect(() => {
        if (organizerName === null) {
            navigate('/');
            return;
        }

        // Use window.location.search because HashRouter's useLocation()
        // does not see query parameters before the '#' hash.
        const queryParams = new URLSearchParams(window.location.search);
        const agendaId = queryParams.get('agendaId');
        const agendaName = queryParams.get('agendaName');
        const eventId = queryParams.get('eventId');

        const newAgendaInfo: { agendaId?: string; agendaName?: string; eventId?: string } = {};
        if (agendaId) newAgendaInfo.agendaId = agendaId;
        if (agendaName) newAgendaInfo.agendaName = agendaName;
        if (eventId) newAgendaInfo.eventId = eventId;

        if (Object.keys(newAgendaInfo).length > 0) {
            setAgendaInfo(newAgendaInfo);
        }

        const fetchLibraryData = async () => {
            setIsLoadingLibrary(true);
            try {
                const { data, error } = await supabase
                    .from('question_bank_structured')
                    .select('*');

                if (error) {
                    console.error('Error fetching question library:', error);
                    setIsLoadingLibrary(false);
                    return;
                }

                const mappedQuestions: Question[] = data.map((row: any) => ({
                    //id: row.id,
                    id: row.pk_id.toString(),
                    text: row.question_text,
                    timeLimit: row.time_limit,
                    technology: row.technology,
                    skill: row.skill,
                    type: row.type,
                    organizerName: row.organizer_name,
                    options: [
                        row.option_1,
                        row.option_2,
                        row.option_3,
                        row.option_4,
                    ].filter(Boolean),
                    correctAnswerIndex: row.correct_answer_index,
                }));

                setLibraryQuestions(mappedQuestions);


                if (data.length > 0) {
                    // const techMap = new Map<string, string>();
                    // const skillMap = new Map<string, string>();

                    // data.forEach(q => {
                    //     if (q.technology?.trim()) {
                    //         techMap.set(q.technology.toLowerCase(), q.technology.trim());
                    //     }
                    //     if (q.skill?.trim()) {
                    //         skillMap.set(q.skill.toLowerCase(), q.skill.trim());
                    //     }
                    // });

                    // setTechnologies(Array.from(techMap.values()).sort());
                    // const sortedSkills = Array.from(skillMap.values()).sort();
                    // setMasterSkills(sortedSkills);
                    // setSkillsForFilter(sortedSkills);
//                     const techSet = new Set<string>();
// const skillSet = new Set<string>();

// data.forEach(q => {
//   if (q.technology?.trim()) {
//     techSet.add(q.technology.trim());
//   }
//   if (q.skill?.trim()) {
//     skillSet.add(q.skill.trim());
//   }
// });

// const sortedTechnologies = Array.from(techSet).sort();
// const sortedSkills = Array.from(skillSet).sort();

// setTechnologies(sortedTechnologies);
// setMasterSkills(sortedSkills);
// setSkillsForFilter(sortedSkills);
setLibraryQuestions(mappedQuestions);


                }

            } catch (error) {
                console.error("Error fetching question library:", error);
            }
            setIsLoadingLibrary(false);
        };

        // const fetchAiUsage = async () => {
        //     setIsCheckingUsage(true);
        //     const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        //     const usageRef = db.collection('aiUsage').doc(organizerName);
        //     try {
        //         const doc = await usageRef.get();
        //         if (doc.exists) {
        //             const data = doc.data();
        //             setAiUsage(data?.[today] || 0);
        //         } else {
        //             setAiUsage(0);
        //         }
        //     } catch (error) {
        //         console.error("Error fetching AI usage:", error);
        //     }
        //     setIsCheckingUsage(false);
        // };
            const fetchAiUsage = async () => {
  setIsCheckingUsage(true);

  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('ai_usage')
      .select('number_of_ai_questions')
      .eq('user_id', organizerName)
      .eq('date_of_usage', today)
      .maybeSingle();

    if (error) {
      console.error('AI usage fetch error:', error);
      setAiUsage(0);
    } else {
      setAiUsage(data?.number_of_ai_questions ?? 0);
    }
  } catch (err) {
    console.error('AI usage fetch exception:', err);
    setAiUsage(0);
  }

  setIsCheckingUsage(false);
};

        // const fetchQuizzes = async () => {
        //     setIsLoadingQuizzes(true);
        //     try {
        //         const snapshot = await db.collection('quizzes')
        //             .where('organizerName', '==', organizerName)
        //             .orderBy('startTime', 'desc')
        //             .limit(100)
        //             .get();
        //         const quizzesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Quiz));
        //         const drafts = quizzesData.filter(q => q.isDraft && !q.isArchived).sort((a, b) => (b.startTime?.seconds || 0) - (a.startTime?.seconds || 0));
        //         const completed = quizzesData.filter(q => !q.isDraft && !q.isArchived); // Already sorted by startTime
        //         setDraftQuizzes(drafts);
        //         setPastQuizzes(completed);
        //     } catch (error) {
        //         console.error("Error fetching quizzes:", error);
        //     }
        //     setIsLoadingQuizzes(false);
        // };
        const fetchQuizzes = async () => {
  setIsLoadingQuizzes(true);

  try {
    const { data, error } = await supabase
    .from('quiz_master_structure')
     .select(`
  id:quiz_id,
  title,
  game_state,
  is_draft,
  created_at
`)

      .eq('organizer_name', organizerName)
      .eq('is_draft', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quizzes:', error);
      setPastQuizzes([]);
      return;
    }

    // ✅ Only COMPLETED quizzes
    const completed = data.filter(
  q => q.game_state === 'FINISHED'
);

    setPastQuizzes(
    completed.map(item => ({
        id: item.id,
        title: item.title,
        gameState: item.game_state,
        isDraft: item.is_draft,
        createdAt: item.created_at,
        questions: [], // Provide default values for missing properties
        currentQuestionIndex: 0,
        questionStartTime: null,
        players: [],
        clans: [],
    })) as Quiz[]
);

  } catch (err) {
    console.error('Quiz fetch failed:', err);
    setPastQuizzes([]);
  } finally {
    setIsLoadingQuizzes(false);
  }
};

        fetchLibraryData();
        fetchAiUsage();
         fetchQuizzes();
      //  setIsLoadingQuizzes(false);
    }, [organizerName, navigate]);

    useEffect(() => {
        if (selectedTechnology === 'all') {
            setSkillsForFilter(masterSkills);
        } else {
            const skillsForTech = libraryQuestions
                .filter(q => q.technology === selectedTechnology)
                .map(q => q.skill);
            setSkillsForFilter(Array.from(new Set(skillsForTech)));
        }
        setSelectedSkill('all');
    }, [selectedTechnology, libraryQuestions, masterSkills]);
useEffect(() => {
  const techSet = new Set<string>();

  libraryQuestions.forEach(q => {
    if (q.technology && q.technology.trim()) {
      techSet.add(q.technology.trim());
    }
  });

  setTechnologies(Array.from(techSet).sort());
}, [libraryQuestions]);

    const filteredQuestions = useMemo(() => {
        const sourceQuestions = libraryView === 'mine'
            ? libraryQuestions.filter(q => q.organizerName === organizerName)
            : libraryQuestions;

        const searchedQuestions = sourceQuestions.filter(q => {
            if (!librarySearchTerm.trim()) return true;
            const searchTermLower = librarySearchTerm.toLowerCase();
            return (
                q.text.toLowerCase().includes(searchTermLower) ||
                q.technology.toLowerCase().includes(searchTermLower) ||
                q.skill.toLowerCase().includes(searchTermLower)
            );
        });

        return searchedQuestions.filter(q =>
            (selectedQuestionType === 'all' || q.type === selectedQuestionType) &&
            (selectedTechnology === 'all' || q.technology === selectedTechnology) &&
            (selectedSkill === 'all' || q.skill === selectedSkill)
        );
    }, [libraryQuestions, selectedTechnology, selectedSkill, selectedQuestionType, libraryView, organizerName, librarySearchTerm]);

    const filteredPastQuizzes = useMemo<Quiz[]>(() => {
        if (!pastQuizzesSearchTerm.trim()) return pastQuizzes;
        const searchTermLower = pastQuizzesSearchTerm.toLowerCase();

        return pastQuizzes.filter(quiz =>
            quiz.title.toLowerCase().includes(searchTermLower)
        );
    }, [pastQuizzes, pastQuizzesSearchTerm]);

    const filteredDrafts = useMemo<Quiz[]>(() => {
        if (!draftsSearchTerm.trim()) return draftQuizzes;
        const searchTermLower = draftsSearchTerm.toLowerCase();
        return draftQuizzes.filter(quiz => quiz.title.toLowerCase().includes(searchTermLower));
    }, [draftQuizzes, draftsSearchTerm]);

    const groupedPastQuizzes = useMemo(() => {
        if (!filteredPastQuizzes) return {};

        const groups: { [title: string]: Quiz[] } = {};

        filteredPastQuizzes.forEach(quiz => {
            if (!groups[quiz.title]) {
                groups[quiz.title] = [];
            }
            groups[quiz.title].push(quiz);
        });

        return groups;
    }, [filteredPastQuizzes]);

    const filteredReports = useMemo<Quiz[]>(() => {
        if (!reportSearchTerm.trim()) return pastQuizzes;
        const searchTermLower = reportSearchTerm.toLowerCase();

        return pastQuizzes.filter(quiz =>
            quiz.title.toLowerCase().includes(searchTermLower)
        );
    }, [pastQuizzes, reportSearchTerm]);

    const groupedReports = useMemo(() => {
        if (!filteredReports) return {};

        const groups: { [title: string]: Quiz[] } = {};

        filteredReports.forEach(quiz => {
            if (!groups[quiz.title]) {
                groups[quiz.title] = [];
            }
            groups[quiz.title].push(quiz);
        });

        // Quizzes are already sorted by date descending from Firestore query

        return groups;
    }, [filteredReports]);

    // Validation for custom question form
    useEffect(() => {
        let isValid = true;

        if (!customQuestion.text.trim()) isValid = false;
        if (!customQuestion.technology.trim()) isValid = false;
        if (!customQuestion.skill.trim()) isValid = false;

        if (customQuestion.type === QuestionType.MCQ || customQuestion.type === QuestionType.SURVEY) {
            if (customQuestion.options.some(opt => !opt.trim())) isValid = false;
        }

        if (customQuestion.type === QuestionType.MATCH) {
            if (customQuestion.matchPairs.some(p => !p.prompt.trim() || !p.correctMatch.trim())) isValid = false;
        }

        setIsCustomQuestionValid(isValid);
    }, [customQuestion]);


    const handleSelectQuestion = (q: Question) => {
        if (questions.length < 10 && !questions.find(sq => sq.id === q.id)) {
            setQuestions([...questions, q]);
        }
    };

    const handleRemoveQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === questions.length - 1) return;

        const newQuestions = [...questions];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap elements
        [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];

        setQuestions(newQuestions);
    };

    // Fix: Corrected type comparison error by replacing GameState.QUESTION_INTRO with QuestionType.SURVEY
    const handleQuestionTypeChange = (newType: QuestionType) => {
        const baseState: typeof customQuestion = {
            ...customQuestion,
            type: newType,
            text: "",
            options: [],
            correctAnswerIndex: undefined,
            matchPairs: [],
        };

        if (newType === QuestionType.MCQ) {
            baseState.options = ['', '', '', ''];
            baseState.correctAnswerIndex = 0;
        } else if (newType === QuestionType.SURVEY) {
            baseState.options = ['', ''];
        } else if (newType === QuestionType.MATCH) {
            baseState.matchPairs = [{ prompt: '', correctMatch: '' }, { prompt: '', correctMatch: '' }];
        }
        setCustomQuestion(baseState);
    };

    // Handlers for Survey option changes
    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...customQuestion.options];
        newOptions[index] = value;
        setCustomQuestion(p => ({ ...p, options: newOptions }));
    };
    const handleAddOption = () => {
        if (customQuestion.options.length < 6) {
            setCustomQuestion(p => ({ ...p, options: [...p.options, ''] }));
        }
    };
    const handleRemoveOption = (index: number) => {
        if (customQuestion.options.length > 2) {
            setCustomQuestion(p => ({ ...p, options: p.options.filter((_, i) => i !== index) }));
        }
    };

    // Handlers for Match pair changes
    const handleMatchPairChange = (index: number, field: 'prompt' | 'correctMatch', value: string) => {
        const newPairs = [...customQuestion.matchPairs];
        newPairs[index] = { ...newPairs[index], [field]: value };
        setCustomQuestion(p => ({ ...p, matchPairs: newPairs }));
    };
    const handleAddPair = () => {
        if (customQuestion.matchPairs.length < 6) {
            setCustomQuestion(p => ({ ...p, matchPairs: [...p.matchPairs, { prompt: '', correctMatch: '' }] }));
        }
    };
    const handleRemovePair = (index: number) => {
        if (customQuestion.matchPairs.length > 2) {
            setCustomQuestion(p => ({ ...p, matchPairs: p.matchPairs.filter((_, i) => i !== index) }));
        }
    };


    const handleAddToLibrary = async () => {
  if (!isCustomQuestionValid || !organizerName) {
    alert('Please fill all required fields.');
    return;
  }

  setIsAddingToLibrary(true);

  try {
    const payload = {
       // id: crypto.randomUUID(),
      question_text: customQuestion.text,
      time_limit: customQuestion.timeLimit ?? 30,
      technology: customQuestion.technology,
      skill: customQuestion.skill,
      type: customQuestion.type,
      organizer_name: organizerName,

      option_1: customQuestion.options?.[0] ?? null,
      option_2: customQuestion.options?.[1] ?? null,
      option_3: customQuestion.options?.[2] ?? null,
      option_4: customQuestion.options?.[3] ?? null,

      correct_answer_index:
        customQuestion.type === QuestionType.MCQ
          ? customQuestion.correctAnswerIndex
          : null,

      creation_time: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('question_bank_structured')
      .insert(payload)        // ✅ NOT ARRAY
      .select()
      .single();

    if (error) throw error;

    const newQuestion: Question = {
      id: data.pk_id.toString(),
      text: data.question_text,
      timeLimit: data.time_limit,
      technology: data.technology,
      skill: data.skill,
      type: data.type,
      organizerName: data.organizer_name,
      options: [
        data.option_1,
        data.option_2,
        data.option_3,
        data.option_4,
      ].filter(Boolean),
      correctAnswerIndex: data.correct_answer_index,
    };

    setLibraryQuestions(prev => [...prev, newQuestion]);

    alert('Question added successfully!');
    setCustomQuestion(EMPTY_CUSTOM_QUESTION);
setCustomFormErrors({ technology: '', skill: '' });
setIsCustomQuestionValid(false);
    setView('library');
  } catch (err) {
    console.error('Insert failed:', err);
    alert('Failed to add question');
  } finally {
    setIsAddingToLibrary(false);
  }
};

    const handleSaveDraft = async () => {
        if (!finalTitle || questions.length < 1) {
            alert("A title and at least one question are required to save a draft.");
            return;
        }
        setIsCreating(true);
        const quizId = Math.random().toString(36).substring(2, 8).toUpperCase();

        try {
            // 1. Insert into quiz_master_structure
            const { error: masterError } = await supabase.from('quiz_master_structure').insert({
                quiz_id: quizId,
                title: finalTitle,
                organizer_name: organizerName!,
                game_state: GameState.LOBBY,
                show_live_response_count: quizConfig.showLiveResponseCount,
                show_question_to_players: quizConfig.showQuestionToPlayers,
                clan_based: quizConfig.clanBased,
                titan_name: quizConfig.clanNames?.[Clan.TITANS] ?? null,
                defender_name: quizConfig.clanNames?.[Clan.DEFENDERS] ?? null,
                clan_assignment: quizConfig.clanAssignment,
                current_question_index: 0,
                is_draft: true
            });

            if (masterError) throw masterError;

            // 2. Insert into quiz_questions using individual columns
            // Fix: Change q.time_limit to q.timeLimit to match Question interface definition.
            const questionRows = questions.map((q, index) => ({
  quiz_id: quizId,
  question_order: index + 1,
  question_text: q.text,

  // ✅ force safe values
  type: q.type ?? QuestionType.MCQ,
  time_limit: q.timeLimit ?? 30,
  technology: q.technology?.trim() || 'General',
  skill: q.skill?.trim() || 'General',

  option_1: q.options?.[0] ?? null,
  option_2: q.options?.[1] ?? null,
  option_3: q.options?.[2] ?? null,
  option_4: q.options?.[3] ?? null,

  correct_answer_index:
    q.type === QuestionType.MCQ
      ? q.correctAnswerIndex ?? 0
      : null,
}));


            const { error: questionsError } = await supabase
                .from('quiz_questions')
                .insert(questionRows);

            if (questionsError) throw questionsError;

            alert("Draft saved successfully!");
            setTitle('');
            setDynamicTitle('');
            setQuestions([]);
        } catch (error: any) {
            console.error("Error saving draft:", error);
            alert("Could not save draft: " + error.message);
        }
        setIsCreating(false);
    };

    const handleStartLiveQuiz = async () => {
        localStorage.setItem('quiz_role', 'host');

  if (!finalTitle || questions.length < 1 || questions.length > 10) {
    alert("A title and between 1 to 10 questions are required.");
    return;
  }

  setIsCreating(true);

  const quizId = Math.random().toString(36).substring(2, 8).toUpperCase();

  const quizPayload = {
    quiz_id: quizId,
    title: finalTitle,
    organizer_name: organizerName!,
    game_state: GameState.LOBBY,
    //game_state: GameState.QUESTION_ACTIVE,
  current_question_index: 0,
  show_question_to_players: false,
    is_draft: false,

    show_live_response_count: quizConfig.showLiveResponseCount,
   // show_question_to_players: quizConfig.showQuestionToPlayers,
    clan_based: quizConfig.clanBased,
    titan_name: quizConfig.clanNames?.[Clan.TITANS] ?? null,
    defender_name: quizConfig.clanNames?.[Clan.DEFENDERS] ?? null,
    clan_assignment: quizConfig.clanAssignment,

  
  };

  // 1️⃣ Insert quiz into quiz_master_structure
  const { error: quizError } = await supabase
    .from('quiz_master_structure')
    .insert([quizPayload]);

  if (quizError) {
    console.error("Quiz insert failed:", quizError);
    alert("Failed to create quiz header");
    setIsCreating(false);
    return;
  }

  // 2️⃣ Insert questions into quiz_questions using individual columns
  const questionRows = questions.map((q, index) => ({
  quiz_id: quizId,
  question_order: index + 1,
  question_text: q.text,

  // ✅ force safe values
  type: q.type ?? QuestionType.MCQ,
  time_limit: q.timeLimit ?? 30,
  technology: q.technology?.trim() || 'General',
  skill: q.skill?.trim() || 'General',

  option_1: q.options?.[0] ?? null,
  option_2: q.options?.[1] ?? null,
  option_3: q.options?.[2] ?? null,
  option_4: q.options?.[3] ?? null,

  correct_answer_index:
    q.type === QuestionType.MCQ
      ? q.correctAnswerIndex ?? 0
      : null,
}));

  const { error: questionError } = await supabase
    .from('quiz_questions')
    .insert(questionRows);

  if (questionError) {
    console.error('Question insert failed:', questionError);
    alert('Failed to save quiz questions');
    setIsCreating(false);
    return;
  }

// //   // 3️⃣ Navigation is SAFE
// //   //navigate(`/lobby/${quizId}`);
// navigate(`/#/lobby/${quizId}`);
// //   //navigate(`/lobby/${quizId}`, { replace: true });
// //   navigate(`/#/lobby/${quizId}`);
// //navigate(`/lobby/${quizId}`);


navigate(`/lobby/${quizId}`);
//navigate(`/quiz/host/${quizId}`);




};


    const handleReuseQuiz = async (quizToReuse: Quiz) => {
  try {
    // 1️⃣ Fetch questions for this quiz
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizToReuse.id)
      .order('question_order');

    if (error) throw error;

    // 2️⃣ Map DB → Question interface
    const mappedQuestions: Question[] = data.map((row: any) => ({
      id: row.pk_id.toString(),
      text: row.question_text,
      timeLimit: row.time_limit,
      technology: row.technology,
      skill: row.skill,
      type: row.type,
      options: [
        row.option_1,
        row.option_2,
        row.option_3,
        row.option_4,
      ].filter(Boolean),
      correctAnswerIndex: row.correct_answer_index,
    }));

    // 3️⃣ Handle title (agenda-safe)
    if (agendaInfo.agendaName) {
      const prefix = `${agendaInfo.agendaName} - `;
      if (quizToReuse.title.startsWith(prefix)) {
        setDynamicTitle(quizToReuse.title.substring(prefix.length));
      } else {
        setDynamicTitle(quizToReuse.title);
      }
    } else {
      setTitle(quizToReuse.title);
    }

    // 4️⃣ 🔥 ADD QUESTIONS TO "Your Questions"
    setQuestions(mappedQuestions);

    // 5️⃣ Stay on Create Quiz screen
    setView('past'); // optional: change to 'past' if you want
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    console.error('Reuse failed:', err);
    alert('Failed to reuse quiz');
  }
};


    // const handleArchiveQuiz = async (quizId: string) => {
    //     if (window.confirm('Are you sure you want to archive this quiz? It will be hidden from this list but its data will be preserved for analytics.')) {
    //         try {
    //             await db.collection('quizzes').doc(quizId).update({ isArchived: true });
    //             setPastQuizzes(prev => prev.filter(q => q.id !== quizId));
    //         } catch (error) {
    //             console.error("Error archiving quiz:", error);
    //             alert('Failed to archive quiz.');
    //         }
    //     }
    // };

    // const handleDeleteDraft = async (quizId: string) => {
    //     if (window.confirm("Are you sure you want to permanently delete this draft?")) {
    //         try {
    //             await db.collection('quizzes').doc(quizId).delete();
    //             setDraftQuizzes(prev => prev.filter(q => q.id !== quizId));
    //         } catch (error) {
    //             console.error("Error deleting draft:", error);
    //             alert("Failed to delete draft.");
    //         }
    //     }
    // };

    // const handleEditDraft = (quizToEdit: Quiz) => {
    //     setEditingDraft(quizToEdit);

    //     if (quizToEdit.agendaName) {
    //         const prefix = `${quizToEdit.agendaName} - `;
    //         if (quizToEdit.title.startsWith(prefix)) {
    //             setDynamicTitle(quizToEdit.title.substring(prefix.length));
    //         } else {
    //             setDynamicTitle(quizToEdit.title);
    //         }
    //     } else {
    //         setTitle(quizToEdit.title);
    //     }
    //     setQuestions(quizToEdit.questions);
    //     setQuizConfig(quizToEdit.config);

    //     window.scrollTo({ top: 0, behavior: 'smooth' });
    // };

    // const handleCancelEdit = () => {
    //     setEditingDraft(null);
    //     setTitle('');
    //     setDynamicTitle('');
    //     setQuestions([]);
    //     setQuizConfig({
    //         showLiveResponseCount: true,
    //         showQuestionToPlayers: true,
    //         clanBased: false,
    //         clanNames: { [Clan.TITANS]: 'Titans', [Clan.DEFENDERS]: 'Defenders' },
    //         clanAssignment: 'autoBalance',
    //     });
    // };

    // const handleUpdateDraft = async () => {
    //     if (!editingDraft) return;
    //     if (!finalTitle || questions.length < 1) {
    //         alert("A title and at least one question are required to update the draft.");
    //         return;
    //     }
    //     setIsCreating(true);

    //     const questionsForQuiz = questions.map(q => {
    //         const { creationTime, ...rest } = q;
    //         return rest;
    //     });

    //     const updatedQuizData = {
    //         title: finalTitle,
    //         questions: questionsForQuiz,
    //         config: quizConfig,
    //         startTime: firebase.firestore.FieldValue.serverTimestamp(), // Acts as "last modified"
    //     };

    //     try {
    //         await db.collection('quizzes').doc(editingDraft.id).update(updatedQuizData);
    //         alert("Draft updated successfully!");

    //         setDraftQuizzes(prev =>
    //             prev.map(q =>
    //                 q.id === editingDraft.id ? { ...q, ...updatedQuizData } : q
    //             )
    //         );
    //         handleCancelEdit();
    //     } catch (error) {
    //         console.error("Error updating draft:", error);
    //         alert("Could not update draft. Please try again.");
    //     }
    //     setIsCreating(false);
    // };

    // const handleGenerateQuestions = async () => {
    //     if (!aiTopic || !aiSkill) {
    //         setAiError("Please provide a topic and a skill level.");
    //         return;
    //     }
    //     if (aiUsage + aiNumQuestions > dailyAiLimit) {
    //         setAiError(`This would exceed your daily limit of ${dailyAiLimit} questions.`);
    //         return;
    //     }
    //     setIsGenerating(true);
    //     setAiError(null);
    //     setGeneratedQuestions([]);
    //     setEditingQuestionIndex(null);

    //     try {
    //         const questions: Omit<Question, 'id'>[] = await generateQuestions(aiTopic, aiSkill, aiNumQuestions);

    //         const originalCount = questions.length;
    //         const validQuestions = questions.filter(q =>
    //             countWords(q.text) <= 20 &&
    //             q.options.every(opt => countWords(opt) <= 10)
    //         );

    //         if (validQuestions.length < originalCount) {
    //             setAiError(`AI generated ${originalCount} questions, but ${originalCount - validQuestions.length} were filtered out for exceeding word limits. Please review the generated questions.`);
    //         }

    //         setGeneratedQuestions(validQuestions.map(q => ({ ...q, status: undefined })));

    //         // Update usage in Firestore
    //         const today = new Date().toISOString().split('T')[0];
    //         const usageRef = db.collection('aiUsage').doc(organizerName!);
    //         await db.runTransaction(async (transaction) => {
    //             const doc = await transaction.get(usageRef);
    //             const updateData = { [today]: firebase.firestore.FieldValue.increment(validQuestions.length) };
    //             if (!doc.exists) {
    //                 transaction.set(usageRef, { [today]: validQuestions.length });
    //             } else {
    //                 transaction.update(usageRef, updateData);
    //             }
    //         });
    //         setAiUsage(prev => prev + validQuestions.length);

    //     } catch (error: any) {
    //         setAiError(error.message || "An unknown error occurred while generating questions.");
    //     }
    //     setIsGenerating(false);
    // };
//        const handleGenerateQuestions = async () => {

//     if (!organizerName) {
//         alert('Organizer session expired. Please login again.');
//         navigate('/');
//         return;
//     }

//     if (!aiTopic || !aiSkill) {
//         setAiError("Please provide a topic and a skill level.");
//         return;
//     }

//     if (aiUsage + aiNumQuestions > dailyAiLimit) {
//         setAiError(`Daily limit exceeded (${dailyAiLimit} questions per day).`);
//         return;
//     }

//     setIsGenerating(true);
//     setAiError(null);

//     try {
//         const questions = await generateQuestions(
//             aiTopic,
//             aiSkill,
//             aiNumQuestions
//         );

//         const validQuestions = questions.filter(q =>
//             countWords(q.text) <= 20 &&
//             q.options.every(opt => countWords(opt) <= 10)
//         );

//         setGeneratedQuestions(
//             validQuestions.map(q => ({ ...q, status: undefined }))
//         );

//         const today = new Date().toISOString().split('T')[0];

//         const { error } = await supabase
//             .from('ai_usage')
//             .upsert(
//                 {
//                     user_id: organizerName,
//                     date_of_usage: today,
//                     number_of_ai_questions: aiUsage + validQuestions.length,
//                 },
//                 { onConflict: 'user_id,date_of_usage' }
//             );

//         if (error) {
//             console.error('AI usage update failed:', error);
//         } else {
//             setAiUsage(prev => prev + validQuestions.length);
//         }

//     } catch (err: any) {
//         console.error('AI generation failed:', err);
//         setAiError(err?.message || 'AI generation failed');
//     }

//     setIsGenerating(false);
// };

const handleGenerateQuestions = async () => {
  if (!organizerName) {
    alert('Session expired. Please login again.');
    navigate('/');
    return;
  }

  if (!aiTopic || !aiSkill) {
    setAiError('Please provide a topic and a skill level.');
    return;
  }

  if (aiUsage + aiNumQuestions > dailyAiLimit) {
    setAiError(`Daily limit exceeded (${dailyAiLimit} questions/day).`);
    return;
  }

  setIsGenerating(true);
  setAiError(null);

  try {
    // 1️⃣ Generate questions
    const questions = await generateQuestions(aiTopic, aiSkill, aiNumQuestions);

    const validQuestions = questions.filter(q =>
      q &&
      typeof q.text === 'string' &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      countWords(q.text) <= 20 &&
      q.options.every(opt => countWords(opt) <= 10)
    );

    setGeneratedQuestions(
      validQuestions.map(q => ({ ...q, status: undefined }))
    );

    // 2️⃣ Atomic UPSERT (NO SELECT NEEDED)
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('ai_usage')
      .upsert(
        {
          user_id: organizerName,
          date_of_usage: today,
          number_of_ai_questions: aiUsage + validQuestions.length,
        },
        { onConflict: 'user_id,date_of_usage' }
      );

    if (error) {
      console.error('AI usage update failed:', error);
    } else {
      setAiUsage(prev => prev + validQuestions.length);
    }

  } catch (err: any) {
    console.error('AI generation failed:', err);
    setAiError(err?.message || 'AI generation failed');
  }

  setIsGenerating(false);
};
// const handleAddFromGenerator = async (q, index) => {
//   setGeneratedQuestions(prev =>
//     prev.map((item, i) =>
//       i === index ? { ...item, status: 'adding' } : item
//     )
//   );

//   try {
//     // const userId = await getAuthUserId();
//     // if (!userId) {
//     //   alert('Session expired. Please login again.');
//     //   return;
//     // }
// if (!organizerName) {
//   alert('Organizer missing');
//   return;
// }

// //organizer_name: organizerName,

//     const payload = {
      
//   question_text: customQuestion.text,
//   time_limit: customQuestion.timeLimit ?? 30,
//   technology: customQuestion.technology,
//   skill: customQuestion.skill,
//   type: customQuestion.type,
//   organizer_name: organizerName,

//   option_1: customQuestion.options?.[0] ?? null,
//   option_2: customQuestion.options?.[1] ?? null,
//   option_3: customQuestion.options?.[2] ?? null,
//   option_4: customQuestion.options?.[3] ?? null,

//   correct_answer_index:
//     customQuestion.type === QuestionType.MCQ
//       ? customQuestion.correctAnswerIndex
//       : null,

//   creation_time: new Date().toISOString(),
// };

    

//     const { data, error } = await supabase
//       .from('question_bank_structured')
//       .insert(payload)
//       .select()
//       .single();

//     if (error) throw error;

//     setLibraryQuestions(prev => [
//       ...prev,
//       {
//         id: data.pk_id.toString(),
//         text: data.question_text,
//         timeLimit: data.time_limit,
//         technology: data.technology,
//         skill: data.skill,
//         type: data.type,
//         organizerName: data.organizer_name,
//         options: [
//           data.option_1,
//           data.option_2,
//           data.option_3,
//           data.option_4,
//         ].filter(Boolean),
//         correctAnswerIndex: data.correct_answer_index,
//       },
//     ]);

//     setGeneratedQuestions(prev =>
//       prev.map((item, i) =>
//         i === index ? { ...item, status: 'added' } : item
//       )
//     );
//   } catch (err) {
//     console.error('❌ AI insert failed:', err);
//     alert('Failed to add AI question to library');

//     setGeneratedQuestions(prev =>
//       prev.map((item, i) =>
//         i === index ? { ...item, status: undefined } : item
//       )
//     );
//   }
// };

const handleAddFromGenerator = async (q, index) => {
  // UI: show "adding..."
  setGeneratedQuestions(prev =>
    prev.map((item, i) =>
      i === index ? { ...item, status: 'adding' } : item
    )
  );

  try {
    if (!organizerName) {
      alert('Session expired');
      return;
    }

    // ✅ IMPORTANT: map AI question properly
    const payload = {
      question_text: q.text,                 // ✅ AI text
      time_limit: 30,                        // ✅ hardcode (AI has no time)
    //  technology: q.technology ?? null,      // ✅ AI tech
    technology: aiTopic.trim(),   // ✅ FIX
  skill: aiSkill.trim(),   
    //   skill: q.skill ?? null,                // ✅ AI skill
      type: 'MCQ',                           // ✅ AI is MCQ
      organizer_name: organizerName,

      option_1: q.options?.[0] ?? null,
      option_2: q.options?.[1] ?? null,
      option_3: q.options?.[2] ?? null,
      option_4: q.options?.[3] ?? null,

      correct_answer_index: 0,               // ✅ safe default
      creation_time: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('question_bank_structured')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    // 🔥 ADD THIS BLOCK HERE
setLibraryQuestions(prev => [
  ...prev,
  {
    id: data.pk_id.toString(),
    text: data.question_text,
    timeLimit: data.time_limit,
    technology: data.technology,
    skill: data.skill,
    type: data.type,
    organizerName: data.organizer_name,
    options: [
      data.option_1,
      data.option_2,
      data.option_3,
      data.option_4,
    ].filter(Boolean),
    correctAnswerIndex: data.correct_answer_index,
  },
]);
setTechnologies(prev => {
  const tech = data.technology?.trim();
  if (!tech || prev.includes(tech)) return prev;
  return [...prev, tech].sort();
});

    // UI: mark as added
    setGeneratedQuestions(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, status: 'added' } : item
      )
    );

  } catch (err) {
    console.error('❌ AI insert failed:', err);
    alert('Failed to add AI question');

    setGeneratedQuestions(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, status: undefined } : item
      )
    );
  }
};


    // const handleAddFromGenerator = async (questionDataToAdd: Omit<Question, 'id'> & { status?: 'adding' | 'added' }, index: number) => {
    //     setGeneratedQuestions(prev =>
    //         prev.map((q, i) => (i === index ? { ...q, status: 'adding' } : q))
    //     );

    //     try {
    //         const { status, ...questionCoreData } = questionDataToAdd; // Fix: destructure to remove UI-only status field

    //         const questionData = {
    //             ...questionCoreData,
    //             organizerName,
    //             creationTime: firebase.firestore.FieldValue.serverTimestamp()
    //         };

    //         const docRef = await db.collection('questionBank').add(questionData);

    //         const newLibraryQuestion = { ...questionData, id: docRef.id } as Question;
    //         setLibraryQuestions(prev => [...prev, newLibraryQuestion]);

    //         if (!technologies.includes(questionCoreData.technology)) setTechnologies(prev => [...prev, questionCoreData.technology]);
    //         if (!masterSkills.includes(questionCoreData.skill)) setMasterSkills(prev => [...prev, questionCoreData.skill]);

    //         setGeneratedQuestions(prev =>
    //             prev.map((q, i) => (i === index ? { ...q, status: 'added' } : q))
    //         );
    //     } catch (error) {
    //         console.error("Error adding generated question:", error);
    //         alert("Failed to add question to library.");
    //         setGeneratedQuestions(prev =>
    //             prev.map((q, i) => {
    //                 if (i === index) {
    //                     const { status, ...rest } = q;
    //                     return rest;
    //                 }
    //                 return q;
    //             })
    //         );
    //     }
    // };


    

    // const handleSaveFromGenerator = (editedData: Omit<Question, 'id'>, index: number) => {
    //     const newGeneratedQuestions = [...generatedQuestions];
    //     newGeneratedQuestions[index] = { ...editedData, status: newGeneratedQuestions[index].status };
    //     setGeneratedQuestions(newGeneratedQuestions);
    //     setEditingQuestionIndex(null); // Close the modal
    // };

    // const handleUpdateLibraryQuestion = async (updatedData: Omit<Question, 'id'>) => {
    //     if (!editingLibraryQuestion) return;

    //     const questionToUpdate: Question = { ...editingLibraryQuestion, ...updatedData };

    //     if (questionToUpdate.type === QuestionType.SURVEY) {
    //         delete questionToUpdate.correctAnswerIndex;
    //     } else if (questionToUpdate.type === QuestionType.MATCH) {
    //         questionToUpdate.options = (questionToUpdate.matchPairs || []).map(p => p.correctMatch);
    //     } else if (questionToUpdate.type === QuestionType.WORD_CLOUD) {
    //         // In edit mode, options are not regenerated. Assume they are stored correctly.
    //     }

    //     try {
    //         const docRef = db.collection('questionBank').doc(questionToUpdate.id);
    //         const { id, ...dataToSave } = questionToUpdate;
    //         await docRef.update(dataToSave);

    //         setLibraryQuestions(prev => prev.map(q => q.id === id ? questionToUpdate : q));
    //         setEditingLibraryQuestion(null);
    //     } catch (error) {
    //         console.error("Error updating question:", error);
    //         alert('Failed to update question.');
    //     }
    // };
    const handleUpdateLibraryQuestion = async (
        questionId: string,
        updatedData: Partial<Question>
    ) => {
        try {
            const { error } = await supabase
                .from('question_bank_structured')
                .update({
                    question_text: updatedData.text,
                    time_limit: updatedData.timeLimit,
                    technology: updatedData.technology,
                    skill: updatedData.skill,
                    type: updatedData.type,

                    option_1: updatedData.options?.[0] ?? null,
                    option_2: updatedData.options?.[1] ?? null,
                    option_3: updatedData.options?.[2] ?? null,
                    option_4: updatedData.options?.[3] ?? null,

                    correct_answer_index: updatedData.correctAnswerIndex ?? null,
                })
                .eq('pk_id', Number(questionId));

            if (error) throw error;

            // Update UI state
            setLibraryQuestions(prev =>
                prev.map(q =>
                    q.id === questionId ? { ...q, ...updatedData } : q
                )
            );

            alert('Question updated successfully');
            setEditingLibraryQuestion(null);
        } catch (err) {
            console.error('Update failed:', err);
            alert('Failed to update question');
        }
    };


    // const handleDeleteLibraryQuestion = async (questionId: string) => {
    //     if (window.confirm('Are you sure you want to delete this question forever?')) {
    //         try {
    //             await db.collection('questionBank').doc(questionId).delete();
    //             setLibraryQuestions(prev => prev.filter(q => q.id !== questionId));
    //             setQuestions(prev => prev.filter(q => q.id !== questionId));
    //         } catch (error) {
    //             console.error("Error deleting question:", error);
    //             alert('Failed to delete question.');
    //         }
    //     }
    // };

    const handleDeleteLibraryQuestion = async (questionId: string) => {
        if (!window.confirm('Are you sure you want to delete this question?')) return;

        try {
            const { error } = await supabase
                .from('question_bank_structured')
                .delete()
                .eq('pk_id', Number(questionId));

            if (error) throw error;

            // Remove from UI
            setLibraryQuestions(prev =>
                prev.filter(q => q.id !== questionId)
            );

            // Also remove from selected quiz questions if present
            setQuestions(prev =>
                prev.filter(q => q.id !== questionId)
            );

            alert('Question deleted successfully');
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete question');
        }
    };



    const numOptions = useMemo(() => ['3', '5', '10'], []);

    if (!organizerName) {
        return <PageLoader message="Verifying organizer access..." />;
    }

    return (
        <div className="p-4 sm:p-8 animate-fade-in">
            <h1 className="text-4xl font-bold text-center my-8">{editingDraft ? `Editing: ${editingDraft.title}` : 'Create a New Quiz'}</h1>
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

                <div className="space-y-6">
                    <Card>
                        <label htmlFor={agendaInfo.agendaName ? "dynamic-title" : "title"} className="block text-lg font-medium text-slate-800 mb-2">Quiz Title</label>
                        {agendaInfo.agendaName ? (
                            <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 rounded-md p-3 focus-within:ring-2 focus-within:ring-gl-orange-500 transition-shadow">
                                <span className="font-semibold text-slate-600 flex-shrink-0 whitespace-nowrap">{agendaInfo.agendaName} -</span>
                                <input
                                    id="dynamic-title"
                                    type="text"
                                    value={dynamicTitle}
                                    onChange={(e) => setDynamicTitle(e.target.value)}
                                    className="w-full bg-transparent focus:outline-none placeholder-slate-400"
                                    placeholder="Add a unique identifier (e.g., Round 1)"
                                    aria-label="Dynamic quiz title"
                                />
                            </div>
                        ) : (
                            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-slate-100 border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none"
                                placeholder="e.g., AWS Cloud Practitioner"
                                aria-label="Quiz title"
                            />
                        )}
                    </Card>
                    <Card>
                        <h2 className="text-xl font-bold mb-3 text-slate-800">Quiz Settings</h2>
                        <div className="space-y-3">
                            <label className="flex items-center justify-between">
                                <span className="text-slate-700">Show live response counts on host screen</span>
                                <input type="checkbox" className="toggle-checkbox" checked={quizConfig.showLiveResponseCount} onChange={e => setQuizConfig(p => ({ ...p, showLiveResponseCount: e.target.checked }))} />
                            </label>
                            <label className="flex items-center justify-between">
                                <span className="text-slate-700">Show question text on player screens</span>
                                <input type="checkbox" className="toggle-checkbox" checked={quizConfig.showQuestionToPlayers} onChange={e => setQuizConfig(p => ({ ...p, showQuestionToPlayers: e.target.checked }))} />
                            </label>
                            <label className="flex items-center justify-between">
                                <span className="text-slate-700">Enable Clan-based teams</span>
                                <input type="checkbox" className="toggle-checkbox" checked={quizConfig.clanBased} onChange={e => setQuizConfig(p => ({ ...p, clanBased: e.target.checked }))} />
                            </label>

                            {quizConfig.clanBased && (
                                <div className="space-y-3 mt-3 p-4 bg-slate-50 rounded-lg border animate-fade-in">
                                    <h3 className="font-semibold text-slate-800">Clan Settings</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Clan 1 Name</label>
                                            <input type="text" value={quizConfig.clanNames?.[Clan.TITANS]} onChange={e => setQuizConfig(p => ({ ...p, clanNames: { ...p.clanNames, [Clan.TITANS]: e.target.value } }))} className="w-full bg-white border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Clan 2 Name</label>
                                            <input type="text" value={quizConfig.clanNames?.[Clan.DEFENDERS]} onChange={e => setQuizConfig(p => ({ ...p, clanNames: { ...p.clanNames, [Clan.DEFENDERS]: e.target.value } }))} className="w-full bg-white border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Clan Assignment</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" value="playerChoice" checked={quizConfig.clanAssignment === 'playerChoice'} onChange={() => setQuizConfig(p => ({ ...p, clanAssignment: 'playerChoice' }))} className="custom-radio" /> Player Choice
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" value="autoBalance" checked={quizConfig.clanAssignment === 'autoBalance'} onChange={() => setQuizConfig(p => ({ ...p, clanAssignment: 'autoBalance' }))} className="custom-radio" /> Automatic Balancing
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                    <Card>
                        <h2 className="text-xl font-bold mb-3 text-slate-800">Your Questions ({questions.length}/10)</h2>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {questions.map((q, i) => (
                                <div key={q.id} className="bg-slate-100 p-2 rounded-md flex justify-between items-center gap-2">
                                    <p className="flex-grow text-slate-700 truncate">{i + 1}. {q.text}</p>
                                    <div className="flex-shrink-0 flex items-center gap-2">
                                        <div className="flex flex-col">
                                            <button onClick={() => handleMoveQuestion(i, 'up')} disabled={i === 0} className="text-slate-500 hover:text-slate-800 disabled:text-slate-300 disabled:cursor-not-allowed" aria-label="Move up">
                                                <UpArrowIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleMoveQuestion(i, 'down')} disabled={i === questions.length - 1} className="text-slate-500 hover:text-slate-800 disabled:text-slate-300 disabled:cursor-not-allowed" aria-label="Move down">
                                                <DownArrowIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <button onClick={() => handleRemoveQuestion(q.id)} className="text-red-500 hover:text-red-400 font-bold text-2xl px-1" aria-label="Remove">&times;</button>
                                    </div>
                                </div>
                            ))}
                            {questions.length < 1 && <p className="text-yellow-600 p-2">Add at least 1 question.</p>}
                        </div>
                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            {editingDraft ? (
                                <Button onClick={handleSaveDraft}
 disabled={!finalTitle || questions.length < 1 || isCreating} className="bg-slate-600 hover:bg-slate-700">
                                    {isCreating ? 'Updating...' : 'Update Draft'}
                                </Button>
                            ) : (
                                <Button onClick={handleSaveDraft}
 disabled={!finalTitle || questions.length < 1 || isCreating} className="bg-slate-600 hover:bg-slate-700">
                                    {isCreating ? 'Saving...' : 'Save Draft'}
                                </Button>
                            )}
                            <Button onClick={handleStartLiveQuiz} disabled={!finalTitle || questions.length < 1 || questions.length > 10 || isCreating} className="bg-gl-orange-600 hover:bg-gl-orange-700">
                                {isCreating ? 'Starting...' : (editingDraft ? 'Start Quiz Now' : 'Start Live Quiz')}
                            </Button>
                        </div>
                        {editingDraft && (
                            <div className="mt-3 text-center">
                                <button onClick={() => notAvailable()}
 className="text-sm text-slate-500 hover:underline">
                                    Cancel Edit
                                </button>
                            </div>
                        )}
                    </Card>
                </div>

                <Card>
                    <div className="flex flex-nowrap overflow-x-auto no-scrollbar border-b border-slate-200 mb-4">
                        <button onClick={() => setView('past')} className={`py-2 px-4 font-semibold whitespace-nowrap ${view === 'past' ? 'text-gl-orange-600 border-b-2 border-gl-orange-600' : 'text-slate-500'}`}>My Quizzes</button>
                        <button onClick={() => setView('reports')} className={`py-2 px-4 font-semibold whitespace-nowrap ${view === 'reports' ? 'text-gl-orange-600 border-b-2 border-gl-orange-600' : 'text-slate-500'}`}>Reports</button>
                        <button onClick={() => setView('library')} className={`py-2 px-4 font-semibold whitespace-nowrap ${view === 'library' ? 'text-gl-orange-600 border-b-2 border-gl-orange-600' : 'text-slate-500'}`}>Library</button>
                       { <button onClick={() => setView('custom')} className={`py-2 px-4 font-semibold whitespace-nowrap ${view === 'custom' ? 'text-gl-orange-600 border-b-2 border-gl-orange-600' : 'text-slate-500'}`}>Add Custom</button>}
                       <button
//   onClick={() => {
//     setCustomQuestion(EMPTY_CUSTOM_QUESTION);
//     setCustomFormErrors({ technology: '', skill: '' });
//     setIsCustomQuestionValid(false);
//     setView('custom');
//   }}
>
  
</button>

                        <button onClick={() => setView('ai')} className={`py-2 px-4 font-semibold whitespace-nowrap ${view === 'ai' ? 'text-gl-orange-600 border-b-2 border-gl-orange-600' : 'text-slate-500'}`}>Generate (AI)</button>
                    </div>

                    {view === 'past' && (
                        <div className="max-h-[65vh] overflow-y-auto pr-2 space-y-6">
                            {isLoadingQuizzes ? <div className="flex justify-center p-8"><LoadingSpinner /></div> : (
                                <>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-3">Drafts ({draftQuizzes.length})</h3>
                                        <div className="relative mb-4">
                                            <input type="text" placeholder="Search drafts..." value={draftsSearchTerm} onChange={e => setDraftsSearchTerm(e.target.value)} className="w-full bg-slate-100 border border-slate-300 rounded-md p-2 pl-10 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none" />
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><SearchIcon className="w-5 h-5 text-slate-400" /></div>
                                        </div>
                                        <div className="space-y-3">
                                            {filteredDrafts.length === 0 ? (
                                                <p className="text-center text-slate-500 p-4">{draftsSearchTerm ? 'No drafts match your search.' : "You have no saved drafts."}</p>
                                            ) : (
                                                filteredDrafts.map(q => (
                                                    <div key={q.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-3 rounded-lg gap-2">
                                                        <div>
                                                            <p className="font-semibold text-slate-700">{q.title}</p>
                                                            <p className="text-sm text-slate-500">{q.questions.length} Questions</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                                            <button onClick={() => notAvailable()} className="text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                                                            <button onClick={() => notAvailable()} title="Delete draft" className="p-2 text-slate-500 bg-slate-200 hover:bg-red-500 hover:text-white rounded-lg transition-colors"><DeleteIcon /></button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-3 pt-4 border-t">Completed Quizzes</h3>
                                        <div className="relative mb-4">
                                            <input type="text" placeholder="Search completed quizzes by title" value={pastQuizzesSearchTerm} onChange={e => setPastQuizzesSearchTerm(e.target.value)} className="w-full bg-slate-100 border border-slate-300 rounded-md p-2 pl-10 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none" />
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><SearchIcon className="w-5 h-5 text-slate-400" /></div>
                                        </div>
                                        <div className="space-y-4">
                                            {Object.keys(groupedPastQuizzes).length === 0 ? (
                                                <p className="text-center text-slate-500 p-4">{pastQuizzesSearchTerm ? 'No quizzes match your search.' : "You haven't hosted any quizzes yet."}</p>
                                            ) : (
                                                Object.entries(groupedPastQuizzes).map(([title, quizzes]) => {
                                                  //  const isExpanded = expandedPastQuizGroup === title;
                                                  /* Fix: Property 'quiz_id' does not exist on type 'Quiz'. Use 'id' instead. */
                                                  const groupKey = `${title}-${quizzes[0].id}`;
const isExpanded = expandedPastQuizGroup === groupKey;

                                                    return (
                                                        <div key={title} className="p-4 rounded-xl border bg-white border-slate-200 shadow-sm transition-all">
                                                            <button onClick={() => setExpandedPastQuizGroup(isExpanded ? null : groupKey)} className="w-full flex justify-between items-center text-left gap-4" aria-expanded={isExpanded} aria-controls={`past-quiz-group-${title.replace(/\s+/g, '-')}`}>
                                                                <p className="font-bold text-lg text-slate-800 truncate">{title}</p>
                                                                <div className="flex items-center gap-4 flex-shrink-0">
                                                                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">{quizzes.length} {quizzes.length === 1 ? 'Instance' : 'Instances'}</span>
                                                                    <DownArrowIcon className={`w-5 h-5 text-slate-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                                </div>
                                                            </button>
                                                            {isExpanded && (
                                                                <div id={`past-quiz-group-${title.replace(/\s+/g, '-')}`} className="mt-4 pt-4 border-t border-slate-200 space-y-3 animate-fade-in">
                                                                    {quizzes.map(q => (
  <div
    key={q.id}
    className="flex justify-between items-center bg-slate-50 p-3 rounded-lg"
  >
    <div>
      <p className="font-semibold text-slate-700">{q.title}</p>
      <p className="text-xs text-slate-500">
        Created on {new Date(q.createdAt).toLocaleDateString()}
      </p>
    </div>

    <div className="flex gap-2">
      <button
        onClick={() => handleReuseQuiz(q)}
        className="text-sm font-bold text-white bg-gl-orange-600 hover:bg-gl-orange-700 px-3 py-1.5 rounded-lg transition-colors"
      >
        Reuse
      </button>
    </div>
  </div>
))}

                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {view === 'reports' && (
                        <div>
                            <div className="relative mb-4">
                                <input
                                    type="text"
                                    placeholder="Search reports by title"
                                    value={reportSearchTerm}
                                    onChange={e => setReportSearchTerm(e.target.value)}
                                    className="w-full bg-slate-100 border border-slate-300 rounded-md p-2 pl-10 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none"
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <SearchIcon className="w-5 h-5 text-slate-400" />
                                </div>
                            </div>
                            {isLoadingQuizzes ? <div className="flex justify-center p-8"><LoadingSpinner /></div> : (
                                <div className="max-h-[65vh] overflow-y-auto pr-2 space-y-4">
                                    {Object.keys(groupedReports).length === 0 ? (
                                        <p className="text-center text-slate-500 p-4">{reportSearchTerm ? 'No reports match your search.' : "You haven't hosted any quizzes yet. Reports will show up here."}</p>
                                    ) : (
                                        Object.entries(groupedReports).map(([title, quizzes]) => {
                                            const isExpanded = expandedReportGroup === title;
                                            return (
                                                <div key={title} className="p-4 rounded-xl border bg-white border-slate-200 shadow-sm transition-all">
                                                    <button
                                                        onClick={() => setExpandedReportGroup(isExpanded ? null : title)}
                                                        className="w-full flex justify-between items-center text-left gap-4"
                                                        aria-expanded={isExpanded}
                                                        aria-controls={`report-group-${title.replace(/\s+/g, '-')}`}
                                                    >
                                                        <p className="font-bold text-lg text-slate-800 truncate">{title}</p>
                                                        <div className="flex items-center gap-4 flex-shrink-0">
                                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">{quizzes.length} {quizzes.length === 1 ? 'Report' : 'Reports'}</span>
                                                            <DownArrowIcon className={`w-5 h-5 text-slate-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                        </div>
                                                    </button>
                                                    {isExpanded && (
                                                        <div id={`report-group-${title.replace(/\s+/g, '-')}`} className="mt-4 pt-4 border-t border-slate-200 space-y-3 animate-fade-in">
                                                            {pastQuizzes.map(q => (
                                                                <div key={q.id}>
                                                                    {/* Render quiz details here */}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'library' && (
                        <div>
                            <div className="flex justify-center mb-4 bg-slate-100 rounded-lg p-1">
                                <button onClick={() => setLibraryView('all')} className={`w-1/2 py-1 rounded-md text-sm font-semibold ${libraryView === 'all' ? 'bg-gl-orange-600 text-white' : 'text-slate-600'}`}>Quiz Library</button>
                                <button onClick={() => setLibraryView('mine')} className={`w-1/2 py-1 rounded-md text-sm font-semibold ${libraryView === 'mine' ? 'bg-gl-orange-600 text-white' : 'text-slate-600'}`}>My Library</button>
                            </div>
                            <div className="relative mb-4">
                                <input
                                    type="text"
                                    placeholder="Search by question, tech, or skill..."
                                    value={librarySearchTerm}
                                    onChange={e => setLibrarySearchTerm(e.target.value)}
                                    className="w-full bg-slate-100 border border-slate-300 rounded-md p-2 pl-10 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none"
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <SearchIcon className="w-5 h-5 text-slate-400" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                                <CustomSelect
                                    value={selectedQuestionType}
                                    onChange={setSelectedQuestionType}
                                    placeholder="All Types"
                                    options={Object.values(QuestionType)}
                                />
                                <CustomSelect
                                    value={selectedTechnology}
                                    onChange={setSelectedTechnology}
                                    placeholder="All Technologies"
                                    options={technologies}
                                />
                                <CustomSelect
                                    value={selectedSkill}
                                    onChange={setSelectedSkill}
                                    placeholder="All Skills"
                                    options={skillsForFilter}
                                />
                            </div>
                            {isLoadingLibrary ? <div className="flex justify-center p-8"><LoadingSpinner /></div> : (
                                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                                    {filteredQuestions.length === 0 && <p className="text-center text-slate-500 p-4">No questions found. Try adding some or adjusting your search/filters.</p>}
                                    {filteredQuestions.map(q => {
                                        const isSelected = questions.find(sq => sq.id === q.id);
                                        return (
                                            <div key={q.id} className={`p-3 rounded-lg border ${isSelected ? 'bg-gl-orange-50 border-gl-orange-300' : 'bg-white border-slate-200'}`}>
                                                <p className={`font-semibold ${isSelected ? 'text-gl-orange-800' : 'text-slate-800'}`}>{q.text}</p>
                                                <div className="flex justify-between items-center mt-2">
                                                    <div className="flex gap-2 text-xs">
                                                        <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{q.type}</span>
                                                        <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{q.technology}</span>
                                                        <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{q.skill}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {libraryView === 'mine' && (
                                                            <>
                                                                <button title="Edit question" onClick={() => setEditingLibraryQuestion(q)} className="text-slate-500 hover:text-slate-800 p-1 rounded-full bg-slate-200 hover:bg-slate-300 transition"><EditIcon /></button>
                                                                <button title="Delete question" onClick={() => handleDeleteLibraryQuestion(q.id)} className="text-slate-500 hover:text-white p-1 rounded-full bg-slate-200 hover:bg-red-500 transition"><DeleteIcon /></button>
                                                            </>
                                                        )}
                                                        <button onClick={() => handleSelectQuestion(q)} disabled={isSelected != null} className="text-sm font-bold text-gl-orange-600 disabled:text-slate-400 disabled:cursor-not-allowed">
                                                            {isSelected ? 'Added' : '+ Add to Quiz'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                    {view === 'custom' && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-4">
                                {(Object.values(QuestionType) as Array<QuestionType>).map(type => (
                                    <label key={type} className="flex items-center gap-2 text-slate-800">
                                        <input type="radio" value={type} checked={customQuestion.type === type} onChange={() => handleQuestionTypeChange(type)} className="form-radio text-gl-orange-500" /> {type}
                                    </label>
                                ))}
                            </div>
                            <textarea value={customQuestion.text} onChange={e => setCustomQuestion(p => ({ ...p, text: e.target.value }))} placeholder={customQuestion.type === QuestionType.MATCH ? "Instruction Text..." : "Question / Prompt..."} className="w-full bg-slate-100 border border-slate-300 rounded-md p-3 h-24 resize-none focus:ring-2 focus:ring-gl-orange-500 focus:outline-none" />

                            {/* MCQ Form */}
                            {customQuestion.type === QuestionType.MCQ && customQuestion.options.slice(0, 4).map((opt, i) => (
                                <div key={i}>
                                    <div className="flex items-center space-x-2">
                                        <input type="radio" name="correctAnswer" checked={customQuestion.correctAnswerIndex === i} onChange={() => setCustomQuestion(p => ({ ...p, correctAnswerIndex: i }))} className="form-radio h-5 w-5 text-gl-orange-600 bg-slate-200 border-slate-400 focus:ring-gl-orange-500" />
                                        <input type="text" value={opt} onChange={e => handleOptionChange(i, e.target.value)} placeholder={`Option ${i + 1}`} className="w-full bg-slate-100 border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none" />
                                    </div>
                                </div>
                            ))}

                            {/* Survey Form */}
                            {customQuestion.type === QuestionType.SURVEY && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Options</label>
                                    {customQuestion.options.map((opt, i) => (
                                        <div key={i} className="flex items-center space-x-2 mb-2">
                                            <input type="text" value={opt} onChange={e => handleOptionChange(i, e.target.value)} placeholder={`Option ${i + 1}`} className="w-full bg-slate-100 border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none" />
                                            <button onClick={() => handleRemoveOption(i)} className="text-red-500 hover:text-red-700 disabled:opacity-50" disabled={customQuestion.options.length <= 2}>&times;</button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={handleAddOption} disabled={customQuestion.options.length >= 6} className="text-sm font-semibold text-gl-orange-600 disabled:text-slate-400 hover:text-gl-orange-500">+ Add Option</button>
                                </div>
                            )}

                            {/* Match Form */}
                            {customQuestion.type === QuestionType.MATCH && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Matching Pairs (2-6 pairs)</label>
                                    <div className="space-y-3">
                                        {customQuestion.matchPairs.map((pair, i) => (
                                            <div key={i} className="grid grid-cols-10 gap-2 items-center">
                                                <input type="text" value={pair.prompt} onChange={e => handleMatchPairChange(i, 'prompt', e.target.value)} placeholder={`Prompt ${i + 1}`} className="col-span-4 bg-slate-100 border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none" />
                                                <span className="text-center text-slate-500 col-span-1">&harr;</span>
                                                <input type="text" value={pair.correctMatch} onChange={e => handleMatchPairChange(i, 'correctMatch', e.target.value)} placeholder={`Match ${i + 1}`} className="col-span-4 bg-slate-100 border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none" />
                                                <button onClick={() => handleRemovePair(i)} className="text-red-500 hover:text-red-700 disabled:opacity-50 col-span-1" disabled={customQuestion.matchPairs.length <= 2}>&times;</button>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" onClick={handleAddPair} disabled={customQuestion.matchPairs.length >= 6} className="mt-2 text-sm font-semibold text-gl-orange-600 disabled:text-slate-400 hover:text-gl-orange-500">+ Add Pair</button>
                                </div>
                            )}

                            {/* Word Cloud has no specific inputs other than the main text area */}


                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="w-full">
                                    <input type="text" value={customQuestion.technology} onChange={e => {
                                        const value = e.target.value;
                                        setCustomQuestion(p => ({ ...p, technology: value }));
                                        if (countWords(value) > 2) {
                                            setCustomFormErrors(prev => ({ ...prev, technology: 'Max 2 words allowed' }));
                                        } else {
                                            setCustomFormErrors(prev => ({ ...prev, technology: '' }));
                                        }
                                    }} placeholder="Technology (e.g., AWS)" className="w-full bg-slate-100 border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none" />
                                    {customFormErrors.technology && <p className="text-red-500 text-xs mt-1">{customFormErrors.technology}</p>}
                                </div>
                                <div className="w-full">
                                    <input type="text" value={customQuestion.skill} onChange={e => {
                                        const value = e.target.value;
                                        setCustomQuestion(p => ({ ...p, skill: value }));
                                        if (countWords(value) > 2) {
                                            setCustomFormErrors(prev => ({ ...prev, skill: 'Max 2 words allowed' }));
                                        } else {
                                            setCustomFormErrors(prev => ({ ...prev, skill: '' }));
                                        }
                                    }} placeholder="Skill (e.g., Beginner)" className="w-full bg-slate-100 border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none" />
                                    {customFormErrors.skill && <p className="text-red-500 text-xs mt-1">{customFormErrors.skill}</p>}
                                </div>
                            </div>
                            <Button onClick={handleAddToLibrary} className="bg-gl-orange-600 hover:bg-gl-orange-700" disabled={isAddingToLibrary || !isCustomQuestionValid || !!customFormErrors.technology || !!customFormErrors.skill}>
                                {isAddingToLibrary ? 'Adding...' : 'Add to Library'}
                            </Button>
                        </div>
                    )}
                    {view === 'ai' && (
                        <div className="space-y-4">
                            <p className="text-slate-500 text-sm">You can generate up to {dailyAiLimit} questions per day. Currently, AI generation only supports Multiple Choice Questions (MCQ).</p>
                            {isCheckingUsage ? <p className="text-slate-500">Checking usage...</p> : <p className="text-gl-orange-600 font-semibold">Today's usage: {aiUsage}/{dailyAiLimit}</p>}
                            <div>
                                <input type="text" value={aiTopic} onChange={e => {
                                    const value = e.target.value;
                                    setAiTopic(value);
                                    if (countWords(value) > 2) {
                                        setAiFormErrors(prev => ({ ...prev, topic: 'Max 2 words allowed' }));
                                    } else {
                                        setAiFormErrors(prev => ({ ...prev, topic: '' }));
                                    }
                                }} placeholder="Topic (e.g., React)" className="w-full bg-slate-100 border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none" />
                                {aiFormErrors.topic && <p className="text-red-500 text-xs mt-1">{aiFormErrors.topic}</p>}
                            </div>
                            <div>
                                <input type="text" value={aiSkill} onChange={e => {
                                    const value = e.target.value;
                                    setAiSkill(value);
                                    if (countWords(value) > 2) {
                                        setAiFormErrors(prev => ({ ...prev, skill: 'Max 2 words allowed' }));
                                    } else {
                                        setAiFormErrors(prev => ({ ...prev, skill: '' }));
                                    }
                                }} placeholder="Skill (e.g., Hooks)" className="w-full bg-slate-100 border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none" />
                                {aiFormErrors.skill && <p className="text-red-500 text-xs mt-1">{aiFormErrors.skill}</p>}
                            </div>
                            <CustomSelect
                                options={numOptions.map(n => `${n} Questions`)}
                                value={`${aiNumQuestions} Questions`}
                                onChange={(val) => {
                                    const num = parseInt(val.split(' ')[0], 10);
                                    if (!isNaN(num)) {
                                        setAiNumQuestions(num);
                                    }
                                }}
                                placeholder="Number of questions"
                                showPlaceholderOption={false}
                            />
                            <Button onClick={handleGenerateQuestions} className="bg-gl-orange-600 hover:bg-gl-orange-700" disabled={isGenerating || isCheckingUsage || aiUsage >= dailyAiLimit || !!aiFormErrors.topic || !!aiFormErrors.skill}>
                                {isGenerating ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div> : 'Generate Questions'}
                            </Button>
                            {aiError && <p className="text-red-500 text-center">{aiError}</p>}
                            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                                {generatedQuestions.map((q, index) => (
                                    <div key={index} className="p-3 rounded-lg bg-slate-50 border border-slate-200 animate-fade-in">
                                        <p className="font-semibold text-slate-800">{q.text}</p>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="flex gap-2 text-xs">
                                                <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{q.technology}</span>
                                                <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{q.skill}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => setEditingQuestionIndex(index)} disabled={q.status === 'adding' || q.status === 'added'} className="text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed">
                                                    Review
                                                </button>
                                               
                                                <button
  onClick={() => handleAddFromGenerator(q, index)}
  disabled={q.status === 'adding' || q.status === 'added'}
  className="text-sm font-bold text-gl-orange-600 disabled:text-slate-400 disabled:cursor-not-allowed"
>
  {q.status === 'added'
    ? 'Added'
    : q.status === 'adding'
    ? 'Adding...'
    : 'Add to library'}
</button>

                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
            {editingQuestionIndex !== null && (
                <EditQuestionModal
                    key={`ai-${editingQuestionIndex}`}
                    question={generatedQuestions[editingQuestionIndex]}
                    onClose={() => setEditingQuestionIndex(null)}
                    onSave={notAvailable}
                />
            )}
            {editingLibraryQuestion && (
                <EditQuestionModal
                    key={editingLibraryQuestion.id}
                    question={editingLibraryQuestion}
                    onClose={() => setEditingLibraryQuestion(null)}
                    // onSave={notAvailable}
                    onSave={(question) => handleUpdateLibraryQuestion(editingLibraryQuestion.id, question)}
                />
            )}
        </div>
    );
};

export default CreateQuizPage;

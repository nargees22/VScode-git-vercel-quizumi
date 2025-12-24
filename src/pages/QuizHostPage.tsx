import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../service/supabase.ts';
import type { Quiz, Player, Question } from '../../types.ts';
import { GameState, QuestionType } from '../../types.ts';
import { PageLoader } from '../components/PageLoader';
import { PersistentQRCode } from '../components/PersistentQRCode';
import { TimerCircle } from '../components/TimerCircle';
import Button from '../components/Button';
import { SurveyResultsChart } from '../components/SurveyResultsChart';
import { IntermediateLeaderboard } from '../components/IntermediateLeaderboard';

const QuizHostPage = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentQuestionAnswers, setCurrentQuestionAnswers] = useState<any[]>([]);

    // Add detailed comments, guards, and improved logic for game state updates and rendering

    // -----------------------------
    // FETCH DATA (SAFE)
    // -----------------------------
    const fetchData = async () => {
        if (!quizId) return;

        const { data: qData } = await supabase
            .from('quiz_master_structure')
            .select(`
                quiz_id,
                title,
                game_state,
                current_question_index,
                clan_based,
                show_live_response_count,
                start_time,
                end_time,
                created_at
            `)
            .eq('quiz_id', quizId)
            .single();

        const { data: qsData } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('quiz_id', quizId)
            .order('question_order', { ascending: true });

        const { data: pData } = await supabase
            .from('quiz_players')
            .select('*')
            .eq('quiz_id', quizId);

        if (!qData || !qsData) return;

        const mappedQuestions: Question[] = qsData.map((q: any) => ({
            id: String(q.pk_id),
            text: q.question_text,
            options: [q.option_1, q.option_2, q.option_3, q.option_4].filter(Boolean),
            correctAnswerIndex: q.correct_answer_index,
            timeLimit: q.time_limit,
            type: q.type as QuestionType,
            technology: q.technology || '', // Default to empty string if missing
            skill: q.skill || '', // Default to empty string if missing
        }));

        setQuiz({
            id: qData.quiz_id,
            title: qData.title,
            gameState: qData.game_state,
            currentQuestionIndex: qData.current_question_index ?? 0, // ✅ SAFE
            questions: mappedQuestions,
            config: {
                clanBased: qData.clan_based,
                showLiveResponseCount: qData.show_live_response_count,
            },
        } as Quiz);

        if (pData) {
            setPlayers(
                pData.map(p => ({
                    id: p.player_id,
                    name: p.player_name,
                    avatar: p.avatar,
                    score: p.score,
                    clan: p.clan,
                }))
            );
        }
    };

    useEffect(() => {
        fetchData();

        const channel = supabase.channel(`host-room-${quizId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_answers', filter: `quiz_id=eq.${quizId}` }, (payload) => {
                setCurrentQuestionAnswers(prev => [...prev, payload.new]);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quiz_master_structure', filter: `quiz_id=eq.${quizId}` }, () => {
                fetchData();
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_players', filter: `quiz_id=eq.${quizId}` }, () => {
                fetchData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [quizId]);

    const updateGameState = async (newState: GameState) => {
        const updateData: any = { game_state: newState };
        if (newState === GameState.QUESTION_INTRO) {
            updateData.current_question_index = (quiz?.currentQuestionIndex || 0) + 1;
        }
        await supabase.from('quiz_master_structure').update(updateData).eq('quiz_id', quizId);
    };

    // -----------------------------
    // GUARDS (CRITICAL)
    // -----------------------------
    if (!quiz) return <PageLoader message="Loading host view..." />;

    const question = quiz.questions?.[quiz.currentQuestionIndex];

    if (
        quiz.gameState !== GameState.LOBBY &&
        quiz.gameState !== GameState.LEADERBOARD &&
        quiz.gameState !== GameState.FINISHED &&
        !question
    ) {
        return <PageLoader message="Preparing question..." />;
    }

    const totalAnswers = currentQuestionAnswers.length;

    // -----------------------------
    // SAFE useMemo
    // -----------------------------
    const answerCounts = useMemo(() => {
        if (!question) return [];
        const counts = new Array(question.options.length).fill(0);
        currentQuestionAnswers.forEach(a => {
            if (typeof a.answer === 'number') counts[a.answer]++;
        });
        return counts;
    }, [currentQuestionAnswers, question]);

    // -----------------------------
    // RENDER
    // -----------------------------
    const renderContent = () => {
        switch (quiz.gameState) {
            case GameState.LOBBY:
                return <div className="text-xl text-slate-500">Waiting to start quiz…</div>;

            case GameState.QUESTION_INTRO:
                return (
                    <div className="text-center">
                        <h1 className="text-3xl font-bold">{question.text}</h1>
                        <p className="mt-4 text-slate-500">Get ready…</p>
                    </div>
                );

            case GameState.QUESTION_ACTIVE:
                return (
                    <>
                        {/* Fix: Passed resetKey prop to TimerCircle to satisfy interface and logic requirements */}
                        <TimerCircle duration={question.timeLimit} start resetKey={question.id} />
                        <h1 className="text-2xl mt-6">{question.text}</h1>
                    </>
                );

            case GameState.QUESTION_RESULT:
                return (
                    <SurveyResultsChart
                        options={question.options}
                        answerCounts={answerCounts}
                    />
                );

            case GameState.LEADERBOARD:
                return <IntermediateLeaderboard players={players} quiz={quiz} animate />;

            case GameState.FINISHED:
                return (
                    <Button onClick={() => navigate(`/report/${quizId}`)}>
                        View Report
                    </Button>
                );

            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col items-center p-4">
            <PersistentQRCode quizId={quizId!} />
            <div className="flex-grow w-full flex justify-center py-4">{renderContent()}</div>
            <div className="sticky bottom-4 w-full max-w-md flex gap-4">
                {quiz.gameState === GameState.LOBBY && (
                    <Button
                        onClick={() => updateGameState(GameState.QUESTION_INTRO)}
                        className="bg-green-600"
                    >
                        Start Quiz
                    </Button>
                )}
                {quiz.gameState === GameState.QUESTION_ACTIVE && <Button onClick={() => updateGameState(GameState.QUESTION_RESULT)} className="bg-gl-orange-600">Stop Timer & Show Results</Button>}
                {quiz.gameState === GameState.QUESTION_RESULT && <Button onClick={() => updateGameState(GameState.LEADERBOARD)} className="bg-slate-800">Show Leaderboard</Button>}
                {quiz.gameState === GameState.LEADERBOARD && (
                    quiz.currentQuestionIndex < quiz.questions.length - 1
                        ? <Button onClick={() => updateGameState(GameState.QUESTION_INTRO)} className="bg-gl-orange-600">Next Question</Button>
                        : <Button onClick={() => updateGameState(GameState.FINISHED)} className="bg-green-600">Finish Quiz</Button>
                )}
            </div>
        </div>
    );
};

export default QuizHostPage;
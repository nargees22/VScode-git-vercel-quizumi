import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../src/service/supabase';
import type { Quiz, Player, PlayerAnswer, Question } from '../types.ts';
import { QuestionType } from '../types.ts';
import { PageLoader } from '../components/PageLoader.tsx';
import { PerformanceReport } from '../components/PerformanceReport.tsx';
import Button from '../components/Button.tsx';
import Card from '../src/components/Card';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

const PerformanceReportPage = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [players, setPlayers] = useState<Player[] | null>(null);
    const [recommendations, setRecommendations] = useState<{ loading: boolean; text: string; }>({ loading: true, text: '' });
    
    const organizerName = useMemo(() => sessionStorage.getItem('quiz-organizer'), []);

    useEffect(() => {
        if (!quizId) {
            navigate('/');
            return;
        }

        const fetchAllData = async () => {
            const { data: qData } = await supabase.from('quiz_master_structure')
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

            const { data: qsData } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quizId).order('question_order', { ascending: true });
            const { data: pData } = await supabase.from('quiz_players').select('*').eq('quiz_id', quizId);
            const { data: ansData } = await supabase.from('quiz_answers').select('*').eq('quiz_id', quizId);

            if (qData) {
                const mappedQuestions: Question[] = (qsData || []).map(q => ({
                    id: String(q.pk_id),
                    text: q.question_text,
                    options: [q.option_1, q.option_2, q.option_3, q.option_4].filter(Boolean),
                    correctAnswerIndex: q.correct_answer_index,
                    timeLimit: q.time_limit,
                    type: q.type as QuestionType,
                    technology: q.technology || '',
                    skill: q.skill || '',
                }));

                const mappedPlayers = (pData || []).map(p => {
                    const pAnswers = (ansData || [])
                        .filter(a => a.player_id === p.player_id)
                        .map(a => ({
                            questionId: String(a.question_id),
                            answer: a.answer,
                            timeTaken: a.time_taken,
                            score: a.score
                        }));
                    return {
                        id: p.player_id,
                        name: p.player_name,
                        avatar: p.avatar,
                        score: p.score,
                        clan: p.clan,
                        answers: pAnswers
                    };
                });

                setQuiz({
                    id: qData.quiz_id,
                    title: qData.title,
                    gameState: qData.game_state,
                    currentQuestionIndex: qData.current_question_index,
                    config: {
                        clanBased: qData.clan_based,
                        showLiveResponseCount: qData.show_live_response_count,
                    },
                    questions: mappedQuestions
                } as any);
                setPlayers(mappedPlayers as any);
            } else {
                navigate('/');
            }
        };

        fetchAllData();
    }, [quizId, navigate]);

    const performanceReport = useMemo(() => {
        if (!quiz || !players || players.length === 0) return null;

        const scorableQuestions = quiz.questions.filter(q => q.type === QuestionType.MCQ);
        const totalJoined = players.length;
        const totalParticipated = players.filter(p => p.answers.length > 0).length;
        const averageScore = totalJoined > 0 ? players.reduce((sum, p) => sum + p.score, 0) / totalJoined : 0;
        
        // Competency calculation
        const THRESHOLD = 0.7;
        const competentCount = players.filter(p => {
            const correct = p.answers.filter(a => a.score > 1000).length;
            return scorableQuestions.length > 0 ? (correct / scorableQuestions.length) >= THRESHOLD : false;
        }).length;

        const analytics = scorableQuestions.map(q => {
            const qAnswers = players.flatMap(p => p.answers.filter(a => a.questionId === q.id));
            const total = qAnswers.length;
            const correct = qAnswers.filter(a => a.score > 1000).length;
            return {
                id: q.id,
                text: q.text,
                type: q.type,
                correctness: total > 0 ? (correct / total) * 100 : 0,
                avgScore: total > 0 ? qAnswers.reduce((s, a) => s + a.score, 0) / total : 0,
                avgTime: total > 0 ? qAnswers.reduce((s, a) => s + a.timeTaken, 0) / total : 0,
            };
        });

        return {
            totalJoined,
            totalParticipated,
            nonParticipants: players.filter(p => p.answers.length === 0).map(p => ({ name: p.name, avatar: p.avatar })),
            averageScore,
            scoreDistribution: [0, 0, 0, 0, 0], // Simplified distribution
            maxPossibleScore: scorableQuestions.length * 2000,
            bySkill: [], // Populated in full implementation
            byTechnology: [],
            toughestQuestions: [],
            questionAnalytics: analytics,
            competency: { achieved: competentCount, total: totalJoined, percentage: totalJoined > 0 ? (competentCount / totalJoined) * 100 : 0 },
        };
    }, [quiz, players]);

    useEffect(() => {
        if (!performanceReport || !quiz || recommendations.text) return;

        const getAIAdvice = async () => {
            setRecommendations({ loading: true, text: '' });
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `Analyze quiz results for "${quiz.title}". Competency: ${performanceReport.competency.percentage.toFixed(0)}%. Provide Strengths, Weaknesses, and Recommendations.`;
                
                const response: GenerateContentResponse = await ai.models.generateContent({
                    model: 'gemini-3-pro-preview',
                    contents: prompt,
                });
                setRecommendations({ loading: false, text: response.text || "No insights available." });
            } catch (err) {
                console.error(err);
                setRecommendations({ loading: false, text: "Error generating recommendations." });
            }
        };

        getAIAdvice();
    }, [performanceReport, quiz]);

    if (!quiz || !players) return <PageLoader message="Analyzing performance..." />;

    return (
        <div className="p-4 sm:p-8 animate-fade-in">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-slate-800">Quiz Performance Report</h1>
                    <p className="text-xl text-slate-500 mt-2">{quiz.title}</p>
                </div>
                <PerformanceReport 
                    report={performanceReport as any} 
                    quizTitle={quiz.title} 
                    quizId={quiz.id} 
                    recommendations={recommendations} 
                />
                <div className="mt-8 flex justify-center">
                    <Link to="/"><Button className="bg-gl-orange-600 hover:bg-gl-orange-700 w-auto px-8">Back to Dashboard</Button></Link>
                </div>
            </div>
        </div>
    );
};

export default PerformanceReportPage;
import React, { useState, useEffect, useMemo } from 'react';
// Fix: Ensure useParams, useNavigate, and Link are correctly imported from react-router-dom
import { useParams, useNavigate, Link } from 'react-router-dom';
// Commenting out Firebase import
// import { db } from '../../firebase.ts';

// Replacing with Supabase import
import { supabase } from "../service/supabase";
import type { Quiz, Player, PlayerAnswer } from '../../types.ts';
import { QuestionType } from '../../types.ts';
import { PageLoader } from '../components/PageLoader.tsx';
import { PerformanceReport } from '../components/PerformanceReport.tsx';
import Button from '../components/Button.tsx';
import Card from '../components/Card.tsx';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

const PerformanceReportPage = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [players, setPlayers] = useState<Player[] | null>(null);
    const [recommendations, setRecommendations] = useState<{ loading: boolean; text: string; }>({ loading: true, text: '' });
    
    const loggedInOrganizer = useMemo(() => sessionStorage.getItem('quiz-organizer'), []);

    useEffect(() => {
        if (!quizId) {
            navigate('/');
            return;
        }

        const fetchQuiz = async () => {
            const { data: quizData, error } = await supabase
                .from('quizzes')
                .select('*')
                .eq('id', quizId)
                .single();

            if (error) {
                console.error('Error fetching quiz:', error);
                navigate('/');
            } else {
                setQuiz(quizData);
            }
        };

        const fetchPlayers = async () => {
            const { data: playersData, error } = await supabase
                .from('players')
                .select('*')
                .eq('quiz_id', quizId);

            if (error) {
                console.error('Error fetching players:', error);
            } else {
                setPlayers(playersData);
            }
        };

        fetchQuiz();
        fetchPlayers();
    }, [quizId, navigate]);

    const performanceReport = useMemo(() => {
        if (!quiz || !players || players.length === 0) return null;

        const skillStats = new Map<string, { correct: number, total: number }>();
        const techStats = new Map<string, { correct: number, total: number }>();
        const questionStats = new Map<string, { text: string, correct: number, total: number }>();
        
        const scorableQuestions = quiz.questions.filter(q => q.type === QuestionType.MCQ || q.type === QuestionType.MATCH);

        const totalJoined = players.length;
        const totalParticipated = players.filter(p => p.answers && p.answers.length > 0).length;
        const nonParticipants = players
            .filter(p => !p.answers || p.answers.length === 0)
            .map(p => ({ name: p.name, avatar: p.avatar }));

        const totalScoreSum = players.reduce((sum, p) => sum + p.score, 0);
        const averageScore = totalJoined > 0 ? totalScoreSum / totalJoined : 0;
        
        const maxPossibleScore = scorableQuestions.reduce((sum, q) => {
            if (q.type === QuestionType.MCQ) return sum + 2000;
            if (q.type === QuestionType.MATCH) return sum + 3000;
            return sum;
        }, 0);
        
        const scoreDistribution = [0, 0, 0, 0, 0];
        if (maxPossibleScore > 0) {
            players.forEach(player => {
                const percentage = (player.score / maxPossibleScore) * 100;
                if (percentage <= 20) scoreDistribution[0]++;
                else if (percentage <= 40) scoreDistribution[1]++;
                else if (percentage <= 60) scoreDistribution[2]++;
                else if (percentage <= 80) scoreDistribution[3]++;
                else scoreDistribution[4]++;
            });
        }

        players.forEach(player => {
            player.answers.forEach(answer => {
                const question = quiz.questions.find(q => q.id === answer.questionId);
                if (!question || (question.type !== QuestionType.MCQ && question.type !== QuestionType.MATCH)) {
                    return;
                }

                const isCorrect = answer.score > 0;

                if (!questionStats.has(question.id)) {
                    questionStats.set(question.id, { text: question.text, correct: 0, total: 0 });
                }
                const qStats = questionStats.get(question.id)!;
                qStats.total++;
                if (isCorrect) qStats.correct++;

                if (question.skill) {
                    const skill = question.skill;
                    if (!skillStats.has(skill)) skillStats.set(skill, { correct: 0, total: 0 });
                    const stats = skillStats.get(skill)!;
                    stats.total++;
                    if (isCorrect) stats.correct++;
                }

                if (question.technology) {
                    const tech = question.technology;
                    if (!techStats.has(tech)) techStats.set(tech, { correct: 0, total: 0 });
                    const stats = techStats.get(tech)!;
                    stats.total++;
                    if (isCorrect) stats.correct++;
                }
            });
        });

        const getLevel = (percentage: number): 'Good' | 'Moderate' | 'Needs Improvement' => {
            if (percentage >= 75) return 'Good';
            if (percentage >= 40) return 'Moderate';
            return 'Needs Improvement';
        };

        const processStats = (statsMap: Map<string, { correct: number, total: number }>) => {
            return Array.from(statsMap.entries())
                .map(([tagName, stats]) => {
                    const percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
                    return {
                        tagName,
                        correctAnswers: stats.correct,
                        totalAnswers: stats.total,
                        percentage,
                        level: getLevel(percentage),
                    };
                })
                .sort((a, b) => a.percentage - b.percentage);
        };
        
        const toughestQuestions = Array.from(questionStats.values())
            .filter(q => q.total > 0)
            .map(q => ({
                ...q,
                percentage: q.total > 0 ? (q.correct / q.total) * 100 : 0,
            }))
            .sort((a, b) => a.percentage - b.percentage)
            .slice(0, 5);
        
        const questionAnalyticsData = scorableQuestions.map(question => {
            const answersForQuestion = players
                .map(p => p.answers.find(a => a.questionId === question.id))
                .filter((a): a is PlayerAnswer => a !== undefined);
            
            const answerCount = answersForQuestion.length;
            if (answerCount === 0) {
                return {
                    id: question.id,
                    text: question.text,
                    type: question.type,
                    correctness: 0,
                    avgScore: 0,
                    avgTime: 0,
                };
            }
    
            const correctCount = answersForQuestion.filter(a => a.score > 0).length;
            const totalScore = answersForQuestion.reduce((sum, a) => sum + a.score, 0);
            const totalTime = answersForQuestion.reduce((sum, a) => sum + a.timeTaken, 0);
    
            return {
                id: question.id,
                text: question.text,
                type: question.type,
                correctness: (correctCount / answerCount) * 100,
                avgScore: totalScore / answerCount,
                avgTime: totalTime / answerCount,
            };
        });

        const COMPETENCY_THRESHOLD = 0.7;
        const totalScorableQuestions = scorableQuestions.length;
        let competentPlayers = 0;

        if (totalScorableQuestions > 0) {
            players.forEach(player => {
                let correctAnswers = 0;
                scorableQuestions.forEach(q => {
                    const answer = player.answers.find(a => a.questionId === q.id);
                    if (answer && answer.score > 0) {
                        correctAnswers++;
                    }
                });
                if ((correctAnswers / totalScorableQuestions) >= COMPETENCY_THRESHOLD) {
                    competentPlayers++;
                }
            });
        }
        const competencyAchievement = {
            achieved: competentPlayers,
            total: players.length,
            percentage: players.length > 0 ? (competentPlayers / players.length) * 100 : 0,
        };

        return {
            totalJoined,
            totalParticipated,
            nonParticipants,
            averageScore,
            scoreDistribution,
            maxPossibleScore,
            bySkill: processStats(skillStats),
            byTechnology: processStats(techStats),
            toughestQuestions,
            questionAnalytics: questionAnalyticsData,
            competency: competencyAchievement,
        };
    }, [quiz, players]);

    const isAuthorized = useMemo(() => {
        if (!quiz) return false;
        return loggedInOrganizer === quiz.organizerName;
    }, [quiz, loggedInOrganizer]);

    useEffect(() => {
        if (!performanceReport || !isAuthorized || recommendations.text || !quiz) return;

        const generateRecommendations = async () => {
            setRecommendations({ loading: true, text: '' });

            const { bySkill, byTechnology, toughestQuestions } = performanceReport;

            if (bySkill.length === 0 && byTechnology.length === 0 && toughestQuestions.length === 0) {
                setRecommendations({ loading: false, text: "Not enough data to generate recommendations." });
                return;
            }

            const topSkills = bySkill.slice(-3).reverse();
            const topTechs = byTechnology.slice(-3).reverse();

            const prompt = `
                You are an expert instructional designer analyzing quiz results for the quiz titled "${quiz.title}".
                Based on the provided performance data, generate a concise analysis with three distinct sections: Strengths, Weaknesses, and Recommendations.

                - For **Strengths**, identify 1-2 topics or skills where participants performed exceptionally well.
                - For **Weaknesses**, identify 1-2 topics or skills that need the most improvement.
                - For **Recommendations**, provide 2-3 actionable suggestions for the quiz organizer to improve learner outcomes.

                Format the entire response using Markdown with the following headings exactly:
                **Strengths**
                **Weaknesses**
                **Recommendations**

                Under each heading, use bullet points starting with '* '.

                **Performance Data Summary:**
                *   **Competency Rate:** ${performanceReport.competency.percentage.toFixed(0)}%
                *   **Strongest Skills:** ${topSkills.length > 0 ? topSkills.map(s => `${s.tagName} (${s.percentage.toFixed(0)}%)`).join(', ') : 'N/A'}
                *   **Skills needing review:** ${bySkill.length > 0 ? bySkill.slice(0, 3).map(s => `${s.tagName} (${s.percentage.toFixed(0)}%)`).join(', ') : 'N/A'}
            `;

            try {
                // Guidelines: Use process.env.API_KEY directly and create instance right before making an API call.
                // Using gemini-3-pro-preview for complex reasoning tasks (educational analytics).
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const response: GenerateContentResponse = await ai.models.generateContent({
                    model: 'gemini-3-pro-preview',
                    contents: prompt,
                });
                setRecommendations({ loading: false, text: response.text || "" });
            } catch (error) {
                console.error("Error generating recommendations:", error);
                setRecommendations({ loading: false, text: "Could not generate AI recommendations." });
            }
        };

        generateRecommendations();

    }, [performanceReport, isAuthorized, recommendations.text, quiz]);

    if (!quiz || !players) return <PageLoader message="Generating performance report..." />;

    if (!isAuthorized) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
                <Card>
                    <h1 className="text-4xl font-bold">Access Denied</h1>
                    <p className="text-slate-600 text-xl mt-2">Only the organizer can view this report.</p>
                    <Link to="/" className="mt-8 inline-block"><Button className="bg-gl-orange-600 hover:bg-gl-orange-700 w-auto px-6">Go to Home</Button></Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 animate-fade-in">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-slate-800">Quiz Performance Report</h1>
                    <p className="text-xl text-slate-500 mt-2">{quiz.title}</p>
                </div>
                <PerformanceReport report={performanceReport} quizTitle={quiz.title} quizId={quiz.id} recommendations={recommendations} />
                <div className="mt-8 flex justify-center"><Link to="/"><Button className="bg-gl-orange-600 hover:bg-gl-orange-700 w-auto px-6">Back to Home</Button></Link></div>
            </div>
        </div>
    );
};

export default PerformanceReportPage;

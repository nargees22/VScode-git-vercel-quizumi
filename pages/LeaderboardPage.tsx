import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../src/service/supabase';
import type { Quiz, Player } from '../types.ts';
import { Clan, QuestionType } from '../types.ts';
import { PageLoader } from '../components/PageLoader.tsx';
import { ReactionSender, FloatingReaction } from '../components/Reaction.tsx';
import { ConfettiCelebration } from '../src/components/ConfettiCelebration';
import { Trophy3D } from '../src/components/Trophy3D';
import { PodiumSlot } from '../src/components/Podium';
import { TrophyIcon } from '../src/icons/TrophyIcon';
import { StarIcon } from '../src/icons/StarIcon';
import Card from '../src/components/Card';
import { UsersIcon } from '../src/icons/UsersIcon';
import { ClockIcon } from '../src/icons/ClockIcon';
import { ChartBarIcon } from '../src/icons/ChartBarIcon';
import { HighRollerIcon } from '../src/icons/HighRollerIcon';
import { GamblerIcon } from '../src/icons/GamblerIcon';

const LightningIcon: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const StreakIcon: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
    </svg>
);

const LeaderboardPage = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [players, setPlayers] = useState<Player[] | null>(null);
    const [countdown, setCountdown] = useState(3);
    const [revealStep, setRevealStep] = useState<'countdown' | 'all'>('countdown');

    useEffect(() => {
        if (!quizId) {
            navigate('/');
            return;
        }

        const fetchAll = async () => {
            const { data: qData } = await supabase.from('quiz_master_structure')
                .select(`
                    quiz_id,
                    title,
                    clan_based,
                    start_time,
                    end_time,
                    created_at
                `)
                .eq('quiz_id', quizId)
                .single();

            if (qData) {
                setQuiz({ 
                    id: qData.quiz_id, 
                    title: qData.title, 
                    config: { clanBased: qData.clan_based } 
                } as any);
            }
            const { data: pData } = await supabase.from('quiz_players').select('*').eq('quiz_id', quizId);
            
            if (pData) {
                setPlayers(pData.map(p => ({ 
                    id: p.player_id, 
                    name: p.player_name, 
                    avatar: p.avatar, 
                    score: p.score, 
                    clan: p.clan, 
                    answers: [] 
                })) as any);
            }
        };

        fetchAll();
        
        const channel = supabase.channel(`leaderboard-${quizId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_players', filter: `quiz_id=eq.${quizId}` }, fetchAll)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [quizId, navigate]);

    useEffect(() => {
        if (!quiz || !players) return;
        if (revealStep !== 'countdown') return;

        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setRevealStep('all');
        }
    }, [countdown, revealStep, quiz, players]);

    if (!quiz || !players) return <PageLoader message="Finalizing results..." />;

    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const topThree = sortedPlayers.slice(0, 3);

    return (
        <div className="flex-grow flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {revealStep === 'all' && <ConfettiCelebration />}
            <div className="relative z-10 w-full flex flex-col items-center p-8">
                {revealStep === 'countdown' ? (
                    <>
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-800 animate-pulse text-center">Tallying final scores...</h1>
                        <div className="text-9xl font-bold text-gl-orange-500 mt-8 animate-pop-in">{countdown}</div>
                    </>
                ) : (
                    <>
                        <h1 className="text-5xl font-extrabold tracking-tight text-slate-800">Final Standings</h1>
                        <h2 className="text-2xl text-slate-500 mb-12">{quiz.title}</h2>
                        
                        <div className="flex items-end justify-center gap-4 mb-12">
                            {topThree[1] && <PodiumSlot player={topThree[1]} rank={2} height="120px" color="bg-slate-300" visible={true} />}
                            {topThree[0] && <PodiumSlot player={topThree[0]} rank={1} height="180px" color="bg-yellow-400" visible={true} />}
                            {topThree[2] && <PodiumSlot player={topThree[2]} rank={3} height="90px" color="bg-orange-300" visible={true} />}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                            <Link to="/" className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-lg text-center transition">
                                Home
                            </Link>
                            <Link to={`/report/${quizId}`} className="bg-gl-orange-600 hover:bg-gl-orange-700 text-white font-bold py-3 px-8 rounded-lg text-center transition flex items-center gap-2">
                                <ChartBarIcon /> Full Report
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default LeaderboardPage;
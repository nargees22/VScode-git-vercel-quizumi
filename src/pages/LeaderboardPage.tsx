import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
// import { db } from '../../firebase';
// import firebase from '../../firebase';
import { supabase } from "../service/supabase";
import type { Quiz, Player } from '../../types.ts';
import { Clan, QuestionType } from '../../types.ts';
import { PageLoader } from '../components/PageLoader';
import { ReactionSender, FloatingReaction } from '../components/Reaction';
import { ConfettiCelebration } from '../components/ConfettiCelebration';
import { Trophy3D } from '../components/Trophy3D';
import { PodiumSlot } from '../components/Podium';
import { TrophyIcon } from '../icons/TrophyIcon';
import { StarIcon } from '../icons/StarIcon';
import Card from '../components/Card';
import { UsersIcon } from '../icons/UsersIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { GiftIcon } from '../icons/GiftIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { HighRollerIcon } from '../icons/HighRollerIcon';
import { GamblerIcon } from '../icons/GamblerIcon';

// --- Local Icon Components ---
const LightningIcon: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const StreakIcon: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806 1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
);

const AwardCard: React.FC<{icon: React.ReactNode, title: string, winner: {player: Player, metric: string} }> = ({ icon, title, winner }) => (
    <div className="bg-white/50 border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col items-center h-full text-center">
        <div className="text-yellow-500">{icon}</div>
        <h3 className="text-lg sm:text-xl font-bold mt-2 text-slate-700">{title}</h3>
        <img src={winner.player.avatar} alt={winner.player.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white bg-slate-200 shadow-lg my-2" />
        <p className="font-bold text-xl sm:text-2xl text-slate-800 truncate max-w-full">{winner.player.name}</p>
        <p className="text-base sm:text-lg font-semibold text-gl-orange-600">{winner.metric}</p>
    </div>
);

const LeaderboardPage = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [players, setPlayers] = useState<Player[] | null>(null);
    const [countdown, setCountdown] = useState(3);
    const [revealStep, setRevealStep] = useState<'countdown' | 'podium-3' | 'podium-2' | 'podium-1' | 'awards' | 'all'>('countdown');
    const playerId = useMemo(() => quizId ? localStorage.getItem(`quiz-player-${quizId}`) : null, [quizId]);
    const hostId = useMemo(() => quizId ? localStorage.getItem(`quiz-host-${quizId}`) : null, [quizId]);
    const isHost = hostId === quiz?.hostId;
    const isPlayerView = !!playerId;
    const [liveReactions, setLiveReactions] = useState<{ id: string; emoji: string }[]>([]);
    const [openSection, setOpenSection] = useState<'winner' | 'runner-up' | 'potm' | 'fastest' | 'consistency' | 'high-roller' | 'gambler' | null>(null);

    const sortedPlayers = useMemo(() => {
        if (!players) return [];
        return [...players].sort((a, b) => b.score - a.score);
    }, [players]);

    const sortedClans = useMemo(() => {
        if (!players || !quiz?.config?.clanBased) {
            return [];
        }
    
        const clanData: Record<string, { totalScore: number; players: Player[] }> = {
            [Clan.TITANS]: { totalScore: 0, players: [] },
            [Clan.DEFENDERS]: { totalScore: 0, players: [] },
        };
    
        for (const player of players) {
            if (player.clan && clanData[player.clan]) {
                clanData[player.clan].totalScore += player.score || 0;
                clanData[player.clan].players.push(player);
            }
        }
    
        const processedClans = Object.entries(clanData).map(([clan, data]) => {
            const playerCount = data.players.length;
            const averageScore = playerCount > 0 ? data.totalScore / playerCount : 0;
            const sortedClanPlayers = [...data.players].sort((a, b) => (b.score || 0) - (a.score || 0));
            return { 
                clan: clan as Clan, 
                score: Math.round(averageScore), 
                players: sortedClanPlayers 
            };
        });
    
        return processedClans.sort((a, b) => b.score - a.score);
    }, [players, quiz]);

    const playerOfTheMatch = useMemo(() => {
        if (!players || !quiz || players.length === 0 || !quiz?.config?.clanBased) return null;
    
        const sortedByPerf = [...players].sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            const totalScoredTimeA = a.answers.reduce((sum, ans) => sum + (ans.score > 0 ? ans.timeTaken : 0), 0);
            const totalScoredTimeB = b.answers.reduce((sum, ans) => sum + (ans.score > 0 ? ans.timeTaken : 0), 0);
            if (totalScoredTimeA === 0 && totalScoredTimeB > 0) return 1;
            if (totalScoredTimeB === 0 && totalScoredTimeA > 0) return -1;
            return totalScoredTimeA - totalScoredTimeB;
        });
        
        return sortedByPerf[0];
    }, [players, quiz]);
    
    const fastestFinger = useMemo(() => {
        if (!players || !quiz || quiz?.config?.clanBased) return null;

        let fastest: { player: Player; time: number } | null = null;

        for (const player of players) {
            for (const answer of player.answers) {
                const question = quiz.questions.find(q => q.id === answer.questionId);
                if (question && question.type === QuestionType.MCQ && answer.answer === question.correctAnswerIndex) {
                    if (!fastest || answer.timeTaken < fastest.time) {
                        fastest = { player, time: answer.timeTaken };
                    }
                }
            }
        }
        return fastest;
    }, [players, quiz]);

    const consistencyChamp = useMemo(() => {
        if (!players || !quiz || quiz?.config?.clanBased) return null;

        let champ: { player: Player; streak: number } | null = null;

        for (const player of players) {
            let currentStreak = 0;
            let maxStreak = 0;

            for (const question of quiz.questions) {
                const answer = player.answers.find(a => a.questionId === question.id);
                if (answer && question.type === QuestionType.MCQ && answer.answer === question.correctAnswerIndex) {
                    currentStreak++;
                } else {
                    maxStreak = Math.max(maxStreak, currentStreak);
                    currentStreak = 0;
                }
            }
            maxStreak = Math.max(maxStreak, currentStreak); // Final check

            if (!champ || maxStreak > champ.streak) {
                champ = { player, streak: maxStreak };
            }
        }
        
        if (champ && champ.streak > 1) { // Only award for streaks of 2 or more
            return champ;
        }

        return null;
    }, [players, quiz]);

    const highRollerAward = useMemo(() => {
        if (!players || quiz?.config?.clanBased) return null;
    
        let maxLifelines = 0;
        let bestPlayer: Player | null = null;
    
        for (const player of players) {
            const usedCount = player.answers.filter(a => a.lifelineUsed === 'fiftyFifty').length;
            if (usedCount > 0 && usedCount >= maxLifelines) {
                if (usedCount > maxLifelines || !bestPlayer || player.score > bestPlayer.score) {
                    maxLifelines = usedCount;
                    bestPlayer = player;
                }
            }
        }
    
        if (bestPlayer) {
            return { player: bestPlayer, count: maxLifelines };
        }
        return null;
    }, [players, quiz?.config?.clanBased]);

    const gamblerAward = useMemo(() => {
        if (!players || quiz?.config?.clanBased) return null;
        
        let maxUsed = 0;
        let bestPlayer: Player | null = null;
        
        for (const player of players) {
            const usedCount = player.answers.filter(a => a.lifelineUsed === 'pointDoubler' && a.score > 0).length;
            if (usedCount > 0 && usedCount >= maxUsed) {
                if (usedCount > maxUsed || !bestPlayer || player.score > bestPlayer.score) {
                    maxUsed = usedCount;
                    bestPlayer = player;
                }
            }
        }
        
        if (bestPlayer) {
            return { player: bestPlayer, count: maxUsed };
        }
        return null;
    }, [players, quiz?.config?.clanBased]);


    const playerClanRanks = useMemo(() => {
        if (!quiz?.config?.clanBased || !playerId || !players) return null;
        const player = players.find(p => p.id === playerId);
        if (!player) return null;

        const overallRank = sortedPlayers.findIndex(p => p.id === playerId) + 1;
        
        return { overallRank, score: player.score };

    }, [players, playerId, sortedPlayers, quiz?.config?.clanBased]);

    const playerRankInfo = useMemo(() => {
        if (!playerId || !sortedPlayers || sortedPlayers.length === 0) return null;
        const playerIndex = sortedPlayers.findIndex(p => p.id === playerId);
        if (playerIndex === -1) return null;
        return {
            rank: playerIndex + 1,
            totalPlayers: sortedPlayers.length,
            score: sortedPlayers[playerIndex].score,
        };
    }, [playerId, sortedPlayers]);

    const dashboardStats = useMemo(() => {
        if (!players || !quiz) return null;
        let totalTime = 0;
        let totalAnswers = 0;
        players.forEach(p => {
            p.answers.forEach(ans => {
                const question = quiz.questions.find(q => q.id === ans.questionId);
                // Only count time for scorable questions like MCQ and MATCH
                if (question && (question.type === QuestionType.MCQ || question.type === QuestionType.MATCH)) {
                    totalTime += ans.timeTaken;
                    totalAnswers++;
                }
            });
        });
        const avgTime = totalAnswers > 0 ? (totalTime / totalAnswers).toFixed(1) : 'N/A';
        return {
            participants: players.length,
            avgResponseTime: avgTime
        };
    }, [players, quiz]);

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

    useEffect(() => {
        if (!quizId || !quiz?.endTime || !isHost) return;
    
        const unsubReactions = db.collection('quizzes').doc(quizId).collection('reactions')
            .where('timestamp', '>', quiz.endTime)
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const reaction = change.doc.data();
                        setLiveReactions(prev => [...prev, { id: change.doc.id, emoji: reaction.emoji }]);
                    }
                });
            });
    
        return () => unsubReactions();
    }, [quizId, quiz, isHost]);

    useEffect(() => {
        // Prevent the countdown from starting or progressing until all data is loaded.
        if (!quiz || !players) {
            return;
        }

        if (revealStep !== 'countdown') return;

        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            if (quiz.config?.clanBased) {
                setRevealStep('all');
            } else {
                setRevealStep('podium-3');
            }
        }
    }, [countdown, revealStep, quiz, players]);

    useEffect(() => {
        if (quiz?.config?.clanBased) return; // This sequence is not for clan battles.

        if (revealStep === 'podium-3' || revealStep === 'podium-2' || revealStep === 'podium-1') {
            const timer = setTimeout(() => {
                if (revealStep === 'podium-3') setRevealStep('podium-2');
                else if (revealStep === 'podium-2') setRevealStep('podium-1');
                else if (revealStep === 'podium-1') setRevealStep('awards');
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [revealStep, quiz?.config?.clanBased]);
    
    useEffect(() => {
        if (revealStep === 'all' && quiz?.config?.clanBased && players && playerId && sortedClans.length > 0) {
            const player = players.find(p => p.id === playerId);
            const winnerClan = sortedClans[0];
            if (player?.clan === winnerClan?.clan) {
                setOpenSection('winner');
            } else {
                setOpenSection('runner-up');
            }
        }
    }, [revealStep, quiz, players, playerId, sortedClans]);

    const handleSendReaction = async (emoji: string) => {
        if (!quizId || !playerId) return;
        try {
            // Supabase equivalent
            const { error } = await supabase
                .from('quiz_reactions')
                .insert({
                    quiz_id: quizId,
                    emoji,
                    player_id: playerId,
                    timestamp: new Date().toISOString()
                });

            if (error) {
                throw error;
            }
        } catch (error) {
            console.error("Error sending reaction:", error);
        }
    };
    
    const MVPList: React.FC<{ players: Player[] }> = ({ players }) => (
        <div className="space-y-3">
            {players.map((p, index) => (
                <div key={p.id} className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                    <span className="font-bold text-slate-400 text-lg w-8">{index + 1}.</span>
                    <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full mr-3"/>
                    <div className="flex-grow truncate">
                        <p className="font-semibold text-slate-800 truncate text-lg">{p.name}</p>
                        <p className="text-sm text-gl-orange-600 font-bold">{p.score} pts</p>
                    </div>
                </div>
            ))}
        </div>
    );
    
    const CollapsibleSection: React.FC<{ title: string; sectionId: 'winner' | 'runner-up' | 'potm' | 'fastest' | 'consistency' | 'high-roller' | 'gambler'; children: React.ReactNode; icon: React.ReactNode }> = ({ title, sectionId, children, icon }) => {
        const isOpen = openSection === sectionId;
        return (
            <div className="bg-white/80 border border-slate-200 rounded-xl shadow-md overflow-hidden transition-all duration-300">
                <button onClick={() => setOpenSection(isOpen ? null : sectionId)} className="w-full flex justify-between items-center p-4 text-left font-bold text-lg text-slate-800 hover:bg-slate-50">
                    <span className="flex items-center gap-3">{icon} {title}</span>
                    <svg className={`w-6 h-6 transition-transform text-slate-500 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {isOpen && (
                    <div className="p-4 border-t border-slate-200 animate-fade-in bg-white">
                        {children}
                    </div>
                )}
            </div>
        );
    };


    if (!quiz || !players) {
        return <PageLoader message="Tallying the final scores..." />;
    }
    
    if (quiz.config?.clanBased) {
        const winnerClan = sortedClans[0];
        const runnerUpClan = sortedClans[1];
        
        if(isPlayerView) {
             const currentPlayer = players?.find(p => p.id === playerId);
             const playerClanName = currentPlayer?.clan ? (quiz?.config?.clanNames?.[currentPlayer.clan] || currentPlayer.clan) : null;
                
             return (
                <div className="flex-grow flex flex-col items-center justify-center p-4 relative overflow-hidden">
                    {(revealStep === 'all') && <ConfettiCelebration />}
                    <div className="relative z-10 w-full flex flex-col items-center p-4 sm:p-8 pb-32 sm:pb-40">
                         {revealStep === 'countdown' ? (
                            <>
                                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-800 animate-pulse text-center">The results are in...</h1>
                                <div className="text-9xl font-bold text-gl-orange-500 mt-8 animate-pop-in" key={countdown}>{countdown}</div>
                            </>
                        ) : (
                             <>
                                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-800">Battle Board</h1>
                                <h2 className="text-xl sm:text-2xl text-slate-500 mb-6">{quiz.title}</h2>
                            </>
                        )}
                        {revealStep === 'all' && (
                             <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 animate-fade-in">
                                {playerClanRanks && (
                                    <>
                                        <Card className="!p-4 animate-slide-in-up shadow-xl border-gl-orange-400">
                                            <h2 className="text-xl font-bold text-center mb-3 text-slate-800">Your Results</h2>
                                            <div className="grid grid-cols-2 text-center divide-x divide-slate-200">
                                                <div>
                                                    <p className="text-2xl sm:text-3xl font-bold text-gl-orange-600">
                                                        #{playerClanRanks.overallRank}
                                                        <span className="text-base font-normal text-slate-500"> / {players.length}</span>
                                                    </p>
                                                    <p className="text-xs sm:text-sm text-slate-500">Overall Rank</p>
                                                </div>
                                                <div>
                                                    <p className="text-2xl sm:text-3xl font-bold text-gl-orange-600">{playerClanRanks.score}</p>
                                                    <p className="text-xs sm:text-sm text-slate-500">Final Score</p>
                                                </div>
                                            </div>
                                        </Card>
                                        {playerClanName && (
                                            <p className="text-center text-slate-600 -mt-2">
                                                You fought for the <span className="font-bold text-slate-700">{playerClanName}</span>.
                                            </p>
                                        )}
                                    </>
                                )}
                                {winnerClan && (
                                    <CollapsibleSection title={`Winner: ${quiz.config?.clanNames?.[winnerClan.clan] || winnerClan.clan}`} sectionId="winner" icon={<TrophyIcon className="w-6 h-6 text-yellow-500"/>}>
                                        <MVPList players={winnerClan.players.slice(0, 3)} />
                                    </CollapsibleSection>
                                )}
                                 {runnerUpClan && (
                                    <CollapsibleSection title={`Runner-Up: ${quiz.config?.clanNames?.[runnerUpClan.clan] || runnerUpClan.clan}`} sectionId="runner-up" icon={<span className="text-2xl">🥈</span>}>
                                        <MVPList players={runnerUpClan.players.slice(0, 3)} />
                                    </CollapsibleSection>
                                )}
                                {playerOfTheMatch && (
                                    <CollapsibleSection title="Player of the Match" sectionId="potm" icon={<StarIcon className="w-7 h-7" />}>
                                        <div className="flex items-center bg-white p-3 rounded-lg">
                                            <img src={playerOfTheMatch.avatar} alt={playerOfTheMatch.name} className="w-12 h-12 rounded-full mr-4"/>
                                            <div className="flex-grow truncate">
                                                <p className="font-bold text-slate-800 text-xl">{playerOfTheMatch.name}</p>
                                                <p className="text-base text-gl-orange-600 font-bold">{playerOfTheMatch.score} pts</p>
                                                {playerOfTheMatch.clan && <p className="text-sm text-slate-500">{quiz.config?.clanNames?.[playerOfTheMatch.clan] || playerOfTheMatch.clan}</p>}
                                            </div>
                                        </div>
                                    </CollapsibleSection>
                                )}
                            </div>
                        )}
                    </div>
                    {playerId && revealStep !== 'countdown' && <ReactionSender onSend={handleSendReaction} />}
                </div>
             );
        }

        return (
            <div className="flex-grow flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {(revealStep === 'all') && <ConfettiCelebration />}
                {isHost && (
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                        {liveReactions.map(r => (
                            <FloatingReaction 
                                key={r.id} 
                                emoji={r.emoji} 
                                onComplete={() => setLiveReactions(prev => prev.filter(lr => lr.id !== r.id))}
                            />
                        ))}
                    </div>
                )}
                <div className={`relative z-10 w-full flex flex-col items-center p-8`}>
                     {revealStep === 'countdown' ? (
                        <>
                            <h1 className="text-5xl font-extrabold tracking-tight text-slate-800 animate-pulse">And the winner is...</h1>
                            <div className="text-9xl font-bold text-gl-orange-500 mt-8 animate-pop-in" key={countdown}>{countdown}</div>
                        </>
                    ) : (
                        <>
                            <h1 className="text-5xl font-extrabold tracking-tight text-slate-800">Battle Board</h1>
                            <h2 className="text-2xl text-slate-500 mb-8">{quiz.title}</h2>
                        </>
                    )}

                    {revealStep === 'all' && (
                         <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-7 gap-6 items-start animate-fade-in">
                            {runnerUpClan && (
                                <div className="lg:col-span-2 bg-white/50 border border-slate-200 rounded-2xl p-6 shadow-lg flex flex-col items-center h-full">
                                    <h3 className="text-2xl font-bold text-center mb-4 text-slate-500">RUNNER-UP</h3>
                                    <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-4xl font-bold mb-2">🥈</div>
                                    <h2 className="text-3xl font-extrabold text-slate-700 text-center">{quiz.config?.clanNames?.[runnerUpClan.clan] || runnerUpClan.clan}</h2>
                                    <p className="text-2xl font-bold text-slate-600 mb-6">{runnerUpClan.score} pts</p>
                                    <div className="w-full">
                                        <h4 className="text-lg font-bold text-center mb-3 text-slate-800">MVPs</h4>
                                        <MVPList players={runnerUpClan.players.slice(0, 3)} />
                                    </div>
                                </div>
                            )}
                            {winnerClan && (
                                <div className="lg:col-span-3 flex flex-col items-center order-first lg:order-none">
                                    <h3 className="text-4xl font-bold text-center mb-4 text-slate-600">Winning Clan</h3>
                                    <Trophy3D />
                                    <h2 className="text-6xl font-extrabold my-2 text-transparent bg-clip-text bg-gradient-to-r from-gl-orange-500 to-yellow-500 text-center">{quiz.config?.clanNames?.[winnerClan.clan] || winnerClan.clan}</h2>
                                    <p className="text-4xl font-bold text-slate-700 mb-8">{winnerClan.score} pts</p>
                                    <div className="w-full bg-white/50 border border-slate-200 rounded-2xl p-6 shadow-inner">
                                        <h3 className="text-2xl font-bold text-center mb-4 text-slate-800">MVPs</h3>
                                        <MVPList players={winnerClan.players.slice(0, 3)} />
                                    </div>
                                </div>
                            )}
                            {playerOfTheMatch && (
                                <div className="lg:col-span-2 bg-white/50 border border-slate-200 rounded-2xl p-6 shadow-lg flex flex-col items-center h-full">
                                    <h3 className="text-2xl font-bold text-center mb-4 text-slate-500">PLAYER OF THE MATCH</h3>
                                    <div className="my-2"><StarIcon className="w-20 h-20" /></div>
                                    <img src={playerOfTheMatch.avatar} alt={playerOfTheMatch.name} className="w-20 h-20 rounded-full border-4 border-white bg-slate-200 shadow-lg my-2" />
                                    <p className="font-bold text-2xl text-slate-800 text-center">{playerOfTheMatch.name}</p>
                                    <p className="text-lg font-semibold text-gl-orange-600">{playerOfTheMatch.score} pts</p>
                                    {playerOfTheMatch.clan && <p className="text-sm font-semibold text-slate-500 mt-1">{quiz.config?.clanNames?.[playerOfTheMatch.clan] || playerOfTheMatch.clan}</p>}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="mt-12 flex flex-col items-center gap-8">
                        {isHost && revealStep === 'all' && (
                             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link to="/" className="inline-block bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105 animate-fade-in">
                                    Go to Home
                                </Link>
                                <Link to={`/report/${quizId}`} className="inline-flex items-center gap-2 bg-gl-orange-600 hover:bg-gl-orange-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105 animate-fade-in" style={{animationDelay: '200ms'}}>
                                    <ChartBarIcon />
                                    View Quiz Report
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
    
    // Individual Leaderboard
    const topThree = sortedPlayers.slice(0, 3);
    
    // Player view for Individual quiz
    if (isPlayerView) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {(revealStep === 'podium-1' || revealStep === 'all' || revealStep === 'awards') && <ConfettiCelebration />}
                 <div className="relative z-10 w-full flex flex-col items-center p-4 sm:p-8 pb-32 sm:pb-40">
                    {revealStep === 'countdown' ? (
                        <>
                            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-800 animate-pulse text-center">The results are in...</h1>
                            <div className="text-9xl font-bold text-gl-orange-500 mt-8 animate-pop-in" key={countdown}>{countdown}</div>
                        </>
                    ) : (
                         <>
                            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-800">Final Results</h1>
                            <h2 className="text-xl sm:text-2xl text-slate-500 mb-6">{quiz.title}</h2>
                            <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
                                <div className="flex items-end justify-center gap-2 sm:gap-4 mb-4">
                                    {topThree[1] && <PodiumSlot player={topThree[1]} rank={2} height="120px" color="bg-slate-300 text-slate-700" visible={revealStep === 'podium-2' || revealStep === 'podium-1' || revealStep === 'all' || revealStep === 'awards'} />}
                                    {topThree[0] && <PodiumSlot player={topThree[0]} rank={1} height="180px" color="bg-yellow-400 text-yellow-800" visible={revealStep === 'podium-1' || revealStep === 'all' || revealStep === 'awards'} />}
                                    {topThree[2] && <PodiumSlot player={topThree[2]} rank={3} height="90px" color="bg-orange-300 text-orange-800" visible={revealStep === 'podium-3' || revealStep === 'podium-2' || revealStep === 'podium-1' || revealStep === 'all' || revealStep === 'awards'} />}
                                </div>
                                
                                {(revealStep === 'awards' || revealStep === 'all') && (
                                    <div className="animate-fade-in space-y-4" style={{ animationDelay: '500ms' }}>
                                        {playerRankInfo && (
                                            <Card className="!p-4 animate-slide-in-up shadow-xl border-gl-orange-400">
                                                <h2 className="text-xl font-bold text-center mb-3 text-slate-800">Your Results</h2>
                                                <div className="grid grid-cols-2 text-center divide-x divide-slate-200">
                                                    <div>
                                                        <p className="text-2xl sm:text-3xl font-bold text-gl-orange-600">
                                                            #{playerRankInfo.rank}
                                                            <span className="text-base font-normal text-slate-500"> / {playerRankInfo.totalPlayers}</span>
                                                        </p>
                                                        <p className="text-xs sm:text-sm text-slate-500">Overall Rank</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl sm:text-3xl font-bold text-gl-orange-600">{playerRankInfo.score}</p>
                                                        <p className="text-xs sm:text-sm text-slate-500">Final Score</p>
                                                    </div>
                                                </div>
                                            </Card>
                                        )}

                                        {fastestFinger && (
                                            <CollapsibleSection title="Fastest Finger" sectionId="fastest" icon={<LightningIcon className="w-6 h-6 text-yellow-500"/>}>
                                                <div className="flex items-center bg-white p-3 rounded-lg">
                                                    <img src={fastestFinger.player.avatar} alt={fastestFinger.player.name} className="w-12 h-12 rounded-full mr-4"/>
                                                    <div className="flex-grow truncate">
                                                        <p className="font-bold text-slate-800 text-xl">{fastestFinger.player.name}</p>
                                                        <p className="text-base text-gl-orange-600 font-bold">{fastestFinger.time.toFixed(2)}s response</p>
                                                    </div>
                                                </div>
                                            </CollapsibleSection>
                                        )}
                                        {highRollerAward && (
                                            <CollapsibleSection title="High Roller" sectionId="high-roller" icon={<HighRollerIcon className="w-6 h-6 text-purple-500"/>}>
                                                <div className="flex items-center bg-white p-3 rounded-lg">
                                                    <img src={highRollerAward.player.avatar} alt={highRollerAward.player.name} className="w-12 h-12 rounded-full mr-4"/>
                                                    <div className="flex-grow truncate">
                                                        <p className="font-bold text-slate-800 text-xl">{highRollerAward.player.name}</p>
                                                        <p className="text-base text-gl-orange-600 font-bold">Used 50:50 {highRollerAward.count} time{highRollerAward.count > 1 ? 's' : ''}</p>
                                                    </div>
                                                </div>
                                            </CollapsibleSection>
                                        )}
                                        {gamblerAward && (
                                            <CollapsibleSection title="The Gambler" sectionId="gambler" icon={<GamblerIcon className="w-6 h-6 text-blue-500"/>}>
                                                <div className="flex items-center bg-white p-3 rounded-lg">
                                                    <img src={gamblerAward.player.avatar} alt={gamblerAward.player.name} className="w-12 h-12 rounded-full mr-4"/>
                                                    <div className="flex-grow truncate">
                                                        <p className="font-bold text-slate-800 text-xl">{gamblerAward.player.name}</p>
                                                        <p className="text-base text-gl-orange-600 font-bold">Used 2x {gamblerAward.count} time(s)</p>
                                                    </div>
                                                </div>
                                            </CollapsibleSection>
                                        )}
                                        {consistencyChamp && (
                                            <CollapsibleSection title="Consistency Champ" sectionId="consistency" icon={<StreakIcon className="w-6 h-6 text-blue-500"/>}>
                                                <div className="flex items-center bg-white p-3 rounded-lg">
                                                    <img src={consistencyChamp.player.avatar} alt={consistencyChamp.player.name} className="w-12 h-12 rounded-full mr-4"/>
                                                    <div className="flex-grow truncate">
                                                        <p className="font-bold text-slate-800 text-xl">{consistencyChamp.player.name}</p>
                                                        <p className="text-base text-gl-orange-600 font-bold">{consistencyChamp.streak} correct answers in a row</p>
                                                    </div>
                                                </div>
                                            </CollapsibleSection>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                 </div>
                 {playerId && revealStep !== 'countdown' && <ReactionSender onSend={handleSendReaction} />}
            </div>
        );
    }

    // Host view for Individual quiz
    const awards = [];
    if (fastestFinger) {
        awards.push(<AwardCard key="fastest-finger" icon={<LightningIcon className="w-12 h-12" />} title="Fastest Finger" winner={{ player: fastestFinger.player, metric: `${fastestFinger.time.toFixed(2)}s response` }} />);
    }
    if (consistencyChamp) {
        awards.push(<AwardCard key="consistency-champ" icon={<StreakIcon className="w-12 h-12" />} title="Consistency Champ" winner={{ player: consistencyChamp.player, metric: `${consistencyChamp.streak} question streak` }} />);
    }
    if (highRollerAward) {
        awards.push(<AwardCard key="high-roller" icon={<HighRollerIcon className="w-12 h-12 text-purple-500" />} title="High Roller" winner={{ player: highRollerAward.player, metric: `Used 50:50 ${highRollerAward.count} time${highRollerAward.count > 1 ? 's' : ''}` }} />);
    }
    if (gamblerAward) {
        awards.push(<AwardCard key="gambler" icon={<GamblerIcon className="w-12 h-12 text-blue-500" />} title="The Gambler" winner={{ player: gamblerAward.player, metric: `Used 2x ${gamblerAward.count} time(s)` }} />);
    }

    const gridColsMap: { [key: number]: string } = {
        1: 'lg:grid-cols-1',
        2: 'lg:grid-cols-2',
        3: 'lg:grid-cols-3',
        4: 'lg:grid-cols-4',
    };
    const gridColsClass = gridColsMap[awards.length] || 'lg:grid-cols-4';


    return (
        <div className="flex-grow flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {(revealStep === 'podium-1' || revealStep === 'all' || revealStep === 'awards') && <ConfettiCelebration />}
            {isHost && (
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                    {liveReactions.map(r => (
                        <FloatingReaction 
                            key={r.id} 
                            emoji={r.emoji} 
                            onComplete={() => setLiveReactions(prev => prev.filter(lr => lr.id !== r.id))}
                        />
                    ))}
                </div>
            )}
            <div className={`relative z-10 w-full flex flex-col items-center p-8 ${playerId ? 'sm:pb-40' : ''}`}>
                
                {revealStep === 'countdown' ? (
                     <>
                        <h1 className="text-5xl font-extrabold tracking-tight text-slate-800 animate-pulse">And the winner is...</h1>
                        <div className="text-9xl font-bold text-gl-orange-500 mt-8 animate-pop-in" key={countdown}>{countdown}</div>
                    </>
                ) : (
                    <>
                         <h1 className="text-5xl font-extrabold tracking-tight text-slate-800">Final Leaderboard</h1>
                         <h2 className="text-2xl text-slate-500 mb-8">{quiz.title}</h2>
                    </>
                )}

                {(revealStep !== 'countdown') && (
                    <div className="w-full max-w-7xl mx-auto mt-8">
                        <div className="flex items-end justify-center gap-2 sm:gap-4">
                            {topThree[1] && <PodiumSlot player={topThree[1]} rank={2} height="120px" color="bg-slate-300 text-slate-700" visible={revealStep === 'podium-2' || revealStep === 'podium-1' || revealStep === 'all' || revealStep === 'awards'} />}
                            {topThree[0] && <PodiumSlot player={topThree[0]} rank={1} height="180px" color="bg-yellow-400 text-yellow-800" visible={revealStep === 'podium-1' || revealStep === 'all' || revealStep === 'awards'} />}
                            {topThree[2] && <PodiumSlot player={topThree[2]} rank={3} height="90px" color="bg-orange-300 text-orange-800" visible={revealStep === 'podium-3' || revealStep === 'podium-2' || revealStep === 'podium-1' || revealStep === 'all' || revealStep === 'awards'} />}
                        </div>
                        
                        {awards.length > 0 && (
                             <div className={`grid grid-cols-1 md:grid-cols-2 ${gridColsClass} gap-6 mt-12 transition-opacity duration-500 ${revealStep === 'awards' ? 'opacity-100' : 'opacity-0'}`}>
                                {awards}
                            </div>
                        )}
                    </div>
                )}
                
                {dashboardStats && (
                    <div className={`w-full max-w-3xl mx-auto mt-12 opacity-0 ${revealStep === 'awards' ? 'animate-slide-in-up' : ''}`} style={{animationDelay: '900ms'}}>
                        <Card>
                            <h3 className="text-2xl font-bold text-center mb-6 text-slate-800">Quiz Stats</h3>
                            <div className="flex justify-around text-center">
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-3">
                                        <UsersIcon className="w-10 h-10 text-gl-orange-500" />
                                        <p className="text-4xl font-bold text-gl-orange-600">{dashboardStats.participants}</p>
                                    </div>
                                    <p className="text-slate-500 mt-2">Participants</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-3">
                                        <ClockIcon className="w-10 h-10 text-gl-orange-500" />
                                        <p className="text-4xl font-bold text-gl-orange-600">{dashboardStats.avgResponseTime}s</p>
                                    </div>
                                    <p className="text-slate-500 mt-2">Avg. Response Time</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                <div className="mt-12">
                    {isHost && (revealStep === 'awards' || revealStep === 'all') && (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/" className="inline-block bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105 animate-fade-in">
                                Go to Home
                            </Link>
                            <Link to={`/report/${quizId}`} className="inline-flex items-center gap-2 bg-gl-orange-600 hover:bg-gl-orange-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105 animate-fade-in" style={{animationDelay: '200ms'}}>
                                <ChartBarIcon />
                                View Quiz Report
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {playerId && revealStep !== 'countdown' && <ReactionSender onSend={handleSendReaction} />}
        </div>
    );
};

export default LeaderboardPage;
import React, { useState, useEffect, useMemo } from 'react';
import type { Player, Quiz, PlayerAnswer } from '../types.ts';
import { Clan } from '../types.ts';
import { ClockIcon } from '../icons/ClockIcon.tsx';
import { ClanFlag } from './ClanFlag.tsx';
import { PointDoublerIcon } from '../icons/PointDoublerIcon.tsx';
import { FiftyFiftyIcon } from '../icons/FiftyFiftyIcon.tsx';

const RankChangeIndicator: React.FC<{ change: number }> = ({ change }) => {
    if (change > 0) {
        return <span className="flex items-center justify-center gap-1 text-green-500 font-bold text-base w-10">▲{change}</span>;
    }
    if (change < 0) {
        return <span className="flex items-center justify-center gap-1 text-red-500 font-bold text-base w-10">▼{Math.abs(change)}</span>;
    }
    return <span className="text-slate-400 font-bold text-lg w-10">-</span>;
};

export const IntermediateLeaderboard: React.FC<{
    players: Player[];
    quiz: Quiz;
    highlightPlayerId?: string;
    animate: boolean;
    strategicTip?: string;
}> = ({ players, quiz, highlightPlayerId, animate, strategicTip }) => {
    const [leaderboardData, setLeaderboardData] = useState<{ player: Player; oldRank: number; newRank: number; rankChange: number; timeTaken?: number; lastAnswer?: PlayerAnswer; }[]>([]);
    const [clanLeaderboardData, setClanLeaderboardData] = useState<{ clan: Clan; score: number; oldRank: number; newRank: number; rankChange: number; players: { player: Player, timeTaken?: number }[] }[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const playerClan = useMemo(() => players.find(p => p.id === highlightPlayerId)?.clan, [players, highlightPlayerId]);

    useEffect(() => {
        if (!quiz || players.length === 0) return;

        const question = quiz.questions[quiz.currentQuestionIndex];
        if (!question) return;

        const isFirstQuestionLeaderboard = quiz.currentQuestionIndex === 0;

        if (quiz.config.clanBased) {
            const activeClans = Array.from(new Set(players.map(p => p.clan).filter(Boolean))) as Clan[];

            const clanStats: Record<string, { totalScore: number; playerCount: number; prevTotalScore: number }> = {};
            activeClans.forEach(clan => {
                clanStats[clan] = { totalScore: 0, playerCount: 0, prevTotalScore: 0 };
            });

            for (const p of players) {
                if (p.clan) {
                    clanStats[p.clan].playerCount++;
                    clanStats[p.clan].totalScore += p.score;
                    const lastAnswer = p.answers.find(a => a.questionId === question.id);
                    const prevScore = p.score - (lastAnswer?.score || 0);
                    clanStats[p.clan].prevTotalScore += prevScore;
                }
            }

            const getAvg = (total: number, count: number) => count > 0 ? total / count : 0;
            
            const currentClanScores = Object.fromEntries(
                activeClans.map(clan => [clan, getAvg(clanStats[clan].totalScore, clanStats[clan].playerCount)])
            );
            const prevClanScores = Object.fromEntries(
                activeClans.map(clan => [clan, getAvg(clanStats[clan].prevTotalScore, clanStats[clan].playerCount)])
            );

            const currentSortedClans = Object.keys(currentClanScores).sort((a, b) => currentClanScores[b] - currentClanScores[a]);
            const prevSortedClans = Object.keys(prevClanScores).sort((a, b) => prevClanScores[b] - prevClanScores[a]);
            const prevRankMap = new Map(prevSortedClans.map((clan, i) => [clan, i]));
            
            const data = currentSortedClans.map((clanStr, newIndex) => {
                const clan = clanStr as Clan;
                const oldIndex = isFirstQuestionLeaderboard ? newIndex : (prevRankMap.get(clan) ?? newIndex);
                const rankChange = oldIndex - newIndex;
                const clanPlayers = players
                    .filter(p => p.clan === clan)
                    .map(p => {
                        const lastAnswer = p.answers.find(a => a.questionId === question.id);
                        return { player: p, timeTaken: lastAnswer?.timeTaken };
                    })
                    .sort((a, b) => b.player.score - a.player.score)
                    .slice(0, 3);
                return { clan, score: Math.round(currentClanScores[clan]), oldRank: oldIndex, newRank: newIndex, rankChange, players: clanPlayers };
            });
            setClanLeaderboardData(data);
        } else {
            const currentSortedPlayers = [...players].sort((a, b) => b.score - a.score);
            const prevScores = new Map(players.map(p => {
                const lastAnswer = p.answers.find(a => a.questionId === question.id);
                const prevScore = p.score - (lastAnswer?.score || 0);
                return [p.id, prevScore];
            }));
            const prevSortedPlayers = [...players].sort((a, b) => (prevScores.get(b.id) || 0) - (prevScores.get(a.id) || 0));
            const prevRankMap = new Map(prevSortedPlayers.map((p, i) => [p.id, i]));
            
            const data = currentSortedPlayers.map((player, newIndex) => {
                const oldIndex = isFirstQuestionLeaderboard ? newIndex : (prevRankMap.get(player.id) ?? newIndex);
                const lastAnswer = player.answers.find(a => a.questionId === question.id);
                return {
                    player,
                    oldRank: oldIndex,
                    newRank: newIndex,
                    rankChange: oldIndex - newIndex,
                    timeTaken: lastAnswer?.timeTaken,
                    lastAnswer: lastAnswer
                };
            });
            setLeaderboardData(data);
        }
        
        if (animate) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), players.length * 100 + 500);
            return () => clearTimeout(timer);
        }
    }, [players, quiz, animate]);

    return (
        <>
            <div className="w-full max-w-4xl mx-auto animate-fade-in relative">
                {quiz.config.clanBased ? (
                    <div className="space-y-4">
                        {clanLeaderboardData.map(({ clan, score, rankChange, players, newRank }, index) => {
                             const isPlayerInThisClan = playerClan === clan;
                             const animationDelay = isAnimating ? `${index * 100}ms` : '0ms';
                            return (
                                <div key={clan} className={`p-4 rounded-xl border-2 transition-all duration-500 transform ${isPlayerInThisClan ? 'player-clan-glow' : 'bg-white/80 border-slate-200'} ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`} style={{ transitionDelay: animationDelay }}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="font-extrabold text-2xl text-slate-400 w-8">{newRank + 1}.</span>
                                            <ClanFlag clan={clan} quiz={quiz}/>
                                            <div className="flex flex-col">
                                                <h3 className="text-2xl font-bold text-slate-800">{quiz.config.clanNames?.[clan] || clan}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                     {players.map(({player}) => (
                                                        <img key={player.id} src={player.avatar} alt={player.name} className="w-8 h-8 rounded-full border-2 border-white" title={player.name} />
                                                     ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <RankChangeIndicator change={rankChange} />
                                            <p className="text-2xl font-bold text-gl-orange-600 text-right w-32">{score} pts</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                        <h2 className="text-2xl sm:text-3xl font-extrabold p-6 text-center text-slate-800 tracking-tight bg-white/70">Leaderboard</h2>
                        <div className="overflow-y-auto max-h-[calc(100vh-400px)] custom-scrollbar">
                            {leaderboardData.map(({ player, rankChange, timeTaken, lastAnswer }, index) => {
                                const isHighlighted = player.id === highlightPlayerId;
                                const animationDelay = isAnimating ? `${index * 100}ms` : '0ms';
                                const isCorrect = lastAnswer && lastAnswer.score > 0;
                                return (
                                    <div key={player.id} className={`flex items-center p-3 gap-3 border-t border-slate-200 transition-all duration-500 ${isHighlighted ? 'bg-gl-orange-100' : ''} ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`} style={{ transitionDelay: animationDelay }}>
                                        <span className="font-extrabold text-xl text-slate-400 w-8 text-center">{index + 1}.</span>
                                        <img src={player.avatar} alt={player.name} className="w-12 h-12 rounded-full flex-shrink-0" />
                                        <p className="font-bold text-lg flex-grow truncate">{player.name}</p>
                                        <div className="flex items-center gap-3 text-slate-500 flex-shrink-0">
                                            <RankChangeIndicator change={rankChange} />
                                            {lastAnswer?.lifelineUsed === 'pointDoubler' && isCorrect && <PointDoublerIcon className="w-6 h-6 text-yellow-500 animate-icon-pulse" title="Point Doubler Used" />}
                                            {lastAnswer?.lifelineUsed === 'fiftyFifty' && <FiftyFiftyIcon className="w-6 h-6 text-purple-500" title="50:50 Used" />}
                                            <div className="flex items-center gap-1 w-16 justify-end" title={`Answered in ${timeTaken?.toFixed(1) || 'N/A'}s`}>
                                                <ClockIcon className="w-5 h-5"/>
                                                <span className="font-semibold text-sm">{timeTaken?.toFixed(1) || '--'}s</span>
                                            </div>
                                            <p className="font-bold text-xl text-gl-orange-600 w-24 text-right">{player.score} pts</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            {highlightPlayerId && (
                <div className="w-full max-w-lg mx-auto mt-8 animate-slide-in-up text-center px-4">
                    {strategicTip && (
                        <div className="mb-6">
                            <p className="font-bold text-xl text-slate-700 flex items-center justify-center gap-2">
                                <span role="img" aria-label="light bulb">💡</span>
                                Strategic Tip
                            </p>
                            <p className="mt-2 text-slate-600 text-lg">{strategicTip}</p>
                        </div>
                    )}
                    <p className="font-semibold text-slate-600 text-xl sm:text-2xl animate-pulse">
                        Waiting for host to continue...
                    </p>
                </div>
            )}
        </>
    );
};
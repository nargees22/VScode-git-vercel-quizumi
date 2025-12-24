import React from 'react';
import type { Player } from '../../types.ts';

const PlayerConsole: React.FC<{ player: Player | null; playerStats: { rank: string; pointsBehind: number; isLeader: boolean; }; isDarkTheme: boolean }> = ({ player, playerStats, isDarkTheme }) => {
    if (!player) return null;
    const themeClasses = isDarkTheme 
        ? 'bg-black/30 backdrop-blur-md text-white border-white/20' 
        : 'bg-white/70 backdrop-blur-md text-slate-800 border-slate-200';

    return (
        <div className={`w-full max-w-4xl mx-auto p-3 rounded-2xl border shadow-xl animate-slide-in-up ${themeClasses}`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <img src={player.avatar} alt="Your avatar" className="w-12 h-12 rounded-full border-2 border-white/50 shadow-lg"/>
                    <div>
                        <p className="font-bold text-lg leading-tight">{player.name}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-3xl leading-tight">#{playerStats.rank}</p>
                    {playerStats.isLeader ? (
                        <p className={`text-sm font-semibold ${isDarkTheme ? 'text-yellow-300' : 'text-amber-600'} animate-pulse`}>You're in the lead!</p>
                    ) : (
                        <p className={`text-sm ${isDarkTheme ? 'opacity-80' : 'text-slate-600'}`}>{playerStats.pointsBehind} pts behind 1st</p>
                    )}
                </div>
            </div>
        </div>
    );
};
export const MemoizedPlayerConsole = React.memo(PlayerConsole);
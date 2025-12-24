import React, { useEffect, useMemo } from 'react';
import type { Quiz, Player } from '../../types.ts';
import { Clan } from '../../types.ts';
import { playSound } from '../utils/audio';

// Fix: Corrected component implementation to export ClanBattleIntro as expected by Host and Player pages
export const ClanBattleIntro: React.FC<{ quiz: Quiz; players: Player[]; playerId?: string }> = ({ quiz, players, playerId }) => {
    useEffect(() => {
        playSound('battle');
    }, []);

    const currentPlayer = useMemo(() => {
        if (!playerId) return null;
        return players.find(p => p.id === playerId);
    }, [players, playerId]);

    const clanButtonColors: Record<Clan, string> = {
        [Clan.TITANS]: 'bg-red-600',
        [Clan.DEFENDERS]: 'bg-blue-600',
    };

    const clanName = quiz.config.clanNames?.[currentPlayer?.clan as Clan] || currentPlayer?.clan;
    const buttonColor = currentPlayer?.clan ? clanButtonColors[currentPlayer.clan] : 'bg-gray-500';


    return (
        <div className="fixed inset-0 z-50 bg-clan-battle-bg text-white flex flex-col items-center justify-center p-8 overflow-hidden">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-center mb-12 animate-zoom-in-out" style={{ textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>
                Let the Clan Battle Begin!
            </h1>

            {currentPlayer && currentPlayer.clan && (
                <div className="flex flex-col items-center animate-fade-in" style={{animationDelay: '500ms'}}>
                    <div className={`${buttonColor} text-white font-bold py-3 px-12 rounded-lg text-2xl shadow-lg mb-4`}>
                        {clanName}
                    </div>
                     <div className="p-1 bg-slate-800/50 rounded-lg shadow-md">
                         <img src={currentPlayer.avatar} alt="your avatar" className="w-16 h-16 rounded-full" />
                    </div>
                </div>
            )}
        </div>
    );
};
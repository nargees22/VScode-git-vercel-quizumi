import React from 'react';
import type { Player } from '../../types.ts';

export const PodiumSlot: React.FC<{ player: Player; rank: number; height: string; color: string; visible: boolean }> = ({ player, rank, height, color, visible }) => (
    <div className={`flex flex-col items-center transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <img src={player.avatar} alt={player.name} className="w-24 h-24 rounded-full border-4 border-white bg-slate-200 shadow-lg mb-2" />
        <p className="font-bold text-xl truncate max-w-[150px] text-slate-800">{player.name}</p>
        <p className="text-lg font-semibold text-slate-600">{player.score} pts</p>
        <div className={`w-32 sm:w-40 rounded-t-lg shadow-inner flex items-center justify-center text-4xl font-extrabold ${color}`} style={{ height }}>
            {rank}
        </div>
    </div>
);
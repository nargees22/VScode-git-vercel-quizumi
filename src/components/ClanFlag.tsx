import React from 'react';
import { Clan } from '../../types.ts';
import type { Quiz } from '../../types.ts';

export const ClanFlag: React.FC<{ clan: Clan, quiz: Quiz }> = ({ clan, quiz }) => {
    const clanColors: Record<Clan, { color1: string, color2: string }> = {
        [Clan.TITANS]: { color1: '#ef4444', color2: '#f97316' }, // red-500, orange-500
        [Clan.DEFENDERS]: { color1: '#3b82f6', color2: '#06b6d4' }, // blue-500, cyan-500
    };
    const colors = clanColors[clan];
    const initial = quiz.config.clanNames?.[clan]?.charAt(0) || clan.charAt(0);

    return (
        <div className="clan-flag-container">
            <div className="flag-pole"></div>
            <div 
                className="flag-fabric"
                style={{
                    '--flag-color-1': colors.color1,
                    '--flag-color-2': colors.color2
                } as React.CSSProperties}
            >
                {initial}
            </div>
        </div>
    );
};
import React from 'react';
import type { Quiz } from '../../types.ts';
import { Clan } from '../../types.ts';

export const ClanBattleVsAnimation: React.FC<{ quiz: Quiz }> = ({ quiz }) => {
    const team1Name = quiz.config.clanNames?.[Clan.TITANS] || Clan.TITANS;
    const team2Name = quiz.config.clanNames?.[Clan.DEFENDERS] || Clan.DEFENDERS;
    
    return (
        <div className="clash-animation-container">
            <div className="team-name-left">{team1Name}</div>
            <div className="sword-wrapper sword-1-wrapper">
                <svg className="sword-svg" style={{ color: '#F37037' }} viewBox="0 0 100 100" preserveAspectRatio="none">
                    <rect x="48" y="10" width="4" height="80" rx="2" fill="currentColor" />
                    <rect x="40" y="80" width="20" height="5" rx="2" fill="#94a3b8" />
                </svg>
            </div>
            <div className="sword-wrapper sword-2-wrapper">
                <svg className="sword-svg" style={{ color: '#3b82f6' }} viewBox="0 0 100 100" preserveAspectRatio="none">
                    <rect x="48" y="10" width="4" height="80" rx="2" fill="currentColor" />
                    <rect x="40" y="80" width="20" height="5" rx="2" fill="#94a3b8" />
                </svg>
            </div>
            <div className="vs-separator vs-reveal-text">VS</div>
            <div className="team-name-right">{team2Name}</div>
        </div>
    );
};
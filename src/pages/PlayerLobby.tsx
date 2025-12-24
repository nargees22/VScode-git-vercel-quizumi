// src/pages/PlayerLobby.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Quiz, Player } from '../../types';
import { GameState, Clan } from '../../types';
import { PageLoader } from '../components/PageLoader';
import { FiftyFiftyIcon } from '../icons/FiftyFiftyIcon';
import { PointDoublerIcon } from '../icons/PointDoublerIcon';
import { supabase } from '../service/supabase';

const PlayerLobby = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const playerId = useMemo(() => {
    return quizId ? localStorage.getItem(`quiz-player-${quizId}`) : null;
  }, [quizId]);
console.log('PlayerLobby render', { quizId, playerId });
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  const currentPlayer = useMemo(
    () => players.find(p => p.id === playerId),
    [players, playerId]
  );

  // ✅ SAFE redirect
  useEffect(() => {
    if (!playerId && quizId) {
      navigate(`/join/${quizId}`);
    }
  }, [playerId, quizId, navigate]);

  // 🔁 Watch quiz state (auto-redirect when host starts)
  useEffect(() => {
    if (!quizId || !playerId) return;

    const fetchQuiz = async () => {
      const { data } = await supabase
        .from('quiz_master_structure')
        .select(`
          id:quiz_id,
          game_state,
          clan_based,
          titan_name,
          defender_name,
          start_time,
          end_time,
          created_at
        `)
        .eq('quiz_id', quizId)
        .single();

      if (!data) return;

      setQuiz({
        id: data.id,
        gameState: data.game_state,
        config: {
          clanBased: data.clan_based,
          clanNames: {
            [Clan.TITANS]: data.titan_name,
            [Clan.DEFENDERS]: data.defender_name,
          },
        },
      } as Quiz);

      if (data.game_state !== GameState.LOBBY) {
        navigate(`/quiz/player/${quizId}`);
      }
    };

    fetchQuiz();

    const channel = supabase
      .channel(`player-lobby-quiz-${quizId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quiz_master_structure',
          filter: `quiz_id=eq.${quizId}`,
        },
        fetchQuiz
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [quizId, playerId, navigate]);

  // Redirect players to QuizPlayerPage.tsx when the game state changes
  useEffect(() => {
    if (quiz?.gameState === GameState.QUESTION_INTRO) {
      navigate(`/quiz/player/${quizId}`);
    }
  }, [quiz?.gameState, quizId, navigate]);

  // 🔁 Realtime players
  useEffect(() => {
    if (!quizId) return;

    const fetchPlayers = async () => {
      const { data } = await supabase
        .from('quiz_players')
        .select(`player_id, player_name, clan, avatar`)
        .eq('quiz_id', quizId);

      if (!data) return;

      setPlayers(
        data.map(p => ({
          id: p.player_id,
          name: p.player_name,
          clan: p.clan,
          avatar: p.avatar,
        }))
      );
    };

    fetchPlayers();

    const channel = supabase
      .channel(`player-lobby-players-${quizId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_players',
          filter: `quiz_id=eq.${quizId}`,
        },
        fetchPlayers
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [quizId]);

  if (!quiz) return <PageLoader message="Joining lobby..." />;

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-4xl font-bold">You're in!</h1>
      <p className="text-xl mt-4">Waiting for the host to start the quiz…</p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <FiftyFiftyIcon />
          <span>50:50 Lifeline</span>
        </div>
        <div className="flex items-center gap-3">
          <PointDoublerIcon />
          <span>Point Doubler</span>
        </div>
      </div>

      <div className="mt-6">
        {players.map((player, index) => (
          <div key={player.id || `player-${index}`}>
            {/* Render player details */}
          </div>
        ))}
      </div>

      <div className="mt-6">
        {Object.values(Clan).map((clan, index) => (
          <div key={clan || `clan-${index}`}>
            {/* Render clan details */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerLobby;

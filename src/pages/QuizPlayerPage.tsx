import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../service/supabase.ts';
import type { Quiz, Player, PlayerAnswer, Question } from '../../types.ts';
import { GameState, QuestionType, Clan } from '../../types.ts';
import { PageLoader } from '../components/PageLoader';
import { IntermediateLeaderboard } from '../components/IntermediateLeaderboard';
import { ClanBattleIntro } from '../components/ClanBattleIntro';
import { ClanBattleVsAnimation } from '../components/ClanBattleVsAnimation';
import { playSound } from '../utils/audio';
import { getUniqueMessage, getUniqueTip } from '../utils/messages';
import { PlayerQuestionActive } from '../components/PlayerQuestionActive';
import { PlayerQuestionResult } from '../components/PlayerQuestionResult';

const QuizPlayerPage = () => {
    const { quizId, playerId } = useParams<{ quizId: string; playerId: string }>();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [player, setPlayer] = useState<Player | null>(null);
    const [allPlayers, setAllPlayers] = useState<Player[]>([]);
    const [submittedAnswer, setSubmittedAnswer] = useState<PlayerAnswer['answer'] | null>(null);
    const [soundPlayed, setSoundPlayed] = useState(false);
    const localQuestionStartTimeRef = useRef<number | null>(null);
    const [currentResultMessage, setCurrentResultMessage] = useState('');
    const [strategicTip, setStrategicTip] = useState('');
    const [lastScore, setLastScore] = useState(0);
    const [hasActuallyAnswered, setHasActuallyAnswered] = useState(false);
    const [isAnswerLocked, setIsAnswerLocked] = useState(false);

    const fetchPlayers = async () => {
        if (!quizId) return;
        const { data } = await supabase.from('quiz_players').select('*').eq('quiz_id', quizId);
        if (data) {
            const mapped = data.map((p, index) => ({
                id: p.player_id,
                name: p.player_name,
                avatar: p.avatar,
                score: p.score,
                clan: p.clan,
                answers: [],
                key: p.player_id || `player-${index}` // Ensure unique key
            }));
            setAllPlayers(mapped as any);
            const current = mapped.find(p => p.id === playerId);
            if (current) setPlayer(current as any);
        }
    };

    useEffect(() => {
        if (!quizId || !playerId) {
            // navigate('/join');
            navigate(`/join/${quizId}`);
            return;
        }

        const fetchQuizData = async () => {
            const { data: qData } = await supabase.from('quiz_master_structure')
                .select(`
                    quiz_id,
                    title,
                    game_state,
                    current_question_index,
                    clan_based,
                    show_question_to_players,
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
                    gameState: qData.game_state,
                    currentQuestionIndex: qData.current_question_index,
                    config: { 
                        clanBased: qData.clan_based, 
                        showQuestionToPlayers: qData.show_question_to_players 
                    }
                } as any);
            }
        };

        fetchQuizData();
        fetchPlayers();

        const channel = supabase.channel(`player-room-${quizId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quiz_master_structure', filter: `quiz_id=eq.${quizId}` }, (payload) => {
                const newData = payload.new as any;
                setQuiz(prev => prev ? { ...prev, gameState: newData.game_state, currentQuestionIndex: newData.current_question_index } : null);
                setHasActuallyAnswered(false);
                setIsAnswerLocked(false);
                setSubmittedAnswer(null);
                localQuestionStartTimeRef.current = null;
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_players', filter: `quiz_id=eq.${quizId}` }, () => {
                fetchPlayers();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [quizId, playerId]);

    useEffect(() => {
        if (quiz?.gameState === GameState.QUESTION_ACTIVE && localQuestionStartTimeRef.current === null) {
            localQuestionStartTimeRef.current = Date.now();
        }
    }, [quiz?.gameState]);

    // Add guards for missing data and improve realtime updates

    // -----------------------------
    // GUARDS (CRITICAL)
    // -----------------------------
    if (!quiz || !player) return <PageLoader message="Connecting to quiz..." />;

    const question = quiz.questions?.[quiz.currentQuestionIndex];
    if (!question && quiz.gameState !== GameState.LEADERBOARD) {
        return <PageLoader message="Preparing question..." />;
    }

    // -----------------------------
    // ENHANCE submitAnswer LOGIC
    // -----------------------------
    const submitAnswer = useCallback(async (answerPayload: any) => {
        if (isAnswerLocked || hasActuallyAnswered || !localQuestionStartTimeRef.current || !quizId || !playerId || !question) return;

        setIsAnswerLocked(true);
        setSubmittedAnswer(answerPayload);
        playSound('survey');

        const timeTaken = (Date.now() - localQuestionStartTimeRef.current) / 1000;
        let score = 0;
        let isCorrectLocal = false;

        if (question.type === QuestionType.MCQ) {
            isCorrectLocal = answerPayload === question.correctAnswerIndex;
            if (isCorrectLocal) {
                score = Math.round(1000 + (Math.max(0, (1 - (timeTaken / question.timeLimit))) * 1000));
            }
        }

        const { error: ansError } = await supabase.from('quiz_answers').insert({
            quiz_id: quizId,
            player_id: playerId,
            question_id: question.id,
            answer: answerPayload,
            time_taken: timeTaken,
            score: score
        });

        if (!ansError) {
            await supabase.rpc('increment_player_score', { 
                p_player_id: playerId, 
                p_quiz_id: quizId, 
                p_score_increment: score 
            });
            
            setHasActuallyAnswered(true);
            setLastScore(score);
            setCurrentResultMessage(question.type === QuestionType.MCQ ? getUniqueMessage(isCorrectLocal) : "Submitted!");
        }
    }, [isAnswerLocked, hasActuallyAnswered, quizId, playerId, question]);

    // -----------------------------
    // IMPROVE renderContent LOGIC
    // -----------------------------
    const renderContent = () => {
        switch (quiz.gameState) {
            case GameState.CLAN_BATTLE_VS:
                return <ClanBattleVsAnimation quiz={quiz} />;

            case GameState.CLAN_BATTLE_INTRO:
                return <ClanBattleIntro quiz={quiz} players={allPlayers} playerId={playerId} />;

            case GameState.LEADERBOARD:
                return (
                    <div className="p-8">
                        <IntermediateLeaderboard
                            players={allPlayers}
                            quiz={quiz}
                            highlightPlayerId={playerId}
                            animate={true}
                            strategicTip={strategicTip}
                        />
                    </div>
                );

            case GameState.QUESTION_RESULT:
                // Fix: Properly handle the result view for QUESTION_RESULT state
                return (
                    <PlayerQuestionResult
                        question={question}
                        isCorrect={lastScore > 0}
                        correctMatchesCount={0}
                        currentResultMessage={currentResultMessage}
                        lifelineEarned={null}
                        setLifelineEarned={() => {}}
                    />
                );

            default:
                // Fix: Check if player already answered while in default/active state
                if (hasActuallyAnswered) {
                    return (
                        <PlayerQuestionResult
                            question={question}
                            isCorrect={lastScore > 0}
                            correctMatchesCount={0}
                            currentResultMessage={currentResultMessage}
                            lifelineEarned={null}
                            setLifelineEarned={() => {}}
                        />
                    );
                }
                return (
                    <PlayerQuestionActive
                        quiz={quiz}
                        player={player}
                        question={question}
                        allPlayers={allPlayers}
                        submitAnswer={submitAnswer}
                        lifelineUsedThisTurn={null}
                        eliminatedOptions={[]}
                        handleLifelineClick={() => {}}
                        isUsingLifeline={false}
                        canUseFiftyFifty={false}
                        canUsePointDoubler={false}
                        fiftyFiftyCost={0}
                        confirmingLifeline={null}
                        setConfirmingLifeline={() => {}}
                        handleUseLifeline={() => {}}
                    />
                );
        }
    };

    return <div className={`flex-grow flex flex-col bg-slate-50`}>{renderContent()}</div>;
};

export default QuizPlayerPage;
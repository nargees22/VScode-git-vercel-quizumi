import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// import { db } from '../../firebase';
import type { Quiz, Player } from '../../types.ts';
import { GameState, Clan } from '../../types.ts';
import { PageLoader } from '../components/PageLoader';
import Card from '../components/Card';
import Button from '../components/Button';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { CopyIcon } from '../icons/CopyIcon';
import { supabase } from '../service/supabase.ts';

const LobbyPage = () => {
    const { quizId } = useParams<{ quizId: string }>();

    if (!quizId || quizId.length !== 6) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-red-500 text-lg font-semibold">
                    Invalid Quiz Code
                </div>
            </div>
        );
    }

    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (!quizId) return;

        const fetchQuiz = async () => {
            const { data, error } = await supabase
                .from('quiz_master_structure')
                .select(`
                    id:quiz_id,
                    title,
                    game_state,
                    clan_based,
                    show_live_response_count,
                    show_question_to_players,
                    titan_name,
                    defender_name,
                    start_time,
                    end_time,
                    created_at
                `)
                .eq('quiz_id', quizId)
                .single();

            if (error) {
                console.error('Error fetching quiz:', error);
            } else {
                setQuiz(data);
            }
        };

        fetchQuiz();
    }, [quizId]);

    useEffect(() => {
        if (!quizId) return;

        const fetchPlayers = async () => {
            const { data, error } = await supabase
                .from('quiz_players')
                .select(`
                    player_id,
                    player_name,
                    clan
                `)
                .eq('quiz_id', quizId);

            if (!error && data) {
                const mappedPlayers = data.map(p => ({
                    id: p.player_id,
                    name: p.player_name,
                    clan: p.clan,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.player_name}`
                }));
                setPlayers(mappedPlayers as Player[]);
            }
        };

        fetchPlayers();

        const channel = supabase
            .channel(`lobby-${quizId}`)
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'quiz_players', filter: `quiz_id=eq.${quizId}` }, 
                () => fetchPlayers()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [quizId, navigate]);

    if (!quiz) return <PageLoader message="Loading lobby..." />;

    const joinUrl =
        window.location.href.split('#')[0].replace(/^blob:/, '') +
        `#/join/${quiz.id}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(joinUrl).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleStartQuiz = async () => {
        if (!quizId || !quiz) return;

        const nextState = quiz.config.clanBased ? GameState.CLAN_BATTLE_VS : GameState.QUESTION_INTRO;

        const { error } = await supabase
            .from('quiz_master_structure')
            .update({ game_state: nextState })
            .eq('quiz_id', quizId);

        if (!error) {
            navigate(`/#/quiz/host/${quizId}`);
        } else {
            console.error("Error updating game state:", error);
        }
    };

    return (
        <div className="flex-grow flex flex-col items-center justify-center p-4 animate-fade-in">
            <Card className="w-full max-w-4xl text-center">
                <h1 className="text-3xl font-bold mb-2 text-gl-orange-600">{quiz.title}</h1>
                <p className="text-slate-500 mb-6">Players will join using the code or QR code below.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-slate-800">Scan to Join!</h2>
                        <QRCodeDisplay text={joinUrl} />
                        <p className="mt-4 text-4xl font-extrabold tracking-widest bg-slate-100 p-4 rounded-lg text-slate-800">{quiz.id}</p>
                        <button onClick={handleCopyLink} className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg transition">
                            <CopyIcon />
                            {isCopied ? 'Copied!' : 'Copy Join Link'}
                        </button>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-slate-800">Players ({players.length})</h2>
                        {quiz.config.clanBased ? (
                            <div className="space-y-3 text-left">
                                {Object.values(Clan).map(clan => {
                                    const clanPlayers = players.filter(p => p.clan === clan);
                                    return (
                                        <div key={clan}>
                                            <h3 className="font-bold text-lg mb-1">{quiz.config.clanNames?.[clan] || clan} ({clanPlayers.length})</h3>
                                            <div className="bg-slate-50 rounded-lg p-2 min-h-[60px] max-h-32 overflow-y-auto border">
                                                {clanPlayers.length > 0 ? (
                                                    <ul className="grid grid-cols-2 gap-2">
                                                        {clanPlayers.map(p => (
                                                            <li key={p.id} className="bg-white text-slate-800 p-1.5 rounded-md font-semibold text-sm flex items-center animate-fade-in border truncate">
                                                                <img src={p.avatar} alt="avatar" className="w-6 h-6 rounded-full mr-2" />
                                                                <span className="truncate">{p.name}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : <p className="text-slate-400 text-sm p-1">No players yet.</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-lg p-4 h-64 overflow-y-auto border">
                                {players.length === 0 ? (
                                    <p className="text-slate-500">Waiting for players to join...</p>
                                ) : (
                                    <ul className="space-y-2 text-left">
                                        {players.map(p => (
                                            <li key={p.id} className="bg-white text-slate-800 p-2 rounded-md font-semibold text-lg flex items-center animate-fade-in border">
                                                <img src={p.avatar} alt="avatar" className="w-8 h-8 rounded-full mr-3" />
                                                {p.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <Button onClick={handleStartQuiz} className="bg-gl-orange-600 hover:bg-gl-orange-700 mt-8 w-1/2 mx-auto text-xl" disabled={players.length === 0}>
                    Start Quiz
                </Button>
            </Card>
        </div>
    );
};

export default LobbyPage;
import React, { useState, useMemo } from 'react';
import { supabase } from '../service/supabase.ts';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import type { Player, QuizConfig, Quiz } from '../../types.ts';
import { Clan } from '../../types.ts';
import { AVATARS } from '../../avatars.ts';
import Card from '../components/Card.tsx';
import Button from '../components/Button.tsx';

const JoinQuizPage = () => {
    
    const { quizId: paramQuizId } = useParams<{ quizId: string }>();
    if (paramQuizId && paramQuizId.length !== 6) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center text-red-500 text-lg font-semibold">
        Invalid Quiz Code in URL
      </div>
    </div>
  );

}
    const location = useLocation();
    const navigate = useNavigate();

    // const quizIdFromUrl = useMemo(() => {
    //     const queryParams = new URLSearchParams(location.search);
    //     return queryParams.get('quizCode') || paramQuizId;
    // }, [location.search, paramQuizId]);
    const quizIdFromUrl = paramQuizId;


    const [quizId, setQuizId] = useState(quizIdFromUrl || '');
    const [name, setName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    const [step, setStep] = useState<'join' | 'clan'>('join');
    const [clanConfig, setClanConfig] = useState<{ titan_name: string, defender_name: string } | null>(null);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!quizId.trim() || !name.trim() || !selectedAvatar) {
            setError("Quiz code, nickname, and avatar are required.");
            return;
        }

        setIsJoining(true);
        const upperQuizId = quizId.toUpperCase().trim();

        try {
            const { data: quiz, error: quizError } = await supabase
                .from('quiz_master_structure')
                .select(`
        id:quiz_id,
        clan_based,
        clan_assignment,
        titan_name,
        defender_name,
        start_time,
        end_time,
        created_at
    `)
                .eq('quiz_id', upperQuizId)
                .single();

            if (quizError || !quiz) {
                setError('Quiz not found. Please check the code.');
                setIsJoining(false);
                return;
            }

            if (quiz.clan_based) {
                setClanConfig({ titan_name: quiz.titan_name, defender_name: quiz.defender_name });
                
                if (quiz.clan_assignment === 'autoBalance') {
                    // Fetch existing player clans to balance
                    const { data: players } = await supabase.from('quiz_players').select('clan').eq('quiz_id', upperQuizId);
                    const tCount = players?.filter(p => p.clan === Clan.TITANS).length || 0;
                    const dCount = players?.filter(p => p.clan === Clan.DEFENDERS).length || 0;
                    await finalizeJoin(upperQuizId, tCount <= dCount ? Clan.TITANS : Clan.DEFENDERS);
                } else {
                    setStep('clan');
                    setIsJoining(false);
                }
            } else {
                await finalizeJoin(upperQuizId, null);
            }
        } catch (err) {
            console.error(err);
            setError('Unexpected error joining quiz.');
            setIsJoining(false);
        }
    };

    const finalizeJoin = async (targetQuizId: string, clan: Clan | null) => {
        const playerId = crypto.randomUUID();
        const { error: insertError } = await supabase
            .from('quiz_players')
            .insert({
                quiz_id: targetQuizId,
                player_id: playerId,
                player_name: name.trim(),
                avatar: selectedAvatar,
                clan: clan
            });

        if (insertError) {
            setError('Failed to join quiz database.');
            setIsJoining(false);
            return;
        }

        localStorage.setItem(`quiz-player-${targetQuizId}`, playerId);
        //navigate(`/player-lobby/${targetQuizId}`);
       //navigate(`/#/player-lobby/${targetQuizId}`);
       navigate(`/lobby/${quizId}`);

      // navigate(`/player-lobby/${targetQuizId}`);
//navigate(`/player-lobby/${quizId}`);

    };

    const ClanSelection = () => {
        const clanColors: Record<Clan, string> = {
            [Clan.TITANS]: 'from-red-500 to-orange-500',
            [Clan.DEFENDERS]: 'from-blue-500 to-cyan-500',
        };

        return (
            <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-center mb-4">Choose Your Clan</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.values(Clan).map(clan => (
                        <button key={clan} onClick={() => finalizeJoin(paramQuizId!.toUpperCase(), clan)}
                            disabled={isJoining}
                            className={`p-6 rounded-lg text-white font-bold text-xl transition transform hover:scale-105 shadow-lg bg-gradient-to-br ${clanColors[clan]}`}>
                            {clan === Clan.TITANS ? (clanConfig?.titan_name || 'Titans') : (clanConfig?.defender_name || 'Defenders')}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
         <div className="flex-grow flex flex-col items-center justify-center p-4 animate-fade-in">
             <Card className="w-full max-w-md">
                 {step === 'join' && (
                     <form onSubmit={handleJoin} className="space-y-4">
                        <h1 className="text-3xl font-bold text-center mb-6">Join a Quiz</h1>
                        <input
  type="text"
  value={quizId}
  onChange={(e) => setQuizId(e.target.value.toUpperCase())}
  className="w-full text-center tracking-widest text-2xl bg-slate-100 border border-slate-300 rounded-md p-3"
  placeholder="QUIZ CODE"
/>
 <input
                             type="text"
                             value={name}
                             onChange={(e) => setName(e.target.value)}
                             className="w-full bg-slate-100 border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-gl-orange-500 outline-none"
                             placeholder="Your Nickname"
                         />
                        <div>
                            <p className="text-center text-slate-600 mb-3 text-sm">Choose your avatar</p>
                            <div className="grid grid-cols-6 gap-2">
                                {AVATARS.map((src, idx) => (
                                    <button type="button" key={idx} onClick={() => setSelectedAvatar(src)}
                                        className={`w-full aspect-square rounded-full transition-all border-2 ${selectedAvatar === src ? 'border-gl-orange-500 scale-110' : 'border-transparent'}`}>
                                      <img src={src} alt="avatar" className="w-full h-full rounded-full" />
                                    </button>
                                ))}
                            </div>
                        </div>
                         {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
                         <Button type="submit" className="bg-gl-orange-600 hover:bg-gl-orange-700" disabled={isJoining}>
                             {isJoining ? 'Joining...' : 'Join Game'}
                        </Button>
                     </form>
                 )}
                 {step === 'clan' && <ClanSelection />}
             </Card>
         </div>
    );
};

export default JoinQuizPage;

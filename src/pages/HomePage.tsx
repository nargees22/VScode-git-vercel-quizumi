
import React, { useState, useEffect } from 'react';
// Fix: Ensure standard react-router-dom Link is correctly referenced
import { Link } from 'react-router-dom';
import { supabase } from '../service/supabase.ts';
import Card from '../components/Card.tsx';
import Button from '../components/Button.tsx';
import { ReleaseNotesModal, RELEASE_NOTES_KEY } from '../components/ReleaseNotesModal.tsx';
import { GiftIcon } from '../icons/GiftIcon.tsx';

const HomePage = () => {
    const [showOrganizerLogin, setShowOrganizerLogin] = useState(false);
    const [organizerUsername, setOrganizerUsername] = useState('');
    const [loggedInOrganizer, setLoggedInOrganizer] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');
    const [showReleaseNotes, setShowReleaseNotes] = useState(false);

    useEffect(() => {
        const storedOrganizer = sessionStorage.getItem('quiz-organizer');
        if (storedOrganizer) {
            setLoggedInOrganizer(storedOrganizer);
        }

        const hasSeenNotes = localStorage.getItem(RELEASE_NOTES_KEY);
        if (!hasSeenNotes) {
            setShowReleaseNotes(true);
        }
    }, []);

    const handleCloseReleaseNotes = () => {
        setShowReleaseNotes(false);
        localStorage.setItem(RELEASE_NOTES_KEY, 'true');
    };

    const handleOrganizerLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const username = organizerUsername.trim();
        if (!username) return;

        setIsVerifying(true);
        setError('');

        try {
            // Check if user exists in organizers_master
            const { data, error: sbError } = await supabase
                .from('organizers_master')
                .select('organizer_id')
                .eq('organizer_id', username)
                .maybeSingle();

            if (sbError) throw sbError;

            if (!data) {
                setError('Invalid organizer username. Please check your credentials.');
                return;
            }

            setLoggedInOrganizer(username);
            sessionStorage.setItem('quiz-organizer', username);
            setShowOrganizerLogin(false);
            setOrganizerUsername('');
        } catch (err) {
            console.error('Organizer verification failed:', err);
            setError('System error during login. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleLogout = () => {
        setLoggedInOrganizer(null);
        sessionStorage.removeItem('quiz-organizer');
    };

    return (
        <div className="flex-grow flex flex-col items-center justify-center p-4 animate-fade-in">
            {showReleaseNotes && <ReleaseNotesModal onClose={handleCloseReleaseNotes} />}

            <div className="flex flex-row items-center justify-center gap-6 sm:gap-8 mb-12">
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gl-orange-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-white text-4xl sm:text-5xl font-extrabold tracking-tight">GLX</span>
                </div>
                <div className="text-left">
                    <h1 className="text-6xl sm:text-7xl font-black tracking-tighter text-slate-800 drop-shadow-lg">
                        Quizumi
                    </h1>
                    <p className="text-slate-600 text-xl mt-1">The ultimate real-time trivia challenge!</p>
                </div>
            </div>

            <div className="w-full max-w-md animate-slide-in-up z-10">
                <Card className="transition-all duration-300 flex flex-col items-center text-center">
                    {!loggedInOrganizer && !showOrganizerLogin && (
                        <div className="w-full animate-fade-in">
                            <h2 className="text-3xl font-bold text-slate-800 mb-6">Ready to Play?</h2>
                            <Link to="/join" className="w-full text-white text-center font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center bg-gl-orange-600 hover:bg-gl-orange-700 shadow-lg text-lg">
                                Join a Quiz
                            </Link>
                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-slate-300" /></div>
                                <div className="relative flex justify-center"><span className="bg-white px-2 text-sm text-slate-500">OR</span></div>
                            </div>
                        </div>
                    )}

                    {loggedInOrganizer ? (
                        <div className="w-full">
                            <p className="text-slate-700">Welcome, <span className="font-bold text-gl-orange-600">{loggedInOrganizer}</span>!</p>
                            <Link to="/create" className="mt-4 inline-block bg-gl-orange-600 hover:bg-gl-orange-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105">
                                Create Quiz
                            </Link>
                            <button onClick={handleLogout} className="block mx-auto mt-3 text-sm text-slate-500 hover:text-slate-800">Log out</button>
                        </div>
                    ) : (
                        showOrganizerLogin ? (
                            <form onSubmit={handleOrganizerLogin} className="w-full space-y-4 animate-fade-in">
                                <h3 className="text-xl font-bold text-slate-800">Organizer Login</h3>
                                <input
                                    type="text"
                                    value={organizerUsername}
                                    onChange={(e) => setOrganizerUsername(e.target.value)}
                                    className="w-full bg-slate-100 border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none placeholder-slate-400"
                                    placeholder="Enter organizer username"
                                    required
                                />
                                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                                <Button type="submit" className="bg-gl-orange-600 hover:bg-gl-orange-700" disabled={isVerifying}>
                                    {isVerifying ? 'Verifying...' : 'Login'}
                                </Button>
                                <button type="button" onClick={() => setShowOrganizerLogin(false)} className="text-sm text-slate-500 hover:underline">Cancel</button>
                            </form>
                        ) : (
                            <div>
                                <p className="text-slate-600">Want to host your own quiz?</p>
                                <button onClick={() => setShowOrganizerLogin(true)} className="mt-2 font-semibold text-gl-orange-600 hover:text-gl-orange-700 transition">
                                    Organizer Login
                                </button>
                            </div>
                        )
                    )}
                </Card>
            </div>

            <div className="absolute bottom-4 right-4 z-10">
                <button onClick={() => setShowReleaseNotes(true)} className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg text-slate-600 hover:text-gl-orange-500 hover:shadow-xl transition-all duration-300 transform hover:scale-110" aria-label="Show release notes">
                    <GiftIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default HomePage;

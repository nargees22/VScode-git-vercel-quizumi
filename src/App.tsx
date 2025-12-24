
import React from 'react';
// Fix: Ensure standard react-router-dom exports are correctly referenced
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import HomePage from './pages/HomePage.tsx';
import CreateQuizPage from './pages/CreateQuizPage.tsx';
import JoinQuizPage from './pages/JoinQuizPage.tsx';
import LobbyPage from './pages/LobbyPage.tsx';
import PlayerLobby from './pages/PlayerLobby.tsx';
import QuizHostPage from './pages/QuizHostPage.tsx';
import QuizPlayerPage from './pages/QuizPlayerPage.tsx';
import LeaderboardPage from './pages/LeaderboardPage.tsx';
import PerformanceReportPage from './pages/PerformanceReportPage.tsx';

const App = () => {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col relative">
        <div className="background-shapes"></div>
        <Header />
        <main className="flex-grow flex flex-col relative">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreateQuizPage />} />
            <Route path="/join" element={<JoinQuizPage />} />
            <Route path="/join/:quizId" element={<JoinQuizPage />} />
            <Route path="/lobby/:quizId" element={<LobbyPage />} />
            <Route path="/player-lobby/:quizId" element={<PlayerLobby />} />
            <Route path="/quiz/host/:quizId" element={<QuizHostPage />} />
            <Route path="/quiz/player/:quizId/:playerId" element={<QuizPlayerPage />} />
            <Route path="/leaderboard/:quizId" element={<LeaderboardPage />} />
            <Route path="/report/:quizId" element={<PerformanceReportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
};

export default App;

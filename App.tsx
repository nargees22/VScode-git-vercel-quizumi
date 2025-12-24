import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Header } from './src/components/Header';
import { Footer } from './src/components/Footer';
import HomePage from './src/pages/HomePage';
import CreateQuizPage from './src/pages/CreateQuizPage';
import JoinQuizPage from './src/pages/JoinQuizPage';
import LobbyPage from './src/pages/LobbyPage';
import PlayerLobby from './src/pages/PlayerLobby';
import QuizHostPage from './src/pages/QuizHostPage';
import QuizPlayerPage from './src/pages/QuizPlayerPage';
import LeaderboardPage from './src/pages/LeaderboardPage';
import PerformanceReportPage from './src/pages/PerformanceReportPage';

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
import React from 'react';
import { QRCodeDisplay } from './QRCodeDisplay.tsx';

export const PersistentQRCode: React.FC<{ quizId: string }> = ({ quizId }) => {
  if (!quizId) return null;

  // ✅ AI Studio SAFE URL (DO NOT CHANGE)
  const joinUrl = `${window.location.origin}/#/join/${quizId}`;

  return (
    <div className="fixed bottom-20 left-4 z-50 p-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl text-center">
      <QRCodeDisplay text={joinUrl} />
      <p className="mt-2 font-bold">{quizId}</p>
    </div>
  );
};
export const playSound = (type: 'correct' | 'wrong' | 'survey' | 'match' | 'battle') => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContext) return;

    if (type === 'correct') {
        const oscillator1 = audioContext.createOscillator();
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator1.connect(audioContext.destination);
        oscillator1.start();
        oscillator1.stop(audioContext.currentTime + 0.1);

        const oscillator2 = audioContext.createOscillator();
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.1); // G5
        oscillator2.connect(audioContext.destination);
        oscillator2.start(audioContext.currentTime + 0.1);
        oscillator2.stop(audioContext.currentTime + 0.2);
    } else if (type === 'wrong') {
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(185.00, audioContext.currentTime); // F#3
        oscillator.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.25);
    } else if (type === 'battle') {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(80, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(120, audioContext.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.6);
    } else { // 'survey' or 'match'
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440.00, audioContext.currentTime); // A4
        oscillator.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
    }
};

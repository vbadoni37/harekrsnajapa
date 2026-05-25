import { useState, useEffect, useRef } from 'react';
import { get } from 'idb-keyval';
import confetti from 'canvas-confetti';
import { Mic } from 'lucide-react';

const ChantingArea = ({ dailyRounds, dailyChants, onUpdateCounts, hasAudio, onRequireAudio }) => {
  const [showHariBol, setShowHariBol] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [currentChant, setCurrentChant] = useState(dailyChants);
  const [currentRound, setCurrentRound] = useState(dailyRounds);
  const audioRef = useRef(null);

  useEffect(() => {
    setCurrentChant(dailyChants);
    setCurrentRound(dailyRounds);
  }, [dailyChants, dailyRounds]);

  useEffect(() => {
    const loadAudio = async () => {
      try {
        const audioBlob = await get('mahamantra_audio');
        if (audioBlob) {
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
        }
      } catch (e) {
        console.error("Error loading audio in ChantingArea", e);
      }
    };
    loadAudio();
  }, []);

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f59e0b', '#fbbf24', '#ffffff']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f59e0b', '#fbbf24', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handleChantAreaClick = (e) => {
    if (!hasAudio) {
      onRequireAudio();
      return;
    }

    if (showHariBol) return;

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Play Audio
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio play failed', e));
    }

    // Ripple effect
    const box = e.currentTarget;
    const ripple = document.createElement('div');
    const rect = box.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.className = 'ripple';
    box.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    // Update Counts
    const nextChant = currentChant + 1;
    
    if (nextChant >= 108) {
      // Round Complete
      triggerConfetti();
      setShowHariBol(true);
      const newRoundCount = currentRound + 1;
      onUpdateCounts(newRoundCount, 0); // 0 chants for next round
      setCurrentChant(0);
      setCurrentRound(newRoundCount);
    } else {
      onUpdateCounts(currentRound, nextChant);
      setCurrentChant(nextChant);
    }
  };

  const startNextRound = () => {
    setShowHariBol(false);
  };

  if (!hasAudio) {
    return (
      <div className="card text-center" style={{ marginTop: '2rem' }}>
        <h2 className="text-2xl font-bold mb-4">Welcome</h2>
        <p className="mb-4 text-muted">Please record your Mahamantra first to start chanting.</p>
        <button className="btn w-full justify-center" onClick={onRequireAudio}>
          <Mic size={20} /> Go to Recorder
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full" style={{ flex: 1 }}>
      {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" preload="auto" />}
      
      <div className="flex justify-between items-center mb-4 mt-2">
        <div className="stat-box" style={{ flex: 1, marginRight: '0.5rem' }}>
          <div className="stat-label">Rounds Completed</div>
          <div className="stat-value text-primary">{currentRound}</div>
        </div>
        <div className="stat-box" style={{ flex: 1, marginLeft: '0.5rem' }}>
          <div className="stat-label">Target Rounds</div>
          <div className="stat-value">16</div>
        </div>
      </div>

      <div 
        className="chant-box" 
        onClick={handleChantAreaClick}
        style={{ pointerEvents: showHariBol ? 'none' : 'auto' }}
      >
        <div className="chant-count">{currentChant}</div>
        <div className="chant-label">Tap anywhere to chant</div>

        {showHariBol && (
          <div className="hari-bol-overlay flash-animation" style={{ pointerEvents: 'auto' }}>
            <div className="hari-bol-text">Hari Bol !</div>
            <p className="text-xl text-white mb-8">One Mala Completed</p>
            <button className="btn" onClick={(e) => { e.stopPropagation(); startNextRound(); }}>
              Start Next Round
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChantingArea;

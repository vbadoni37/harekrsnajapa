import { useState, useEffect, useRef } from 'react';
import { get } from 'idb-keyval';
import confetti from 'canvas-confetti';
import { Mic } from 'lucide-react';

const ChantingArea = ({ dailyRounds, dailyChants, onUpdateCounts, hasAudio, onRequireAudio }) => {
  const [showHariBol, setShowHariBol] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [currentChant, setCurrentChant] = useState(dailyChants);
  const [currentRound, setCurrentRound] = useState(dailyRounds);
  const [multiplier, setMultiplier] = useState(1);
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
    const nextChant = currentChant + multiplier;
    
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
    <div className="flex flex-col w-full h-full" style={{ flex: 1, position: 'relative' }}>
      {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" preload="auto" />}
      
      {/* 1. TOP: Hindi Mahamantra */}
      <div className="text-center mt-2 mb-6 font-bold text-primary" style={{ fontSize: '1.2rem', lineHeight: '1.5' }}>
        हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे ।<br/>
        हरे राम हरे राम राम राम हरे हरे ॥
      </div>

      {/* 2. STATS ROW: Count | Rounds Completed | Target Round */}
      <div className="flex justify-between items-center mb-6 gap-2">
        <div className="stat-box" style={{ flex: 1, padding: '0.8rem' }}>
          <div className="stat-label">Count</div>
          <div className="stat-value text-primary" style={{ fontSize: '2rem' }}>{currentChant}</div>
        </div>
        <div className="stat-box" style={{ flex: 1, padding: '0.8rem' }}>
          <div className="stat-label">Rounds</div>
          <div className="stat-value text-primary" style={{ fontSize: '2rem' }}>{currentRound}</div>
        </div>
        <div className="stat-box" style={{ flex: 1, padding: '0.8rem' }}>
          <div className="stat-label">Target</div>
          <div className="stat-value" style={{ fontSize: '2rem' }}>16</div>
        </div>
      </div>

      {/* 3. MULTIPLIER TOGGLE */}
      <div className="flex justify-center items-center gap-2 mb-auto mt-4">
        <span className="text-muted" style={{ fontSize: '0.9rem' }}>Increment by:</span>
        <button 
          className={`btn ${multiplier === 1 ? '' : 'outline'}`} 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
          onClick={() => setMultiplier(1)}
        >
          1x
        </button>
        <button 
          className={`btn ${multiplier === 5 ? '' : 'outline'}`}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
          onClick={() => setMultiplier(5)}
        >
          5x
        </button>
      </div>

      {/* 4. JAPA BUTTON (Bottom, just above nav) */}
      <button 
        className="japa-btn" 
        onClick={handleChantAreaClick}
        style={{ pointerEvents: showHariBol ? 'none' : 'auto' }}
      >
        CHANT JAPA
        <div style={{ fontSize: '1rem', fontWeight: 'normal', opacity: 0.9, marginTop: '0.5rem' }}>
          (Tap Here)
        </div>
      </button>

      {/* HARI BOL OVERLAY */}
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
  );
};

export default ChantingArea;

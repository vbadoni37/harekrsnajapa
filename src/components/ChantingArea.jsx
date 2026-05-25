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
    <div className="flex flex-col w-full h-full" style={{ flex: 1 }}>
      {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" preload="auto" />}
      
      <div 
        className="chant-box" 
        onClick={handleChantAreaClick}
        style={{ pointerEvents: showHariBol ? 'none' : 'auto', flex: 1, minHeight: '50vh' }}
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

      <div className="flex justify-center gap-2 mt-4 mb-2">
        <button 
          className={`btn ${multiplier === 1 ? '' : 'outline'}`} 
          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          onClick={() => setMultiplier(1)}
        >
          Count by 1
        </button>
        <button 
          className={`btn ${multiplier === 5 ? '' : 'outline'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          onClick={() => setMultiplier(5)}
        >
          Count by 5
        </button>
      </div>

      <div className="flex justify-between items-center mt-2 mb-2">
        <div className="stat-box" style={{ flex: 1, marginRight: '0.5rem' }}>
          <div className="stat-label">Rounds Completed</div>
          <div className="stat-value text-primary">{currentRound}</div>
        </div>
        <div className="stat-box" style={{ flex: 1, marginLeft: '0.5rem' }}>
          <div className="stat-label">Target Rounds</div>
          <div className="stat-value">16</div>
        </div>
      </div>
      
      <div className="text-center my-4 font-bold text-primary" style={{ fontSize: '1.2rem', lineHeight: '1.5' }}>
        हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे ।<br/>
        हरे राम हरे राम राम राम हरे हरे ॥
      </div>
    </div>
  );
};

export default ChantingArea;

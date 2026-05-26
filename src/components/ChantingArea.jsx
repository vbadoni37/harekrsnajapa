import { useEffect, useMemo, useRef, useState } from 'react';
import { get } from 'idb-keyval';
import confetti from 'canvas-confetti';
import { CheckCircle2, Minus, Mic, Plus, RotateCcw, Target, Undo2, Vibrate, Volume2, VolumeX } from 'lucide-react';

const MANTRA = 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे । हरे राम हरे राम राम राम हरे हरे ॥';
const ROUND_SIZE = 108;

const ChantingArea = ({
  dailyRounds,
  dailyChants,
  onUpdateCounts,
  hasAudio,
  onRequireAudio,
  settings,
  onSettingsChange,
}) => {
  const [showHariBol, setShowHariBol] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [increment, setIncrement] = useState(1);
  const [lastStep, setLastStep] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    let objectUrl;

    const loadAudio = async () => {
      try {
        const audioBlob = await get('mahamantra_audio');
        if (audioBlob) {
          objectUrl = URL.createObjectURL(audioBlob);
          setAudioUrl(objectUrl);
        } else {
          setAudioUrl(null);
        }
      } catch (e) {
        console.error('Error loading audio in ChantingArea', e);
      }
    };

    loadAudio();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [hasAudio]);

  const totalChants = dailyRounds * ROUND_SIZE + dailyChants;
  const targetChants = settings.targetRounds * ROUND_SIZE;
  const goalPercent = Math.min(100, Math.round((totalChants / Math.max(targetChants, 1)) * 100));
  const malaPercent = Math.round((dailyChants / ROUND_SIZE) * 100);
  const remainingRounds = Math.max(settings.targetRounds - dailyRounds, 0);
  const remainingChants = Math.max(0, remainingRounds * ROUND_SIZE - dailyChants);

  const paceText = useMemo(() => {
    const now = new Date();
    const end = new Date();
    end.setHours(22, 0, 0, 0);
    const hoursLeft = Math.max((end - now) / 36e5, 1);
    return `${Math.ceil(remainingChants / hoursLeft)} chants/hr`;
  }, [remainingChants]);

  const triggerConfetti = () => {
    const duration = 2200;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 65,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f97316', '#facc15', '#ffffff'],
      });
      confetti({
        particleCount: 4,
        angle: 115,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f97316', '#facc15', '#ffffff'],
      });

      if (Date.now() < end) requestAnimationFrame(frame);
    };

    frame();
  };

  const playAudio = () => {
    if (!settings.soundEnabled || !audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  const addRipple = (event) => {
    const box = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = box.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.className = 'ripple';
    box.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const handleChant = (event) => {
    if (showHariBol) return;

    if (settings.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(35);
    }

    playAudio();
    addRipple(event);

    const before = { rounds: dailyRounds, chants: dailyChants };
    const nextTotal = totalChants + increment;
    const nextRound = Math.floor(nextTotal / ROUND_SIZE);
    const nextChant = nextTotal % ROUND_SIZE;
    const completedMala = nextRound > dailyRounds;

    setLastStep(before);
    onUpdateCounts(nextRound, nextChant);

    if (completedMala) {
      triggerConfetti();
      setShowHariBol(true);
    }
  };

  const undoLast = () => {
    if (!lastStep) return;
    onUpdateCounts(lastStep.rounds, lastStep.chants);
    setLastStep(null);
    setShowHariBol(false);
  };

  const resetToday = () => {
    if (!window.confirm('Reset today\'s count to zero?')) return;
    setLastStep({ rounds: dailyRounds, chants: dailyChants });
    setShowHariBol(false);
    onUpdateCounts(0, 0);
  };

  const changeTarget = (delta) => {
    const nextTarget = Math.min(64, Math.max(1, settings.targetRounds + delta));
    onSettingsChange({ targetRounds: nextTarget });
  };

  return (
    <div className="chant-screen">
      {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" preload="auto" />}

      <section className="mantra-panel" aria-label="Mahamantra">
        <div className="mantra-script">{MANTRA}</div>
        <div className="mantra-translation">Hare Krishna Hare Krishna, Krishna Krishna Hare Hare</div>
      </section>

      <section className="progress-panel">
        <div className="progress-ring" style={{ '--progress': `${goalPercent}%` }}>
          <div>
            <strong>{goalPercent}%</strong>
            <span>Daily goal</span>
          </div>
        </div>
        <div className="progress-copy">
          <p className="eyebrow">Current Mala</p>
          <h2>{dailyChants}<span>/{ROUND_SIZE}</span></h2>
          <div className="mala-track" aria-label={`${malaPercent}% of current mala`}>
            <span style={{ width: `${malaPercent}%` }} />
          </div>
        </div>
      </section>


      <button className="japa-btn" onClick={handleChant} type="button">
        <span>Chant Japa</span>
        <small>Tap once for +{increment}</small>
      </button>
      <section className="stat-grid chant-stats">
        <div className="stat-box">
          <span>Rounds</span>
          <strong>{dailyRounds}</strong>
        </div>
        <div className="stat-box">
          <span>Remaining</span>
          <strong>{remainingRounds}</strong>
        </div>
        <div className="stat-box">
          <span>Pace</span>
          <strong>{paceText}</strong>
        </div>
      </section>

      <section className="controls-panel" aria-label="Japa controls">
        <div className="segmented-control" aria-label="Increment amount">
          {[1, 4, 8, 16].map((value) => (
            <button
              key={value}
              className={increment === value ? 'active' : ''}
              onClick={() => setIncrement(value)}
              type="button"
            >
              +{value}
            </button>
          ))}
        </div>

        <div className="toggle-row">
          <button
            className={settings.soundEnabled ? 'icon-toggle active' : 'icon-toggle'}
            onClick={() => onSettingsChange({ soundEnabled: !settings.soundEnabled })}
            type="button"
            title="Audio feedback"
          >
            {settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            className={settings.vibrationEnabled ? 'icon-toggle active' : 'icon-toggle'}
            onClick={() => onSettingsChange({ vibrationEnabled: !settings.vibrationEnabled })}
            type="button"
            title="Vibration feedback"
          >
            <Vibrate size={18} />
          </button>
          <button className="icon-toggle" onClick={undoLast} disabled={!lastStep} type="button" title="Undo last tap">
            <Undo2 size={18} />
          </button>
          <button className="icon-toggle" onClick={resetToday} type="button" title="Reset today">
            <RotateCcw size={18} />
          </button>
        </div>
      </section>

      <section className="target-panel">
        <Target size={18} />
        <span>Daily target</span>
        <button onClick={() => changeTarget(-1)} type="button" aria-label="Decrease target">
          <Minus size={16} />
        </button>
        <strong>{settings.targetRounds}</strong>
        <button onClick={() => changeTarget(1)} type="button" aria-label="Increase target">
          <Plus size={16} />
        </button>
      </section>

      {!hasAudio && (
        <button className="audio-nudge" onClick={onRequireAudio} type="button">
          <Mic size={18} /> Add your recorded mantra voice
        </button>
      )}


      {showHariBol && (
        <div className="hari-bol-overlay flash-animation">
          <CheckCircle2 size={48} />
          <div className="hari-bol-text">Hari Bol!</div>
          <p>One mala completed</p>
          <div className="overlay-actions">
            <button className="btn" onClick={() => setShowHariBol(false)} type="button">
              Continue
            </button>
            <button className="btn outline" onClick={undoLast} type="button">
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChantingArea;

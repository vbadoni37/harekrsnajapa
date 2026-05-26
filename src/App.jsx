import { useEffect, useState } from 'react';
import { Activity, BarChart3, Mic2 } from 'lucide-react';
import { get } from 'idb-keyval';
import AudioRecorder from './components/AudioRecorder';
import ChantingArea from './components/ChantingArea';
import Dashboard from './components/Dashboard';
import './index.css';

const DEFAULT_SETTINGS = {
  targetRounds: 16,
  soundEnabled: true,
  vibrationEnabled: true,
};

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const readTodayData = () => readJson(`chantData_${getTodayKey()}`, { rounds: 0, chants: 0 });

function App() {
  const [activeTab, setActiveTab] = useState('chant');
  const [dailyRounds, setDailyRounds] = useState(() => readTodayData().rounds || 0);
  const [dailyChants, setDailyChants] = useState(() => readTodayData().chants || 0);
  const [hasAudio, setHasAudio] = useState(false);
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...readJson('japaSettings', DEFAULT_SETTINGS),
  }));

  useEffect(() => {
    get('mahamantra_audio')
      .then((audioBlob) => setHasAudio(Boolean(audioBlob)))
      .catch(() => setHasAudio(false));
  }, []);

  const saveDailyData = (rounds, chants) => {
    const todayKey = getTodayKey();
    const entry = {
      date: todayKey,
      rounds,
      chants,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(`chantData_${todayKey}`, JSON.stringify(entry));

    const history = readJson('chantingHistory', []);
    const nextHistory = [entry, ...history.filter((item) => item.date !== todayKey)].slice(0, 120);
    localStorage.setItem('chantingHistory', JSON.stringify(nextHistory));
  };

  const handleUpdateCounts = (newRounds, newChants) => {
    setDailyRounds(newRounds);
    setDailyChants(newChants);
    saveDailyData(newRounds, newChants);
  };

  const handleSettingsChange = (nextSettings) => {
    const merged = { ...settings, ...nextSettings };
    setSettings(merged);
    localStorage.setItem('japaSettings', JSON.stringify(merged));
  };

  const navItems = [
    { id: 'record', label: 'Record', icon: Mic2 },
    { id: 'chant', label: 'Chant', icon: Activity },
    { id: 'dashboard', label: 'Stats', icon: BarChart3 },
  ];

  return (
    <>
      <header className="app-header">
        <div>
          <p className="app-eyebrow">Vaishnav Japa Utility</p>
          <h1 className="app-title">Mahamantra</h1>
        </div>
        <div className="header-progress" aria-label={`${dailyRounds} of ${settings.targetRounds} rounds completed`}>
          <span>{dailyRounds}</span>
          <small>/{settings.targetRounds}</small>
        </div>
      </header>

      <main className="main-content">
        {activeTab === 'record' && <AudioRecorder setHasAudio={setHasAudio} />}
        {activeTab === 'chant' && (
          <ChantingArea
            dailyRounds={dailyRounds}
            dailyChants={dailyChants}
            onUpdateCounts={handleUpdateCounts}
            hasAudio={hasAudio}
            onRequireAudio={() => setActiveTab('record')}
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        )}
        {activeTab === 'dashboard' && (
          <Dashboard
            dailyRounds={dailyRounds}
            dailyChants={dailyChants}
            settings={settings}
            onUpdateCounts={handleUpdateCounts}
          />
        )}
      </main>

      <nav className="nav-bar" aria-label="Primary">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-btn ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
            type="button"
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

export default App;

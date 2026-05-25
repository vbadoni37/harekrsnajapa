import { useState, useEffect } from 'react';
import { Mic, Activity, BarChart2 } from 'lucide-react';
import AudioRecorder from './components/AudioRecorder';
import ChantingArea from './components/ChantingArea';
import Dashboard from './components/Dashboard';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('chant');
  const [dailyRounds, setDailyRounds] = useState(0);
  const [dailyChants, setDailyChants] = useState(0);
  const [hasAudio, setHasAudio] = useState(false);

  useEffect(() => {
    // Load state from local storage on mount
    const today = new Date().toLocaleDateString();
    const storedData = localStorage.getItem(`chantData_${today}`);
    if (storedData) {
      const data = JSON.parse(storedData);
      setDailyRounds(data.rounds || 0);
      setDailyChants(data.chants || 0);
    }
  }, []);

  const saveDailyData = (rounds, chants) => {
    const today = new Date().toLocaleDateString();
    localStorage.setItem(`chantData_${today}`, JSON.stringify({ rounds, chants }));
  };

  const handleUpdateCounts = (newRounds, newChants) => {
    setDailyRounds(newRounds);
    setDailyChants(newChants);
    saveDailyData(newRounds, newChants);
  };

  return (
    <>
      <header className="app-header">
        <h1 className="app-title">Mahamantra</h1>
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
          />
        )}
        {activeTab === 'dashboard' && (
          <Dashboard 
            dailyRounds={dailyRounds} 
            dailyChants={dailyChants} 
          />
        )}
      </main>

      <nav className="nav-bar">
        <button 
          className={`nav-btn ${activeTab === 'record' ? 'active' : ''}`}
          onClick={() => setActiveTab('record')}
        >
          <Mic size={24} />
          <span>Record</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'chant' ? 'active' : ''}`}
          onClick={() => setActiveTab('chant')}
        >
          <Activity size={24} />
          <span>Chant</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <BarChart2 size={24} />
          <span>Stats</span>
        </button>
      </nav>
    </>
  );
}

export default App;

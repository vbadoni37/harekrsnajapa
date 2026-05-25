import { useState, useEffect } from 'react';
import { Award, Calendar, TrendingUp } from 'lucide-react';

const Dashboard = ({ dailyRounds, dailyChants }) => {
  const [scoreData, setScoreData] = useState({
    score: 0,
    status: '',
    history: []
  });

  useEffect(() => {
    // Calculate current score
    const now = new Date();
    const hours = now.getHours();
    
    let currentScore = 0;
    let currentStatus = '';

    if (dailyRounds >= 16) {
      if (hours < 7) {
        currentScore = 100;
        currentStatus = 'Excellent (Before 7 AM)';
      } else if (hours < 10) {
        currentScore = 85;
        currentStatus = 'Great (Before 10 AM)';
      } else {
        currentScore = 70;
        currentStatus = 'Good (Completed)';
      }
    } else if (dailyRounds >= 8) {
      currentScore = 50;
      currentStatus = 'Halfway there';
    } else if (dailyRounds >= 4) {
      currentScore = 25;
      currentStatus = 'Needs Dedication';
    } else {
      currentScore = 0;
      currentStatus = 'Poor Performance';
    }

    // Load history
    const historyData = localStorage.getItem('chantingHistory');
    let history = [];
    if (historyData) {
      history = JSON.parse(historyData);
    }

    setScoreData({
      score: currentScore,
      status: currentStatus,
      history: history
    });
  }, [dailyRounds]);

  const closeDay = () => {
    if (window.confirm("Are you sure you want to close today's chanting? This will save your score to history and reset for tomorrow.")) {
      const today = new Date().toLocaleDateString();
      const newEntry = {
        date: today,
        rounds: dailyRounds,
        score: scoreData.score,
        status: scoreData.status
      };

      const newHistory = [newEntry, ...scoreData.history.filter(h => h.date !== today)];
      localStorage.setItem('chantingHistory', JSON.stringify(newHistory));
      
      setScoreData(prev => ({ ...prev, history: newHistory }));
      alert("Day closed successfully. Hari Bol!");
    }
  };

  // Calculate MTD and YTD
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let mtdRounds = 0;
  let ytdRounds = 0;

  scoreData.history.forEach(entry => {
    const entryDate = new Date(entry.date);
    if (entryDate.getFullYear() === currentYear) {
      ytdRounds += entry.rounds;
      if (entryDate.getMonth() === currentMonth) {
        mtdRounds += entry.rounds;
      }
    }
  });

  // Add current day if not already in history
  const todayStr = now.toLocaleDateString();
  if (!scoreData.history.find(h => h.date === todayStr)) {
    mtdRounds += dailyRounds;
    ytdRounds += dailyRounds;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="score-card rounded-xl">
        <h2 className="text-xl font-bold flex items-center justify-center gap-2">
          <Award className="text-primary" /> Today's Performance
        </h2>
        <div className="score-value">{scoreData.score}%</div>
        <div className="font-bold text-xl mb-2">{scoreData.status}</div>
        <p className="text-muted">
          Rounds: {dailyRounds} / 16
        </p>
      </div>

      <div className="stat-grid mt-2">
        <div className="card text-center mb-0" style={{ padding: '1rem' }}>
          <TrendingUp className="mx-auto mb-2 text-primary" size={24} />
          <div className="stat-value">{mtdRounds}</div>
          <div className="stat-label">MTD Rounds</div>
        </div>
        <div className="card text-center mb-0" style={{ padding: '1rem' }}>
          <Calendar className="mx-auto mb-2 text-primary" size={24} />
          <div className="stat-value">{ytdRounds}</div>
          <div className="stat-label">YTD Rounds</div>
        </div>
      </div>

      <button className="btn outline w-full mt-4" onClick={closeDay}>
        Close Day & Save History
      </button>

      {scoreData.history.length > 0 && (
        <div className="card mt-4">
          <h3 className="font-bold mb-4 text-xl">Recent History</h3>
          <div className="flex flex-col gap-2">
            {scoreData.history.slice(0, 5).map((entry, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <div>
                  <div className="font-bold">{entry.date}</div>
                  <div className="text-sm text-muted">{entry.status}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{entry.rounds} Rounds</div>
                  <div className="text-sm">{entry.score}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

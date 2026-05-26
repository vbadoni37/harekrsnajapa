import { useMemo } from 'react';
import { Award, CalendarDays, Flame, RefreshCw, TrendingUp } from 'lucide-react';

const ROUND_SIZE = 108;

const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const sameDay = (a, b) => a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);

const Dashboard = ({ dailyRounds, dailyChants, settings, onUpdateCounts }) => {
  const history = readJson('chantingHistory', []);

  const stats = useMemo(() => {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const normalized = [
      { date: todayKey, rounds: dailyRounds, chants: dailyChants, updatedAt: now.toISOString() },
      ...history.filter((entry) => entry.date !== todayKey),
    ];

    const completedDays = normalized.filter((entry) => (entry.rounds || 0) >= settings.targetRounds).length;
    const totalRounds = normalized.reduce((sum, entry) => sum + (entry.rounds || 0), 0);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const mtdRounds = normalized.reduce((sum, entry) => {
      const date = new Date(entry.date);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        return sum + (entry.rounds || 0);
      }
      return sum;
    }, 0);

    let streak = 0;
    const byDate = new Map(normalized.map((entry) => [entry.date, entry]));
    const cursor = new Date(todayKey);
    for (let i = 0; i < 366; i += 1) {
      const key = cursor.toISOString().slice(0, 10);
      const entry = byDate.get(key);
      if (!entry || (entry.rounds || 0) < settings.targetRounds) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return { normalized, completedDays, totalRounds, mtdRounds, streak };
  }, [dailyRounds, dailyChants, history, settings.targetRounds]);

  const dailyPercent = Math.min(100, Math.round(((dailyRounds * ROUND_SIZE + dailyChants) / (settings.targetRounds * ROUND_SIZE)) * 100));
  const status = dailyRounds >= settings.targetRounds ? 'Daily vow complete' : dailyRounds >= settings.targetRounds / 2 ? 'Steady progress' : 'Begin gently and continue';

  const resetToday = () => {
    if (!window.confirm('Reset today\'s count and update history?')) return;
    onUpdateCounts(0, 0);
  };

  return (
    <div className="dashboard-screen">
      <section className="score-card">
        <div className="score-topline">
          <Award size={22} />
          <span>Today</span>
        </div>
        <div className="score-value">{dailyPercent}%</div>
        <h2>{status}</h2>
        <p>{dailyRounds} rounds and {dailyChants} chants toward {settings.targetRounds} rounds</p>
      </section>

      <section className="stat-grid dashboard-stats">
        <div className="stat-box">
          <Flame size={20} />
          <span>Streak</span>
          <strong>{stats.streak} days</strong>
        </div>
        <div className="stat-box">
          <TrendingUp size={20} />
          <span>This Month</span>
          <strong>{stats.mtdRounds}</strong>
        </div>
        <div className="stat-box">
          <CalendarDays size={20} />
          <span>Total Rounds</span>
          <strong>{stats.totalRounds}</strong>
        </div>
        <div className="stat-box">
          <Award size={20} />
          <span>Goal Days</span>
          <strong>{stats.completedDays}</strong>
        </div>
      </section>

      <section className="card history-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Practice Log</p>
            <h3>Recent Days</h3>
          </div>
          <button className="icon-toggle" onClick={resetToday} type="button" title="Reset today">
            <RefreshCw size={18} />
          </button>
        </div>

        {stats.normalized.length > 0 ? (
          <div className="history-list">
            {stats.normalized.slice(0, 10).map((entry) => {
              const isToday = sameDay(new Date(entry.date), new Date());
              const percent = Math.min(100, Math.round(((entry.rounds || 0) / settings.targetRounds) * 100));
              return (
                <div className="history-row" key={entry.date}>
                  <div>
                    <strong>{isToday ? 'Today' : formatDate(entry.date)}</strong>
                    <span>{entry.rounds || 0} rounds, {entry.chants || 0} chants</span>
                  </div>
                  <div className="mini-progress" aria-label={`${percent}% complete`}>
                    <span style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="empty-state">Your practice log will appear after the first chant.</p>
        )}
      </section>
    </div>
  );
};

export default Dashboard;

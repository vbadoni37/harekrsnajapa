import { useState } from 'react';
import {
  Award,
  BookOpen,
  Coins,
  Flame,
  Gift,
  HeartPulse,
  MapPin,
  Music2,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

const ROUND_SIZE = 108;
const MORNING_COMPLETION_HOUR = 10;

const SEVA_ITEMS = [
  { id: 'ekadashi-fasting', title: 'Ekadashi Fasting', coins: 100, icon: Sparkles },
  { id: 'ekadashi-25-rounds', title: 'Ekadashi 25 Rounds', coins: 100, icon: Award },
  { id: 'dham-nivas', title: 'Dham Nivas', coins: 100, icon: MapPin },
  { id: 'bhagavatam-shravan', title: 'Bhagavatam Shravan', coins: 100, icon: BookOpen },
  { id: 'gita-patha', title: 'Shrimad Bhagvat Gita Patha', coins: 100, icon: BookOpen },
  { id: 'harinam-sankirtan', title: 'Harinam Sankirtan', coins: 100, icon: Music2 },
  { id: 'granth-vitaran-seva', title: 'Granth Vitaran Seva', coins: 100, icon: Gift },
  { id: 'vaishnav-pad-seva', title: 'Vaishnav Pad Seva', coins: 100, icon: Sparkles },
  { id: 'gurupooja', title: 'Gurupooja', coins: 100, icon: Flame },
];

const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const toDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

const formatDate = (value, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, options);
};

const getDaysThisMonth = () => {
  const now = new Date();
  const days = [];
  for (let day = 1; day <= now.getDate(); day += 1) {
    days.push(new Date(now.getFullYear(), now.getMonth(), day));
  }
  return days;
};

const getCompletionHour = (entry) => {
  if (!entry?.updatedAt) return 23;
  const date = new Date(entry.updatedAt);
  if (Number.isNaN(date.getTime())) return 23;
  return date.getHours();
};

const getHealth = (entry, targetRounds) => {
  const rounds = entry?.rounds || 0;
  const chants = entry?.chants || 0;
  const percent = Math.min(100, Math.round(((rounds * ROUND_SIZE + chants) / (targetRounds * ROUND_SIZE)) * 100));

  if (rounds >= targetRounds && getCompletionHour(entry) < MORNING_COMPLETION_HOUR) {
    return { label: 'Excellent', className: 'excellent', percent, coins: 100 };
  }
  if (rounds >= targetRounds) {
    return { label: 'Healthy', className: 'healthy', percent, coins: 100 };
  }
  if (percent >= 70) {
    return { label: 'Moderate', className: 'moderate', percent, coins: 100 };
  }
  if (percent >= 50) {
    return { label: 'Unhealthy', className: 'unhealthy', percent, coins: 100 };
  }
  if (percent >= 33) {
    return { label: 'Unhealthy', className: 'unhealthy', percent, coins: 0 };
  }
  return { label: 'Sick', className: 'sick', percent, coins: 0 };
};

const Dashboard = ({ dailyRounds, dailyChants, settings, onUpdateCounts }) => {
  const [showMonthChart, setShowMonthChart] = useState(false);
  const [sevaLog, setSevaLog] = useState(() => readJson('golokSevaLog', []));
  const history = readJson('chantingHistory', []);

  const stats = (() => {
    const now = new Date();
    const todayKey = toDateKey(now);
    const normalized = [
      { date: todayKey, rounds: dailyRounds, chants: dailyChants, updatedAt: now.toISOString() },
      ...history.filter((entry) => entry.date !== todayKey),
    ];
    const byDate = new Map(normalized.map((entry) => [entry.date, entry]));
    const monthDays = getDaysThisMonth().map((date) => {
      const dateKey = toDateKey(date);
      const entry = byDate.get(dateKey) || { date: dateKey, rounds: 0, chants: 0 };
      return { ...entry, health: getHealth(entry, settings.targetRounds) };
    });

    const completedDays = normalized.filter((entry) => (entry.rounds || 0) >= settings.targetRounds).length;
    const totalRounds = normalized.reduce((sum, entry) => sum + (entry.rounds || 0), 0);
    const mtdRounds = monthDays.reduce((sum, entry) => sum + (entry.rounds || 0), 0);
    const japaCoins = monthDays.reduce((sum, entry) => sum + entry.health.coins, 0);

    let streak = 0;
    const cursor = new Date(todayKey);
    for (let i = 0; i < 366; i += 1) {
      const key = toDateKey(cursor);
      const entry = byDate.get(key);
      if (!entry || (entry.rounds || 0) < settings.targetRounds) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const healthCounts = monthDays.reduce((counts, entry) => {
      counts[entry.health.label] = (counts[entry.health.label] || 0) + 1;
      return counts;
    }, {});
    const excellentDays = healthCounts.Excellent || 0;
    const healthyDays = (healthCounts.Healthy || 0) + excellentDays;
    const currentHealth = monthDays[monthDays.length - 1]?.health || getHealth(null, settings.targetRounds);

    return { normalized, completedDays, totalRounds, mtdRounds, streak, monthDays, japaCoins, healthyDays, excellentDays, currentHealth };
  })();

  const sevaCoins = sevaLog.reduce((sum, entry) => sum + entry.coins, 0);
  const totalCoins = stats.japaCoins + sevaCoins;
  const wealthLevel = totalCoins >= 5000 ? 'Golok Treasurer' : totalCoins >= 2500 ? 'Very Wealthy' : totalCoins >= 1000 ? 'Growing Wealth' : totalCoins >= 300 ? 'Blessed Saver' : 'Beginner Saver';

  const resetToday = () => {
    if (!window.confirm('Reset today\'s count and update history?')) return;
    onUpdateCounts(0, 0);
  };

  const addSevaEntry = (item) => {
    const today = toDateKey();
    const date = window.prompt(`Enter date for ${item.title}`, today);
    if (!date) return;

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      window.alert('Please enter date as YYYY-MM-DD.');
      return;
    }

    const entryDate = toDateKey(parsed);
    const entry = {
      id: `${item.id}-${entryDate}-${sevaLog.length + 1}`,
      type: item.id,
      title: item.title,
      coins: item.coins,
      date: entryDate,
      createdAt: entryDate,
    };
    const nextLog = [entry, ...sevaLog].slice(0, 200);
    setSevaLog(nextLog);
    writeJson('golokSevaLog', nextLog);
  };

  const removeSevaEntry = (id) => {
    const nextLog = sevaLog.filter((entry) => entry.id !== id);
    setSevaLog(nextLog);
    writeJson('golokSevaLog', nextLog);
  };

  return (
    <div className="dashboard-screen">
      <section className="score-card wealth-card">
        <div className="score-topline">
          <Coins size={22} />
          <span>Total Golokdham Currency</span>
        </div>
        <div className="score-value coin-value">{totalCoins}</div>
        <h2>{wealthLevel}</h2>
        <p>{stats.japaCoins} from japa health and {sevaCoins} from seva entries</p>
      </section>

      <section className="stat-grid dashboard-stats">
        <div className="stat-box">
          <HeartPulse size={20} />
          <span>Spiritual Health</span>
          <strong>{stats.currentHealth.label}</strong>
        </div>
        <button className="stat-box stat-action" onClick={() => setShowMonthChart((value) => !value)} type="button">
          <TrendingUp size={20} />
          <span>This Month</span>
          <strong>{stats.mtdRounds}</strong>
        </button>
        <div className="stat-box">
          <Flame size={20} />
          <span>Streak</span>
          <strong>{stats.streak} days</strong>
        </div>
        <div className="stat-box">
          <Award size={20} />
          <span>Goal Days</span>
          <strong>{stats.completedDays}</strong>
        </div>
      </section>

      {showMonthChart && (
        <section className="card health-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Your Spiritual Health Chart</p>
              <h3>Daywise Japa This Month</h3>
            </div>
            <span className={`health-pill ${stats.currentHealth.className}`}>{stats.currentHealth.label}</span>
          </div>
          <div className="health-legend">
            {['Sick', 'Unhealthy', 'Moderate', 'Healthy', 'Excellent'].map((label) => (
              <span key={label} className={`legend-dot ${label.toLowerCase()}`}>{label}</span>
            ))}
          </div>
          <div className="japa-chart">
            {stats.monthDays.map((entry) => (
              <div className="chart-day" key={entry.date} title={`${formatDate(entry.date)}: ${entry.health.label}`}>
                <span className={`chart-bar ${entry.health.className}`} style={{ height: `${Math.max(entry.health.percent, 8)}%` }} />
                <small>{new Date(entry.date).getDate()}</small>
              </div>
            ))}
          </div>
          <div className="health-summary">
            <span>{stats.excellentDays} excellent mornings</span>
            <span>{stats.healthyDays} days at 16 rounds</span>
            <span>{stats.japaCoins} japa coins</span>
          </div>
        </section>
      )}

      <section className="card seva-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Golok Coins</p>
            <h3>Seva & Bonus Ledger</h3>
          </div>
          <strong className="coin-chip">+100 each</strong>
        </div>

        <div className="seva-grid">
          {SEVA_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button className="seva-tile" key={item.id} onClick={() => addSevaEntry(item)} type="button">
                <Icon size={18} />
                <span>{item.title}</span>
                <strong>{item.coins}</strong>
              </button>
            );
          })}
        </div>

        {sevaLog.length > 0 && (
          <div className="coin-ledger">
            {sevaLog.slice(0, 8).map((entry) => (
              <button className="ledger-row" key={entry.id} onClick={() => removeSevaEntry(entry.id)} type="button" title="Tap to remove">
                <span>{entry.title}</span>
                <small>{formatDate(entry.date)}</small>
                <strong>+{entry.coins}</strong>
              </button>
            ))}
          </div>
        )}
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

        <div className="history-list">
          {stats.normalized.slice(0, 10).map((entry) => {
            const health = getHealth(entry, settings.targetRounds);
            const isToday = entry.date === toDateKey();
            return (
              <div className="history-row rich-history-row" key={entry.date}>
                <div>
                  <strong>{isToday ? 'Today' : formatDate(entry.date)}</strong>
                  <span>{entry.rounds || 0} rounds, {entry.chants || 0} chants</span>
                </div>
                <span className={`health-pill ${health.className}`}>{health.label}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;



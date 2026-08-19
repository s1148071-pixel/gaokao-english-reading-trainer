import { useState, useEffect } from 'react';
import { api } from '../api';
import { useStore } from '../store';

export default function StatsPanel() {
  const { dispatch } = useStore();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.getStats().then(({ data }) => {
      if (data) setStats(data);
    });
  }, []);

  if (!stats) return null;

  return (
    <div className="glass-panel p-5 mt-6">
      <h3 className="text-sm font-bold text-slate-700 mb-3">📊 我的做题统计</h3>
      <div className="flex gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
          <div className="text-xs text-slate-400">总题数</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-accent-600">{stats.accuracy}%</div>
          <div className="text-xs text-slate-400">正确率</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-600">{stats.correct}/{stats.total}</div>
          <div className="text-xs text-slate-400">对/总</div>
        </div>
      </div>
      {stats.byType && (
        <div className="mt-3 space-y-1">
          {Object.entries(stats.byType).map(([type, d]) => (
            <div key={type} className="flex justify-between text-xs text-slate-500">
              <span>
                {type === 'detail'
                  ? '细节题'
                  : type === 'inference'
                  ? '推断题'
                  : type === 'main'
                  ? '主旨题'
                  : type}
              </span>
              <span className="font-semibold">
                {d.correct}/{d.total} ({Math.round((d.correct / d.total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 pt-3 border-t border-slate-100 text-center">
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'profile' })}
          className="text-xs text-primary-500 hover:text-primary-700"
        >
          📊 查看完整学情画像 →
        </button>
      </div>
    </div>
  );
}

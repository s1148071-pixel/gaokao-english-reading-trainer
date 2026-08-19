import { useState, useEffect } from 'react';
import { api } from '../api';

const DISTRACTOR_LABELS = {
  synonym_replace: '同义替换', concept_swap: '偷换概念',
  unsupported: '无中生有', opposite_direction: '方向相反', scope_shift: '范围扩大/缩小',
};

export default function LearningProfile({ onBack }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats().then(({ data }) => {
      if (data) setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-12 text-center text-slate-400">加载中...</div>;
  if (!stats || stats.total === 0) return (
    <div className="p-12 text-center">
      <p className="text-slate-400 mb-4">还没有做题记录</p>
      <button onClick={onBack} className="px-4 py-2 rounded-xl text-sm bg-slate-100">← 返回</button>
    </div>
  );

  const breakdown = stats.distractorBreakdown || {};
  const curve = stats.accuracyCurve || [];
  const maxDistractor = Math.max(...Object.values(breakdown).map(d => d.total || 0), 1);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">📊 学情画像</h2>
        <button onClick={onBack} className="px-4 py-2 rounded-xl text-sm bg-slate-100 hover:bg-slate-200">← 返回</button>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-panel p-4 text-center">
          <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
          <div className="text-xs text-slate-400">总题数</div>
        </div>
        <div className="glass-panel p-4 text-center">
          <div className="text-2xl font-bold text-accent-600">{stats.accuracy}%</div>
          <div className="text-xs text-slate-400">正确率</div>
        </div>
        <div className="glass-panel p-4 text-center">
          <div className="text-2xl font-bold text-slate-600">{stats.correct}/{stats.total}</div>
          <div className="text-xs text-slate-400">对/总</div>
        </div>
      </div>

      {/* Distractor weakness */}
      <div className="glass-panel p-5 mb-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">🎯 干扰项判断能力</h3>
        {Object.entries(breakdown).map(([type, d]) => (
          <div key={type} className="mb-3 last:mb-0">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">{DISTRACTOR_LABELS[type] || type}</span>
              <span className={d.correct === d.total && d.total > 0 ? 'text-accent-600' : 'text-amber-600'}>
                {d.correct}/{d.total} {d.total > 0 ? Math.round(d.correct/d.total*100) + '%' : '尚无数据'}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${d.total > 0 && d.correct === d.total ? 'bg-accent-400' : d.total > 0 ? 'bg-amber-400' : 'bg-slate-200'}`}
                style={{ width: `${d.total > 0 ? Math.round(d.correct / d.total * 100) : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Accuracy curve */}
      <div className="glass-panel p-5 mb-6">
        <h3 className="text-sm font-bold text-slate-700 mb-3">📈 近期正确率趋势（最近 {curve.length} 次）</h3>
        {curve.length === 0 ? (
          <p className="text-sm text-slate-400">暂无数据</p>
        ) : (
          <div className="flex items-end gap-1 h-24">
            {curve.map((point, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t ${point.correct ? 'bg-accent-400' : 'bg-red-300'}`}
                  style={{ height: `${point.correct ? 100 : 30}%` }}
                />
                <span className="text-[9px] text-slate-400">{i+1}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-type accuracy */}
      {stats.byType && (
        <div className="glass-panel p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3">📋 按题型正确率</h3>
          {Object.entries(stats.byType).map(([type, d]) => (
            <div key={type} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
              <span className="text-slate-600">{type === 'detail' ? '细节题' : type === 'inference' ? '推断题' : type === 'main' ? '主旨题' : type}</span>
              <span className="font-semibold text-slate-700">{d.correct}/{d.total} ({Math.round(d.correct/d.total*100)}%)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

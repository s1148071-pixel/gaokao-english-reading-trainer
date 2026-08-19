import { useState, useEffect } from 'react';
import { PAPERS } from '../data';
import { useStore } from '../store';
import { api } from '../api';

const TYPE_LABELS = { detail: '细节', inference: '推断', main: '主旨' };
const TYPE_COLORS = {
  detail: 'bg-blue-100 text-blue-700 border-blue-200',
  inference: 'bg-orange-100 text-orange-700 border-orange-200',
  main: 'bg-purple-100 text-purple-700 border-purple-200',
};

const PROFICIENCY_LEVELS = [
  { level: 1, label: 'L1 引导练习', desc: '每步都有详细引导和即时反馈', icon: '📚', color: 'from-blue-500 to-blue-600' },
  { level: 2, label: 'L2 自主练习', desc: '流程不变但不显示对错反馈', icon: '✍️', color: 'from-green-500 to-green-600' },
  { level: 3, label: 'L3 限时模拟', desc: '跳过引导直接做题，计时作答', icon: '🏆', color: 'from-orange-500 to-red-500' },
];

export default function PaperSelector() {
  const { state, dispatch } = useStore();
  const [proficiencyLevel, setProficiencyLevel] = useState(1);

  // Load papers from API with fallback to static data
  useEffect(() => {
    api.getPapers().then(({ data, fallback }) => {
      if (!fallback && data) {
        dispatch({ type: 'SET_PAPERS_CACHE', papers: data });
      }
      dispatch({ type: 'SET_API_AVAILABLE', available: !fallback });
    });
  }, [dispatch]);

  // Use API-cached papers if available, otherwise fall back to static PAPERS
  const displayPapers = state.papersCache || PAPERS;

  const handleSelect = (paperId, passageId, mode = 'practice') => {
    dispatch({ type: 'SELECT_PASSAGE', paperId, passageId, mode, duration: 360, proficiencyLevel });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="max-w-3xl w-full">
        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            选择训练篇章
          </h2>
          <p className="text-slate-500 text-sm">
            选择一份高考真题的阅读篇章，开始方法论训练
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
            <span className="px-2 py-1 rounded bg-slate-100">题干先行</span>
            <span className="px-2 py-1 rounded bg-slate-100">反向定位</span>
            <span className="px-2 py-1 rounded bg-slate-100">逻辑复盘</span>
          </div>
        </div>

        {/* Proficiency Level Selector */}
        <div className="glass-panel p-4 mb-8">
          <div className="text-sm font-semibold text-slate-700 mb-3 text-center">选择熟练度</div>
          <div className="grid grid-cols-3 gap-3">
            {PROFICIENCY_LEVELS.map(pl => (
              <button
                key={pl.level}
                onClick={() => setProficiencyLevel(pl.level)}
                className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                  proficiencyLevel === pl.level
                    ? 'border-primary-400 bg-primary-50 scale-[1.03]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-2xl mb-1">{pl.icon}</div>
                <div className="text-xs font-bold text-slate-700">{pl.label}</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-tight">{pl.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Teacher annotation tool shortcut */}
        <div className="text-center mt-4">
          <button
            onClick={() => dispatch({ type: 'SET_VIEW', view: 'annotation' })}
            className="text-xs text-purple-500 hover:text-purple-700 underline"
          >
            ✏️ 老师标注工具
          </button>
        </div>

        {/* Papers */}
        {displayPapers.map(paper => (
          <div key={paper.id} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                {paper.year}
              </div>
              <div>
                <h3 className="font-semibold text-slate-700">{paper.name}</h3>
                <p className="text-xs text-slate-400">{paper.description}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {paper.passages.map(passage => {
                const questions = passage.questions || [];
                const unlockedCount = questions.filter(q => !q.locked).length;
                const typeBreakdown = questions.reduce((acc, q) => {
                  acc[q.questionType] = (acc[q.questionType] || 0) + 1;
                  return acc;
                }, {});
                const hasLocked = questions.some(q => q.locked);
                const totalCount = passage.questionCount || questions.length;

                return (
                  <div
                    key={passage.id}
                    className="glass-panel p-4 rounded-xl text-left transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary-200 group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-700 group-hover:text-primary-700 transition-colors">
                        {passage.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                        {passage.sourceInfo}
                      </span>
                    </div>

                    {/* 题型标签 */}
                    <div className="flex items-center gap-1.5 mb-2">
                      {Object.entries(typeBreakdown).map(([type, count]) => (
                        <span
                          key={type}
                          className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[type] || 'bg-slate-100 text-slate-500'}`}
                        >
                          {TYPE_LABELS[type] || type} {count}
                        </span>
                      ))}
                    </div>

                    {/* 可用题数 */}
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                      <span>
                        {hasLocked
                          ? `${unlockedCount} 道可用 · ${totalCount - unlockedCount} 道二期开放`
                          : `${totalCount} 题全部可用`
                        }
                      </span>
                    </div>

                    {/* 模式入口（按熟练度变化） */}
                    {proficiencyLevel === 3 ? (
                      <div>
                        <button
                          onClick={() => handleSelect(paper.id, passage.id, 'timed')}
                          className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:shadow-lg hover:shadow-orange-200 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1"
                        >
                          🏆 L3 限时模拟
                        </button>
                        <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                          6分钟限时 · 直答模式 · 模拟考试
                        </p>
                      </div>
                    ) : (
                      <div>
                        <button
                          onClick={() => handleSelect(paper.id, passage.id, 'practice')}
                          className={`w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${proficiencyLevel === 1 ? 'from-blue-500 to-blue-600' : 'from-green-500 to-green-600'} hover:shadow-lg active:scale-95 transition-all duration-200`}
                        >
                          {proficiencyLevel === 1 ? '📚 L1 引导练习 →' : '✍️ L2 自主练习 →'}
                        </button>
                        <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                          {proficiencyLevel === 1 ? '每步有引导和反馈' : '自主练习 · 无反馈'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useStore, useCurrentData } from '../store';

export default function TimedResultSummary({ onViewQuestion }) {
  const { state, dispatch } = useStore();
  const { passage, questions } = useCurrentData();

  // Calculate results
  const results = questions.map((q, idx) => {
    const qs = state.questions[idx];
    const isCorrect = qs.answer === q.correctAnswer;
    const isAnswered = qs.answer !== null;
    return { question: q, questionState: qs, isCorrect, isAnswered, index: idx };
  });

  const correctCount = results.filter(r => r.isCorrect).length;
  const totalCount = results.length;
  const answeredCount = results.filter(r => r.isAnswered).length;

  // Time used
  const timeUsed = state.timedEnd
    ? Math.min(360, Math.round((Math.min(Date.now(), state.timedEnd) - (state.timedEnd - 360 * 1000)) / 1000))
    : 360;
  const minutes = Math.floor(timeUsed / 60);
  const seconds = timeUsed % 60;

  const handleViewQuestion = (idx) => {
    onViewQuestion?.(idx);
  };

  return (
    <div className="step-enter max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-base font-bold mb-4 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700">
          ⏱ 计时模式 · 作答完毕
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {correctCount} / {totalCount} 正确
        </h2>
        <p className="text-slate-500 text-sm">
          用时 {minutes}:{seconds.toString().padStart(2, '0')} · {answeredCount}/{totalCount} 题已作答
        </p>
      </div>

      {/* Score visualization */}
      <div className="glass-panel p-6 mb-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex-1 h-3 rounded-full ${
                !r.isAnswered
                  ? 'bg-slate-200'
                  : r.isCorrect
                  ? 'bg-accent-400'
                  : 'bg-red-400'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-6 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-accent-400"></span>
            <span className="text-slate-600">正确 {correctCount}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400"></span>
            <span className="text-slate-600">错误 {answeredCount - correctCount}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-200"></span>
            <span className="text-slate-600">未答 {totalCount - answeredCount}</span>
          </span>
        </div>
      </div>

      {/* Per-question results */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
          逐题回顾 · 点击查看详细解析
        </h3>
        {results.map((r) => (
          <button
            key={r.index}
            onClick={() => handleViewQuestion(r.index)}
            className="w-full glass-panel p-4 rounded-xl text-left transition-all duration-300 hover:shadow-lg hover:scale-[1.01] hover:border-primary-200 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  !r.isAnswered
                    ? 'bg-slate-100 text-slate-400'
                    : r.isCorrect
                    ? 'bg-accent-100 text-accent-700'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {!r.isAnswered ? '—' : r.isCorrect ? '✓' : '✗'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-slate-700">Q{r.question.number}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                      {r.question.questionType === 'detail' ? '细节' : '推断'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 truncate">{r.question.stem}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <div className="text-xs text-slate-400">你的答案</div>
                  <div className={`text-sm font-bold ${
                    !r.isAnswered ? 'text-slate-300' : r.isCorrect ? 'text-accent-600' : 'text-red-500'
                  }`}>
                    {r.questionState.answer || '未答'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">正确答案</div>
                  <div className="text-sm font-bold text-accent-600">
                    {r.question.correctAnswer}
                  </div>
                </div>
                <span className="text-primary-400 group-hover:text-primary-600 transition-colors">
                  →
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="text-center mt-8 flex items-center justify-center gap-4">
        <button
          onClick={() => dispatch({ type: 'GO_HOME' })}
          className="px-8 py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-95 transition-all"
        >
          ← 返回选择篇章
        </button>
      </div>
    </div>
  );
}

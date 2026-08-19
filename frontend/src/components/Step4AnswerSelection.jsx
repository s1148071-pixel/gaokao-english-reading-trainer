import { useStore, useCurrentData } from '../store';
import { DISTRACTOR_TYPE_LABELS } from '../data';
import { api } from '../api';

export default function Step4AnswerSelection() {
  const { state, dispatch } = useStore();
  const { currentQuestion: question, questionState } = useCurrentData();
  const isTimed = state.mode === 'timed';
  const isMainQuestion = question.questionType === 'main';

  const handleSelect = (optionId) => {
    // practice: lock after submit; timed: always editable
    if (!isTimed && questionState.answerSubmitted) return;
    dispatch({ type: 'SELECT_ANSWER', optionId });
  };

  const handleSubmit = () => {
    if (!questionState.answer) return;
    dispatch({ type: 'SUBMIT_ANSWER' });
    // Fire-and-forget: submit record to API (fail silently)
    api.submitRecord({
      passageId: state.currentPassageId,
      questionId: question.id,
      mode: state.mode,
      step: 4,
      finalAnswer: questionState.answer,
      answerSubmitted: true,
      keywords: questionState.keywords,
      blocks: questionState.blocks,
      distractorJudgments: questionState.distractorJudgments,
      highlights: questionState.highlights,
      underlines: questionState.underlines,
      notes: questionState.notes,
    });
  };

  const getOptionClass = (optionId) => {
    if (isTimed) {
      // timed mode: just show selection, no correct/wrong reveal
      return questionState.answer === optionId ? 'option-card-selected' : 'option-card-default';
    }
    if (!questionState.answerSubmitted) {
      return questionState.answer === optionId ? 'option-card-selected' : 'option-card-default';
    }
    if (optionId === question.correctAnswer) return 'option-card-correct';
    if (optionId === questionState.answer && optionId !== question.correctAnswer) return 'option-card-wrong';
    return 'option-card-default opacity-50';
  };

  const getOptionBadge = (optionId) => {
    if (isTimed) return null;
    if (!questionState.answerSubmitted) return null;
    if (optionId === question.correctAnswer) return { text: '✓ 正确答案', color: 'text-accent-600' };
    if (optionId === questionState.answer) return { text: '✗ 你的选择', color: 'text-red-500' };
    return null;
  };

  return (
    <div className="step-enter max-w-2xl mx-auto">
      {/* Instruction */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          第 {question.number} 题 · {isTimed ? '限时作答' : '第四步：选择答案'}
        </h2>
        <p className="text-slate-500 text-sm">
          {isTimed
            ? '选择你认为正确的答案，可在提交前随时修改'
            : isMainQuestion
            ? '对比你归纳的主旨与选项，选出最贴切的答案'
            : '基于前两步的关键词定位和选项比对，选出最终答案'
          }
        </p>
      </div>

      {/* Main idea question: show student's summary */}
      {isMainQuestion && questionState.mainSummary && (
        <div className="glass-panel p-4 mb-5 border-l-4 border-l-purple-400 bg-purple-50/20">
          <div className="text-xs uppercase tracking-wider text-purple-500 mb-1.5 font-semibold">
            ✍️ 你归纳的主旨
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {questionState.mainSummary}
          </p>
        </div>
      )}

      {/* Question stem */}
      <div className="glass-panel p-5 mb-5">
        <div className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold">
          题目
        </div>
        <p className="text-lg font-medium text-slate-800 passage-text">
          {question.stem}
        </p>
      </div>

      {/* Step3 judgment summary — only in practice mode */}
      {!isTimed && questionState.distractorJudgments.length > 0 && (
        <div className="glass-panel p-4 mb-5 border-l-4 border-l-primary-400">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold">
            你的选项判断概览
          </div>
          <div className="space-y-1.5">
            {questionState.distractorJudgments.map((j) => {
              const opt = question.options.find(o => o.id === j.optionId);
              return (
                <div key={j.optionId} className="flex items-center gap-2 text-sm">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    j.isCorrect ? 'bg-accent-100 text-accent-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {j.optionId}
                  </span>
                  <span className="text-slate-700">{opt?.text}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    j.isCorrect ? 'bg-accent-50 text-accent-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {j.isCorrect ? '✓ ' : '⚠ '}{DISTRACTOR_TYPE_LABELS[j.selectedType]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option) => {
          const badge = getOptionBadge(option.id);
          return (
            <div
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`option-card ${getOptionClass(option.id)} ${
                (!isTimed && questionState.answerSubmitted) ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    questionState.answer === option.id && (!isTimed || !questionState.answerSubmitted)
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {option.id}
                  </span>
                  <span className="text-base font-medium text-slate-700">{option.text}</span>
                </div>
                {badge && (
                  <span className={`text-sm font-semibold ${badge.color}`}>
                    {badge.text}
                  </span>
                )}
                {isTimed && questionState.answer === option.id && (
                  <span className="text-sm font-semibold text-primary-600">
                    ✓ 已选择
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action — practice mode only */}
      {!isTimed && (
        <div className="mt-6">
          {!questionState.answerSubmitted ? (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => dispatch({ type: 'PREVIOUS_STEP' })}
                className="px-5 py-3 rounded-xl font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200"
              >
                ← 返回上一步
              </button>
              <button
                onClick={handleSubmit}
                disabled={!questionState.answer}
                className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
                  !questionState.answer
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-95'
                }`}
              >
                提交答案
              </button>
            </div>
          ) : (
            <div className={`text-center p-4 rounded-xl ${
              questionState.answer === question.correctAnswer
                ? 'bg-accent-50 border border-accent-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-lg font-bold ${
                questionState.answer === question.correctAnswer ? 'text-accent-700' : 'text-red-600'
              }`}>
                {questionState.answer === question.correctAnswer ? '🎉 回答正确！' : '回答错误'}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                正确答案是 {question.correctAnswer}. {question.options.find(o => o.id === question.correctAnswer)?.text}
              </p>
              <div className="flex items-center justify-center gap-3 mt-3">
                <button
                  onClick={() => dispatch({ type: 'PREVIOUS_STEP' })}
                  className="px-4 py-2 rounded-lg font-medium text-slate-500 hover:text-slate-700 hover:bg-white/60 transition-all"
                >
                  ← 返回修改
                </button>
                <button
                  onClick={() => dispatch({ type: 'SUBMIT_ANSWER' })}
                  className="px-6 py-2 rounded-lg font-medium text-white bg-primary-600 hover:bg-primary-700 transition-all"
                >
                  查看完整复盘 →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timed mode hint */}
      {isTimed && (
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            {questionState.answer
              ? `✓ 已选择 ${questionState.answer} · 点击顶部题号切换下一题`
              : '选择一个答案后，点击顶部题号切换下一题'
            }
          </p>
        </div>
      )}
    </div>
  );
}

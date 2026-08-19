import { useState } from 'react';
import { useStore, useCurrentData } from '../store';
import { DISTRACTOR_TYPE_LABELS } from '../data';

const JUDGMENT_OPTIONS = [
  { value: 'synonym_replace', label: '同义替换', desc: '选项与原文意思相同，用词不同' },
  { value: 'concept_swap', label: '偷换概念', desc: '选项替换了原文的关键概念' },
  { value: 'unsupported', label: '无中生有', desc: '原文没有提到这个意思' },
  { value: 'opposite_direction', label: '方向相反', desc: '选项与原文逻辑方向相反' },
  { value: 'scope_shift', label: '范围扩大/缩小', desc: '选项对原文范围做了放大或缩小' },
];

export default function Step3OptionComparison() {
  const { state, dispatch } = useStore();
  const { passage, currentQuestion: question, questionState } = useCurrentData();
  const [currentOptionIdx, setCurrentOptionIdx] = useState(0);
  const [selectedType, setSelectedType] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const isLevel2 = state.proficiencyLevel === 2;

  const currentOption = question.options[currentOptionIdx];
  const judgments = questionState.distractorJudgments;
  const isConfirmed = questionState.distractorConfirmed;

  // Get paragraphs selected in Step2
  const selectedBlocks = (questionState.blocks || [])
    .map(id => passage?.paragraphs.find(p => p.id === id))
    .filter(Boolean);

  // Find existing judgment for current option
  const existingJudgment = judgments.find(j => j.optionId === currentOption?.id);

  const handleJudge = () => {
    if (!selectedType || !currentOption) return;

    const isCorrect = selectedType === currentOption.distractorType ||
      (currentOption.distractorType === 'correct' && selectedType === 'synonym_replace');

    dispatch({
      type: 'JUDGE_DISTRACTOR',
      optionId: currentOption.id,
      selectedType,
      isCorrect,
    });

    setShowFeedback(true);
  };

  const handleReset = () => {
    if (!currentOption) return;
    dispatch({ type: 'RESET_DISTRACTOR', optionId: currentOption.id });
    setSelectedType('');
    setShowFeedback(false);
  };

  const handlePrevOption = () => {
    if (currentOptionIdx > 0) {
      setCurrentOptionIdx(currentOptionIdx - 1);
      setSelectedType('');
      setShowFeedback(false);
    }
  };

  const handleNextOption = () => {
    if (currentOptionIdx < question.options.length - 1) {
      setCurrentOptionIdx(currentOptionIdx + 1);
      setSelectedType('');
      setShowFeedback(false);
    }
  };

  const handleConfirmAll = () => {
    dispatch({ type: 'CONFIRM_DISTRACTOR_JUDGMENTS' });
  };

  // Check if all options have been judged
  const allJudged = question.options.every(opt =>
    judgments.some(j => j.optionId === opt.id)
  );

  const currentJudgment = judgments.find(j => j.optionId === currentOption?.id);
  const isCurrentCorrect = currentJudgment?.isCorrect;

  return (
    <div className="step-enter max-w-2xl mx-auto">
      {/* Instruction */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          第 {question.number} 题 · 第三步：选项关系判断
        </h2>
        <p className="text-slate-500 text-sm">
          逐个判断每个选项与原文的<strong className="text-primary-600">关系类型</strong>——这是识别干扰项的核心能力
        </p>
      </div>

      {/* Question stem */}
      <div className="glass-panel p-5 mb-4">
        <div className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold">
          题目
        </div>
        <p className="text-base font-medium text-slate-800 passage-text">
          {question.stem}
        </p>
      </div>

      {/* 你定位的段落 + 原文对应句 */}
      <div className="glass-panel p-4 mb-4 border-l-4 border-l-primary-400 bg-primary-50/20">
        <div className="text-xs uppercase tracking-wider text-primary-500 mb-2 font-semibold flex items-center gap-2">
          <span>📍 你定位的段落</span>
          <span className="text-slate-400 font-normal normal-case tracking-normal">
            （Step2 所选 · 共 {selectedBlocks.length} 段）
          </span>
        </div>
        {selectedBlocks.length === 0 ? (
          <p className="text-sm text-slate-400 italic">未选择段落，请在第二步定位</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedBlocks.map(para => {
              const fullText = para.sentences.map(s => s.text).join(' ');
              return (
                <div key={para.id} className="text-sm text-slate-700 leading-relaxed">
                  <span className="text-[10px] text-slate-400 font-mono mr-1">¶{para.id}</span>
                  {fullText}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 原文对应句（高亮提示） */}
      {currentOption?.evidenceSentence && (
        <div className="glass-panel p-4 mb-4 border-l-4 border-l-accent-400 bg-accent-50/30">
          <div className="text-xs uppercase tracking-wider text-accent-500 mb-1.5 font-semibold">
            ✦ 原文对应句（参考）
          </div>
          <p className="text-sm text-slate-700 leading-relaxed italic">
            "{currentOption.evidenceSentence}"
          </p>
        </div>
      )}

      {/* Current option card */}
      <div className="glass-panel p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
            {currentOption?.id}
          </span>
          <span className="text-base font-medium text-slate-700">
            {currentOption?.text}
          </span>
        </div>

        {/* Judgment options (only show if not yet judged or not confirmed) */}
        {(!currentJudgment || !isConfirmed) && (
          <div className="mt-4">
            <p className="text-sm text-slate-500 mb-3">
              这个选项与原文的关系是？
            </p>
            <div className="space-y-2">
              {JUDGMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (currentJudgment && !isConfirmed) return; // Already judged, can't change until reset
                    setSelectedType(opt.value);
                    setShowFeedback(false);
                  }}
                  disabled={currentJudgment && !isConfirmed}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                    currentJudgment && !isConfirmed
                      ? 'cursor-default'
                      : selectedType === opt.value
                      ? 'border-primary-400 bg-primary-50 text-primary-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  style={{ minHeight: '48px' }}
                >
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedType === opt.value ? 'border-primary-600 bg-primary-600' : 'border-slate-300'
                  }`}>
                    {selectedType === opt.value && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-xs text-slate-400 ml-auto">{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* Judge button */}
            {!currentJudgment && selectedType && !showFeedback && (
              <button
                onClick={handleJudge}
                className="mt-4 w-full px-6 py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-95 transition-all duration-300"
              >
                判断此选项
              </button>
            )}

            {/* Reset button for already-judged option */}
            {currentJudgment && !isConfirmed && (
              <button
                onClick={handleReset}
                className="mt-3 text-sm text-slate-500 hover:text-slate-700 underline transition-all"
              >
                重新判断此选项
              </button>
            )}
          </div>
        )}

        {/* Feedback after judgment — hidden in L2 */}
        {!isLevel2 && (currentJudgment || showFeedback) && (
          <div className={`mt-4 p-4 rounded-xl border ${
            isCurrentCorrect
              ? 'bg-accent-50 border-accent-200'
              : 'bg-amber-50 border-amber-200'
          } animate-fadeIn`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-lg font-bold ${isCurrentCorrect ? 'text-accent-600' : 'text-amber-600'}`}>
                {isCurrentCorrect ? '✅' : '⚠️'}
              </span>
              <span className={`font-semibold ${isCurrentCorrect ? 'text-accent-700' : 'text-amber-700'}`}>
                {isCurrentCorrect
                  ? `判断正确！你识别为"${DISTRACTOR_TYPE_LABELS[currentJudgment?.selectedType || selectedType]}"`
                  : `判断偏差 — 你选了"${DISTRACTOR_TYPE_LABELS[currentJudgment?.selectedType || selectedType]}"，实际是"${DISTRACTOR_TYPE_LABELS[currentOption?.distractorType]}"`}
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {currentOption?.distractorExplanation}
            </p>
          </div>
        )}
      </div>

      {/* Option navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevOption}
          disabled={currentOptionIdx === 0}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            currentOptionIdx === 0
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          ← 上一选项
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {question.options.map((opt, i) => {
            const judged = judgments.some(j => j.optionId === opt.id);
            const isCurrent = i === currentOptionIdx;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setCurrentOptionIdx(i);
                  setSelectedType('');
                  setShowFeedback(false);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  isCurrent
                    ? 'bg-primary-600 text-white shadow-md'
                    : judged
                    ? 'bg-accent-100 text-accent-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {opt.id}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleNextOption}
          disabled={currentOptionIdx === question.options.length - 1}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            currentOptionIdx === question.options.length - 1
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          下一选项 →
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <button
          onClick={() => dispatch({ type: 'PREVIOUS_STEP' })}
          className="px-5 py-3 rounded-xl font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200"
        >
          ← 返回上一步
        </button>
        {allJudged && !isConfirmed && (
          <button
            onClick={handleConfirmAll}
            className="px-8 py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-95 transition-all duration-300"
          >
            确认判断，进入作答
          </button>
        )}
        {isConfirmed && !isLevel2 && (
          <span className="px-8 py-3 rounded-xl font-semibold text-white bg-slate-300">
            已确认 ✓
          </span>
        )}
        {isConfirmed && isLevel2 && (
          <button
            onClick={() => dispatch({ type: 'CONFIRM_DISTRACTOR_JUDGMENTS' })}
            className="px-8 py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-95 transition-all duration-300"
          >
            继续到作答 →
          </button>
        )}
      </div>
    </div>
  );
}

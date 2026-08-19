import { useState } from 'react';
import { useStore, useCurrentData } from '../store';

export default function Step1KeywordExtraction() {
  const { state, dispatch } = useStore();
  const { currentQuestion: question, questionState } = useCurrentData();
  const [showComparison, setShowComparison] = useState(false);
  const isLevel2 = state.proficiencyLevel === 2;

  const isKeywordSelected = (index) => questionState.keywords.includes(index);
  const isExpectedKeyword = (index) => question.stemTokens[index].isKeyword;

  const handleToggle = (index) => {
    if (questionState.keywordConfirmed) return;
    dispatch({ type: 'TOGGLE_KEYWORD', wordIndex: index });
  };

  const handleConfirm = () => {
    dispatch({ type: 'CONFIRM_KEYWORDS' });
    setShowComparison(true);
    setTimeout(() => {
      setShowComparison(false);
    }, 500);
  };

  const getChipClass = (index) => {
    if (!questionState.keywordConfirmed) {
      return isKeywordSelected(index) ? 'word-chip-selected' : 'word-chip-default';
    }
    if (isLevel2) return isKeywordSelected(index) ? 'word-chip-selected' : 'word-chip-default opacity-50';
    const selected = isKeywordSelected(index);
    const expected = isExpectedKeyword(index);
    if (selected && expected) return 'word-chip-selected';
    if (selected && !expected) return 'word-chip-amber';
    if (!selected && expected) return 'word-chip-missed';
    return 'word-chip-default opacity-50';
  };

  const expectedKeywordCount = question.stemTokens.filter(t => t.isKeyword).length;
  const selectedCount = questionState.keywords.length;
  const correctCount = questionState.keywords.filter(i => isExpectedKeyword(i)).length;
  const accuracy = expectedKeywordCount > 0
    ? Math.round((correctCount / expectedKeywordCount) * 100)
    : 0;

  const fewerThanExpected = selectedCount < expectedKeywordCount && selectedCount > 0;

  return (
    <div className="step-enter max-w-3xl mx-auto">
      {/* Instruction */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          第 {question.number} 题 · 第一步：提取题干关键词
        </h2>
        <p className="text-slate-500 text-sm">
          不读文章，先观察题干——点击你认为能帮助定位答案的<strong className="text-primary-600">关键词</strong>
        </p>
        {!questionState.keywordConfirmed && (
          <p className="text-xs text-slate-400 mt-1">
            已选 <strong className="text-primary-600">{selectedCount}</strong>/{expectedKeywordCount} 个关键定位词
          </p>
        )}
      </div>

      {/* Question stem with clickable words */}
      <div className="glass-panel p-6">
        <div className="text-xs uppercase tracking-wider text-slate-400 mb-3 font-semibold">
          题干 Question Stem
        </div>
        <div className="flex flex-wrap gap-2 leading-relaxed">
          {question.stemTokens.map((token, i) => (
            <button
              key={i}
              onClick={() => handleToggle(i)}
              disabled={questionState.keywordConfirmed}
              className={`word-chip ${getChipClass(i)} ${
                questionState.keywordConfirmed ? 'cursor-default' : 'cursor-pointer'
              }`}
              style={{ minHeight: '44px' }}
            >
              {token.text}
            </button>
          ))}
        </div>

        {questionState.keywordConfirmed && !isLevel2 && (
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-accent-600 font-semibold">准确率 {accuracy}%</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">
                选中 {correctCount}/{expectedKeywordCount} 个预期关键词
              </span>
            </div>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-accent-100 border border-accent-500 inline-block" />
                <span className="text-slate-500">命中</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-50 border border-amber-300 border-dashed inline-block" />
                <span className="text-slate-500">遗漏</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-50 border border-amber-400 inline-block" />
                <span className="text-slate-500">多余</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="text-center mt-6">
        {!questionState.keywordConfirmed ? (
          <div className="flex flex-col items-center gap-3">
            {fewerThanExpected && (
              <p className="text-xs text-amber-500">
                💡 建议选择更多关键词以提高定位精度
              </p>
            )}
            <button
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
                selectedCount === 0
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-95'
              }`}
            >
              {fewerThanExpected
                ? `确认关键词（少于参考数量）`
                : '确认关键词，进入定位'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => dispatch({ type: 'CONFIRM_KEYWORDS' })}
              className="px-8 py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-95 transition-all duration-300"
            >
              继续到第二步 →
            </button>
            <button
              onClick={() => dispatch({ type: 'RESTART' })}
              className="text-sm text-slate-400 hover:text-slate-600 underline transition-all"
            >
              重新选择关键词
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

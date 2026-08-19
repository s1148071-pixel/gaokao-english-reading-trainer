import { useState } from 'react';
import { useStore } from '../store';
import { QUESTIONS, getParagraphText } from '../data';

const PAIR_COLORS = [
  'border-l-blue-500 bg-blue-50',
  'border-l-purple-500 bg-purple-50',
  'border-l-orange-500 bg-orange-50',
  'border-l-pink-500 bg-pink-50',
];

export default function Step3Pairing() {
  const { state, dispatch } = useStore();
  const q = state.currentQuestion;
  const questionState = state.questions[q];
  const question = QUESTIONS[q];

  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [selectedPassageFragment, setSelectedPassageFragment] = useState(null);

  // Build passage text from selected paragraphs
  const passageText = questionState.blocks
    .map(id => getParagraphText(id))
    .filter(Boolean)
    .join(' ');

  // Simple tokenization of passage for clicking
  const passageWords = passageText.split(/\s+/).filter(w => w.length > 0);

  const isPairConfirmed = questionState.pairConfirmed;

  const handleOptionClick = (optionId) => {
    if (isPairConfirmed) return;
    if (selectedOptionId === optionId) {
      setSelectedOptionId(null);
      setSelectedPassageFragment(null);
    } else {
      setSelectedOptionId(optionId);
    }
  };

  const handlePassageWordClick = (word, index) => {
    if (isPairConfirmed) return;
    if (!selectedOptionId) return;

    const pair = { optionId: selectedOptionId, passageWord: word, passageIndex: index };
    dispatch({ type: 'ADD_PAIR', pair });
    setSelectedOptionId(null);
    setSelectedPassageFragment(null);
  };

  const handleRemovePair = (pairIndex) => {
    if (isPairConfirmed) return;
    dispatch({ type: 'REMOVE_PAIR', pairIndex });
  };

  const handleConfirm = () => {
    dispatch({ type: 'CONFIRM_PAIRS' });
  };

  // Group pairs by optionId
  const pairsByOption = {};
  questionState.pairs.forEach((p, i) => {
    if (!pairsByOption[p.optionId]) pairsByOption[p.optionId] = [];
    pairsByOption[p.optionId].push({ ...p, globalIndex: i });
  });

  // Check if a passage word is already paired
  const pairedPassageIndices = new Set(questionState.pairs.map(p => p.passageIndex));

  return (
    <div className="step-enter max-w-5xl mx-auto">
      {/* Instruction */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          第 {question.number} 题 · 第三步：选项-文段配对
        </h2>
        <p className="text-slate-500 text-sm">
          先点选项中的<strong className="text-primary-600">定位词</strong>，再点文段中的<strong className="text-accent-600">对应词</strong>，建立配对
        </p>
      </div>

      {/* Question stem */}
      <div className="glass-panel p-5 mb-6 max-w-2xl mx-auto">
        <div className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold">
          题目
        </div>
        <p className="text-base font-medium text-slate-800 passage-text">
          {question.stem}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Selected passage block */}
        <div className="flex-1">
          <div className="glass-panel p-6">
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-3 font-semibold">
              已定位文段 (P{questionState.blocks.join(', P')})
            </div>
            <div className="passage-text text-[15px] leading-relaxed">
              {passageWords.map((word, i) => {
                const isPaired = pairedPassageIndices.has(i);
                const pairInfo = questionState.pairs.find(p => p.passageIndex === i);
                const pairColorIdx = pairInfo
                  ? ['A','B','C','D'].indexOf(pairInfo.optionId)
                  : -1;

                // Clean display of the word
                const cleanWord = word.replace(/[.,;:!?"'`]$/, '');

                return (
                  <span
                    key={i}
                    onClick={() => handlePassageWordClick(word, i)}
                    className={`inline cursor-pointer px-0.5 rounded transition-all duration-200 ${
                      isPairConfirmed ? 'cursor-default' : 'hover:bg-accent-100'
                    } ${
                      isPaired && pairColorIdx >= 0
                        ? `${PAIR_COLORS[pairColorIdx % 4]} px-1 border-l-4 font-medium`
                        : ''
                    } ${
                      selectedOptionId && !isPaired && !isPairConfirmed
                        ? 'ring-1 ring-primary-300 bg-primary-50/50'
                        : ''
                    }`}
                  >
                    {cleanWord}{' '}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Options to pair */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="glass-panel p-5 space-y-4 sticky top-6">
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold">
              选项定位词配对
            </div>

            {question.options.map((option, optIdx) => {
              const optionPairs = pairsByOption[option.id] || [];
              const isActive = selectedOptionId === option.id;

              return (
                <div
                  key={option.id}
                  onClick={() => handleOptionClick(option.id)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    isPairConfirmed ? 'cursor-default' : 'hover:shadow-md'
                  } ${
                    isActive
                      ? 'border-primary-500 bg-primary-50 shadow-sm'
                      : optionPairs.length > 0
                      ? `${PAIR_COLORS[optIdx % 4]} border-l-4`
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-700">
                      {option.id}. {option.text}
                    </span>
                    {optionPairs.length > 0 && (
                      <span className="text-xs text-slate-400">
                        {optionPairs.length} 配对
                      </span>
                    )}
                  </div>

                  {optionPairs.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {optionPairs.map((p) => (
                        <div
                          key={p.globalIndex}
                          className={`flex items-center justify-between text-xs px-2 py-1 rounded ${PAIR_COLORS[optIdx % 4]} bg-opacity-50`}
                        >
                          <span className="font-medium">↔ {p.passageWord}</span>
                          {!isPairConfirmed && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePair(p.globalIndex);
                              }}
                              className="text-slate-400 hover:text-red-500 font-bold"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Status indicator */}
            {selectedOptionId && !isPairConfirmed && (
              <div className="text-xs text-primary-600 bg-primary-50 rounded-lg p-2 text-center">
                已选中 {selectedOptionId}，请在文段中点击对应词汇
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={() => dispatch({ type: 'PREVIOUS_STEP' })}
          className="px-5 py-3 rounded-xl font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200"
        >
          ← 返回上一步
        </button>
        {!isPairConfirmed ? (
          <button
            onClick={handleConfirm}
            className="px-8 py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-95 transition-all duration-300"
          >
            确认配对，开始作答
          </button>
        ) : (
          <button
            onClick={() => dispatch({ type: 'CONFIRM_BLOCKS' })}
            className="px-8 py-3 rounded-xl font-semibold text-white bg-accent-600 hover:bg-accent-700 transition-all duration-300 hover:shadow-lg active:scale-95"
          >
            已确认，进入作答 →
          </button>
        )}
      </div>
    </div>
  );
}

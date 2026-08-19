import { useState, useMemo } from 'react';
import { useStore, useCurrentData } from '../store';

export default function Step2PassageLocation() {
  const { state, dispatch } = useStore();
  const { passage, currentQuestion: question, questionState } = useCurrentData();
  const [showReveal, setShowReveal] = useState(false);
  const isLevel2 = state.proficiencyLevel === 2;

  const isBlockSelected = (paraId) => questionState.blocks.includes(paraId);
  const isCorrectBlock = (paraId) => question.answerBlocks.includes(paraId);

  const handleToggle = (paraId) => {
    if (questionState.blockConfirmed) return;
    dispatch({ type: 'TOGGLE_BLOCK', paragraphId: paraId });
  };

  const handleConfirm = () => {
    dispatch({ type: 'CONFIRM_BLOCKS' });
    setShowReveal(true);
  };

  // Get Step1 keyword texts for auto-highlighting
  const keywordTexts = useMemo(() =>
    questionState.keywords
      .map(i => question.stemTokens[i]?.text?.toLowerCase().replace(/[?"']/g, ''))
      .filter(Boolean),
    [questionState.keywords, question?.stemTokens]
  );

  const getBlockClass = (paraId) => {
    if (!questionState.blockConfirmed) {
      return isBlockSelected(paraId) ? 'sentence-block-selected' : 'sentence-block-default';
    }
    const selected = isBlockSelected(paraId);
    const correct = isCorrectBlock(paraId);
    if (selected && correct) return 'sentence-block-selected animate-pulse-soft';
    if (selected && !correct) return 'sentence-block-wrong';
    if (!selected && correct) return 'sentence-block-revealed';
    return 'sentence-block-default opacity-40';
  };

  const qType = question.questionType || 'detail';

  const getStepTitle = () => {
    if (qType === 'inference') return '第二步：反向定位文章';
    return '第二步：反向定位文章';
  };

  const getInstruction = () => {
    if (qType === 'inference') return (
      <>
        带着关键词，在文章中<strong className="text-primary-600">点击相关段落</strong>，定位推断线索所在文段
      </>
    );
    return (
      <>
        带着关键词，在文章中<strong className="text-primary-600">点击相关段落</strong>，定位答案所在文段
        <span className="block text-xs text-slate-400 mt-1">（不通读全文，只找与关键词相关的段落）</span>
      </>
    );
  };

  const getConfirmText = () => '确认定位，进入比对';

  const getBlockLabel = (paraId) => {
    if (!questionState.blockConfirmed) return null;
    const selected = isBlockSelected(paraId);
    const correct = isCorrectBlock(paraId);
    if (selected && correct) return { text: '✓ 定位正确', color: 'text-accent-600' };
    if (selected && !correct) return { text: '✗ 偏离目标', color: 'text-amber-600' };
    if (!selected && correct) return { text: '遗漏', color: 'text-accent-500' };
    return null;
  };

  const correctCount = questionState.blocks.filter(id => isCorrectBlock(id)).length;
  const extraCount = questionState.blocks.filter(id => !isCorrectBlock(id)).length;

  // Render paragraph text with keyword auto-highlighting
  const renderParagraphText = (para) => {
    const fullText = para.id === 3 && question.id === 26
      ? renderStaggeringText(para)
      : para.sentences.map(s => s.text).join(' ');

    if (!isBlockSelected(para.id) || keywordTexts.length === 0) return fullText;

    // Auto-highlight keywords in selected blocks
    const words = fullText.split(/(\s+)/);
    return words.map((part, i) => {
      const cleanPart = part.toLowerCase().replace(/[.,;:!?"']/g, '');
      if (keywordTexts.includes(cleanPart) && part.trim().length > 0) {
        return <span key={i} className="bg-accent-200 text-accent-800 font-medium rounded px-0.5">{part}</span>;
      }
      return part;
    });
  };

  const renderStaggeringText = (para) => {
    const fullText = para.sentences.map(s => s.text).join(' ');
    const parts = fullText.split('staggering');
    if (parts.length === 1) return fullText;
    return (
      <>
        {parts[0]}
        <span className="underline decoration-accent-500 decoration-2 underline-offset-2 font-semibold text-accent-700">
          staggering
        </span>
        {parts[1]}
      </>
    );
  };

  return (
    <div className="step-enter max-w-4xl mx-auto">
      {/* Instruction */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          第 {question.number} 题 · {getStepTitle()}
        </h2>
        <p className="text-slate-500 text-sm">
          {getInstruction()}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Passage — hidden on desktop (PassageReader on left handles it), visible on mobile */}
        <div className="flex-1 lg:hidden">
          <div className="glass-panel p-6">
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-4 font-semibold">
              文章 Passage
            </div>
            <div className="passage-text space-y-4">
              {passage.paragraphs.map((para) => {
                const label = getBlockLabel(para.id);
                return (
                  <div
                    key={para.id}
                    onClick={() => handleToggle(para.id)}
                    className={`sentence-block ${getBlockClass(para.id)} ${
                      questionState.blockConfirmed ? 'cursor-default' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`text-xs font-bold shrink-0 mt-0.5 px-2 py-0.5 rounded ${
                        isBlockSelected(para.id) && !questionState.blockConfirmed
                          ? 'bg-accent-500 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        P{para.id}
                      </span>
                      <div className="flex-1">
                        <p className="text-[15px] leading-relaxed">
                          {renderParagraphText(para)}
                        </p>
                      </div>
                      {!isLevel2 && label && (
                        <span className={`text-xs font-semibold shrink-0 ${label.color}`}>
                          {label.text}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Desktop hint: use left panel to locate */}
        <div className="hidden lg:block flex-1">
          <div className="glass-panel p-6 text-center">
            <div className="text-4xl mb-3">👈</div>
            <p className="text-sm text-slate-500 leading-relaxed">
              在左侧文章中<strong className="text-primary-600">点击段落编号</strong>选择定位
              <br />
              <span className="text-xs text-slate-400 mt-1 block">
                选中段落会高亮显示，可多选
              </span>
            </p>
            {questionState.blocks.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {questionState.blocks.map(id => (
                  <span key={id} className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                    ¶{id} ✓
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Stats only (no keywords) */}
        <div className="w-full lg:w-48 shrink-0">
          <div className="glass-panel p-5 sticky top-6">
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold">
              定位统计
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">已选段落</span>
                <span className="font-bold text-slate-700">{questionState.blocks.length}</span>
              </div>
              {questionState.blockConfirmed && (
                <>
                  <div className="flex justify-between">
                    <span className="text-accent-600">命中</span>
                    <span className="font-bold text-accent-600">{correctCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-600">偏离</span>
                    <span className="font-bold text-amber-600">{extraCount}</span>
                  </div>
                </>
              )}
            </div>
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
        <button
          onClick={handleConfirm}
          disabled={questionState.blocks.length === 0}
          className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
            questionState.blocks.length === 0
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-95'
          }`}
        >
          {getConfirmText()}
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useStore, useCurrentData } from '../store';
import { STRUCTURE_TYPES, THESIS_LOCATIONS } from '../data';

// Main idea question Step3: induction
// Student reads passage (left panel), then writes a one-sentence main idea summary

export default function Step3MainInduction() {
  const { state, dispatch } = useStore();
  const { passage, currentQuestion: question, questionState } = useCurrentData();
  const [summary, setSummary] = useState(questionState.mainSummary || '');

  const method = questionState.mainMethod;
  const isConfirmed = questionState.mainSummaryConfirmed;
  const prediction = questionState.structurePrediction || {};

  const handleConfirm = () => {
    if (!summary.trim()) return;
    dispatch({ type: 'SET_MAIN_SUMMARY', text: summary.trim() });
    dispatch({ type: 'CONFIRM_MAIN_SUMMARY' });
  };

  // Get relevant paragraphs based on method
  const getRelevantParagraphs = () => {
    if (!passage) return [];
    if (method === 'head-tail') {
      const paras = passage.paragraphs;
      return [paras[0], paras[paras.length - 1]];
    }
    // logic-chain: all paragraphs with summary
    return passage.paragraphs;
  };

  const relevantParas = getRelevantParagraphs();
  const passageSummary = passage?.passageSummary || [];

  return (
    <div className="step-enter max-w-2xl mx-auto">
      {/* Instruction */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          第 {question.number} 题 · 第三步：主旨归纳
        </h2>
        <p className="text-slate-500 text-sm">
          {method === 'head-tail'
            ? '对比首尾段，用一句话写出文章主旨'
            : '顺着每段要点，用一句话归纳文章主旨'
          }
        </p>
      </div>

      {/* Method context */}
      <div className="glass-panel p-4 mb-4 border-l-4 border-l-primary-400">
        <div className="flex items-center gap-3 text-sm">
          <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium">
            {method === 'head-tail' ? '🎯 首尾段法' : '🔗 逻辑链法'}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">
            预判：{STRUCTURE_TYPES[prediction.type]} · {THESIS_LOCATIONS[prediction.thesisLocation]}
          </span>
        </div>
      </div>

      {/* Method-specific reference */}
      {method === 'head-tail' ? (
        <div className="glass-panel p-4 mb-4">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold">
            📍 首段 + 尾段（在左侧文章中阅读）
          </div>
          <div className="space-y-3">
            {relevantParas.map(para => (
              <div key={para.id} className="text-sm">
                <span className="text-[10px] text-slate-400 font-mono mr-1">¶{para.id}</span>
                <span className="text-slate-600 leading-relaxed">
                  {para.sentences.map(s => s.text).join(' ')}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            💡 对比首尾：作者开头想什么 → 结尾认识到什么？变化即主旨。
          </p>
        </div>
      ) : (
        <div className="glass-panel p-4 mb-4">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-3 font-semibold">
            🔗 前三题逻辑链（每段关键信息）
          </div>
          <div className="space-y-2.5">
            {passageSummary.map(ps => (
              <div key={ps.paragraphId} className="flex items-start gap-2 text-sm">
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 flex-shrink-0">
                  ¶{ps.paragraphId}
                </span>
                <div className="flex-1">
                  <p className="text-slate-600 leading-relaxed">{ps.summary}</p>
                  <p className="text-xs text-accent-600 mt-0.5">→ {ps.keyInfo}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            💡 顺着每段要点推理：开头→发展→结尾，整体在讲什么？
          </p>
        </div>
      )}

      {/* Induction input */}
      <div className="glass-panel p-5 mb-4">
        <div className="text-sm font-semibold text-slate-700 mb-2">
          ✍️ 用一句话写下你归纳的主旨
        </div>
        <textarea
          value={summary}
          onChange={e => !isConfirmed && setSummary(e.target.value)}
          disabled={isConfirmed}
          placeholder="例如：作者通过...经历，意识到...的重要性"
          className="w-full p-3 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
          rows={3}
        />
        <p className="text-xs text-slate-400 mt-2">
          {summary.length > 0 && `${summary.length} 字`}
          {summary.length > 80 && ' · 建议精简到一句话'}
        </p>
      </div>

      {/* Confirmed summary display */}
      {isConfirmed && (
        <div className="glass-panel p-4 mb-4 bg-accent-50/30 border-accent-200 animate-fadeIn">
          <div className="text-xs uppercase tracking-wider text-accent-500 mb-1 font-semibold">
            ✅ 你的主旨归纳
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {questionState.mainSummary}
          </p>
        </div>
      )}

      {/* Action */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={() => dispatch({ type: 'PREVIOUS_STEP' })}
          className="px-5 py-3 rounded-xl font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200"
        >
          ← 返回方法选择
        </button>
        {!isConfirmed ? (
          <button
            onClick={handleConfirm}
            disabled={!summary.trim()}
            className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
              !summary.trim()
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-95'
            }`}
          >
            确认归纳，进入作答
          </button>
        ) : (
          <button
            onClick={() => dispatch({ type: 'CONFIRM_MAIN_SUMMARY' })}
            className="px-8 py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-95 transition-all duration-300"
          >
            继续到作答 →
          </button>
        )}
      </div>
    </div>
  );
}

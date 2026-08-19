import { useStore, useCurrentData } from '../store';
import { STRUCTURE_TYPES, THESIS_LOCATIONS } from '../data';

// Main idea question Step2: method selection + branch
// Student chooses: head-tail method OR logic-chain method

export default function Step2MainMethod() {
  const { state, dispatch } = useStore();
  const { passage, currentQuestion: question, questionState } = useCurrentData();

  const selectedMethod = questionState.mainMethod;
  const prediction = questionState.structurePrediction || {};

  const handleSelectMethod = (method) => {
    dispatch({ type: 'SET_MAIN_METHOD', method });
  };

  const handleProceed = () => {
    // Move to Step3 (induction)
    dispatch({ type: 'MAIN_STEP2_TO_STEP3' });
  };

  return (
    <div className="step-enter max-w-2xl mx-auto">
      {/* Instruction */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          第 {question.number} 题 · 第二步：选择主旨推导方法
        </h2>
        <p className="text-slate-500 text-sm">
          你已预判为<strong className="text-primary-600">{STRUCTURE_TYPES[prediction.type] || '?'}</strong>
          · 主旨在<strong className="text-primary-600">{THESIS_LOCATIONS[prediction.thesisLocation] || '?'}</strong>
        </p>
      </div>

      {/* Method selection */}
      <div className="space-y-4">
        {/* Method A: Head-Tail */}
        <div
          onClick={() => handleSelectMethod('head-tail')}
          className={`glass-panel p-5 cursor-pointer transition-all duration-300 border-2 ${
            selectedMethod === 'head-tail'
              ? 'border-primary-400 bg-primary-50/30 scale-[1.02]'
              : 'border-transparent hover:border-slate-200'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
              selectedMethod === 'head-tail' ? 'bg-primary-100' : 'bg-slate-100'
            }`}>
              🎯
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-slate-800 mb-1">
                方法A：首尾段定位法
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-2">
                直接定位<strong>首段</strong>和<strong>尾段</strong>，对比首尾观点变化。
                适合结构清晰、首尾段有点题句的文章。
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  ⏱ 快速
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  适合结构清晰的文章
                </span>
              </div>
            </div>
            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              selectedMethod === 'head-tail' ? 'border-primary-500 bg-primary-500' : 'border-slate-300'
            }`}>
              {selectedMethod === 'head-tail' && <span className="w-2 h-2 rounded-full bg-white" />}
            </span>
          </div>
        </div>

        {/* Method B: Logic Chain */}
        <div
          onClick={() => handleSelectMethod('logic-chain')}
          className={`glass-panel p-5 cursor-pointer transition-all duration-300 border-2 ${
            selectedMethod === 'logic-chain'
              ? 'border-accent-400 bg-accent-50/30 scale-[1.02]'
              : 'border-transparent hover:border-slate-200'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
              selectedMethod === 'logic-chain' ? 'bg-accent-100' : 'bg-slate-100'
            }`}>
              🔗
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-slate-800 mb-1">
                方法B：逻辑链顺推法
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-2">
                前三题已略读过文章——顺着<strong>每段关键信息</strong>，推理出整体主旨。
                适合叙事/反思类文章，主旨需整体归纳。
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  📝 利用前三题铺垫
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  适合叙事/反思文
                </span>
              </div>
            </div>
            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              selectedMethod === 'logic-chain' ? 'border-accent-500 bg-accent-500' : 'border-slate-300'
            }`}>
              {selectedMethod === 'logic-chain' && <span className="w-2 h-2 rounded-full bg-white" />}
            </span>
          </div>
        </div>
      </div>

      {/* Selected method preview */}
      {selectedMethod && (
        <div className="glass-panel p-4 mt-4 animate-fadeIn border-l-4 border-l-primary-400">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold">
            方法说明
          </div>
          {selectedMethod === 'head-tail' ? (
            <div className="text-sm text-slate-600 leading-relaxed space-y-1">
              <p>📍 在左侧文章中阅读<strong>首段</strong>和<strong>尾段</strong>。</p>
              <p>💡 问自己：作者在首段提出什么？尾段总结成什么？两者有何变化？</p>
              <p>✏️ 可以用标注工具高亮首尾段的主旨句。</p>
            </div>
          ) : (
            <div className="text-sm text-slate-600 leading-relaxed space-y-1">
              <p>📍 左侧文章会展示<strong>每段关键信息</strong>（前三题已覆盖的段落要点）。</p>
              <p>💡 顺着段落要点推理：开头讲了什么 → 中间发展什么 → 结尾升华什么。</p>
              <p>✏️ 在归纳框中用自己的话写出主旨。</p>
            </div>
          )}
        </div>
      )}

      {/* Action */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={() => dispatch({ type: 'PREVIOUS_STEP' })}
          className="px-5 py-3 rounded-xl font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200"
        >
          ← 返回上一步
        </button>
        <button
          onClick={handleProceed}
          disabled={!selectedMethod}
          className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
            !selectedMethod
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-95'
          }`}
        >
          确认方法，进入归纳
        </button>
      </div>
    </div>
  );
}

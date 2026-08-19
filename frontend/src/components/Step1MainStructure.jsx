import { useStore, useCurrentData } from '../store';

// Main idea question Step1: structure prediction
// Student picks article type + thesis location, then confirms to proceed

const STRUCTURE_OPTIONS = [
  { value: 'argumentative', label: '议论文', desc: '提出观点→论证→结论', icon: '⚖️' },
  { value: 'expository', label: '说明文', desc: '客观介绍/解释某事物', icon: '📖' },
  { value: 'narrative', label: '记叙文', desc: '讲述故事/经历', icon: '📝' },
  { value: 'reflective', label: '反思散文', desc: '个人经历→感悟升华', icon: '✨' },
];

const LOCATION_OPTIONS = [
  { value: 'first-paragraph', label: '首段点题', desc: '开篇即亮出主旨' },
  { value: 'last-paragraph', label: '尾段总结', desc: '结尾升华点题' },
  { value: 'first-and-last', label: '首尾呼应', desc: '首段提出+尾段总结' },
  { value: 'throughout', label: '全文渗透', desc: '无明显主旨句，需整体归纳' },
];

export default function Step1MainStructure() {
  const { state, dispatch } = useStore();
  const { currentQuestion: question, questionState } = useCurrentData();

  const prediction = questionState.structurePrediction || {};
  const selectedType = prediction.type;
  const selectedLocation = prediction.thesisLocation;
  const isConfirmed = questionState.structureConfirmed;

  const canConfirm = selectedType && selectedLocation;

  const handleConfirm = () => {
    if (!canConfirm) return;
    dispatch({ type: 'CONFIRM_STRUCTURE' });
  };

  return (
    <div className="step-enter max-w-2xl mx-auto">
      {/* Instruction */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          第 {question.number} 题 · 第一步：文章结构预判
        </h2>
        <p className="text-slate-500 text-sm">
          主旨题不读全文也能做——先判断<strong className="text-primary-600">文章类型</strong>和<strong className="text-primary-600">主旨位置</strong>
        </p>
      </div>

      {/* Question stem */}
      <div className="glass-panel p-5 mb-4">
        <div className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold">
          题目
        </div>
        <p className="text-lg font-medium text-slate-800 passage-text">
          {question.stem}
        </p>
        <p className="text-xs text-slate-400 mt-2">
          💡 "show / realize / mainly about / best title" 等词指向主旨题
        </p>
      </div>

      {/* Structure type selection */}
      <div className="glass-panel p-5 mb-4">
        <div className="text-sm font-semibold text-slate-700 mb-3">
          1. 这篇文章是什么类型？
        </div>
        <div className="grid grid-cols-2 gap-2">
          {STRUCTURE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => !isConfirmed && dispatch({
                type: 'SET_STRUCTURE_PREDICTION',
                structureType: opt.value,
                thesisLocation: selectedLocation,
              })}
              disabled={isConfirmed}
              className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                selectedType === opt.value
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              } ${isConfirmed ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{opt.icon}</span>
                <span className="font-semibold text-slate-700">{opt.label}</span>
              </div>
              <p className="text-xs text-slate-400">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Thesis location selection */}
      <div className="glass-panel p-5 mb-4">
        <div className="text-sm font-semibold text-slate-700 mb-3">
          2. 主旨最可能出现在哪里？
        </div>
        <div className="space-y-2">
          {LOCATION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => !isConfirmed && dispatch({
                type: 'SET_STRUCTURE_PREDICTION',
                structureType: selectedType,
                thesisLocation: opt.value,
              })}
              disabled={isConfirmed}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${
                selectedLocation === opt.value
                  ? 'border-accent-400 bg-accent-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              } ${isConfirmed ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
            >
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selectedLocation === opt.value ? 'border-accent-500 bg-accent-500' : 'border-slate-300'
              }`}>
                {selectedLocation === opt.value && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
              <div className="flex-1 text-left">
                <span className="font-medium text-slate-700">{opt.label}</span>
                <span className="text-xs text-slate-400 ml-2">{opt.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Feedback after confirm */}
      {isConfirmed && (
        <div className="glass-panel p-4 mb-4 bg-accent-50/30 border-accent-200 animate-fadeIn">
          <p className="text-sm text-slate-600">
            ✅ 预判完成。接下来在左侧文章中<strong className="text-primary-600">定位主旨段</strong>，验证你的判断。
          </p>
        </div>
      )}

      {/* Action */}
      <div className="text-center mt-6">
        {!isConfirmed ? (
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
              !canConfirm
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-95'
            }`}
          >
            确认预判，进入定位
          </button>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => dispatch({ type: 'CONFIRM_STRUCTURE' })}
              className="px-8 py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-95 transition-all duration-300"
            >
              继续到第二步 →
            </button>
            <button
              onClick={() => dispatch({ type: 'RESTART' })}
              className="text-sm text-slate-400 hover:text-slate-600 underline transition-all"
            >
              重新预判
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

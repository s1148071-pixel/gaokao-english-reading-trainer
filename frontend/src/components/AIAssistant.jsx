import { useState } from 'react';
import { api } from '../api';

export default function AIAssistant({ question, options, correctAnswer, userAnswer, questionType }) {
  const [open, setOpen] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);

  const handleAsk = async () => {
    if (!question) return;
    if (!open) {
      setOpen(true);
      if (!hasData) {
        setLoading(true);
        const { data, error } = await api.explainQuestion({
          question,
          options: options || [],
          correctAnswer,
          userAnswer,
          questionType: questionType || 'detail',
        });
        setLoading(false);
        if (data) {
          setExplanation(data.explanation);
          setHasData(true);
        } else {
          setExplanation('AI 服务暂时不可用，请确保后端已启动并配置 DEEPSEEK_API_KEY。');
        }
      }
      return;
    }
    setOpen(false);
  };

  return (
    <>
      {/* Floating ball */}
      <button
        onClick={handleAsk}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-2xl transition-all duration-300 ${
          open
            ? 'bg-slate-700 text-white scale-90'
            : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:scale-110 hover:shadow-purple-200'
        }`}
        title="AI 讲题助手"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 max-w-[90vw] max-h-[60vh] glass-panel rounded-2xl shadow-2xl flex flex-col animate-fadeIn overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex items-center justify-between">
            <span className="text-sm font-bold">🤖 AI 讲题助手</span>
            <span className="text-[10px] opacity-70">Powered by DeepSeek</span>
          </div>
          <div className="flex-1 p-4 overflow-y-auto text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400">
                <span className="animate-spin">⏳</span>
                <span>AI 正在分析题目...</span>
              </div>
            ) : explanation ? (
              explanation
            ) : (
              <p className="text-slate-400">点击悬浮球获取 AI 解析</p>
            )}
          </div>
          {explanation && (
            <button
              onClick={() => { setExplanation(''); setHasData(false); }}
              className="px-4 py-2 text-xs text-purple-500 hover:bg-purple-50 border-t border-slate-100"
            >
              重新分析
            </button>
          )}
        </div>
      )}
    </>
  );
}

import { useState, useEffect } from 'react';
import { api } from '../api';
import { useStore } from '../store';
import AIAssistant from './AIAssistant';

const TYPE_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'detail', label: '细节' },
  { value: 'inference', label: '推断' },
  { value: 'main', label: '主旨' },
];

export default function WrongBook({ onBack }) {
  const { dispatch } = useStore();
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const loadRecords = (type) => {
    setLoading(true);
    api.getWrongRecords(type).then(({ data }) => {
      if (data) setRecords(data);
      setLoading(false);
    });
  };

  useEffect(() => { loadRecords(filter); }, [filter]);

  const handleRetake = (passageId, questionId) => {
    // Navigate to training mode for this question
    dispatch({ type: 'SELECT_PASSAGE', paperId: passageId.includes('why') ? '2025-n1' : '2026-n1', passageId, mode: 'practice' });
  };

  const handleAIAnalyze = async (record) => {
    // Fetch full question data to get options and correctAnswer
    const { data } = await api.getQuestion(record.questionId);
    setSelectedQuestion({
      stem: record.questionStem,
      questionType: record.questionType,
      userAnswer: record.finalAnswer,
      correctAnswer: data?.correctAnswer || '',
      options: data?.options || [],
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">📕 错题本</h2>
        <button onClick={onBack} className="px-4 py-2 rounded-xl text-sm bg-slate-100 hover:bg-slate-200">← 返回</button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {TYPE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === opt.value ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {opt.label} {opt.value === 'all' && records.length > 0 && `(${records.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-slate-400 py-8">加载中...</p>
      ) : records.length === 0 ? (
        <div className="glass-panel p-8 text-center">
          <p className="text-slate-400 text-lg mb-2">🎉 没有错题！</p>
          <p className="text-slate-300 text-sm">继续保持</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map(r => (
            <div key={r.id} className="glass-panel p-4 flex items-center justify-between group hover:border-red-200 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-red-600">Q{r.questionNumber}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    r.questionType === 'detail' ? 'bg-blue-100 text-blue-700' :
                    r.questionType === 'inference' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {r.questionType === 'detail' ? '细节' : r.questionType === 'inference' ? '推断' : '主旨'}
                  </span>
                  <span className="text-xs text-slate-400">你的答案: {r.finalAnswer}</span>
                </div>
                <p className="text-sm text-slate-600 truncate">{r.questionStem}</p>
              </div>
              <button
                onClick={() => handleRetake(r.passageId, r.questionId)}
                className="ml-4 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all flex-shrink-0"
              >
                重做
              </button>
              <button
                onClick={() => handleAIAnalyze(r)}
                className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 active:scale-95 transition-all flex-shrink-0"
              >
                🤖 AI分析
              </button>
            </div>
          ))}
        </div>
      )}

      <AIAssistant
        question={selectedQuestion?.stem}
        options={selectedQuestion?.options}
        correctAnswer={selectedQuestion?.correctAnswer}
        userAnswer={selectedQuestion?.userAnswer}
        questionType={selectedQuestion?.questionType}
      />
    </div>
  );
}

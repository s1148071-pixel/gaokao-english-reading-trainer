import { useState, useEffect } from 'react';
import { api } from '../api';

const DISTRACTOR_OPTIONS = [
  { value: 'correct', label: '正确选项（同义替换）' },
  { value: 'synonym_replace', label: '同义替换' },
  { value: 'concept_swap', label: '偷换概念' },
  { value: 'unsupported', label: '无中生有' },
  { value: 'opposite_direction', label: '方向相反' },
  { value: 'scope_shift', label: '范围扩大/缩小' },
];

export default function AnnotationEditor({ onBack }) {
  const [papers, setPapers] = useState([]);
  const [expanded, setExpanded] = useState({}); // { 'paper-id': true, 'passage-id': true }
  const [editing, setEditing] = useState(null); // { type:'option', questionId, optionId, option }
  const [editingPassage, setEditingPassage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getPapers().then(({ data }) => { if (data) setPapers(data); });
  }, []);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const openOptionEditor = (questionId, option) => {
    setEditing({ type: 'option', questionId, optionId: option.id, option: { ...option } });
    setEditingPassage(null);
  };

  const openPassageEditor = (passage) => {
    setEditingPassage({ ...passage });
    setEditing(null);
  };

  const handleSaveOption = async () => {
    if (!editing || editing.type !== 'option') return;
    setSaving(true);
    const { questionId, optionId, option } = editing;
    const { data, error } = await api.updateOption(questionId, optionId, {
      distractorType: option.distractorType,
      distractorExplanation: option.distractorExplanation || '',
      evidenceSentence: option.evidenceSentence || '',
    });
    setSaving(false);
    if (error) {
      setMessage('保存失败: ' + error);
    } else {
      setMessage('✅ 已保存');
      setEditing(null);
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const handleSavePassage = async () => {
    if (!editingPassage) return;
    setSaving(true);
    const { data, error } = await api.updatePassage(editingPassage.id, {
      passageSummary: editingPassage.passageSummary,
    });
    setSaving(false);
    if (error) {
      setMessage('保存失败: ' + error);
    } else {
      setMessage('✅ 篇章已保存');
      setEditingPassage(null);
      setTimeout(() => setMessage(''), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">✏️ 题目标注工具</h2>
        <div className="flex items-center gap-3">
          {message && <span className="text-sm text-accent-600">{message}</span>}
          <button onClick={onBack} className="px-4 py-2 rounded-xl text-sm bg-slate-100 hover:bg-slate-200">← 返回</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Tree list */}
        <div className="col-span-1 space-y-2">
          {papers.map(paper => (
            <div key={paper.id}>
              <button onClick={() => toggle(paper.id)} className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold bg-slate-100 hover:bg-slate-200 flex items-center gap-1">
                <span>{expanded[paper.id] ? '▼' : '▶'}</span>
                <span>{paper.name}</span>
              </button>
              {expanded[paper.id] && paper.passages?.map(passage => (
                <div key={passage.id} className="ml-3 mt-1">
                  <button onClick={() => toggle(passage.id)} className="w-full text-left px-3 py-1.5 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1">
                    <span>{expanded[passage.id] ? '▽' : '▷'}</span>
                    <span className="truncate">{passage.title}</span>
                  </button>
                  <button onClick={() => openPassageEditor(passage)} className="ml-6 text-[10px] text-purple-500 hover:text-purple-700">
                    编辑篇章摘要
                  </button>
                  {expanded[passage.id] && passage._count?.questions > 0 && (
                    <div className="ml-6 text-xs text-slate-400 mt-0.5">
                      {passage._count.questions || (passage.questionCount)} 道题
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Right: Editor */}
        <div className="col-span-2">
          {editing ? (
            <div className="glass-panel p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3">
                编辑选项 {editing.optionId} · 题目 #{editing.questionId}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">干扰项类型</label>
                  <select
                    value={editing.option.distractorType || ''}
                    onChange={e => setEditing(prev => ({ ...prev, option: { ...prev.option, distractorType: e.target.value } }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  >
                    {DISTRACTOR_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">原文证据句 (evidenceSentence)</label>
                  <textarea
                    value={editing.option.evidenceSentence || ''}
                    onChange={e => setEditing(prev => ({ ...prev, option: { ...prev.option, evidenceSentence: e.target.value } }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg h-20 resize-none"
                    placeholder="引用原文中支持该选项的句子..."
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">干扰项解释 (distractorExplanation)</label>
                  <textarea
                    value={editing.option.distractorExplanation || ''}
                    onChange={e => setEditing(prev => ({ ...prev, option: { ...prev.option, distractorExplanation: e.target.value } }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg h-24 resize-none"
                    placeholder="解释为什么这个选项是对/错的..."
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveOption} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300">
                    {saving ? '保存中...' : '保存'}
                  </button>
                  <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100">
                    取消
                  </button>
                </div>
              </div>
            </div>
          ) : editingPassage ? (
            <div className="glass-panel p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3">
                编辑篇章摘要 · {editingPassage.title}
              </h3>
              <textarea
                value={typeof editingPassage.passageSummary === 'string' ? editingPassage.passageSummary : JSON.stringify(editingPassage.passageSummary, null, 2)}
                onChange={e => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setEditingPassage(prev => ({ ...prev, passageSummary: parsed }));
                  } catch {
                    setEditingPassage(prev => ({ ...prev, passageSummary: e.target.value }));
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg h-40 resize-none font-mono"
                placeholder='[{"paragraphId":1,"summary":"...","keyInfo":"..."}]'
              />
              <div className="flex gap-2 mt-3">
                <button onClick={handleSavePassage} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300">
                  {saving ? '保存中...' : '保存'}
                </button>
                <button onClick={() => setEditingPassage(null)} className="px-4 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100">
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-8 text-center text-slate-400">
              <p className="text-lg mb-2">📋</p>
              <p>从左侧选择试卷→篇章→题目</p>
              <p className="text-xs mt-2">（题目数据通过 /api/passages/:id 获取，可选择选项进行编辑）</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

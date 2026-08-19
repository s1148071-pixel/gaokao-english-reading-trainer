import { useState, useRef, useEffect } from 'react';
import { useStore, useCurrentData } from '../store';

// Highlight color palette
const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: '重点', bg: 'bg-yellow-200', text: 'text-yellow-800', chip: 'bg-yellow-100 text-yellow-700' },
  { id: 'green', label: '已懂', bg: 'bg-green-200', text: 'text-green-800', chip: 'bg-green-100 text-green-700' },
  { id: 'pink', label: '存疑', bg: 'bg-pink-200', text: 'text-pink-800', chip: 'bg-pink-100 text-pink-700' },
];

function getColorClasses(colorId) {
  return HIGHLIGHT_COLORS.find(c => c.id === colorId) || HIGHLIGHT_COLORS[0];
}

export default function PassageReader({ readOnly = false, showAnnotationsPanel = true, locateMode = false }) {
  const { state, dispatch } = useStore();
  const { passage, questionState } = useCurrentData();
  const isLevel2 = state.proficiencyLevel === 2;
  const [selectedSentence, setSelectedSentence] = useState(null);
  const [showNoteEditor, setShowNoteEditor] = useState(null); // sentenceId
  const [noteText, setNoteText] = useState('');
  const [activeHighlightColor, setActiveHighlightColor] = useState('yellow');
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });
  const [selectionText, setSelectionText] = useState('');
  const [selectionSentenceId, setSelectionSentenceId] = useState(null);
  const containerRef = useRef(null);

  // Check if a sentence is underlined
  const isUnderlined = (sentenceId) => {
    return questionState?.underlines?.some(u => u.sentenceId === sentenceId);
  };

  // Get highlights for a sentence
  const getHighlightsForSentence = (sentenceId) => {
    return (questionState?.highlights || []).filter(h => h.sentenceId === sentenceId);
  };

  // Get note for a sentence
  const getNoteForSentence = (sentenceId) => {
    return (questionState?.notes || []).find(n => n.sentenceId === sentenceId);
  };

  // Handle text selection
  const handleMouseUp = () => {
    if (readOnly) return;
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (!text || text.length < 2) {
      setShowToolbar(false);
      return;
    }

    // Find which sentence the selection is in
    const anchorNode = selection.anchorNode;
    if (!anchorNode) return;
    const sentenceEl = anchorNode.parentElement?.closest('[data-sentence-id]');
    if (!sentenceEl) {
      setShowToolbar(false);
      return;
    }
    const sentenceId = parseInt(sentenceEl.dataset.sentenceId);

    // Position toolbar near selection
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      setToolbarPos({
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top - containerRect.top - 10,
      });
    }
    setSelectionText(text);
    setSelectionSentenceId(sentenceId);
    setShowToolbar(true);
  };

  // Apply highlight to selected text
  const applyHighlight = (color) => {
    if (!selectionText || !selectionSentenceId) return;
    dispatch({
      type: 'ADD_HIGHLIGHT',
      sentenceId: selectionSentenceId,
      text: selectionText,
      color,
    });
    setShowToolbar(false);
    window.getSelection().removeAllRanges();
  };

  // Toggle underline for a sentence
  const toggleUnderline = (sentenceId) => {
    if (readOnly) return;
    dispatch({ type: 'TOGGLE_UNDERLINE', sentenceId });
  };

  // Add note
  const handleAddNote = (sentenceId) => {
    if (readOnly) return;
    const existing = getNoteForSentence(sentenceId);
    if (existing) {
      setNoteText(existing.text);
    } else {
      setNoteText('');
    }
    setShowNoteEditor(sentenceId);
  };

  const saveNote = () => {
    if (!showNoteEditor || !noteText.trim()) {
      setShowNoteEditor(null);
      return;
    }
    // Remove existing note for this sentence first
    const existing = getNoteForSentence(showNoteEditor);
    if (existing) {
      dispatch({ type: 'REMOVE_NOTE', id: existing.id });
    }
    dispatch({ type: 'ADD_NOTE', sentenceId: showNoteEditor, text: noteText.trim() });
    setShowNoteEditor(null);
    setNoteText('');
  };

  // Render sentence with highlights applied
  const renderSentenceText = (sentence) => {
    const highlights = getHighlightsForSentence(sentence.id);
    if (highlights.length === 0) {
      return sentence.text;
    }

    // Sort highlights by their position in text (approximate by text match)
    let parts = [{ text: sentence.text, highlight: null }];
    highlights.forEach(hl => {
      const newParts = [];
      parts.forEach(part => {
        if (part.highlight) {
          newParts.push(part);
          return;
        }
        const idx = part.text.indexOf(hl.text);
        if (idx === -1) {
          newParts.push(part);
          return;
        }
        if (idx > 0) newParts.push({ text: part.text.slice(0, idx), highlight: null });
        newParts.push({ text: hl.text, highlight: hl });
        const after = part.text.slice(idx + hl.text.length);
        if (after) newParts.push({ text: after, highlight: null });
      });
      parts = newParts;
    });

    return parts.map((part, i) => {
      if (part.highlight) {
        const c = getColorClasses(part.highlight.color);
        return (
          <span key={i} className={`${c.bg} ${c.text} rounded px-0.5 relative group/highlight`}>
            {part.text}
            {!readOnly && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'REMOVE_HIGHLIGHT', id: part.highlight.id });
                }}
                className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] leading-none opacity-0 group-hover/highlight:opacity-100 transition-opacity flex items-center justify-center"
              >
                ×
              </button>
            )}
          </span>
        );
      }
      return <span key={i}>{part.text}</span>;
    });
  };

  if (!passage) return null;

  const totalAnnotations = (questionState?.highlights?.length || 0)
    + (questionState?.underlines?.length || 0)
    + (questionState?.notes?.length || 0);

  return (
    <div className="flex flex-col h-full" ref={containerRef}>
      {/* Toolbar that appears on text selection */}
      {showToolbar && !readOnly && (
        <div
          className="absolute z-50 flex items-center gap-1 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5"
          style={{ left: toolbarPos.x, top: toolbarPos.y, transform: 'translate(-50%, -100%)' }}
        >
          <span className="text-xs text-slate-400 px-2">高亮：</span>
          {HIGHLIGHT_COLORS.map(c => (
            <button
              key={c.id}
              onClick={() => applyHighlight(c.id)}
              className={`w-7 h-7 rounded-lg ${c.bg} hover:scale-110 transition-transform flex items-center justify-center text-xs font-medium ${c.text}`}
              title={c.label}
            >
              A
            </button>
          ))}
        </div>
      )}

      {/* Annotation tools bar */}
      {!readOnly && (
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-yellow-200"></span>重点
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-200"></span>已懂
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-pink-200"></span>存疑
            </span>
            <span className="mx-1 text-slate-300">|</span>
            <span>选中文字→高亮 · 句末按钮→下划线/笔记</span>
          </div>
          {totalAnnotations > 0 && (
            <button
              onClick={() => {
                if (confirm('确定清空本题所有标注？')) {
                  dispatch({ type: 'CLEAR_ANNOTATIONS' });
                }
              }}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              清空标注 ({totalAnnotations})
            </button>
          )}
        </div>
      )}

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Passage text */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="glass-panel p-5 space-y-4">
            {/* Locate mode hint */}
            {locateMode && (
              <div className="mb-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-600">
                📍 定位模式：点击段落编号选择/取消定位
              </div>
            )}
            {passage.paragraphs.map((para) => {
              const isBlockSelected = locateMode && questionState?.blocks?.includes(para.id);
              const isCorrectBlock = !isLevel2 && locateMode && questionState?.blockConfirmed && (() => {
                const q = state.currentQuestion;
                const question = passage.questions[q];
                return question?.answerBlocks?.includes(para.id);
              })();

              return (
              <div key={para.id} className="leading-relaxed">
                <div className="flex items-center gap-1.5 mb-1">
                  {locateMode ? (
                    <button
                      onClick={() => dispatch({ type: 'TOGGLE_BLOCK', paragraphId: para.id })}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-all ${
                        isBlockSelected
                          ? isCorrectBlock === true
                            ? 'bg-accent-200 text-accent-800 font-bold'
                            : isCorrectBlock === false
                            ? 'bg-red-200 text-red-800 font-bold'
                            : 'bg-primary-200 text-primary-800 font-bold'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      ¶{para.id} {isBlockSelected ? '✓' : ''}
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-300 font-mono">¶{para.id}</span>
                  )}
                </div>
                {para.sentences.map((sentence) => {
                  const underlined = isUnderlined(sentence.id);
                  const note = getNoteForSentence(sentence.id);
                  const hasHighlight = getHighlightsForSentence(sentence.id).length > 0;

                  return (
                    <span
                      key={sentence.id}
                      data-sentence-id={sentence.id}
                      className={`inline passage-text ${
                        underlined ? 'underline decoration-2 decoration-blue-400 underline-offset-4' : ''
                      } ${selectedSentence === sentence.id ? 'bg-blue-50' : ''}`}
                      onMouseUp={handleMouseUp}
                    >
                      {renderSentenceText(sentence)}
                      {!readOnly && (
                        <span className="inline-flex items-center gap-0.5 ml-0.5 align-middle opacity-30 hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleUnderline(sentence.id);
                            }}
                            className={`w-4 h-4 rounded text-[9px] leading-none flex items-center justify-center transition-colors ${
                              underlined ? 'bg-blue-200 text-blue-700 opacity-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                            }`}
                            title="下划线"
                          >
                            U
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddNote(sentence.id);
                            }}
                            className={`w-4 h-4 rounded text-[9px] leading-none flex items-center justify-center transition-colors ${
                              note ? 'bg-amber-200 text-amber-700 opacity-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                            }`}
                            title="添加笔记"
                          >
                            ✎
                          </button>
                        </span>
                      )}
                      {note && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5 align-middle" title="有笔记" />
                      )}
                      {' '}
                    </span>
                  );
                })}
              </div>
              );
            })}
          </div>
        </div>

        {/* Annotations panel */}
        {showAnnotationsPanel && !readOnly && totalAnnotations > 0 && (
          <div className="w-56 flex-shrink-0 overflow-y-auto">
            <div className="sticky top-0">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">我的标注</h4>

              {/* Highlights list */}
              {questionState.highlights.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] text-slate-400 mb-1 font-medium">高亮 ({questionState.highlights.length})</div>
                  <div className="space-y-1">
                    {questionState.highlights.map(hl => {
                      const c = getColorClasses(hl.color);
                      return (
                        <div key={hl.id} className={`text-xs p-1.5 rounded-lg ${c.chip} group`}>
                          <div className="flex items-start justify-between gap-1">
                            <span className="line-clamp-2 flex-1">"{hl.text}"</span>
                            <button
                              onClick={() => dispatch({ type: 'REMOVE_HIGHLIGHT', id: hl.id })}
                              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity flex-shrink-0"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Underlines list */}
              {questionState.underlines.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] text-slate-400 mb-1 font-medium">下划线 ({questionState.underlines.length})</div>
                  <div className="flex flex-wrap gap-1">
                    {questionState.underlines.map(ul => (
                      <button
                        key={ul.id}
                        onClick={() => dispatch({ type: 'TOGGLE_UNDERLINE', sentenceId: ul.sentenceId })}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                      >
                        句{ul.sentenceId} ×
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes list */}
              {questionState.notes.length > 0 && (
                <div>
                  <div className="text-[10px] text-slate-400 mb-1 font-medium">笔记 ({questionState.notes.length})</div>
                  <div className="space-y-1.5">
                    {questionState.notes.map(note => (
                      <div key={note.id} className="text-xs p-2 rounded-lg bg-amber-50 border border-amber-100 group">
                        <div className="text-[10px] text-amber-500 mb-0.5">句{note.sentenceId}</div>
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-slate-600 text-[11px] leading-relaxed">{note.text}</span>
                          <button
                            onClick={() => dispatch({ type: 'REMOVE_NOTE', id: note.id })}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity flex-shrink-0"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Note editor modal */}
      {showNoteEditor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowNoteEditor(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-80 max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <h4 className="text-sm font-bold text-slate-800 mb-3">
              ✎ 句 {showNoteEditor} 笔记
            </h4>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="写下你的理解、疑问或翻译..."
              className="w-full h-24 p-3 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setShowNoteEditor(null)}
                className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveNote}
                className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

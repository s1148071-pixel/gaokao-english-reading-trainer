import { useStore, useCurrentData } from '../store';
import { DISTRACTOR_TYPE_LABELS, STRUCTURE_TYPES, THESIS_LOCATIONS } from '../data';

export default function Step5Analysis({ onBackToSummary }) {
  const { state, dispatch } = useStore();
  const { passage, questions, currentQuestion: question, questionState, currentQuestionIndex: q } = useCurrentData();
  const isTimed = state.mode === 'timed';
  const isMainQuestion = question.questionType === 'main';

  const isCorrect = questionState.answer === question.correctAnswer;

  // Helper: find sentence text by sentenceId
  const getSentenceText = (sentenceId) => {
    for (const para of passage?.paragraphs || []) {
      const s = para.sentences.find(s => s.id === sentenceId);
      if (s) return s.text;
    }
    return '';
  };

  // Helper: find paragraph id by sentenceId
  const getParagraphId = (sentenceId) => {
    for (const para of passage?.paragraphs || []) {
      if (para.sentences.some(s => s.id === sentenceId)) return para.id;
    }
    return null;
  };

  // Annotation stats
  const highlightCount = questionState.highlights?.length || 0;
  const underlineCount = questionState.underlines?.length || 0;
  const noteCount = questionState.notes?.length || 0;
  const hasAnnotations = highlightCount + underlineCount + noteCount > 0;

  // Group highlights by color
  const highlightsByColor = {};
  ['yellow', 'green', 'pink'].forEach(c => {
    highlightsByColor[c] = (questionState.highlights || []).filter(h => h.color === c);
  });

  // Check if underlined sentences contain evidence sentences
  const underlineSentenceIds = (questionState.underlines || []).map(u => u.sentenceId);
  const evidenceHits = question.options.filter(opt =>
    opt.evidenceSentence && underlineSentenceIds.length > 0
  ).map(opt => {
    // Check if any underlined sentence's text overlaps with evidenceSentence
    const evidenceText = opt.evidenceSentence.toLowerCase();
    const matched = underlineSentenceIds.some(sid => {
      const sText = getSentenceText(sid).toLowerCase();
      return sText.includes(evidenceText.slice(0, 30)) || evidenceText.includes(sText.slice(0, 30));
    });
    return { optionId: opt.id, matched, isCorrect: opt.id === question.correctAnswer };
  });

  // Compute keyword accuracy
  const expectedKeywordIndices = question.stemTokens
    .filter(t => t.isKeyword)
    .map(t => t.index);
  const correctKeywords = questionState.keywords.filter(i =>
    expectedKeywordIndices.includes(i)
  );
  const missedKeywords = expectedKeywordIndices.filter(i =>
    !questionState.keywords.includes(i)
  );
  const extraKeywords = questionState.keywords.filter(i =>
    !expectedKeywordIndices.includes(i)
  );

  // Block location stats
  const correctBlocks = questionState.blocks.filter(id =>
    question.answerBlocks.includes(id)
  );
  const missedBlocks = question.answerBlocks.filter(id =>
    !questionState.blocks.includes(id)
  );
  const extraBlocks = questionState.blocks.filter(id =>
    !question.answerBlocks.includes(id)
  );

  // Distractor judgment stats for Card 4
  const distractorStats = {};
  const allDistractorTypes = ['synonym_replace', 'concept_swap', 'unsupported', 'opposite_direction', 'scope_shift'];
  allDistractorTypes.forEach(type => {
    distractorStats[type] = { total: 0, correct: 0 };
  });

  question.options.forEach(opt => {
    const judgment = questionState.distractorJudgments.find(j => j.optionId === opt.id);
    const actualType = opt.distractorType === 'correct' ? 'synonym_replace' : opt.distractorType;
    if (distractorStats[actualType]) {
      distractorStats[actualType].total++;
      if (judgment?.isCorrect) {
        distractorStats[actualType].correct++;
      }
    }
  });

  const handleNextQuestion = () => {
    if (q < questions.length - 1) {
      dispatch({ type: 'SET_QUESTION', index: q + 1 });
    }
  };

  const handleRestart = () => {
    dispatch({ type: 'RESTART' });
  };

  const allDone = q >= questions.length - 1;

  return (
    <div className="step-enter max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-3 ${
          isCorrect ? 'bg-accent-100 text-accent-700' : 'bg-red-100 text-red-600'
        }`}>
          {isCorrect ? '🎉 回答正确' : '💡 回答错误'}
          <span className="font-normal text-slate-500">
            · 你的答案 {questionState.answer} · 正确答案 {question.correctAnswer}
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          第 {question.number} 题 · {isMainQuestion ? '主旨题复盘' : '逻辑链复盘'}
        </h2>
        <p className="text-slate-500 text-sm">
          无论对错，回顾完整做题思路——这才是方法内化的关键
        </p>
      </div>

      {/* Analysis Cards */}
      <div className="space-y-4">
        {/* === Main idea question: dedicated review cards === */}
        {isMainQuestion && !isTimed && (
          <>
            {/* Main Card 1 — 方法路径回顾 */}
            <div className="analysis-card border-purple-200 bg-gradient-to-br from-white to-purple-50/20">
              <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">🎯</span>
                方法路径回顾
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">你选择的方法：</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium">
                    {questionState.mainMethod === 'head-tail' ? '🎯 首尾段定位法' : '🔗 逻辑链顺推法'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">你预判的文体：</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {STRUCTURE_TYPES[questionState.structurePrediction?.type] || '未预判'}
                  </span>
                  <span className="text-slate-400">· 实际：</span>
                  <span className="px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 font-medium">
                    {STRUCTURE_TYPES[passage.passageStructure?.type] || '?'}
                  </span>
                  {questionState.structurePrediction?.type === passage.passageStructure?.type && (
                    <span className="text-accent-600">✓ 正确</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">你预判的主旨位置：</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {THESIS_LOCATIONS[questionState.structurePrediction?.thesisLocation] || '未预判'}
                  </span>
                  <span className="text-slate-400">· 实际：</span>
                  <span className="px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 font-medium">
                    {THESIS_LOCATIONS[passage.passageStructure?.thesisLocation] || '?'}
                  </span>
                  {questionState.structurePrediction?.thesisLocation === passage.passageStructure?.thesisLocation && (
                    <span className="text-accent-600">✓ 正确</span>
                  )}
                </div>
              </div>
            </div>

            {/* Main Card 2 — 主旨归纳对比 */}
            <div className="analysis-card border-purple-200 bg-gradient-to-br from-white to-purple-50/20">
              <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">✍️</span>
                主旨归纳对比
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-primary-50 border border-primary-100">
                  <div className="text-xs text-primary-500 font-semibold mb-1">你的归纳</div>
                  <p className="text-sm text-slate-700 leading-relaxed">{questionState.mainSummary || '（未填写）'}</p>
                </div>
                <div className="p-3 rounded-xl bg-accent-50 border border-accent-100">
                  <div className="text-xs text-accent-500 font-semibold mb-1">参考归纳</div>
                  <p className="text-sm text-slate-700 leading-relaxed">{question.mainIdeaAnalysis?.referenceSummary}</p>
                </div>
              </div>
            </div>

            {/* Main Card 3 — 方法论提示 */}
            <div className="analysis-card border-l-4 border-l-purple-300">
              <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">💡</span>
                方法论提示
              </h3>
              <div className="text-sm text-slate-600 leading-relaxed space-y-2">
                <p>
                  <strong>你选的方法（{questionState.mainMethod === 'head-tail' ? '首尾段法' : '逻辑链法'}）：</strong>
                  {question.mainIdeaAnalysis?.methodTips?.[questionState.mainMethod]}
                </p>
                <p className="pt-2 border-t border-slate-100">
                  <strong>干扰项分析：</strong>
                  {question.mainIdeaAnalysis?.distractorAnalysis}
                </p>
              </div>
            </div>
          </>
        )}

        {/* === Detail/Inference question: original cards === */}
        {/* Card 1 — 关键词对照 (practice mode + non-main only) */}
        {!isTimed && !isMainQuestion && (
        <div className="analysis-card">
          <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">1</span>
            关键词对照
          </h3>
          <div className="mb-3">
            <div className="text-xs text-slate-400 mb-1 font-semibold">预期关键词</div>
            <div className="flex flex-wrap gap-1.5">
              {question.stemTokens.filter(t => t.isKeyword).map((t, i) => (
                <span key={i} className="px-2 py-0.5 bg-accent-100 text-accent-700 rounded text-sm font-medium">
                  {t.text}
                </span>
              ))}
            </div>
          </div>
          {correctKeywords.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-accent-600 mb-1">
              <span>✓ 命中 {correctKeywords.length} 个</span>
            </div>
          )}
          {missedKeywords.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600 mb-1">
              <span>⚠ 遗漏：{question.stemTokens.filter(t => missedKeywords.includes(t.index)).map(t => t.text).join(', ')}</span>
            </div>
          )}
          {extraKeywords.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>· 多余选中 {extraKeywords.length} 个非关键干扰词</span>
            </div>
          )}
          <p className="mt-3 text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-3">
            {question.analysis.keywordReasoning}
          </p>
        </div>
        )}

        {/* Card 2 — 文段定位对照 (practice mode + non-main only) */}
        {!isTimed && !isMainQuestion && (
        <div className="analysis-card">
          <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">2</span>
            文段定位对照
          </h3>
          <div className="flex gap-4 text-sm mb-3">
            <div className="flex items-center gap-1">
              <span className="text-accent-600">✓ 命中 {correctBlocks.length} 段</span>
            </div>
            {missedBlocks.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-amber-600">⚠ 遗漏 P{missedBlocks.join(', P')}</span>
              </div>
            )}
            {extraBlocks.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-slate-500">· {extraBlocks.length} 段偏离</span>
              </div>
            )}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-3">
            {question.analysis.locationReasoning}
          </p>
        </div>
        )}

        {/* Card 2.5 — 我的标注回顾 */}
        {hasAnnotations && (
        <div className="analysis-card border-l-4 border-l-amber-300">
          <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">✎</span>
            我的标注回顾
            <span className="text-xs font-normal text-slate-400">
              {highlightCount} 高亮 · {underlineCount} 下划线 · {noteCount} 笔记
            </span>
          </h3>

          {/* Highlights */}
          {highlightCount > 0 && (
            <div className="mb-4">
              <div className="text-xs text-slate-400 mb-2 font-semibold">高亮词句</div>
              <div className="space-y-2">
                {['yellow', 'green', 'pink'].map(color => {
                  const items = highlightsByColor[color] || [];
                  if (items.length === 0) return null;
                  const colorMap = {
                    yellow: { label: '重点', chip: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-300' },
                    green: { label: '已懂', chip: 'bg-green-100 text-green-700', dot: 'bg-green-300' },
                    pink: { label: '存疑', chip: 'bg-pink-100 text-pink-700', dot: 'bg-pink-300' },
                  };
                  const c = colorMap[color];
                  return (
                    <div key={color} className="flex items-start gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${c.chip}`}>
                        {c.label}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {items.map(hl => (
                          <span key={hl.id} className={`text-xs px-2 py-0.5 rounded ${c.chip}`}>
                            "{hl.text}"
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Underlines with evidence match */}
          {underlineCount > 0 && (
            <div className="mb-4">
              <div className="text-xs text-slate-400 mb-2 font-semibold">
                下划线句子
                {evidenceHits.length > 0 && (
                  <span className="ml-2 text-accent-500">
                    · {evidenceHits.filter(e => e.matched).length}/{evidenceHits.length} 命中证据句
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {(questionState.underlines || []).map(ul => {
                  const text = getSentenceText(ul.sentenceId);
                  const paraId = getParagraphId(ul.sentenceId);
                  const hitEvidence = evidenceHits.filter(e => e.matched).some(e => {
                    const evText = question.options.find(o => o.id === e.optionId)?.evidenceSentence?.toLowerCase() || '';
                    return text.toLowerCase().includes(evText.slice(0, 30));
                  });
                  return (
                    <div key={ul.id} className={`text-xs p-2 rounded-lg flex items-start gap-2 ${
                      hitEvidence ? 'bg-accent-50 border border-accent-100' : 'bg-slate-50 border border-slate-100'
                    }`}>
                      <span className="text-slate-400 flex-shrink-0">¶{paraId}·句{ul.sentenceId}</span>
                      <span className="text-slate-600 line-clamp-2 flex-1 underline decoration-blue-300 decoration-1 underline-offset-2">
                        {text}
                      </span>
                      {hitEvidence && <span className="text-accent-500 flex-shrink-0">✓ 命中</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {noteCount > 0 && (
            <div>
              <div className="text-xs text-slate-400 mb-2 font-semibold">我的笔记</div>
              <div className="space-y-2">
                {(questionState.notes || []).map(note => {
                  const sText = getSentenceText(note.sentenceId);
                  const paraId = getParagraphId(note.sentenceId);
                  return (
                    <div key={note.id} className="text-xs p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                      <div className="text-[10px] text-amber-500 mb-1">¶{paraId}·句{note.sentenceId}</div>
                      <div className="text-[10px] text-slate-400 mb-1 italic line-clamp-1">"{sText}"</div>
                      <div className="text-slate-700 text-sm leading-relaxed">{note.text}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="mt-3 text-xs text-slate-400">
            💡 标注是主动阅读的关键——高亮帮你锁定信息，下划线帮你标记重点，笔记帮你内化理解。
          </p>
        </div>
        )}

        {/* Card 3 — 选项比对复盘 (重) — non-main only */}
        {!isMainQuestion && (
        <div className="analysis-card border-primary-200 bg-gradient-to-br from-white to-primary-50/20">
          <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">3</span>
            选项比对复盘
          </h3>
          <div className="space-y-3">
            {question.options.map((opt) => {
              const isCorrectOption = opt.id === question.correctAnswer;
              const isUserAnswer = opt.id === questionState.answer;
              const judgment = !isTimed ? questionState.distractorJudgments.find(j => j.optionId === opt.id) : null;
              const isJudgmentCorrect = judgment?.isCorrect;

              return (
                <div key={opt.id} className={`p-3 rounded-xl ${
                  isCorrectOption
                    ? 'bg-accent-50 border border-accent-100'
                    : isTimed
                    ? isUserAnswer
                      ? 'bg-red-50 border border-red-100'
                      : 'bg-slate-50 border border-slate-100'
                    : isJudgmentCorrect
                    ? 'bg-slate-50 border border-slate-100'
                    : 'bg-amber-50 border border-amber-100'
                }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCorrectOption ? 'bg-accent-200 text-accent-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {opt.id}
                    </span>
                    <span className="text-sm font-medium text-slate-700">{opt.text}</span>
                    {isCorrectOption && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-200 text-accent-800">
                        正确答案
                      </span>
                    )}
                    {isTimed && isUserAnswer && !isCorrectOption && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        你的选择
                      </span>
                    )}
                    {!isTimed && judgment && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isJudgmentCorrect ? 'bg-accent-100 text-accent-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {isJudgmentCorrect ? '✅ 判断正确' : '❌ 判断偏差'}
                      </span>
                    )}
                  </div>
                  {!isTimed && judgment && (
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {isJudgmentCorrect
                        ? `你判断为"${DISTRACTOR_TYPE_LABELS[judgment.selectedType]}"，正确。`
                        : `你选了"${DISTRACTOR_TYPE_LABELS[judgment.selectedType]}"，实际是"${DISTRACTOR_TYPE_LABELS[opt.distractorType === 'correct' ? 'synonym_replace' : opt.distractorType]}"。`}
                      {opt.distractorExplanation}
                    </p>
                  )}
                  {isTimed && (
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {opt.distractorExplanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Card 4 — 题型弱点总结 (practice mode + non-main only) */}
        {!isTimed && !isMainQuestion && (
        <div className="analysis-card border-accent-200 bg-gradient-to-br from-white to-accent-50/20">
          <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-xs font-bold">4</span>
            干扰项判断能力总结
          </h3>
          <div className="space-y-2.5">
            {allDistractorTypes.map(type => {
              const stat = distractorStats[type];
              if (stat.total === 0) return null;
              const ratio = `${stat.correct}/${stat.total}`;
              const isStrong = stat.correct === stat.total;
              const isWeak = stat.correct < stat.total * 0.5;
              return (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{DISTRACTOR_TYPE_LABELS[type]}判断</span>
                  <span className={`font-semibold ${
                    isStrong ? 'text-accent-600' : isWeak ? 'text-amber-600' : 'text-slate-600'
                  }`}>
                    {ratio} 正确 {isStrong ? '✅' : isWeak ? '⚠️ 需要加强' : ''}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            💡 这个总结直接告诉你最容易掉哪类坑——下次遇到同类干扰项要格外警惕。
          </p>
        </div>
        )}

        {/* Logic Chain */}
        <div className="analysis-card border-slate-200">
          <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">✦</span>
            完整逻辑链
          </h3>
          <div className="space-y-2">
            {question.analysis.logicChain.map((step, i) => (
              <div key={i} className="text-sm text-slate-700 leading-relaxed pl-3 border-l-2 border-accent-300">
                {step}
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-accent-50 rounded-xl border border-accent-200">
            <p className="text-sm font-semibold text-accent-800">
              💎 {question.analysis.conclusion}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="text-center mt-8 flex items-center justify-center gap-4">
        {isTimed ? (
          <>
            {!allDone && (
              <button
                onClick={handleNextQuestion}
                className="px-8 py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-95 transition-all"
              >
                下一题 → 第 {questions[q + 1].number} 题
              </button>
            )}
            <button
              onClick={() => onBackToSummary?.() ?? dispatch({ type: 'GO_HOME' })}
              className="px-6 py-2.5 rounded-xl font-medium text-slate-600 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              ← 返回结果总览
            </button>
            {allDone && (
              <button
                onClick={() => dispatch({ type: 'GO_HOME' })}
                className="px-8 py-3 rounded-xl font-semibold text-white bg-accent-600 hover:bg-accent-700 hover:shadow-lg hover:shadow-accent-200 active:scale-95 transition-all"
              >
                🎉 全部完成！返回选择篇章
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => dispatch({ type: 'PREVIOUS_STEP' })}
              className="px-5 py-2.5 rounded-xl font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200"
            >
              ← 返回修改答案
            </button>
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 rounded-xl font-medium text-slate-600 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              重做本题
            </button>
            {!allDone && (
              <button
                onClick={handleNextQuestion}
                className="px-8 py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-95 transition-all"
              >
                下一题 → 第 {questions[q + 1].number} 题
              </button>
            )}
            {allDone && (
              <button
                onClick={() => dispatch({ type: 'RESET_ALL' })}
                className="px-8 py-3 rounded-xl font-semibold text-white bg-accent-600 hover:bg-accent-700 hover:shadow-lg hover:shadow-accent-200 active:scale-95 transition-all"
              >
                🎉 全部完成！重新开始
          </button>
        )}
          </>
        )}
      </div>
    </div>
  );
}

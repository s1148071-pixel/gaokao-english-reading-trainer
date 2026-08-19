import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore, useCurrentData } from './store';
import { PAPERS, DISTRACTOR_TYPE_LABELS } from './data';
import ProgressBar from './components/ProgressBar';
import PaperSelector from './components/PaperSelector';
import PassageReader from './components/PassageReader';
import Step1KeywordExtraction from './components/Step1KeywordExtraction';
import Step2PassageLocation from './components/Step2PassageLocation';
import Step3OptionComparison from './components/Step3OptionComparison';
import Step4AnswerSelection from './components/Step4AnswerSelection';
import Step5Analysis from './components/Step5Analysis';
import TimedResultSummary from './components/TimedResultSummary';
import StatsPanel from './components/StatsPanel';
import Step1MainStructure from './components/Step1MainStructure';
import Step2MainMethod from './components/Step2MainMethod';
import Step3MainInduction from './components/Step3MainInduction';
import LoginPage from './components/LoginPage';
import AnnotationEditor from './components/AnnotationEditor';
import LearningProfile from './components/LearningProfile';
import WrongBook from './components/WrongBook';

const TYPE_LABELS = { detail: '细节', inference: '推断', main: '主旨' };
const TYPE_COLORS = {
  detail: 'text-blue-600 bg-blue-50',
  inference: 'text-orange-600 bg-orange-50',
  main: 'text-purple-600 bg-purple-50',
};

// Countdown hook — uses Date.now() diff for drift-free timing
function useCountdown(timedEnd, onExpire) {
  const [remaining, setRemaining] = useState(() => {
    if (!timedEnd) return 0;
    return Math.max(0, Math.ceil((timedEnd - Date.now()) / 1000));
  });
  const expireRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!timedEnd) return;
    expireRef.current = false;
    const tick = () => {
      const diff = Math.max(0, Math.ceil((timedEnd - Date.now()) / 1000));
      setRemaining(diff);
      if (diff <= 0 && !expireRef.current) {
        expireRef.current = true;
        onExpireRef.current?.();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timedEnd]);

  return remaining;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// AnnotationEditor placeholder (T03 will replace)
export default function App() {
  const { state, dispatch, STEPS, MAIN_STEPS } = useStore();
  const { passage, questions } = useCurrentData();
  const [lockedToast, setLockedToast] = useState(false);
  const [viewingTimedDetail, setViewingTimedDetail] = useState(false);
  const [passageExpanded, setPassageExpanded] = useState(false);
  const isTimed = state.mode === 'timed';

  // Reset viewingTimedDetail when starting a new timed session
  useEffect(() => {
    if (!state.timedFinished) {
      setViewingTimedDetail(false);
    }
  }, [state.timedFinished]);

  // Timer expiry handler
  const handleTimeUp = useCallback(() => {
    dispatch({ type: 'TIME_UP' });
  }, [dispatch]);
  const remaining = useCountdown(
    isTimed && !state.timedFinished ? state.timedEnd : null,
    handleTimeUp
  );

  // 未登录状态 → 显示 LoginPage
  if (!state.auth.token) {
    return <LoginPage />;
  }

  // Phase 4 feature views (T02/T03)
  const handleBackToSelector = () => dispatch({ type: 'SET_VIEW', view: 'selector' });
  if (state.currentView === 'profile') return <LearningProfile onBack={handleBackToSelector} />;
  if (state.currentView === 'wrongBook') return <WrongBook onBack={handleBackToSelector} />;
  if (state.currentView === 'annotation') return <AnnotationEditor onBack={handleBackToSelector} />;

  // Selector screen
  if (state.screen === 'selector') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <header className="bg-white/60 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <h1 className="text-lg font-bold text-slate-800">高考英语阅读方法论训练</h1>
            <p className="text-xs text-slate-400 mt-0.5">题干先行 · 反向定位 · 逻辑复盘</p>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 pb-16">
          <PaperSelector />
          <StatsPanel />
          <div className="flex justify-center gap-3 mt-4">
            <button onClick={() => dispatch({type:'SET_VIEW',view:'profile'})} className="px-4 py-2 rounded-xl text-sm font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors">📊 学情画像</button>
            <button onClick={() => dispatch({type:'SET_VIEW',view:'wrongBook'})} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors">📕 错题本</button>
            <button onClick={() => dispatch({type:'SET_VIEW',view:'annotation'})} className="px-4 py-2 rounded-xl text-sm font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">✏️ 题目标注</button>
          </div>
        </main>
        <footer className="text-center py-6 text-xs text-slate-400">
          高考英语阅读方法论训练 Demo · 题干先行·反向定位·逻辑复盘
        </footer>
      </div>
    );
  }

  // Training screen
  const q = state.currentQuestion;
  const questionState = state.questions[q];
  const currentStep = questionState?.step || 1;
  const currentPaper = PAPERS.find(p => p.id === state.currentPaperId);

  const handleTabClick = (idx) => {
    const qst = questions[idx];
    if (qst.locked) {
      setLockedToast(true);
      setTimeout(() => setLockedToast(false), 2500);
      return;
    }
    dispatch({ type: 'SET_QUESTION', index: idx });
    // In timed finished mode, switching tabs should show that question's review
    if (isTimed && state.timedFinished) {
      setViewingTimedDetail(true);
    }
  };

  const handleSubmitAll = () => {
    dispatch({ type: 'SUBMIT_ALL' });
  };

  const handleViewTimedQuestion = (idx) => {
    dispatch({ type: 'SET_QUESTION', index: idx });
    setViewingTimedDetail(true);
  };

  const handleBackToSummary = () => {
    setViewingTimedDetail(false);
  };

  const handleGoHome = () => {
    if (confirm('确定返回选择页面吗？当前做题进度将会丢失。')) {
      dispatch({ type: 'GO_HOME' });
    }
  };

  // Determine correct steps array for ProgressBar
  const questionType = questions[q]?.questionType;
  const currentSteps = questionType === 'main' ? MAIN_STEPS : STEPS;

  // Render content — branch by question type
  const renderContent = () => {
    // Timed finished: show summary or individual question review
    if (isTimed && state.timedFinished) {
      if (viewingTimedDetail) {
        return <Step5Analysis onBackToSummary={handleBackToSummary} />;
      }
      return <TimedResultSummary onViewQuestion={handleViewTimedQuestion} />;
    }

    const isMainQuestion = questions[q]?.questionType === 'main';

    // Main idea question flow
    if (isMainQuestion && !isTimed) {
      switch (currentStep) {
        case 1: return <Step1MainStructure />;
        case 2: return <Step2MainMethod />;
        case 3: return <Step3MainInduction />;
        case 4: return <Step4AnswerSelection />;
        case 5: return <Step5Analysis />;
        default: return <Step1MainStructure />;
      }
    }

    // Detail / inference question flow
    switch (currentStep) {
      case 1: return <Step1KeywordExtraction />;
      case 2: return <Step2PassageLocation />;
      case 3: return <Step3OptionComparison />;
      case 4: return <Step4AnswerSelection />;
      case 5: return <Step5Analysis />;
      default: return <Step1KeywordExtraction />;
    }
  };

  // Timer display
  const isUrgent = isTimed && !state.timedFinished && remaining <= 60;
  const timerColor = isUrgent ? 'text-red-600 animate-pulse' : 'text-orange-600';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleGoHome}
                className="text-slate-400 hover:text-primary-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
                title="返回选择"
              >
                ← 选择篇章
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-800">
                  {passage?.title || '高考英语阅读方法论训练'}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {currentPaper?.name} · {passage?.sourceInfo}
                  {isTimed && !state.timedFinished && (
                    <span className="ml-2 text-orange-500 font-medium">⏱ 计时模式</span>
                  )}
                </p>
              </div>
            </div>

            {/* Right side: user + timer + question tabs */}
            <div className="flex flex-col items-end gap-2">
              {/* User info */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 font-medium">
                  {state.auth.user?.name || state.auth.user?.email || '用户'}
                </span>
                <button
                  onClick={() => dispatch({ type: 'LOGOUT' })}
                  className="text-xs px-2 py-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  登出
                </button>
              </div>

              {/* Timer row (timed mode, not finished) */}
              {isTimed && !state.timedFinished && (
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-orange-50 border border-orange-200 font-mono font-bold text-lg ${timerColor}`}>
                    <span>⏱</span>
                    <span>{formatTime(remaining)}</span>
                  </div>
                  <button
                    onClick={handleSubmitAll}
                    className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 active:scale-95 transition-all"
                  >
                    提交全部
                  </button>
                </div>
              )}

              {/* Timed finished: back to summary button */}
              {isTimed && state.timedFinished && viewingTimedDetail && (
                <button
                  onClick={handleBackToSummary}
                  className="px-4 py-1.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  ← 返回结果总览
                </button>
              )}

              {/* Question tabs */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                {questions.map((qst, idx) => {
                  const qState = state.questions[idx];
                  const isActive = idx === q;
                  const isDone = isTimed ? qState?.answer : qState?.answerSubmitted;
                  const isLocked = qst.locked;

                  return (
                    <button
                      key={qst.id}
                      onClick={() => handleTabClick(idx)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                        isLocked
                          ? 'text-slate-300 cursor-not-allowed opacity-60'
                          : isActive
                          ? 'bg-white text-primary-700 shadow-sm'
                          : isDone
                          ? 'text-accent-600'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {isDone && !isLocked ? '✓ ' : ''}
                      {isLocked ? '🔒 ' : ''}Q{qst.number}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold leading-none ${
                        isLocked
                          ? 'bg-slate-200 text-slate-400'
                          : TYPE_COLORS[qst.questionType] || TYPE_COLORS.detail
                      }`}>
                        {isLocked ? '二期' : TYPE_LABELS[qst.questionType] || '细节'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Locked toast */}
      {lockedToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-fadeIn">
          <div className="px-6 py-3 rounded-xl bg-slate-800 text-white text-sm font-medium shadow-xl">
            🔒 主旨题暂未开放，二期扩展
          </div>
        </div>
      )}

      {/* Progress Bar — hidden in timed mode */}
      {!isTimed && (
        <div className="max-w-4xl mx-auto px-4">
          <ProgressBar steps={currentSteps} currentStep={currentStep} />
        </div>
      )}
      {isTimed && !state.timedFinished && (
        <div className="max-w-4xl mx-auto px-4 py-4 text-center">
          <span className="text-sm text-orange-500 font-medium">⏱ 计时模式 · 直接作答 · 选择答案后切换下一题</span>
        </div>
      )}

      {/* Main Content — 左右分栏：左文章可标注 / 右Step交互 */}
      <main className="max-w-7xl mx-auto px-4 pb-16">
        {/* Timed finished: full-width summary or review */}
        {isTimed && state.timedFinished ? (
          <div key={`${q}-${currentStep}-${state.timedFinished}-${viewingTimedDetail}`}>
            {renderContent()}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left: PassageReader (always visible, annotatable) */}
            <div className="lg:w-1/2 lg:sticky lg:top-[140px] lg:h-[calc(100vh-180px)] lg:overflow-hidden flex-shrink-0">
              {/* Mobile collapsible toggle */}
              <div className="lg:hidden">
                <button
                  onClick={() => setPassageExpanded(v => !v)}
                  className="w-full cursor-pointer px-4 py-2 bg-white/60 rounded-xl text-sm font-medium text-slate-600 mb-2 flex items-center justify-between"
                >
                  <span>📖 文章与标注</span>
                  <span className="text-xs text-slate-400">{passageExpanded ? '收起 ▲' : '展开 ▼'}</span>
                </button>
              </div>
              <div className={`h-[50vh] lg:h-full ${passageExpanded ? 'block' : 'hidden'} lg:block`}>
                <PassageReader
                  locateMode={currentStep === 2 && !isTimed}
                  readOnly={false}
                />
              </div>
            </div>
            {/* Right: Step interaction */}
            <div className="w-full lg:w-1/2 min-w-0">
              <div key={`${q}-${currentStep}-${state.timedFinished}-${viewingTimedDetail}`}>
                {renderContent()}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-slate-400">
        高考英语阅读方法论训练 Demo · 题干先行·反向定位·逻辑复盘
      </footer>
    </div>
  );
}

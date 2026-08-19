import { createContext, useContext, useReducer } from 'react';
import { PAPERS } from './data';
import { api, getToken, setToken } from './api';

const StoreContext = createContext(null);

const STEPS = [
  { id: 1, label: '关键词', desc: '提取题干关键词' },
  { id: 2, label: '定位', desc: '反向定位文章' },
  { id: 3, label: '比对', desc: '选项关系判断' },
  { id: 4, label: '作答', desc: '选择答案' },
  { id: 5, label: '复盘', desc: '逻辑链回顾' },
];

const MAIN_STEPS = [
  { id: 1, label: '结构预判', desc: '文章结构预判' },
  { id: 2, label: '方法选择', desc: '选择推导方法' },
  { id: 3, label: '主旨归纳', desc: '一句话主旨' },
  { id: 4, label: '作答', desc: '选择答案' },
  { id: 5, label: '复盘', desc: '方法论回顾' },
];

function createInitialQuestionState(mode = 'practice') {
  const base = {
    keywords: [],
    blocks: [],
    distractorJudgments: [],
    distractorConfirmed: false,
    answer: null,
    keywordConfirmed: false,
    blockConfirmed: false,
    answerSubmitted: false,
    // Student annotations — persist across all steps
    highlights: [],   // [{ id, sentenceId, text, color }]
    underlines: [],   // [{ id, sentenceId }]
    notes: [],        // [{ id, sentenceId, text }]
    // Main idea question specific
    mainMethod: null,           // 'head-tail' | 'logic-chain' | null
    structurePrediction: null,  // { type, thesisLocation }
    structureConfirmed: false,
    mainSummary: '',            // student's main idea summary
    mainSummaryConfirmed: false,
  };
  if (mode === 'timed') {
    return { ...base, step: 4, distractorConfirmed: true, keywordConfirmed: true, blockConfirmed: true };
  }
  return { ...base, step: 1 };
}

const initialState = {
  screen: 'selector', // 'selector' | 'training'
  mode: 'practice',    // 'practice' | 'timed'
  timedEnd: null,      // timestamp when timer ends
  timedFinished: false,
  proficiencyLevel: 1, // 1=引导 2=自主 3=计时
  currentPaperId: null,
  currentPassageId: null,
  currentQuestion: 0,
  questions: [],
  auth: { token: getToken() || null, user: null, loading: false },
  papersCache: null,  // API-loaded papers cache
  apiAvailable: true,  // tracks if API is reachable
  currentView: 'selector', // 'selector' | 'profile' | 'wrongBook' | 'annotation'
  profileData: null,    // 学情画像数据
  wrongRecords: [],     // 错题列表
  annotationData: null, // 标注数据（papers tree）
};

function getPassageFromState(state) {
  const paper = PAPERS.find(p => p.id === state.currentPaperId);
  if (!paper) return null;
  return paper.passages.find(ps => ps.id === state.currentPassageId);
}

function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_PASSAGE': {
      const { paperId, passageId, mode = 'practice', duration = 360, proficiencyLevel = 1 } = action;
      const passage = getPassageFromState({ currentPaperId: paperId, currentPassageId: passageId });
      if (!passage) return state;
      const numQuestions = passage.questions.length;
      return {
        ...state,
        screen: 'training',
        mode,
        proficiencyLevel,
        timedEnd: mode === 'timed' ? Date.now() + duration * 1000 : null,
        timedFinished: false,
        currentPaperId: paperId,
        currentPassageId: passageId,
        currentQuestion: 0,
        questions: Array.from({ length: numQuestions }, () => createInitialQuestionState(mode)),
      };
    }

    case 'GO_HOME': {
      return {
        ...initialState,
      };
    }

    case 'TOGGLE_KEYWORD': {
      const q = state.currentQuestion;
      const keywords = state.questions[q].keywords;
      const idx = keywords.indexOf(action.wordIndex);
      const newKeywords = idx === -1
        ? [...keywords, action.wordIndex]
        : keywords.filter(i => i !== action.wordIndex);
      const newQuestions = [...state.questions];
      newQuestions[q] = { ...newQuestions[q], keywords: newKeywords };
      return { ...state, questions: newQuestions };
    }

    case 'CONFIRM_KEYWORDS': {
      const q = state.currentQuestion;
      const newQuestions = [...state.questions];
      newQuestions[q] = { ...newQuestions[q], keywordConfirmed: true, step: 2 };
      return { ...state, questions: newQuestions };
    }

    case 'TOGGLE_BLOCK': {
      const q = state.currentQuestion;
      const blocks = state.questions[q].blocks;
      const idx = blocks.indexOf(action.paragraphId);
      const newBlocks = idx === -1
        ? [...blocks, action.paragraphId]
        : blocks.filter(i => i !== action.paragraphId);
      const newQuestions = [...state.questions];
      newQuestions[q] = { ...newQuestions[q], blocks: newBlocks };
      return { ...state, questions: newQuestions };
    }

    case 'CONFIRM_BLOCKS': {
      const q = state.currentQuestion;
      const newQuestions = [...state.questions];
      newQuestions[q] = { ...newQuestions[q], blockConfirmed: true, step: 3 };
      return { ...state, questions: newQuestions };
    }

    case 'JUDGE_DISTRACTOR': {
      const q = state.currentQuestion;
      const { optionId, selectedType, isCorrect } = action;
      const existing = state.questions[q].distractorJudgments;
      const filtered = existing.filter(j => j.optionId !== optionId);
      const newJudgments = [...filtered, { optionId, selectedType, isCorrect }];
      const newQuestions = [...state.questions];
      newQuestions[q] = { ...newQuestions[q], distractorJudgments: newJudgments };
      return { ...state, questions: newQuestions };
    }

    case 'CONFIRM_DISTRACTOR_JUDGMENTS': {
      const q = state.currentQuestion;
      const newQuestions = [...state.questions];
      newQuestions[q] = { ...newQuestions[q], distractorConfirmed: true, step: 4 };
      return { ...state, questions: newQuestions };
    }

    case 'RESET_DISTRACTOR': {
      const q = state.currentQuestion;
      const { optionId } = action;
      const existing = state.questions[q].distractorJudgments;
      const filtered = existing.filter(j => j.optionId !== optionId);
      const newQuestions = [...state.questions];
      newQuestions[q] = { ...newQuestions[q], distractorJudgments: filtered };
      return { ...state, questions: newQuestions };
    }

    // === Student annotation actions ===
    case 'ADD_HIGHLIGHT': {
      const q = state.currentQuestion;
      const { sentenceId, text, color } = action;
      const id = `hl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newQuestions = [...state.questions];
      newQuestions[q] = {
        ...newQuestions[q],
        highlights: [...newQuestions[q].highlights, { id, sentenceId, text, color }],
      };
      return { ...state, questions: newQuestions };
    }

    case 'REMOVE_HIGHLIGHT': {
      const q = state.currentQuestion;
      const newQuestions = [...state.questions];
      newQuestions[q] = {
        ...newQuestions[q],
        highlights: newQuestions[q].highlights.filter(h => h.id !== action.id),
      };
      return { ...state, questions: newQuestions };
    }

    case 'TOGGLE_UNDERLINE': {
      const q = state.currentQuestion;
      const existing = state.questions[q].underlines;
      const found = existing.find(u => u.sentenceId === action.sentenceId);
      const newUnderlines = found
        ? existing.filter(u => u.sentenceId !== action.sentenceId)
        : [...existing, { id: `ul-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, sentenceId: action.sentenceId }];
      const newQuestions = [...state.questions];
      newQuestions[q] = { ...newQuestions[q], underlines: newUnderlines };
      return { ...state, questions: newQuestions };
    }

    case 'ADD_NOTE': {
      const q = state.currentQuestion;
      const { sentenceId, text } = action;
      const id = `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newQuestions = [...state.questions];
      newQuestions[q] = {
        ...newQuestions[q],
        notes: [...newQuestions[q].notes, { id, sentenceId, text }],
      };
      return { ...state, questions: newQuestions };
    }

    case 'REMOVE_NOTE': {
      const q = state.currentQuestion;
      const newQuestions = [...state.questions];
      newQuestions[q] = {
        ...newQuestions[q],
        notes: newQuestions[q].notes.filter(n => n.id !== action.id),
      };
      return { ...state, questions: newQuestions };
    }

    case 'CLEAR_ANNOTATIONS': {
      const q = state.currentQuestion;
      const newQuestions = [...state.questions];
      newQuestions[q] = {
        ...newQuestions[q],
        highlights: [],
        underlines: [],
        notes: [],
      };
      return { ...state, questions: newQuestions };
    }

    // === Main idea question actions ===
    case 'SET_MAIN_METHOD': {
      const q = state.currentQuestion;
      const newQuestions = [...state.questions];
      newQuestions[q] = { ...newQuestions[q], mainMethod: action.method };
      return { ...state, questions: newQuestions };
    }

    case 'SET_STRUCTURE_PREDICTION': {
      const q = state.currentQuestion;
      const newQuestions = [...state.questions];
      newQuestions[q] = {
        ...newQuestions[q],
        structurePrediction: { type: action.structureType, thesisLocation: action.thesisLocation },
      };
      return { ...state, questions: newQuestions };
    }

    case 'CONFIRM_STRUCTURE': {
      const q = state.currentQuestion;
      const newQuestions = [...state.questions];
      newQuestions[q] = { ...newQuestions[q], structureConfirmed: true, step: 2 };
      return { ...state, questions: newQuestions };
    }

    case 'SET_MAIN_SUMMARY': {
      const q = state.currentQuestion;
      const newQuestions = [...state.questions];
      newQuestions[q] = { ...newQuestions[q], mainSummary: action.text };
      return { ...state, questions: newQuestions };
    }

    case 'CONFIRM_MAIN_SUMMARY': {
      const q = state.currentQuestion;
      const newQuestions = [...state.questions];
      newQuestions[q] = { ...newQuestions[q], mainSummaryConfirmed: true, step: 4 };
      return { ...state, questions: newQuestions };
    }

    // For main idea questions, skip from Step2 to Step3 (induction)
    case 'MAIN_STEP2_TO_STEP3': {
      const q = state.currentQuestion;
      const newQuestions = [...state.questions];
      newQuestions[q] = { ...newQuestions[q], step: 3 };
      return { ...state, questions: newQuestions };
    }

    case 'SELECT_ANSWER': {
      const q = state.currentQuestion;
      const newQuestions = [...state.questions];
      newQuestions[q] = { ...newQuestions[q], answer: action.optionId };
      return { ...state, questions: newQuestions };
    }

    case 'SUBMIT_ANSWER': {
      const q = state.currentQuestion;
      const newQuestions = [...state.questions];
      newQuestions[q] = { ...newQuestions[q], answerSubmitted: true, step: 5 };
      return { ...state, questions: newQuestions };
    }

    case 'SUBMIT_ALL': {
      const newQuestions = state.questions.map(qs => ({
        ...qs,
        answerSubmitted: true,
        step: 5,
      }));
      return { ...state, questions: newQuestions, timedFinished: true, currentQuestion: 0 };
    }

    case 'TIME_UP': {
      const newQuestions = state.questions.map(qs => ({
        ...qs,
        answerSubmitted: true,
        step: 5,
      }));
      return { ...state, questions: newQuestions, timedFinished: true, currentQuestion: 0 };
    }

    case 'SET_QUESTION': {
      return { ...state, currentQuestion: action.index };
    }

    case 'PREVIOUS_STEP': {
      // Disabled in timed mode — no Step1-3 data to go back to
      if (state.mode === 'timed') return state;
      const q = state.currentQuestion;
      const newQuestions = [...state.questions];
      const prevStep = Math.max(1, newQuestions[q].step - 1);
      newQuestions[q] = { ...newQuestions[q], step: prevStep };
      return { ...state, questions: newQuestions };
    }

    case 'RESTART': {
      const q = state.currentQuestion;
      const newQuestions = [...state.questions];
      newQuestions[q] = createInitialQuestionState(state.mode);
      return { ...state, questions: newQuestions };
    }

    case 'RESET_ALL': {
      const passage = getPassageFromState(state);
      if (!passage) return initialState;
      return {
        ...initialState,
        screen: 'training',
        mode: state.mode,
        currentPaperId: state.currentPaperId,
        currentPassageId: state.currentPassageId,
        currentQuestion: 0,
        questions: Array.from({ length: passage.questions.length }, () => createInitialQuestionState(state.mode)),
      };
    }

    // === Auth actions ===
    case 'SET_AUTH': {
      const { token, user } = action;
      setToken(token);
      return { ...state, auth: { token, user, loading: false } };
    }

    case 'LOGOUT': {
      setToken(null);
      return { ...state, auth: { token: null, user: null, loading: false } };
    }

    // === API cache actions ===
    case 'SET_PAPERS_CACHE': {
      return { ...state, papersCache: action.papers };
    }

    case 'SET_API_AVAILABLE': {
      return { ...state, apiAvailable: action.available };
    }

    // === Navigation & data actions ===
    case 'SET_VIEW': {
      return { ...state, currentView: action.view };
    }

    case 'SET_PROFILE_DATA': {
      return { ...state, profileData: action.data };
    }

    case 'SET_WRONG_RECORDS': {
      return { ...state, wrongRecords: action.records };
    }

    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StoreContext.Provider value={{ state, dispatch, STEPS, MAIN_STEPS }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function useCurrentData() {
  const { state } = useStore();
  const passage = getPassageFromState(state);
  if (!passage) return { passage: null, questions: [], currentQuestion: null, questionState: null };
  const q = state.currentQuestion;
  const question = passage.questions[q];
  const questionState = state.questions[q];
  return { passage, questions: passage.questions, currentQuestion: question, questionState, currentQuestionIndex: q };
}

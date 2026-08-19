import { Router } from 'express';
import prisma from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/practice/records
router.get('/practice/records', authMiddleware, async (req, res) => {
  const records = await prisma.practiceRecord.findMany({
    where: { userId: req.userId },
    include: {
      question: { select: { stem: true, correctAnswer: true, questionType: true, number: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ data: records.map(r => ({ ...r, question: undefined, questionStem: r.question?.stem, questionType: r.question?.questionType })) });
});

// POST /api/practice/records — upsert
router.post('/practice/records', authMiddleware, async (req, res) => {
  try {
  const { passageId, questionId, mode, step, selectedKeywords, selectedBlockIds,
    distractorJudgments, finalAnswer, keywords, blocks,
    highlights, underlines, notes, mainMethod, structurePrediction, mainSummary,
    keywordConfirmed, blockConfirmed, distractorConfirmed, answerSubmitted,
    mainSummaryConfirmed, structureConfirmed, timeSpentMs } = req.body;

  // Compute auto-fields
  const isCorrect = finalAnswer ? await checkAnswer(questionId, finalAnswer) : null;

  const data = {
    userId: req.userId,
    passageId,
    questionId: parseInt(questionId),
    mode: mode || 'practice',
    step: step || 1,
    selectedKeywords: JSON.stringify(selectedKeywords || keywords || null),
    selectedBlockIds: JSON.stringify(selectedBlockIds || blocks || null),
    distractorJudgments: JSON.stringify(distractorJudgments || null),
    finalAnswer,
    isCorrect,
    timeSpentMs: timeSpentMs || null,
    highlights: JSON.stringify(highlights || null),
    underlines: JSON.stringify(underlines || null),
    notes: JSON.stringify(notes || null),
    mainMethod: mainMethod || null,
    structurePrediction: JSON.stringify(structurePrediction || null),
    mainSummary: mainSummary || null,
    keywordConfirmed: keywordConfirmed || false,
    blockConfirmed: blockConfirmed || false,
    distractorConfirmed: distractorConfirmed || false,
    answerSubmitted: answerSubmitted || false,
    mainSummaryConfirmed: mainSummaryConfirmed || false,
    structureConfirmed: structureConfirmed || false,
    submittedAt: answerSubmitted ? new Date() : null,
  };

  const record = await prisma.practiceRecord.upsert({
    where: { userId_passageId_questionId: { userId: req.userId, passageId, questionId: parseInt(questionId) } },
    update: data,
    create: data,
  });

  res.json({ data: { id: record.id, isCorrect, updatedAt: record.updatedAt } });
  } catch (err) {
    console.error('Record save error:', err.message);
    res.status(500).json({ message: err.message || 'Failed to save record' });
  }
});

// GET /api/practice/stats
router.get('/practice/stats', authMiddleware, async (req, res) => {
  const records = await prisma.practiceRecord.findMany({
    where: { userId: req.userId, answerSubmitted: true },
    include: { question: { select: { questionType: true, options: { select: { id: true, distractorType: true } } } } },
  });

  const total = records.length;
  const correct = records.filter(r => r.isCorrect).length;
  const byType = {};
  records.forEach(r => {
    const t = r.question?.questionType || 'unknown';
    if (!byType[t]) byType[t] = { total: 0, correct: 0 };
    byType[t].total++;
    if (r.isCorrect) byType[t].correct++;
  });

  // distractor breakdown — tally each distractor type's performance across all records
  const distractorTypes = ['synonym_replace', 'concept_swap', 'unsupported', 'opposite_direction', 'scope_shift'];
  const distractorBreakdown = {};
  distractorTypes.forEach(dt => { distractorBreakdown[dt] = { total: 0, correct: 0 }; });

  for (const r of records) {
    try {
      const judgments = typeof r.distractorJudgments === 'string' ? JSON.parse(r.distractorJudgments) : (r.distractorJudgments || []);
      const options = r.question?.options || [];
      for (const j of judgments) {
        const opt = options.find(o => o.id === j.optionId);
        const actualType = opt?.distractorType;
        if (actualType && distractorBreakdown[actualType]) {
          distractorBreakdown[actualType].total++;
          if (j.isCorrect) distractorBreakdown[actualType].correct++;
        }
      }
    } catch { /* skip malformed records */ }
  }

  // accuracy curve — last 30 records sorted by time
  const recent = [...records].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt)).slice(-30);
  const accuracyCurve = recent.map(r => ({
    date: r.updatedAt,
    correct: r.isCorrect ? 1 : 0,
  }));

  res.json({ data: { total, correct, accuracy: total > 0 ? Math.round(correct / total * 100) : 0, byType, distractorBreakdown, accuracyCurve } });
});

// GET /api/practice/wrong-records — fetch wrong answers for review (auth required)
router.get('/practice/wrong-records', authMiddleware, async (req, res) => {
  try {
    const { type } = req.query;
    const where = { userId: req.userId, answerSubmitted: true, isCorrect: false };
    const records = await prisma.practiceRecord.findMany({
      where,
      include: { question: { select: { stem: true, questionType: true, number: true, passageId: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    let result = records.map(r => ({
      id: r.id,
      passageId: r.passageId,
      questionId: r.questionId,
      questionStem: r.question?.stem,
      questionType: r.question?.questionType,
      questionNumber: r.question?.number,
      finalAnswer: r.finalAnswer,
      updatedAt: r.updatedAt,
    }));
    if (type && type !== 'all') {
      result = result.filter(r => r.questionType === type);
    }
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch wrong records' });
  }
});

async function checkAnswer(questionId, answer) {
  const q = await prisma.question.findUnique({ where: { id: parseInt(questionId) }, select: { correctAnswer: true } });
  return q?.correctAnswer === answer;
}

export default router;

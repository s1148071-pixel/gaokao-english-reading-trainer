import { Router } from 'express';
import prisma from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/papers
router.get('/papers', async (req, res) => {
  const papers = await prisma.paper.findMany({
    include: {
      passages: {
        include: {
          questions: {
            select: { id: true, questionType: true, locked: true },
          },
          _count: { select: { questions: true } },
        },
      },
    },
  });
  res.json({ data: papers.map(p => ({
    ...p,
    passages: p.passages.map(ps => ({
      ...ps,
      questionCount: ps._count.questions,
      questions: ps.questions || [],
    })),
  })) });
});

// GET /api/papers/:paper
router.get('/papers/:paper', async (req, res) => {
  const paper = await prisma.paper.findUnique({
    where: { id: req.params.paper },
    include: {
      passages: {
        select: { id: true, title: true, sourceInfo: true, passageStructure: true, passageSummary: true },
      },
    },
  });
  if (!paper) return res.status(404).json({ message: 'Paper not found' });
  res.json({ data: paper });
});

// GET /api/passages/:passage — full nested data
router.get('/passages/:passage', async (req, res) => {
  const passage = await prisma.passage.findUnique({
    where: { id: req.params.passage },
    include: {
      paragraphs: { include: { sentences: true }, orderBy: { id: 'asc' } },
      questions: {
        include: { options: true },
        orderBy: { number: 'asc' },
      },
    },
  });
  if (!passage) return res.status(404).json({ message: 'Passage not found' });

  res.json({ data: {
    ...passage,
    passageStructure: tryParse(passage.passageStructure),
    passageSummary: tryParse(passage.passageSummary),
    questions: passage.questions.map(q => ({
      ...q,
      stemTokens: tryParse(q.stemTokens),
      answerBlocks: tryParse(q.answerBlocks),
      analysis: tryParse(q.analysis),
      mainIdeaAnalysis: tryParse(q.mainIdeaAnalysis),
    })),
    paragraphs: passage.paragraphs.map(p => ({
      ...p,
      sentences: p.sentences.map(s => ({ ...s, tokens: tryParse(s.tokens) })),
    })),
  }});
});

// GET /api/questions/:question
router.get('/questions/:question', async (req, res) => {
  const question = await prisma.question.findUnique({
    where: { id: parseInt(req.params.question) },
    include: { options: true },
  });
  if (!question) return res.status(404).json({ message: 'Question not found' });
  res.json({ data: {
    ...question,
    stemTokens: tryParse(question.stemTokens),
    answerBlocks: tryParse(question.answerBlocks),
    analysis: tryParse(question.analysis),
    mainIdeaAnalysis: tryParse(question.mainIdeaAnalysis),
  }});
});

// PATCH /api/questions/:qId/options/:optId — update option annotation (auth required)
router.patch('/questions/:qId/options/:optId', authMiddleware, async (req, res) => {
  try {
    const { qId, optId } = req.params;
    const { distractorType, distractorExplanation, evidenceSentence } = req.body;
    const option = await prisma.option.update({
      where: { questionId_id: { questionId: parseInt(qId), id: optId } },
      data: { distractorType, distractorExplanation, evidenceSentence },
    });
    res.json({ data: option });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update option' });
  }
});

// PATCH /api/passages/:id — update passage annotation (auth required)
router.patch('/passages/:id', authMiddleware, async (req, res) => {
  try {
    const passage = await prisma.passage.update({
      where: { id: req.params.id },
      data: { passageSummary: JSON.stringify(req.body.passageSummary) },
    });
    res.json({ data: { ...passage, passageSummary: JSON.parse(passage.passageSummary) } });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update passage' });
  }
});

function tryParse(val) {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return null; }
  }
  return val;
}

export default router;

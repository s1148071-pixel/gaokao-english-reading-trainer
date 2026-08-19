import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function main() {
  // Load extracted data
  const dataPath = path.join(__dirname, 'seed-data.json');
  if (!fs.existsSync(dataPath)) {
    console.error('seed-data.json not found. Run extract-seed.py first.');
    process.exit(1);
  }
  const papers = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  for (const paper of papers) {
    await prisma.paper.upsert({
      where: { id: paper.id },
      update: { name: paper.name, year: paper.year, description: paper.description },
      create: { id: paper.id, name: paper.name, year: paper.year, description: paper.description },
    });

    for (const passage of paper.passages) {
      await prisma.passage.upsert({
        where: { id: passage.id },
        update: {
          title: passage.title, paperId: paper.id, sourceInfo: passage.sourceInfo,
          passageStructure: JSON.stringify(passage.passageStructure || null),
          passageSummary: JSON.stringify(passage.passageSummary || null),
        },
        create: {
          id: passage.id, paperId: paper.id, title: passage.title,
          sourceInfo: passage.sourceInfo,
          passageStructure: JSON.stringify(passage.passageStructure || null),
          passageSummary: JSON.stringify(passage.passageSummary || null),
        },
      });

      for (const para of passage.paragraphs) {
        await prisma.paragraph.upsert({
          where: { id: para.id },
          update: { passageId: passage.id },
          create: { id: para.id, passageId: passage.id },
        });
        for (const sent of para.sentences) {
          await prisma.sentence.upsert({
            where: { id: sent.id },
            update: { paragraphId: para.id, text: sent.text, tokens: JSON.stringify(sent.tokens || null) },
            create: { id: sent.id, paragraphId: para.id, text: sent.text, tokens: JSON.stringify(sent.tokens || null) },
          });
        }
      }

      for (const q of passage.questions) {
        await prisma.question.upsert({
          where: { id: q.id },
          update: {
            passageId: passage.id, number: q.number, questionType: q.questionType,
            locked: q.locked || false, stem: q.stem,
            stemTokens: JSON.stringify(q.stemTokens), answerBlocks: JSON.stringify(q.answerBlocks),
            correctAnswer: q.correctAnswer, analysis: JSON.stringify(q.analysis),
            mainIdeaAnalysis: JSON.stringify(q.mainIdeaAnalysis || null),
          },
          create: {
            id: q.id, passageId: passage.id, number: q.number, questionType: q.questionType,
            locked: q.locked || false, stem: q.stem,
            stemTokens: JSON.stringify(q.stemTokens), answerBlocks: JSON.stringify(q.answerBlocks),
            correctAnswer: q.correctAnswer, analysis: JSON.stringify(q.analysis),
            mainIdeaAnalysis: JSON.stringify(q.mainIdeaAnalysis || null),
          },
        });

        for (const opt of q.options) {
          await prisma.option.upsert({
            where: { questionId_id: { questionId: q.id, id: opt.id } },
            update: {
              text: opt.text, distractorType: opt.distractorType,
              distractorExplanation: opt.distractorExplanation || null,
              evidenceSentence: opt.evidenceSentence || null,
            },
            create: {
              questionId: q.id, id: opt.id, text: opt.text, distractorType: opt.distractorType,
              distractorExplanation: opt.distractorExplanation || null,
              evidenceSentence: opt.evidenceSentence || null,
            },
          });
        }
      }
    }
  }

  console.log(`Seeded ${papers.length} papers with questions`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

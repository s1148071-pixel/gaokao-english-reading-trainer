import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-your-key-here';
const DEEPSEEK_BASE = 'https://api.deepseek.com/v1';

router.post('/ai/explain', authMiddleware, async (req, res) => {
  const { question, options, correctAnswer, userAnswer, questionType } = req.body;
  if (!question) return res.status(400).json({ message: 'Question is required' });

  const prompt = `你是一位高考英语阅读理解辅导老师。请用中文、友好亲切的语气帮学生分析下面这道${questionType === 'main' ? '主旨大意题' : questionType === 'inference' ? '推断题' : '细节题'}。

题目：${question}
${options ? options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n') : ''}

正确答案：${correctAnswer}
学生的答案：${userAnswer || '未作答'}

请按以下结构回复（控制在200字以内）：
1. 🔍 解题思路：这道题的关键突破口在哪
2. ❌ 错因分析：学生可能为什么选错了（如果做对了就说"做得很好！"）
3. 💡 方法论提示：遇到同类型题目应该怎么想`;

  try {
    const response = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });
    const json = await response.json();
    const content = json.choices?.[0]?.message?.content || 'AI 暂时无法回复，请稍后重试。';
    res.json({ data: { explanation: content } });
  } catch (e) {
    res.status(500).json({ message: 'AI service unavailable: ' + e.message });
  }
});

export default router;

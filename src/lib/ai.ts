//===src/lib/ai.ts

'use server';
import Groq from 'groq-sdk';
import { CycleType, SubGoal } from '../../types';

// Groq 클라이언트 초기화
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // 환경변수 이름 변경
});

// AI 응답의 예상 구조를 정의하는 인터페이스
interface AiResponse {
  mainGoal: string;
  subGoals: { title: string; actions: string[] }[];
}

// 안전한 JSON 파싱
function safeParseJSON(text: string): AiResponse {
  try {
    const cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 형식을 찾을 수 없습니다');
    return JSON.parse(jsonMatch[0]) as AiResponse;
  } catch (error) {
    console.error('JSON 파싱 실패:', error);
    return { mainGoal: '', subGoals: [] };
  }
}

// 배열을 정확히 8개로 맞추기
function normalizeToEight<T>(arr: T[], createDefault: () => T): T[] {
  const result = [...arr];
  if (result.length > 8) return result.slice(0, 8);
  while (result.length < 8) result.push(createDefault());
  return result;
}

export async function generateMandal(goalText: string, cycleType: CycleType) {
  const prompt = `
You are a great thinker. You know every valid and meaningful statement exist only in a certain world model. So you will use language to describe/simulate a suitable world model, and do reasoning within this model.
Here is the problem : [Break down the goals into a mandala structure.]

**Goal**: ${goalText}
**Period**: ${cycleType === 'weekly' ? '1주일' : '8주 (2개월)'}

**RULE**:
1. Break your goal down into 8 sub-goals, each in precise chronological order.
2. Each sub-goal is a specific intermediate goal.
3. Create exactly eight actionable actions for each subgoal.
4. Write the actions as a checklist of two to three words.
5. Answer in Korean.

**Please output only in the JSON format below.**:
{
  "mainGoal": "Refined target sentence (5-7 words)",
  "subGoals": [
    {
      "title": "Sub-goals",
      "actions": ["action1", "action2", "action3", "action4", "action5", "action6", "action7", "action8"]
    }
  ]
}
`;

  // Groq API 호출
  const completion = await groq.chat.completions.create({
    model: 'groq/compound', 
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.4,
    max_tokens: 1024,
    top_p: 0.8,
  });

  const response = completion.choices[0]?.message?.content || '';
  const data = safeParseJSON(response);

  // Sub-goal 8개 보장
  const normalizedSubGoals = normalizeToEight(
    data.subGoals || [],
    () => ({
      title: '세부 목표 보완 필요',
      actions: [],
    })
  );

  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
  ];

  const subGoals: SubGoal[] = normalizedSubGoals.map((sg, idx) => {
    // Action도 8개 보장
    const normalizedActions = normalizeToEight(
      sg.actions || [],
      () => '추가 행동 정의 필요'
    );

    return {
      title: sg.title || `단계 ${idx + 1}`,
      color: colors[idx],
      actions: normalizedActions.map((text: string) => ({ text, done: false })),
      locked: false,
    };
  });

  return {
    mainGoal: data.mainGoal || goalText,
    subGoals,
  };
}
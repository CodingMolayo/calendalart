//===src/lib/ai.ts

'use server';
import Groq from 'groq-sdk';
import { CycleType, SubGoal } from '../../types';

// Groq 클라이언트 초기화
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
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

// 타입별 프롬프트 생성
function generatePrompt(goalText: string, cycleType: CycleType): string {
  const baseInstructions = `
You are a great thinker and goal management expert. You know every valid and meaningful statement exist only in a certain world model and maps.
So you will use language to describe/simulate a suitable world model, and do reasoning within this model.
Here is the problem: [Break down the goals into a mandala structure.]

**Goal**: ${goalText}
`;

  let specificInstructions = '';
  
  if (cycleType === 'routine') {
    specificInstructions = `
**Type**: 주간 루틴 (매주 반복)

**RULE**:
1. This goal is a weekly ROUTINE that repeats every week.
2. Break it down into 8 sub-goals representing different ASPECTS or CONTEXTS of the routine (e.g., morning, evening, weekday, weekend, work, home, etc.).
3. Each sub-goal should be a specific variation or time slot of the routine.
4. Create exactly 8 actionable actions for each sub-goal.
5. Actions should be concrete, measurable habits.
6. Answer in Korean.

**Example**:
Goal: "매일 아침 운동하기"
Sub-goals: "월요일 루틴", "화요일 루틴", "주말 루틴", "실내 운동", "야외 운동", "스트레칭", "유산소", "근력 운동"
`;
  } else if (cycleType === 'weekly') {
    specificInstructions = `
**Type**: 단기 목표 (1주일)

**RULE**:
1. This is a short-term goal to be achieved within 1 week.
2. Break it down into 8 sub-goals in chronological order.
3. Each sub-goal is a specific step toward the main goal.
4. Create exactly 8 actionable actions for each sub-goal.
5. Actions should be completable within 1-2 days.
6. Answer in Korean.
`;
  } else { // focus
    specificInstructions = `
**Type**: 중장기 목표 (8주)

**RULE**:
1. This is a medium-term goal to be achieved within 8 weeks.
2. Break it down into 8 sub-goals in chronological order (roughly 1 sub-goal per week).
3. Each sub-goal is a specific milestone.
4. Create exactly 8 actionable actions for each sub-goal.
5. Actions should be completable within a week.
6. Answer in Korean.
`;
  }

  return `${baseInstructions}${specificInstructions}

**Please output ONLY in the JSON format below**:
{
  "mainGoal": "Refined target sentence (5-7 words in Korean)",
  "subGoals": [
    {
      "title": "Sub-goal title (2-4 words in Korean)",
      "actions": ["action1", "action2", "action3", "action4", "action5", "action6", "action7", "action8"]
    }
  ]
}
`;
}

export async function generateMandal(goalText: string, cycleType: CycleType) {
  const prompt = generatePrompt(goalText, cycleType);

  // Groq API 호출
  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b', 
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.4,
    max_tokens: 4096,
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
    };
  });

  return {
    mainGoal: data.mainGoal || goalText,
    subGoals,
  };
}
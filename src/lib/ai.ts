'use server';
import Groq from 'groq-sdk';
import { CycleType, SubGoal } from '../../types';

// Groq 클라이언트 초기화
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // 환경변수 이름 변경
});

// 안전한 JSON 파싱
function safeParseJSON(text: string): any {
  try {
    const cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 형식을 찾을 수 없습니다');
    return JSON.parse(jsonMatch[0]);
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
당신은 목표 관리 전문가입니다. 사용자의 목표를 만다라트 구조로 분해해주세요.

**목표**: ${goalText}
**기간**: ${cycleType === 'weekly' ? '1주일' : '8주 (2개월)'}

**규칙**:
1. 목표를 시간 순서대로 정확히 8단계 Sub-goal로 나눕니다
2. 각 Sub-goal은 구체적인 중간 목표입니다
3. 각 Sub-goal마다 실행 가능한 Action을 정확히 8개 생성합니다
4. Action은 체크리스트 수준으로 작성합니다

**반드시 아래 JSON 형식으로만 출력하세요**:
{
  "mainGoal": "정제된 목표 문장",
  "subGoals": [
    {
      "title": "Sub-goal 제목",
      "actions": ["action1", "action2", "action3", "action4", "action5", "action6", "action7", "action8"]
    }
  ]
}
`;

  // Groq API 호출
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-70b-versatile', // Groq의 최신 모델
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.4,
    max_tokens: 2048,
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

  const subGoals: SubGoal[] = normalizedSubGoals.map((sg: any, idx: number) => {
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
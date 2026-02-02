MVP 개발 명세서를 보내줄게. 해당 개발 명세서를 확인한 후 이 서비스의 특징을 짧게 설명한 후, 적절한 프로그래밍 언어로 component tree를 작성해줘. 
Calendalart : Make your sentence to mandalart to calendar.

Calendalart — README
1. Product Overview
Mandal Planner는 Mandal-Art 목표 구조 + 캘린더 일정 시스템을 결합한 실행 중심 목표 관리 웹앱이다. 사용자가 목표 문장을 입력하면 AI가 이를 81칸 만다라트 구조로 분해하고, 하위 목표(Sub-goal)를 드래그하여 캘린더 일정으로 변환할 수 있다.
핵심 개념:
Goal Structure → Time Commitment → Progress Tracking

2. Target Users
* 학생
* 직장인
* 단기 집중 목표(시험, 프로젝트, 자기계발 등)를 가진 사용자

3. Goal Cycle Types
사용자는 목표 생성 시 2가지 모드 중 선택한다.
모드
기간
용도
Weekly Mode
1주
단기 실행 집중
Focus Cycle
8주 (2개월)
중기 목표 달성
4. System Architecture (Recommended Stack)
비개발자 운영 기준, 유지보수와 확장성을 고려한 스택:
영역
기술
Frontend
Next.js (React 기반)
Styling
Tailwind CSS
State
React Context / Zustand
Backend
Firebase (Serverless)
DB
Firestore
Auth
Firebase Auth
Hosting
Firebase Hosting
AI
Gemini API
5. Core Feature Flow
5.1 User Flow
1. 웰컴 화면
2. 목표 기간 선택 (주간 / 8주)
3. 목표 문장 입력
4. “만다라트 생성” 버튼 클릭
5. Gemini API 호출 → 만다라트 생성
6. 메인 화면 표시
   * 상단: 캘린더
   * 하단: 만다라트 보드
7. Sub-goal을 드래그하여 캘린더에 등록
8. Action 체크리스트 진행

6. Mandal-Art Structure
레벨
개수
설명
Main Goal
1
사용자 입력 문장 기반
Sub-goal
8
단계/시간 흐름 기반 분해
Action
64
행동 카테고리 수준
규칙
* 항상 8개 Sub-goal 생성 (부족해도 채움)
* Action은 일정 단위가 아닌 행동 유형 수준
* 텍스트 수정 가능
* 구조 변경 불가

7. AI Generation Specification
7.1 Input
{
  goalText: string,
  cycleType: "weekly" | "focus"
}
7.2 AI Prompt Role
AI는 목표를:
1. 기한에 맞게 정제
2. 단계/시간 흐름 기반으로 8개 Sub-goal 생성
3. 각 Sub-goal에 대해 8개 Action 생성
7.3 Output JSON Format
{
  "mainGoal": "string",
  "subGoals": [
    {
      "title": "string",
      "actions": ["string", "string", ... 8개]
    }
  ]
}

8. Calendar System
* 내부 캘린더 전용
* Sub-goal을 드래그하면 기간 일정(Event Duration) 생성
* 등록 시:
   * 해당 Sub-goal 텍스트 수정 불가
   * 경고 메시지 1회 표시

9. Progress System
항목
방식
체크 방식
Action 체크박스
진행률 계산
n/8
UI 반영
Sub-goal 셀 색상 진해짐
계산 위치
프론트엔드
10. Color System
* Sub-goal 8개에 자동 색상 배정
* 진행률에 따라 동일 색상 계열 내 명도 변화

11. Data Model (Firestore)
Goal Document
goals/{goalId}
{
  userId,
  cycleType,
  mainGoal,
  subGoals: [
    {
      title,
      color,
      actions: [
        { text, done }
      ],
      locked: boolean
    }
  ],
  createdAt
}

12. Limit Policy
유형
제한
무료 사용자
Goal 최대 3개
확장
Goal Slot 구매 (추후)
13. Editing Rules
요소
수정 가능
Main Goal 텍스트
가능
Sub-goal 텍스트
가능 (캘린더 등록 전)
Action 텍스트
가능
구조 변경
불가
14. AI Call Timing
* 웰컴 화면 → “만다라트 생성” 클릭 시 단 1회 호출
* 이후 재생성 없음 (토큰 절약 목적)

15. MVP Scope Summary
포함:
* AI 만다라트 생성
* 드래그 일정 등록
* 체크리스트 기반 진행률
* Goal 다중 관리 (최대 3개)
제외:
* 외부 캘린더 연동
* AI 재생성
* 구조 편집
* 협업 기능

component tree
calendalart/
├── app/
│   ├── layout.tsx              // 전역 레이아웃
│   ├── page.tsx                // 웰컴 + 목표 입력
│   └── goal/[id]/page.tsx      // 메인 화면 (캘린더+만다라트)
├── components/
│   ├── AppLayout.tsx         // 좌측 session 목록
│   ├── MandalBoard.tsx         // 만다라트 전체 (셀 포함)
│   └── Calendar.tsx            // 캘린더 전체 (드래그 포함)
├── lib/
│   ├── firebase.ts             // Firebase 설정 + DB 함수
│   ├── color.ts             // 만다라트 성취도 색상
│   └── ai.ts               // AI 생성 로직
└── types.ts                    // 모든 타입 정의
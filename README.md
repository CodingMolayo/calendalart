# Calendalart : Make your sentence to mandalart to calendar.

## 1. Product Overview

Calendalart는 **Mandal-Art 목표 구조**와 **캘린더 일정 시스템**을 결합하여, 아이디어를 구체적인 실행으로 연결해주는 목표 관리 웹앱입니다. 사용자가 이루고 싶은 목표 문장을 입력하면, AI가 이를 81칸 만다라트 구조로 체계화하고, 사용자는 분해된 하위 목표(Sub-goal)를 캘린더에 드래그하여 실행 계획을 수립할 수 있습니다.

**핵심 개념:** `목표 구조화 (Goal Structure)` → `시간 약속 (Time Commitment)` → `진행 상황 추적 (Progress Tracking)`

## 2. Target Users

- **학생:** 시험공부, 논문 작성, 프로젝트 등 학업 목표 관리
- **직장인:** 업무 프로젝트, 자기 계발, 부업 등 경력 목표 관리
- **모 든 이:** 단기 집중 목표(자격증, 운동, 외국어 학습 등)를 효과적으로 달성하고 싶은 사람

## 3. Goal Cycle Types

사용자는 목표 생성 시 2가지 실행 주기 중 하나를 선택하여 집중도를 조절합니다.

| 모드          | 기간      | 용도                                 |
| :------------ | :-------- | :----------------------------------- |
| **Weekly Mode** | 1주       | 단기 과제 해결, 빠른 실행 집중       |
| **Focus Cycle** | 8주 (2개월) | 중장기 프로젝트, 습관 형성 등 목표 달성 |

## 4. System Architecture

비개발자도 쉽게 유지보수하고, 최소 비용으로 운영 및 확장할 수 있는 Serverless 스택을 채택했습니다.

| 영역       | 기술                      | 비고                                                           |
| :--------- | :------------------------ | :------------------------------------------------------------- |
| Frontend   | **Next.js (App Router)**  | React 기반, SSR 및 서버 컴포넌트 활용                             |
| Styling    | **Tailwind CSS**          | Utility-First CSS 프레임워크                                    |
| State      | **React Hooks & Context** | 클라이언트 상태 관리                                            |
| Backend    | **Firebase (Auth, Firestore)** | 사용자 인증 및 데이터베이스 (Serverless)                      |
| **AI**         | **Groq API**              | 빠른 응답 속도의 LLM을 통한 만다라트 계획 자동 생성             |
| **Deployment** | **Vercel**                | Next.js 네이티브 지원, Git 기반 자동 배포(CI/CD), 무료 Hobby 플랜 |

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


## 5. 개발 및 배포 기록 (Development & Deployment Log)

### v0.0.1 - 초기 개발 및 핵심 기능 구현
- **프로젝트 설정:** Next.js, TypeScript, Tailwind CSS 기반으로 프로젝트 구조를 설정했습니다.
- **데이터베이스 연동:** Firebase (Firestore)를 데이터베이스로 사용하여 목표 데이터(메인 목표, 하위 목표, 실행 계획 등)를 관리하는 CRUD 로직을 구현했습니다.
- **AI 기능 구현:** Groq API와 연동하여, 사용자가 입력한 목표 문장을 8개의 구체적인 하위 목표와 각각의 실행 계획으로 자동 생성하는 AI 프롬프트를 설계하고 적용했습니다.
- **Drag & Drop 구현:** `dnd-kit` 라이브러리를 도입하여, 생성된 하위 목표를 캘린더의 특정 날짜에 드래그 앤 드롭으로 손쉽게 추가하는 핵심 기능을 구현했습니다.

### v0.0.2 - 사용성 개선 및 Vercel 배포
- **체크리스트 기능 활성화:** 상세 목표의 개별 실행 항목(Action)을 클릭하여 완료 여부(`done`)를 토글하고, 이를 즉시 Firestore 데이터베이스에 반영하는 기능을 구현했습니다.
- **배포 환경 결정 및 실행:**
  - **검토:** Firebase Hosting(Classic)은 SSR 지원 부재, App Hosting은 유료(Blaze) 플랜 필요성 때문에 최종적으로 **Vercel**을 배포 플랫폼으로 선택했습니다.
  - **선택 이유:** Vercel은 Next.js 프레임워크와의 완벽한 호환성, 편리한 CI/CD(Git Push 기반 자동 배포), 넉넉한 무료 Hobby 플랜을 제공하여 현 단계에 가장 적합하다고 판단했습니다.
  - **배포 완료:** GitHub 저장소에 프로젝트를 푸시하고, Vercel 프로젝트를 생성하여 연동했습니다. 운영 환경에 필요한 환경 변수(Firebase 및 Groq API 키)를 Vercel 대시보드에 안전하게 설정하여 성공적으로 배포를 완료했습니다.

### v0.0.3 - 디자인 강화
- **만다라트 스타일:** main goal 및 sub goal을 만다라트 형태로
- **캘린더에서 팝업:** 캘린더에 등록한 sub goal을 누르면 pop-up(todo list 및 goal 삭제)

### v0.0.4(예정) - UI/UX 디테일 추가
- **모바일 반응형 개선:** `goal/[id]` 페이지의 8주 달력이 모바일 화면에서도 예쁜 비율로 보이도록
- **UI/UX 개선:** 메인 페이지에서 목표 주기('주간' vs '집중') 선택에 따라 목표 입력창의 예시 문구(`placeholder`)가 동적으로 변경되도록
// 모든 타입을 한 곳에서 관리
export type CycleType = 'routine' | 'weekly' | 'focus';

export interface Action {
  text: string;
  done: boolean;
}

export interface SubGoal {
  title: string;
  color: string;
  actions: Action[];
}

export interface Goal {
  id: string;
  userId: string;
  cycleType: CycleType;
  mainGoal: string;
  subGoals: SubGoal[];
  createdAt: Date;
}

export interface CalendarEvent {
  id: string;
  subGoalIndex: number;
  title: string;
  color: string;
  startDate: Date;
  endDate: Date;
}
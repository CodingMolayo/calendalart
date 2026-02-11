'use client';

import { Goal } from '../../types';
import { toggleAction } from '@/lib/firebase';
import { getProgressColor } from '@/lib/color';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  goal: Goal;
  onUpdate: () => void;
}

// 개별 Action 셀 컴포넌트 (3×3 내부 - 중앙 제외)
function ActionCell({ 
  action, 
  actionIdx, 
  subIdx, 
  goalId, 
  onUpdate,
  color,
  isCenter,
  subGoalTitle
}: { 
  action?: { text: string; done: boolean }, 
  actionIdx: number, 
  subIdx: number, 
  goalId: string, 
  onUpdate: () => void,
  color: string,
  isCenter?: boolean,
  subGoalTitle?: string
}) {
  const handleToggle = async () => {
    if (!action) return;
    await toggleAction(goalId, subIdx, actionIdx);
    onUpdate();
  };

  // 중앙 셀 (Sub-Goal 제목)
  if (isCenter) {
    return (
      <div 
        className="flex items-center justify-center p-1 md:p-2 border-2 rounded font-bold text-center"
        style={{ 
          borderColor: color,
          backgroundColor: color + '30',
          minHeight: '40px'
        }}
      >
        <span className="text-[8px] md:text-xs leading-tight text-gray-900">
          {subGoalTitle}
        </span>
      </div>
    );
  }

  if (!action) {
    return <div className="border rounded" style={{ borderColor: color, minHeight: '40px' }}></div>;
  }

  return (
    <label 
      className={`flex items-center justify-center p-1 md:p-2 border rounded cursor-pointer transition-all ${
        action.done ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'
      }`}
      style={{ 
        borderColor: action.done ? '#d1d5db' : color,
        minHeight: '40px'
      }}
    >
      <input
        type="checkbox"
        checked={action.done}
        onChange={handleToggle}
        className="hidden"
      />
      <span 
        className={`text-[8px] md:text-xs text-center leading-tight ${
          action.done ? 'line-through text-gray-500' : 'text-gray-800'
        }`}
      >
        {action.text}
      </span>
    </label>
  );
}

// SubGoal 카드 (3×3 구조, 중앙에 제목)
function MandalCard({ 
  subGoal, 
  subIdx, 
  goalId, 
  onUpdate 
}: { 
  subGoal: Goal['subGoals'][0], 
  subIdx: number, 
  goalId: string, 
  onUpdate: () => void 
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `draggable-${subIdx}`,
    data: {
      subGoalIndex: subIdx,
      title: subGoal.title,
      color: subGoal.color,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const getProgress = () => {
    const doneCount = subGoal.actions.filter(a => a.done).length;
    return doneCount / 8;
  };

  const progress = getProgress();
  const backgroundColor = getProgressColor(subGoal.color, progress);

  // 3×3 배열 생성 (중앙은 제목, 나머지는 actions)
  const gridItems = [
    subGoal.actions[0], // 0
    subGoal.actions[1], // 1
    subGoal.actions[2], // 2
    subGoal.actions[3], // 3
    null,               // 4 (중앙)
    subGoal.actions[4], // 5
    subGoal.actions[5], // 6
    subGoal.actions[6], // 7
    subGoal.actions[7], // 8
  ];

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="border-2 rounded-lg p-1 md:p-2 flex flex-col shadow-md hover:shadow-xl transition-all w-full h-full cursor-move"
      style={{
        ...style, // 드래그 transform 포함
        borderColor: subGoal.color,
        backgroundColor: backgroundColor + '20',
        touchAction: 'none', // 모바일 드래그 개선
      }}
    >
      {/* 헤더 */}
      <div 
        className="flex justify-between items-center mb-1 md:mb-2 px-1 md:px-2 py-1 rounded"
        style={{ backgroundColor }}
      >
        <h3 className="font-bold text-[9px] md:text-sm text-white truncate flex-1">
          {subGoal.title}
        </h3>
        <span className="text-[8px] md:text-xs font-semibold text-white bg-black/30 px-1 py-0.5 rounded ml-1">
          {subGoal.actions.filter(a => a.done).length}/8
        </span>
      </div>

      {/* 3×3 Grid (중앙은 Sub-Goal 제목) */}
      <div 
        className="grid grid-cols-3 gap-0.5 md:gap-1 flex-grow"
        onPointerDown={(e) => e.stopPropagation()}
        style={{ touchAction: 'auto' }} // 체크박스는 스크롤 가능
      >
        {gridItems.map((action, idx) => {
          const isCenter = idx === 4;
          // 중앙이 아닌 경우 실제 actionIndex 계산
          const actualActionIdx = idx < 4 ? idx : idx - 1;
          
          return (
            <ActionCell
              key={idx}
              action={action || undefined}
              actionIdx={actualActionIdx}
              subIdx={subIdx}
              goalId={goalId}
              onUpdate={onUpdate}
              color={subGoal.color}
              isCenter={isCenter}
              subGoalTitle={isCenter ? subGoal.title : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

// 메인 보드 (3×3 구조, 중앙은 Main Goal)
export default function MandalBoard({ goal, onUpdate }: Props) {
  // 3×3 배열 생성 (중앙은 Main Goal)
  const gridItems = [
    goal.subGoals[0], // 0
    goal.subGoals[1], // 1
    goal.subGoals[2], // 2
    goal.subGoals[3], // 3
    null,             // 4 (중앙 - Main Goal)
    goal.subGoals[4], // 5
    goal.subGoals[5], // 6
    goal.subGoals[6], // 7
    goal.subGoals[7], // 8
  ];

  return (
    <div className="w-full">

      
      {/* 3×3 Grid */}
      <div 
        className="grid grid-cols-3 gap-1 md:gap-2 mx-auto w-full max-w-sm md:max-w-2xl lg:max-w-4xl p-2 md:p-4 bg-gray-100 rounded-xl shadow-lg" 
        style={{ aspectRatio: '1/1' }}
      >
        {gridItems.map((subGoal, idx) => {
          const isCenter = idx === 4;
          
          // 중앙 셀 (Main Goal)
          if (isCenter) {
            return (
              <div 
                key="center"
                className="flex items-center justify-center border-4 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl"
              >
                <h2 className="text-center font-bold text-white px-2 text-xs md:text-lg leading-tight">
                  {goal.mainGoal}
                </h2>
              </div>
            );
          }
          
          // SubGoal 카드
          const actualSubIdx = idx < 4 ? idx : idx - 1;
          return (
            <MandalCard 
              key={actualSubIdx} 
              subGoal={goal.subGoals[actualSubIdx]} 
              subIdx={actualSubIdx} 
              goalId={goal.id} 
              onUpdate={onUpdate} 
            />
          );
        })}
      </div>
    </div>
  );
}
'use client';

import { Goal } from '../../types';
import { toggleAction } from '@/lib/firebase';
import { getProgressColor } from '@/lib/color';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import ChecklistModal from './ChecklistModal';

interface Props {
  goal: Goal;
  onUpdate: () => void;
}

// 개별 Action 셀 컴포넌트
function ActionCell({ 
  action, 
  actionIdx, 
  subIdx, 
  goalId, 
  onUpdate,
  color,
  isCenter,
  subGoalTitle,
  onOpenModal
}: { 
  action?: { text: string; done: boolean }, 
  actionIdx: number, 
  subIdx: number, 
  goalId: string, 
  onUpdate: () => void,
  color: string,
  isCenter?: boolean,
  subGoalTitle?: string,
  onOpenModal?: () => void;
}) {
  
  // 1. 중앙 셀 (Sub-Goal 제목 - 클릭 시 모달)
  if (isCenter) {
    return (
      <div 
        onClick={(e) => {
          e.stopPropagation();
          console.log("중앙 셀 클릭됨!");
          onOpenModal?.();
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          console.log("중앙 셀 터치됨!");
          onOpenModal?.();
        }}
        className="flex items-center justify-center p-1 md:p-2 border-2 rounded font-bold text-center cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm"
        style={{ 
          borderColor: color,
          backgroundColor: color + '40',
          minHeight: '40px',
        }}
      >
        <span className="text-[8px] md:text-xs leading-tight text-gray-900 select-none pointer-events-none">
          {subGoalTitle}
        </span>
      </div>
    );
  }

  // 2. 빈 셀
  if (!action) {
    return (
      <div 
        className="border rounded opacity-20" 
        style={{ borderColor: color, minHeight: '40px' }}
      />
    );
  }

  // 3. 일반 Action 셀 (체크박스)
  const handleToggle = async (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    await toggleAction(goalId, subIdx, actionIdx);
    onUpdate();
  };

  return (
    <div 
      onClick={handleToggle}
      onTouchEnd={handleToggle}
      className={`flex items-center justify-center p-1 md:p-2 border rounded cursor-pointer transition-all ${
        action.done ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'
      }`}
      style={{ 
        borderColor: action.done ? '#d1d5db' : color,
        minHeight: '40px'
      }}
    >
      <span 
        className={`text-[8px] md:text-xs text-center leading-tight select-none pointer-events-none ${
          action.done ? 'line-through text-gray-500' : 'text-gray-800'
        }`}
      >
        {action.text}
      </span>
    </div>
  );
}

// SubGoal 카드 (3×3 구조)
function MandalCard({ 
  subGoal, 
  subIdx, 
  goalId, 
  onUpdate,
  onOpenModal
}: { 
  subGoal: Goal['subGoals'][0], 
  subIdx: number, 
  goalId: string, 
  onUpdate: () => void,
  onOpenModal: (subIdx: number) => void
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

  const progress = subGoal.actions.filter(a => a.done).length / 8;
  const backgroundColor = getProgressColor(subGoal.color, progress);

  const gridItems = [
    subGoal.actions[0], subGoal.actions[1], subGoal.actions[2],
    subGoal.actions[3], null,               subGoal.actions[4],
    subGoal.actions[5], subGoal.actions[6], subGoal.actions[7],
  ];

  return (
    <div
      className="border-2 rounded-lg p-1 md:p-2 flex flex-col shadow-md w-full h-full bg-white"
      style={{ 
        ...style,
        borderColor: subGoal.color,
      }}
    >
      {/* 헤더 - 드래그 가능 */}
      <div 
        ref={setNodeRef}
        {...listeners} 
        {...attributes}
        className="flex justify-between items-center mb-1 md:mb-2 px-1 md:px-2 py-1 rounded cursor-move select-none"
        style={{ 
          backgroundColor,
          touchAction: 'none'
        }}
      >
        <h3 className="font-bold text-[9px] md:text-sm text-white truncate flex-1 pointer-events-none">
          {subGoal.title}
        </h3>
        <span className="text-[8px] md:text-xs font-semibold text-white bg-black/30 px-1 py-0.5 rounded ml-1 pointer-events-none">
          {subGoal.actions.filter(a => a.done).length}/8
        </span>
      </div>

      {/* 그리드 영역 - 클릭 가능 */}
      <div 
        className="grid grid-cols-3 gap-0.5 md:gap-1 flex-grow"
        style={{ touchAction: 'auto' }}
      >
        {gridItems.map((action, idx) => {
          const isCenter = idx === 4;
          const actualActionIdx = idx < 4 ? idx : idx - 1;
          
          return (
            <ActionCell
              key={`action-${subIdx}-${idx}`}
              action={action || undefined}
              actionIdx={actualActionIdx}
              subIdx={subIdx}
              goalId={goalId}
              onUpdate={onUpdate}
              color={subGoal.color}
              isCenter={isCenter}
              subGoalTitle={isCenter ? subGoal.title : undefined}
              onOpenModal={isCenter ? () => onOpenModal(subIdx) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

// 메인 보드
export default function MandalBoard({ goal, onUpdate }: Props) {
  const [selectedSubGoalIndex, setSelectedSubGoalIndex] = useState<number | null>(null);

  const handleOpenModal = (subGoalIndex: number) => {
    console.log("모달 열기:", subGoalIndex);
    setSelectedSubGoalIndex(subGoalIndex);
  };

  const handleCloseModal = () => {
    setSelectedSubGoalIndex(null);
  };

  const handleToggleAction = async (subGoalIndex: number, actionIndex: number) => {
    await toggleAction(goal.id, subGoalIndex, actionIndex);
    onUpdate();
  };

  const gridItems = [
    goal.subGoals[0], goal.subGoals[1], goal.subGoals[2],
    goal.subGoals[3], null,             goal.subGoals[4],
    goal.subGoals[5], goal.subGoals[6], goal.subGoals[7],
  ];

  return (
    <div className="w-full">
      <div 
        className="grid grid-cols-3 gap-1 md:gap-2 mx-auto w-full max-w-sm md:max-w-2xl lg:max-w-4xl p-2 md:p-4 bg-gray-100 rounded-xl shadow-lg" 
        style={{ aspectRatio: '1/1' }}
      >
        {gridItems.map((_, idx) => {
          if (idx === 4) {
            return (
              <div 
                key="main-center"
                className="flex items-center justify-center border-4 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl"
              >
                <h2 className="text-center font-bold text-white px-2 text-xs md:text-lg leading-tight">
                  {goal.mainGoal}
                </h2>
              </div>
            );
          }
          
          const actualSubIdx = idx < 4 ? idx : idx - 1;
          return (
            <MandalCard 
              key={`subgoal-${actualSubIdx}`} 
              subGoal={goal.subGoals[actualSubIdx]} 
              subIdx={actualSubIdx} 
              goalId={goal.id} 
              onUpdate={onUpdate}
              onOpenModal={handleOpenModal}
            />
          );
        })}
      </div>
      
      {/* 모달 */}
      {selectedSubGoalIndex !== null && (
        <ChecklistModal
          subGoal={goal.subGoals[selectedSubGoalIndex]}
          subGoalIndex={selectedSubGoalIndex}
          goal={goal}
          onClose={handleCloseModal}
          onToggleAction={handleToggleAction}
        />
      )}
    </div>
  );
}
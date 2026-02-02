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

function MandalCard({ subGoal, subIdx, goalId, onUpdate }: { subGoal: Goal['subGoals'][0], subIdx: number, goalId: string, onUpdate: () => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `draggable-${subIdx}`,
    data: {
      subGoalIndex: subIdx,
      title: subGoal.title,
      color: subGoal.color,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const handleToggle = async (actionIdx: number) => {
    await toggleAction(goalId, subIdx, actionIdx);
    onUpdate();
  };

  const getProgress = () => {
    const doneCount = subGoal.actions.filter(a => a.done).length;
    return doneCount / 8;
  };

  const progress = getProgress();
  const backgroundColor = getProgressColor(subGoal.color, progress);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="touch-none border-2 rounded-lg p-2 md:p-4 flex flex-col cursor-move shadow-md hover:shadow-xl transition-shadow w-full h-full"
    >
      <div style={{ backgroundColor, borderColor: subGoal.color }} className="border-2 rounded-lg p-2 flex-grow flex flex-col">
        <div className="flex justify-between items-center mb-1 md:mb-3">
          <h3 className="font-bold text-[10px] md:text-base text-gray-900 truncate">{subGoal.title}</h3>
          <span className="text-[8px] md:text-xs font-semibold text-gray-800 bg-white/70 px-1 py-0.5 rounded-md shadow-sm">
            {`${subGoal.actions.filter(a => a.done).length}/8`}
          </span>
        </div>
        <div className="flex-grow space-y-1 md:space-y-2 overflow-y-auto no-scrollbar">
          {subGoal.actions.map((action, actIdx) => (
            <label key={actIdx} className="flex items-start gap-1 md:gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={action.done}
                onChange={() => handleToggle(actIdx)}
                className="mt-0.5 w-3 h-3 md:mt-1 md:w-4 md:h-4 accent-blue-600"
              />
              <span className={`flex-1 text-[8px] md:text-sm ${action.done ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                {action.text}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MandalBoard({ goal, onUpdate }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4 mx-auto w-full max-w-lg md:max-w-2xl lg:max-w-4xl" style={{ aspectRatio: '1/1' }}>
      {goal.subGoals.map((subGoal, subIdx) => (
        <MandalCard key={subIdx} subGoal={subGoal} subIdx={subIdx} goalId={goal.id} onUpdate={onUpdate} />
      ))}
    </div>
  );
}

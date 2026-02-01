'use client';

import { Goal } from '../../types';
import { toggleAction } from '@/lib/firebase';
import { getProgressColor } from '@/lib/color'; // 🔥 추가

interface Props {
  goal: Goal;
  onUpdate: () => void;
}

export default function MandalBoard({ goal, onUpdate }: Props) {
  const handleToggle = async (subIdx: number, actionIdx: number) => {
    await toggleAction(goal.id, subIdx, actionIdx);
    onUpdate();
  };

  // 진행률 계산 (0 ~ 1)
  const getProgress = (subIdx: number) => {
    const actions = goal.subGoals[subIdx].actions;
    const doneCount = actions.filter(a => a.done).length;
    return doneCount / 8; // 0.0 ~ 1.0
  };

  // 진행률 텍스트 (n/8)
  const getProgressText = (subIdx: number) => {
    const actions = goal.subGoals[subIdx].actions;
    const doneCount = actions.filter(a => a.done).length;
    return `${doneCount}/8`;
  };

  return (
    <div className="grid grid-cols-3 gap-4 max-w-6xl mx-auto">
      {goal.subGoals.map((subGoal, subIdx) => {
        const progress = getProgress(subIdx);
        const backgroundColor = getProgressColor(subGoal.color, progress); // 🔥 동적 배경색

        return (
          <div
            key={subIdx}
            draggable={!subGoal.locked} // 드래그 가능 여부
            onDragStart={(e) => {
              if (!subGoal.locked) {
                e.dataTransfer.setData('subGoalIndex', subIdx.toString());
              }
            }}
            className={`border-2 rounded-lg p-4 transition-all duration-300 ${
              !subGoal.locked ? 'cursor-move hover:shadow-lg' : 'cursor-not-allowed opacity-75'
            }`}
            style={{
              borderColor: subGoal.color,
              backgroundColor, // 🔥 진행률에 따라 진해짐
            }}
          >
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800">{subGoal.title}</h3>
              <span className="text-sm font-semibold text-gray-700 bg-white px-2 py-1 rounded">
                {getProgressText(subIdx)}
              </span>
            </div>

            {/* Action 체크리스트 */}
            <div className="space-y-2">
              {subGoal.actions.map((action, actIdx) => (
                <label
                  key={actIdx}
                  className="flex items-start gap-2 cursor-pointer hover:bg-white/50 p-1 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={action.done}
                    onChange={() => handleToggle(subIdx, actIdx)}
                    className="mt-1 w-4 h-4 accent-gray-700"
                    disabled={subGoal.locked}
                  />
                  <span
                    className={`text-sm ${
                      action.done
                        ? 'line-through text-gray-500'
                        : 'text-gray-800 font-medium'
                    }`}
                  >
                    {action.text}
                  </span>
                </label>
              ))}
            </div>

            {/* Lock 상태 표시 */}
            {subGoal.locked && (
              <div className="mt-3 text-xs text-red-600 font-semibold bg-white/80 px-2 py-1 rounded">
                🔒 캘린더에 등록됨 (수정 불가)
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


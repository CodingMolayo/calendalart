'use client';

import { format } from 'date-fns';
import { Goal } from '../../types';

interface Props {
  subGoal: Goal['subGoals'][0];
  subGoalIndex: number;
  goal: Goal;
  onClose: () => void;
  onToggleAction: (subGoalIndex: number, actionIndex: number) => void;
  startDate?: Date;
  endDate?: Date;
  onDelete?: () => void;
}

export default function ChecklistModal({ 
  subGoal,
  subGoalIndex,
  goal,
  onClose,
  onToggleAction,
  startDate,
  endDate,
  onDelete
}: Props) {
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="rounded-xl p-5 mb-4 shadow-md"
          style={{ 
            background: `linear-gradient(135deg, ${subGoal.color}, ${subGoal.color}dd)` 
          }}
        >
          <h3 className="text-xl font-bold text-white">{subGoal.title}</h3>
          {startDate && endDate && (
            <p className="text-sm text-white/90 mt-1">
              📅 {format(startDate, 'M월 d일')} - {format(endDate, 'M월 d일')}
            </p>
          )}
        </div>

        <div className="space-y-2 mb-6">
          <h4 className="font-semibold text-gray-700 mb-3">✓ 실행 체크리스트</h4>
          {subGoal.actions.map((action, actIdx) => (
            <label 
              key={actIdx} 
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all group border border-transparent hover:border-gray-200"
            >
              <input
                type="checkbox"
                checked={action.done}
                onChange={() => onToggleAction(subGoalIndex, actIdx)}
                className="mt-1 w-5 h-5 rounded accent-blue-600 cursor-pointer"
              />
              <span className={`flex-1 text-sm ${action.done ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                {action.text}
              </span>
            </label>
          ))}
        </div>

        <div className="mb-6 bg-gray-50 rounded-xl p-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">진행률</span>
            <span className="font-bold text-gray-800">
              {subGoal.actions.filter(a => a.done).length}/{subGoal.actions.length}
            </span>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full transition-all duration-500 rounded-full"
              style={{ 
                width: `${(subGoal.actions.filter(a => a.done).length / subGoal.actions.length) * 100}%`,
                background: `linear-gradient(90deg, ${subGoal.color}, ${subGoal.color}cc)`
              }}
            />
          </div>
        </div>

        <div className="flex gap-3">
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              🗑️ 삭제
            </button>
          )}
          <button
            onClick={onClose}
            className={`${onDelete ? 'flex-1' : 'w-full'} bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-all`}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
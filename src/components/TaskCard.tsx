import React from 'react';
import type { Task } from '../types';

export default function TaskCard({ task }: { task: Task }) {
  const initialDone = task.status === 'done' || Number(task.archived) === 1;

  const [done, setDone] = React.useState<boolean>(initialDone);

  const toggleDone = () => {
    setDone((d) => !d);
  };

  return (
    <div className="bg-white rounded-md p-2 mb-2 shadow-sm flex items-start gap-2">
      <button
        onClick={toggleDone}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 transition-colors duration-150
          ${done ? 'bg-green-500 border-green-500' : 'border-slate-400'}`}
        aria-label="Toggle done"
      >
        {done && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
               fill="none" stroke="white" strokeWidth="3" className="w-3 h-3 m-auto">
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1">
        <div className={`font-medium text-slate-800 ${done ? 'line-through text-slate-500' : ''}`}>
          {task.title}
        </div>
        {task.description && (
          <div className="text-sm text-slate-600">{task.description}</div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import type { ColumnType } from '../types';
import TaskCard from './TaskCard';

export default function Column({
  column,
  onAddTask,
}: {
  column: ColumnType;
  onAddTask: (colId: string, title: string) => void;
}) {
  const [newTask, setNewTask] = React.useState('');
  const tasks = column.tasks ?? [];

  const handleAdd = () => {
    const t = newTask.trim();
    if (!t) return;
    onAddTask(column.id, t);
    setNewTask('');
  };

  return (
    <div className="w-80 bg-white/30 rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{column.title}</h3>
        <div className="text-sm text-slate-700">{tasks.length}</div>
      </div>

      <div>
        {tasks.map((t) => (
          <div key={t.id} className="mb-2">
            <TaskCard task={t} />
          </div>
        ))}
      </div>

      <div className="mt-2">
        <input
          className="w-full p-2 rounded border border-white/30 bg-white/90"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder="Add task..."
        />
        <button
          onClick={handleAdd}
          className="mt-2 w-full py-1 bg-blue-600 text-white rounded disabled:opacity-50"
          disabled={!newTask.trim()}
        >
          Add
        </button>
      </div>
    </div>
  );
}

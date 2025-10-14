import type { Board } from '../types';
import { useNavigate } from 'react-router-dom';

export default function BoardCard({ board }: { board: Board }) {
  const navigate = useNavigate();

  return (
    <div
      className="w-64 bg-white/90 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/boards/${board.id}`)}
    >
      <div className="font-semibold text-slate-800">
        {board.title || '(ไม่มีชื่อบอร์ด)'}
      </div>
      <div className="text-sm text-slate-600 mt-2">
        {board.columns?.length ?? 0} columns
      </div>
    </div>
  );
}

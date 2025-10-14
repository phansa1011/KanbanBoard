import React from 'react';
import Header from '../components/Header';
import BoardCard from '../components/BoardCard';
import type { Board, ColumnType } from '../types';
import { useApi, useAuth } from '../App';

const STORAGE_KEY = 'kanban_boards_v1';

function loadBoards(): Board[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Board[];
  } catch {
    return [];
  }
}
function saveBoards(boards: Board[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
}

// แปลงข้อมูลจาก server ให้เข้ากับ type ฝั่ง UI
function adaptServerBoard(sb: any): Board {
  return {
    id: String(sb.id),
    title: sb.title ?? '',
    columns: [] as ColumnType[],
  };
}

export default function BoardList() {
  const api = useApi();
  const { user } = useAuth();
  const [boards, setBoards] = React.useState<Board[]>(() => loadBoards());
  const [title, setTitle] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.id) {            // ยังไม่รู้ว่าใคร → ว่างไว้ก่อน
        setBoards([]);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        const serverBoards = await api.boards.list(); // ดึงทั้งหมด
        const mine = serverBoards
          .filter((b: any) => Number(b.owner_id) === Number(user.id)); // ✅ กรองเฉพาะของเรา

        if (mounted) setBoards(mine.map(adaptServerBoard));
      } catch (err: any) {
        setError(err?.message || 'โหลดบอร์ดไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [api.boards, user?.id]); // ✅ ผูกกับ user.id ด้วย


  React.useEffect(() => {
    saveBoards(boards);
  }, [boards]);

  const handleCreate = async () => {
    const t = title.trim();
    if (!t) return;
    setError(null);

    try {
      if (!user?.id) throw new Error('ยังไม่ได้ล็อกอิน');
      const created = await api.boards.create({
        title: t,
        description: null as any,
        owner_id: user.id,
        privacy: 'private',
      });
      setBoards((prev) => [adaptServerBoard(created), ...prev]);
      setTitle('');
    } catch (err: any) {
      setError(err?.message || 'สร้างบอร์ดไม่สำเร็จ');
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="p-6">
        <section className="mb-6">
          <h2 className="text-white text-2xl font-bold mb-3">พื้นที่ทำงาน Trello</h2>
          <div className="flex gap-3 items-center">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ตั้งชื่อบอร์ดใหม่"
              className="p-2 rounded w-64"
            />
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-white/90 rounded"
              disabled={loading}
            >
              {loading ? 'กำลังสร้าง...' : 'สร้างบอร์ดใหม่'}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </section>

        <section>
          <h3 className="text-white/90 mb-3">บอร์ดของฉัน</h3>
          {loading ? (
            <div className="text-white/80">กำลังโหลดบอร์ด…</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {boards.map((b) => (
                <BoardCard board={b} key={b.id} />
              ))}
              {boards.length === 0 && (
                <div className="text-white/80">ยังไม่มีบอร์ด ลองสร้างบอร์ดใหม่</div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

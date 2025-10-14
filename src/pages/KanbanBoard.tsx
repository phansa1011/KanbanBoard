import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Column from '../components/Column';
import type { Board, ColumnType, Task } from '../types';
import { useApi, useAuth } from '../App';

function adaptTask(t: any): Task {
    return {
        id: String(t.id),
        title: t.title ?? '',
        description: t.description ?? null,         
        status: t.status ?? 'active',
        archived: typeof t.archived === 'number' ? (t.archived as 0 | 1) : (t.archived ? 1 : 0),
    };
}
function adaptColumn(c: any): ColumnType {
    return { id: String(c.id), title: c.title ?? '', tasks: [] };
}
function adaptBoard(b: any): Board {
    return { id: String(b.id), title: b.title ?? '', columns: [] };
}

export default function KanbanBoard() {
    const { boardId } = useParams<{ boardId: string }>();
    const navigate = useNavigate();
    const api = useApi();
    const { user } = useAuth();

    const [board, setBoard] = React.useState<Board | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [newColTitle, setNewColTitle] = React.useState('');

    // โหลดบอร์ด + คอลัมน์ + การ์ด จาก server
    React.useEffect(() => {
        let mounted = true;
        (async () => {
            if (!boardId) return;
            try {
                setLoading(true);
                setError(null);

                const bid = Number(boardId);
                const [sb, scols, stasks] = await Promise.all([
                    api.boards.get(bid),
                    api.columns.listByBoard(bid),
                    api.tasks.listByBoard(bid),
                ]);

                const b = adaptBoard(sb);
                const cols = scols.map(adaptColumn);
                const tasksByCol = new Map<string, Task[]>();
                for (const t of stasks) {
                    const colId = String(t.column_id);
                    if (!tasksByCol.has(colId)) tasksByCol.set(colId, []);
                    tasksByCol.get(colId)!.push(adaptTask(t));
                }
                const colsWithTasks: ColumnType[] = cols.map((c) => ({
                    ...c,
                    tasks: tasksByCol.get(c.id) ?? [],
                }));

                if (!mounted) return;
                setBoard({ ...b, columns: colsWithTasks });
            } catch (err: any) {
                if (!mounted) return;
                setError(err?.message || 'โหลดบอร์ดไม่สำเร็จ');
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [api.boards, api.columns, api.tasks, boardId]);

    // เพิ่มการ์ดใหม่ลงคอลัมน์
    const addTask = async (colId: string, title: string) => {
        if (!board) return;

        // กันกรณีไม่มีคอลัมน์
        const colExists = board.columns.some(c => c.id === colId);
        if (!colExists) {
            setError('ไม่พบคอลัมน์นี้');
            return;
        }

        if (!user?.id) {
            setError('ยังไม่ได้ล็อกอิน');
            return;
        }

        try {
            const payload = {
                board_id: Number(board.id),
                column_id: Number(colId),
                title,
                description: null as any,
                position: 0,
                created_by: Number(user.id),  
                status: 'active',
                archived: 0,
            };

            const created = await api.tasks.create(payload);
            const newTask: Task = adaptTask(created);

            setBoard(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    columns: prev.columns.map(c =>
                        c.id === colId ? { ...c, tasks: [newTask, ...c.tasks] } : c
                    ),
                };
            });
        } catch (err: any) {
            console.error('POST /api/tasks error:', err);
            setError(err?.message || 'เพิ่มการ์ดไม่สำเร็จ');
        }
    };

    // เพิ่มคอลัมน์ใหม่
    const addColumn = async (title: string) => {
        if (!board) return;
        try {
            const created = await api.columns.create({
                board_id: Number(board.id),
                title,
                position: board.columns.length,
            });
            const newCol: ColumnType = { ...adaptColumn(created), tasks: [] };
            setBoard((prev) => (prev ? { ...prev, columns: [...prev.columns, newCol] } : prev));
        } catch (err: any) {
            setError(err?.message || 'เพิ่มคอลัมน์ไม่สำเร็จ');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen">
                <Header />
                <div className="p-8 text-white">กำลังโหลดบอร์ด…</div>
            </div>
        );
    }

    if (error || !board) {
        return (
            <div className="min-h-screen">
                <Header />
                <div className="p-8 text-white">
                    {error || 'ไม่พบบอร์ด'} —{' '}
                    <button className="underline" onClick={() => navigate('/boards')}>
                        กลับ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Header title={board.title} />
            <main className="p-6">
                <div className="flex gap-4 items-start">
                    {board.columns.map((col) => (
                        <Column
                            key={col.id}
                            column={col}
                            onAddTask={addTask}
                        />
                    ))}

                    <div className="w-80">
                        <div className="bg-white/20 rounded p-3">
                            <h4 className="font-semibold text-white mb-2">เพิ่มคอลัมน์</h4>
                            <input
                                className="w-full p-2 rounded"
                                value={newColTitle}
                                onChange={(e) => setNewColTitle(e.target.value)}
                                placeholder="ชื่อคอลัมน์"
                            />
                            <button
                                onClick={() => {
                                    if (!newColTitle.trim()) return;
                                    addColumn(newColTitle.trim());
                                    setNewColTitle('');
                                }}
                                className="mt-2 w-full py-1 bg-white/90 rounded"
                            >
                                Add column
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-white/80">
                    <p>
                        * หน้านี้ใช้ข้อมูลจากฐานข้อมูลจริง (ผ่าน API)
                    </p>
                </div>
            </main>
        </div>
    );
}

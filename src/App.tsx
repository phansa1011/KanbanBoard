// App.tsx
import React, { createContext, useCallback, useContext, useMemo, useState, type ReactElement } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import BoardList from './pages/BoardList';
import KanbanBoard from './pages/KanbanBoard';
import './index.css';

/** -------------------- Config -------------------- */
const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || 'http://localhost:5000';

/** -------------------- API helper -------------------- */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function apiFetch<T>(
  path: string,
  opts: { method?: HttpMethod; body?: any; token?: string } = {}
): Promise<T> {
  const { method = 'GET', body, token } = opts;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.error || data?.message || msg;
    } catch { }
    throw new Error(msg);
  }

  try {
    return (await res.json()) as T;
  } catch {
    return undefined as unknown as T;
  }
}

/** -------------------- Auth -------------------- */
type User = { id: number; email: string; name?: string | null };

type AuthState = {
  token: string | null;
  user: User | null;
  isAuth: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { email: string; password: string; name?: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('auth_user');
    return raw ? (JSON.parse(raw) as User) : null;
  });
  const isAuth = !!token;

  const persist = useCallback((tk: string | null, u: User | null) => {
    setToken(tk);
    setUser(u);
    if (tk) localStorage.setItem('auth_token', tk);
    else localStorage.removeItem('auth_token');
    if (u) localStorage.setItem('auth_user', JSON.stringify(u));
    else localStorage.removeItem('auth_user');
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // ฝั่ง server ควรส่ง { token, user }
    const data = await apiFetch<{ token: string; user: User }>('/api/login', {
      method: 'POST',
      body: { email, password },
    });
    if (!data?.token) throw new Error('ไม่มี token จากเซิร์ฟเวอร์');
    persist(data.token, data.user);
  }, [persist]);

  const register = useCallback(
    async (payload: { email: string; password: string; name?: string }) => {
      // สมัครผู้ใช้ใหม่ (ถ้าเซิร์ฟเวอร์ส่ง token มาก็ไม่ต้องใช้)
      await apiFetch('/api/users', { method: 'POST', body: payload });
      // ไม่ auto-login แล้ว
    },
    []
  );

  const logout = useCallback(() => {
    persist(null, null);
  }, [persist]);

  const value: AuthState = useMemo(
    () => ({ token, user, isAuth, login, register, logout }),
    [token, user, isAuth, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** -------------------- API (CRUD หลัก) -------------------- */
type Board = { id: number; title: string; description?: string | null; owner_id: number; privacy: 'private' | 'public' };
type Column = { id: number; board_id: number; title: string; position: number };
type Task = { id: number; board_id: number; column_id: number; title: string; description?: string | null; position: number; created_by?: number | null; status: string; archived: number };

type Api = {
  boards: {
    list: (q?: { owner_id?: number }) => Promise<Board[]>;
    get: (id: number) => Promise<Board>;
    create: (payload: Pick<Board, 'title' | 'description' | 'owner_id' | 'privacy'>) => Promise<Board>;
    update: (id: number, payload: Partial<Board>) => Promise<Board>;
    remove: (id: number) => Promise<void>;
  };
  columns: {
    listByBoard: (boardId: number) => Promise<Column[]>;
    create: (payload: Pick<Column, 'board_id' | 'title' | 'position'>) => Promise<Column>;
    update: (id: number, payload: Partial<Column>) => Promise<Column>;
    remove: (id: number) => Promise<void>;
  };
  tasks: {
    listByBoard: (boardId: number) => Promise<Task[]>;
    listByColumn: (columnId: number) => Promise<Task[]>;
    create: (payload: Pick<Task, 'board_id' | 'column_id' | 'title' | 'description' | 'position' | 'created_by' | 'status' | 'archived'>) => Promise<Task>;
    update: (id: number, payload: Partial<Task>) => Promise<Task>;
    remove: (id: number) => Promise<void>;
  };
};

const ApiContext = createContext<Api | null>(null);

export function useApi() {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error('useApi must be used within <ApiProvider>');
  return ctx;
}

function ApiProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();

  const api = useMemo<Api>(() => {
    const withToken = <T,>(path: string, opts?: any) => apiFetch<T>(path, { ...opts, token });

    return {
      boards: {
        list: (q) => {
          const qs = q?.owner_id ? `?owner_id=${q.owner_id}` : '';
          return withToken<Board[]>(`/api/boards${qs}`);
        },
        get: (id) => withToken<Board>(`/api/boards/${id}`),
        create: (payload) => withToken<Board>('/api/boards', { method: 'POST', body: payload }),
        update: (id, payload) => withToken<Board>(`/api/boards/${id}`, { method: 'PUT', body: payload }),
        remove: async (id) => { await withToken(`/api/boards/${id}`, { method: 'DELETE' }); },
      },
      columns: {
        listByBoard: async (boardId) => {
          const all = await withToken<Column[]>(`/api/columns`);
          return all.filter(c => c.board_id === boardId);
        },
        create: (payload) => withToken<Column>('/api/columns', { method: 'POST', body: payload }),
        update: (id, payload) => withToken<Column>(`/api/columns/${id}`, { method: 'PUT', body: payload }),
        remove: async (id) => { await withToken(`/api/columns/${id}`, { method: 'DELETE' }); },
      },
      tasks: {
        listByBoard: async (boardId) => {
          const all = await withToken<Task[]>(`/api/tasks`);
          return all.filter(t => t.board_id === boardId);
        },
        listByColumn: async (columnId) => {
          const all = await withToken<Task[]>(`/api/tasks`);
          return all.filter(t => t.column_id === columnId);
        },
        create: (payload) => withToken<Task>('/api/tasks', { method: 'POST', body: payload }),
        update: (id, payload) => withToken<Task>(`/api/tasks/${id}`, { method: 'PUT', body: payload }),
        remove: async (id) => { await withToken(`/api/tasks/${id}`, { method: 'DELETE' }); },
      },
    };
  }, [token]);

  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

/** -------------------- Guards -------------------- */
function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuth } = useAuth();
  if (!isAuth) return <Navigate to="/login" replace />;
  return children;
}

/** -------------------- App -------------------- */
export default function App() {
  return (
    <AuthProvider>
      <ApiProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/boards" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/boards"
            element={
              <RequireAuth>
                <BoardList />
              </RequireAuth>
            }
          />
          <Route
            path="/boards/:boardId"
            element={
              <RequireAuth>
                <KanbanBoard />
              </RequireAuth>
            }
          />
          <Route path="*" element={<div className="p-8">Not Found</div>} />
        </Routes>
      </ApiProvider>
    </AuthProvider>
  );
}

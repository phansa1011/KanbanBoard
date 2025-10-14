import { useNavigate } from 'react-router-dom';

export default function Header({ title }: { title?: string }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('auth_user') || 'null');

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between p-4 bg-gray-500 backdrop-blur rounded-b-lg">
      <div className="flex items-center gap-4">
        <button
          className="text-white font-bold hover:underline"
          onClick={() => navigate('/boards')}
        >
          Kanban
        </button>
        {title && <h1 className="text-white/90 text-lg">{title}</h1>}
      </div>

      <div className="flex items-center gap-3 text-white">
        {user?.name && <span className="text-sm opacity-90">{user.name}</span>}
        <button
          onClick={logout}
          className="px-3 py-1 bg-white/30 rounded-md hover:bg-white/40 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
}


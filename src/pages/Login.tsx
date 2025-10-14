import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App'; // ✅ ดึง hook ที่สร้างไว้ใน App.tsx

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ ใช้ login จาก context
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('กรุณากรอก email/password');
      return;
    }

    try {
      setLoading(true);
      await login(email, password); // ✅ call API จริง
      navigate('/boards');
    } catch (err: any) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 rounded-lg bg-white shadow">
        <h2 className="text-2xl font-bold mb-4">เข้าสู่ระบบ</h2>

        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full p-2 border rounded"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full p-2 border rounded"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-sm text-center">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </div>
  );
}

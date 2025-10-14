import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

export default function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email || !password) {
            setError('กรุณากรอกข้อมูลให้ครบ');
            return;
        }

        try {
            setLoading(true);
            await register({ email, password, name });
            navigate('/login');
        } catch (err: any) {
            setError(err?.message || 'สมัครสมาชิกไม่สำเร็จ');
        } finally {
            setLoading(false);
        }

    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md p-8 rounded-lg bg-white shadow">
                <h2 className="text-2xl font-bold mb-4">สมัครสมาชิก</h2>

                <form onSubmit={submit} className="space-y-3">
                    <input
                        className="w-full p-2 border rounded"
                        placeholder="ชื่อ นามสกุล"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <input
                        className="w-full p-2 border rounded"
                        placeholder="อีเมล"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        autoComplete="email"
                    />
                    <input
                        className="w-full p-2 border rounded"
                        type="password"
                        placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        minLength={6}
                    />

                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    <button
                        className="w-full py-2 bg-green-600 text-white rounded disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'กำลังสร้างบัญชี...' : 'Create account'}
                    </button>
                </form>

                <p className="mt-4 text-sm text-center">
                    มีบัญชีแล้ว?{' '}
                    <Link to="/login" className="text-blue-600 hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}

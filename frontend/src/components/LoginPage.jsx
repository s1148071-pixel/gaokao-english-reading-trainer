import { useState } from 'react';
import { useStore } from '../store';
import { api, setToken } from '../api';

export default function LoginPage() {
  const { dispatch } = useStore();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fn = mode === 'login' ? api.login : api.register;
    const body = mode === 'login' ? { email, password } : { name, email, password };
    const { data, error: err } = await fn(body);
    setLoading(false);
    if (err) { setError(err); return; }
    setToken(data.token);
    dispatch({ type: 'SET_AUTH', token: data.token, user: data.user });
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="glass-panel p-8 rounded-2xl w-96 max-w-[90vw]">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center">高考英语阅读方法论</h1>

        {/* Mode tabs */}
        <div className="flex mb-6 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'login' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => switchMode('register')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'register' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            注册
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="姓名"
              required
              className="w-full mb-3 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            type="email"
            required
            className="w-full mb-3 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            type="password"
            required
            minLength={6}
            className="w-full mb-4 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 transition-all"
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <p className="text-xs text-slate-400 mt-4 text-center">
          后端未启动时，自动使用离线模式
        </p>
      </div>
    </div>
  );
}

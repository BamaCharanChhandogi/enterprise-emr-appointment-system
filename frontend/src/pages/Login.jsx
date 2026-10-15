import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('admin@emr.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (role) => {
    switch (role) {
      case 'ADMIN':
        setEmail('admin@emr.com');
        setPassword('password123');
        break;
      case 'RECEPTIONIST':
        setEmail('reception@emr.com');
        setPassword('password123');
        break;
      case 'DOCTOR':
        setEmail('house@emr.com');
        setPassword('password123');
        break;
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-[#f8fafc]">
      <div className="max-w-[420px] w-full bg-white border border-slate-200/90 rounded-2xl p-8 shadow-sm">
        
        {/* Header */}
        <div className="mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#2555ff] text-white flex items-center justify-center font-bold text-lg mb-3.5 shadow-xs">
            +
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Staff Sign In</h1>
          <p className="text-[13px] text-slate-500 mt-1">Access clinical records and scheduling system</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-[12px] rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-slate-800 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@hospital.org"
              className="elite-input"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-800 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="elite-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#2555ff] hover:bg-[#1b44db] text-white text-[13px] font-semibold rounded-lg transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Fast Switch */}
        <div className="mt-8 pt-5 border-t border-slate-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-2.5">
            Select Role Account:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSelectRole('ADMIN')}
              className="py-2 px-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-800 transition shadow-2xs cursor-pointer"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => handleSelectRole('RECEPTIONIST')}
              className="py-2 px-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-800 transition shadow-2xs cursor-pointer"
            >
              Receptionist
            </button>
            <button
              type="button"
              onClick={() => handleSelectRole('DOCTOR')}
              className="py-2 px-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-800 transition shadow-2xs cursor-pointer"
            >
              Dr. House
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('admin@emr.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
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
      default:
        break;
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-[#f8fafc]">
      <div className="max-w-[420px] w-full bg-white border border-slate-200/90 rounded-[28px] p-8 shadow-xs">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Staff Sign In</h1>
          <p className="text-[13px] text-slate-500 mt-1">Access clinical records and scheduling system</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-[12px] rounded-2xl">
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
              placeholder="doctor@emr.com"
              className="elite-input rounded-xl text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-800 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="elite-input rounded-xl text-xs font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1e40af] hover:bg-[#1e3a8a] text-white text-[13px] font-semibold rounded-full transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Fast Role Sign In */}
        <div className="mt-8 pt-5 border-t border-slate-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
            Select Staff Role:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSelectRole('ADMIN')}
              className="py-2 px-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-800 transition shadow-2xs cursor-pointer"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => handleSelectRole('RECEPTIONIST')}
              className="py-2 px-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-800 transition shadow-2xs cursor-pointer"
            >
              Receptionist
            </button>
            <button
              type="button"
              onClick={() => handleSelectRole('DOCTOR')}
              className="py-2 px-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-800 transition shadow-2xs cursor-pointer"
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

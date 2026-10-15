import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

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
      setError(err.response?.data?.message || err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role) => {
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
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="max-w-[400px] w-full elite-card p-7">
        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-[#2555ff] rounded-[5px] flex items-center justify-center mx-auto mb-3 text-white">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <h1 className="text-lg font-bold text-[#0f172a]">Enterprise EMR Portal</h1>
          <p className="text-[12px] text-[#64748b] mt-0.5">Sign in with clinical or administrative credentials</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-[12px] rounded-[5px] flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748b] mb-1">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@hospital.org"
                className="w-full pl-9 pr-3 elite-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748b] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 elite-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-[#2555ff] hover:bg-[#1b44db] text-white font-medium text-[13px] rounded-[5px] transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In to EMR</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Quick Logins */}
        <div className="mt-6 pt-5 border-t border-[#e2e8f0]">
          <p className="text-[10px] font-semibold text-[#64748b] text-center mb-2.5 uppercase tracking-wider">
            Quick One-Click Demo Access
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setDemoCredentials('ADMIN')}
              className="py-1 px-2 bg-[#2555ff]/5 hover:bg-[#2555ff]/10 text-[#2555ff] border border-[#2555ff]/20 rounded-[5px] text-[11px] font-semibold transition"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('RECEPTIONIST')}
              className="py-1 px-2 bg-[#0f172a]/5 hover:bg-[#0f172a]/10 text-[#0f172a] border border-[#0f172a]/15 rounded-[5px] text-[11px] font-semibold transition"
            >
              Receptionist
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('DOCTOR')}
              className="py-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-[5px] text-[11px] font-semibold transition"
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

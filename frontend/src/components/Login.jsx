import { useState } from 'react';
import api from '../api';
import { UserRound, Stethoscope, ShieldCheck, Building2 } from 'lucide-react';

const Login = ({ onSuccess, onRequireOtp, onForgotPassword, roleContext = null, title = null, subtitle = null }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        role: roleContext,
      });

      const { access_token, user, redirect_url, onboarding_required } = response.data;

      setEmail('');
      setPassword('');
      setError('');

      if (onSuccess) onSuccess(access_token, user, redirect_url, onboarding_required);
    } catch (err) {
      if (err.response && err.response.data) {
        if (err.response.data.requires_otp) {
          if (onRequireOtp) {
            onRequireOtp(err.response.data.email || email, 'login');
          }
          return;
        }
        setError(err.response.data.message || err.response.data.error || 'Invalid credentials.');
      } else if (err.message) {
        setError(`Connection issue: ${err.message}`);
      } else {
        setError('Unable to sign in. Please verify the backend container is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (r) => {
    switch (r) {
      case 'doctor':
        return { label: 'Doctor Portal', icon: <Stethoscope className="h-3.5 w-3.5" />, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'admin':
        return { label: 'Admin Console', icon: <ShieldCheck className="h-3.5 w-3.5" />, color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'reception':
        return { label: 'Receptionist Desk', icon: <Building2 className="h-3.5 w-3.5" />, color: 'bg-sky-50 text-sky-800 border-sky-200' };
      case 'patient':
        return { label: 'Patient Portal', icon: <UserRound className="h-3.5 w-3.5" />, color: 'bg-teal-50 text-teal-800 border-teal-200' };
      default:
        return null;
    }
  };

  const badge = getRoleBadge(roleContext);

  return (
    <div className="max-w-md mx-auto p-6 rounded-3xl bg-white shadow-xl shadow-slate-200 border border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-slate-900">{title || 'Sign In to MedAlign'}</h2>
        {badge && (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
            {badge.icon} {badge.label}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 mb-6">
        {subtitle || 'Enter your email or phone to access your verified healthcare portal.'}
      </p>
      
      {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Email or Phone Number</span>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your.email@example.com or +1 (555) ..."
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</span>
            {onForgotPassword && (
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            )}
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-gradient-to-r from-sky-700 to-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-sky-600 hover:to-indigo-500 shadow-md shadow-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default Login;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { UserRound, Stethoscope, ShieldCheck, Building2 } from 'lucide-react';

const Register = ({ onSuccess, onRequireOtp, initialRole = 'patient', lockRole = false }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [role, setRole] = useState(initialRole || 'patient');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    }
  }, [initialRole]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (!termsAccepted) {
      setError('Please accept the Terms & Conditions to continue.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        phone,
        password,
        password_confirmation: passwordConfirmation,
        terms_accepted: termsAccepted,
        role,
      });

      if (response.data.requires_otp) {
        if (onRequireOtp) {
          onRequireOtp(email, 'registration');
        }
      } else if (response.data.access_token) {
        if (onSuccess) onSuccess(response.data.access_token, response.data.user, response.data.redirect_url);
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Unable to create account. Please check your inputs.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (r) => {
    switch (r) {
      case 'doctor':
        return { label: 'Clinician / Doctor', icon: <Stethoscope className="h-3.5 w-3.5" />, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'admin':
        return { label: 'Facility Administrator', icon: <ShieldCheck className="h-3.5 w-3.5" />, color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'reception':
        return { label: 'Receptionist Desk', icon: <Building2 className="h-3.5 w-3.5" />, color: 'bg-sky-50 text-sky-800 border-sky-200' };
      default:
        return { label: 'Patient Portal', icon: <UserRound className="h-3.5 w-3.5" />, color: 'bg-teal-50 text-teal-800 border-teal-200' };
    }
  };

  const badge = getRoleBadge(role);

  return (
    <div className="max-w-md mx-auto p-6 rounded-3xl bg-white shadow-xl shadow-slate-200 border border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
          {badge.icon} {badge.label}
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-6">
        Registering as <strong>{badge.label}</strong>. An OTP verification code will be sent to your email.
      </p>
      
      {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Full Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder={role === 'reception' ? 'e.g. MedAlign Health Centre' : role === 'doctor' ? 'e.g. Dr. Sarah Ahmed' : 'e.g. Amina Yusuf'}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Address</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your.email@example.com"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Phone Number</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 010-0000"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="••••••••"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Confirm Password</span>
          <input
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
            minLength={6}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <label className="flex items-start gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5" />
          <span>
            I accept the{' '}
            <Link to="/terms" target="_blank" rel="noreferrer" className="font-bold text-sky-700 underline hover:text-sky-900">
              Terms &amp; Conditions
            </Link>{' '}
            and confirm these details are accurate.
          </span>
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 rounded-full bg-gradient-to-r from-sky-700 to-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-sky-600 hover:to-indigo-500 shadow-md shadow-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {isLoading ? 'Creating Account & Dispatching OTP...' : 'Register & Get OTP'}
        </button>
      </form>
    </div>
  );
};

export default Register;

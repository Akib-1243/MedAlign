import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import api from '../api';
import MedAlignBrand from './MedAlignBrand';
import { Stethoscope, UserRound, ShieldCheck, Building2 } from 'lucide-react';

const Auth = ({ onSuccess, onBack, defaultRole = null, lockRole = false }) => {
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get('role');
  const activeRole = defaultRole || roleFromUrl || 'patient';

  const [mode, setMode] = useState('login'); // login | register | otp | forgot-password
  const [otpEmail, setOtpEmail] = useState('');
  const [otpType, setOtpType] = useState('registration');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequireOtp = (email, type) => {
    setOtpEmail(email);
    setOtpType(type);
    setMode('otp');
    setError('');
    setMessage(`A 6-digit verification code has been dispatched to ${email}. Please check your inbox.`);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', {
        email: otpEmail,
        otp_code: otpCode,
        type: otpType,
        role: activeRole,
      });

      const { access_token, user, redirect_url } = response.data;
      if (onSuccess) onSuccess(access_token, user, redirect_url);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Invalid or expired OTP code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setMessage('');
    try {
      await api.post('/auth/send-otp', {
        email: otpEmail,
        type: otpType,
      });
      setMessage(`A fresh OTP code has been resent to ${otpEmail}.`);
    } catch (err) {
      setError('Unable to resend OTP code.');
    }
  };

  const getPortalInfo = (r) => {
    switch (r) {
      case 'doctor':
        return {
          title: 'Clinician / Doctor Portal',
          subtitle: 'Secure access for verified medical practitioners & consultation desks.',
          themeColor: 'from-emerald-600 to-teal-600',
          badgeIcon: <Stethoscope className="h-4 w-4" />,
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'admin':
        return {
          title: 'Facility Administration',
          subtitle: 'Secure console for clinic directors, counters, and capacity managers.',
          themeColor: 'from-indigo-600 to-purple-600',
          badgeIcon: <ShieldCheck className="h-4 w-4" />,
          badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        };
      case 'reception':
        return {
          title: 'Reception Desk',
          subtitle: 'Check-in counter operations and live patient arrival management.',
          themeColor: 'from-sky-600 to-indigo-600',
          badgeIcon: <Building2 className="h-4 w-4" />,
          badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
        };
      default:
        return {
          title: 'Patient Healthcare Portal',
          subtitle: 'Track your live queue token, alert preferences, and signed prescription vault.',
          themeColor: 'from-sky-700 to-indigo-600',
          badgeIcon: <UserRound className="h-4 w-4" />,
          badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
        };
    }
  };

  const portal = getPortalInfo(activeRole);

  if (mode === 'forgot-password') {
    return (
      <ForgotPassword
        onBack={() => setMode('login')}
        onSuccessLogin={() => setMode('login')}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-slate-100 to-white">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${portal.badgeColor}`}>
                {portal.badgeIcon} {portal.title}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {mode === 'otp' ? 'Email OTP Verification' : mode === 'register' ? 'Register Account' : 'Sign In'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">{portal.subtitle}</p>
          </div>
          <div>
            {onBack && <MedAlignBrand onClick={onBack} label="Back home" />}
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-8">
          {mode !== 'otp' && activeRole !== 'doctor' && (
            <div className="mb-6 flex gap-3 border-b border-slate-100 pb-4">
              <button
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  mode === 'login'
                    ? `bg-gradient-to-r ${portal.themeColor} text-white shadow-md`
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                onClick={() => setMode('login')}
              >
                Sign In
              </button>
              <button
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  mode === 'register'
                    ? `bg-gradient-to-r ${portal.themeColor} text-white shadow-md`
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                onClick={() => setMode('register')}
              >
                Register
              </button>
            </div>
          )}

          {activeRole === 'doctor' && mode !== 'otp' && (
            <div className="mb-6 rounded-2xl bg-emerald-50/80 border border-emerald-200 p-3.5 text-xs text-emerald-900 flex items-center gap-2.5">
              <Stethoscope className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>
                <strong>Doctor Portal Access:</strong> Doctor accounts are provisioned exclusively by Clinic Administrators. Please sign in with your assigned credentials.
              </span>
            </div>
          )}

          {mode === 'login' && (
            <Login
              onSuccess={onSuccess}
              onRequireOtp={handleRequireOtp}
              onForgotPassword={() => setMode('forgot-password')}
              roleContext={activeRole}
              title={`Sign In to ${portal.title}`}
              subtitle={portal.subtitle}
            />
          )}

          {mode === 'register' && activeRole !== 'doctor' && (
            <Register
              onSuccess={onSuccess}
              onRequireOtp={handleRequireOtp}
              initialRole={activeRole}
              lockRole={lockRole || Boolean(roleFromUrl)}
            />
          )}

          {mode === 'otp' && (
            <div className="space-y-5 max-w-md mx-auto">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Verify Email with OTP</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter the 6-digit verification code sent to <strong>{otpEmail}</strong>.
                </p>
              </div>

              {message && (
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-800 font-medium">
                  {message}
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">6-Digit OTP Code</span>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="123456"
                    className="mt-1 w-full text-center text-3xl font-extrabold tracking-[10px] rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-blue-900 outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full rounded-full bg-gradient-to-r from-sky-700 to-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-sky-600 hover:to-indigo-500 shadow-md shadow-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? 'Verifying OTP...' : 'Verify OTP & Log In'}
                </button>
              </form>

              <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-4">
                <button
                  onClick={() => setMode('login')}
                  className="text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                >
                  ← Back to Login
                </button>
                <button
                  onClick={handleResendOtp}
                  className="text-blue-700 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  Resend OTP Code
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;

import { useState } from 'react';
import api from '../api';
import { KeyRound, Mail, Lock, CheckCircle2, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import MedAlignBrand from './MedAlignBrand';

export default function ForgotPassword({ onBack, onSuccessLogin }) {
  const [step, setStep] = useState(1); // 1: request email, 2: verify OTP & set password, 3: success
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Step 1: Dispatch OTP code to user's registered email
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (response.data && response.data.success !== false) {
        setMessage(response.data.message || 'Verification OTP code sent to your email.');
        setStep(2);
      } else {
        setError(response.data.message || 'Failed to dispatch OTP. Please verify your email.');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('No account found with this email, or backend service is offline.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP code & reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your input.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otp_code: otpCode,
        new_password: newPassword,
      });

      if (response.data && response.data.success !== false) {
        setMessage(response.data.message || 'Password reset successful!');
        setStep(3);
      } else {
        setError(response.data.message || 'Invalid OTP code or password reset failed.');
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Invalid or expired OTP code.');
      } else {
        setError('Password reset failed. Please check network connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen med-theme-bg flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md med-glass-card p-8 space-y-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <MedAlignBrand onClick={onBack} />
          <span className="med-badge med-badge-indigo">
            <ShieldCheck className="h-3.5 w-3.5" /> Security Reset
          </span>
        </div>

        {/* Step 1: Enter Email for OTP */}
        {step === 1 && (
          <div>
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mb-3">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Forgot Password?</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your account email address. We will send you a 6-digit OTP code to reset your password.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="med-label">Account Email Address</label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@medalign.test or patient@example.com"
                    className="med-input pl-10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="med-btn-primary w-full py-3 text-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Sending OTP...
                  </>
                ) : (
                  'Send Reset OTP'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Enter OTP & New Password */}
        {step === 2 && (
          <div>
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Enter OTP & New Password</h2>
              <p className="text-xs text-slate-500 mt-1">
                A 6-digit OTP code was sent to <strong className="text-slate-800">{email}</strong>.
              </p>
            </div>

            {message && (
              <div className="mb-4 p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-800">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="med-label">6-Digit OTP Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.trim())}
                  placeholder="e.g. 123456"
                  className="med-input text-center tracking-widest font-mono text-lg font-bold"
                />
              </div>

              <div>
                <label className="med-label">New Password</label>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="med-input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="med-label">Confirm New Password</label>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="med-input pl-10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="med-btn-emerald w-full py-3 text-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Updating Password...
                  </>
                ) : (
                  'Reset & Save Password'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-xs font-semibold text-slate-500 hover:text-slate-900 py-1"
              >
                Change Email / Resend Code
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Success Confirmation */}
        {step === 3 && (
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Password Reset Complete!</h2>
            <p className="text-xs text-slate-600">
              Your password has been successfully updated in the MedAlign engine. You can now log into your account.
            </p>
            <button
              onClick={() => {
                if (onSuccessLogin) onSuccessLogin();
                else if (onBack) onBack();
                else window.location.href = '/';
              }}
              className="med-btn-primary w-full py-3 text-sm mt-4"
            >
              Go to Sign In
            </button>
          </div>
        )}

        {/* Bottom Back Button */}
        {onBack && step !== 3 && (
          <div className="pt-4 border-t border-slate-100 text-center">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

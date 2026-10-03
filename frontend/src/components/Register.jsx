import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { UserRound, Stethoscope, ShieldCheck, Building2 } from 'lucide-react';

const Register = ({ onSuccess, onRequireOtp, initialRole = 'patient', lockRole = false }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [age, setAge] = useState('');
  const [registeringForOther, setRegisteringForOther] = useState(false);
  const [relationshipToPatient, setRelationshipToPatient] = useState('');
  const [parentGuardianName, setParentGuardianName] = useState('');
  const [parentGuardianPhone, setParentGuardianPhone] = useState('');
  const [friendParentName, setFriendParentName] = useState('');
  const [friendParentPhone, setFriendParentPhone] = useState('');
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

    if (role === 'patient' && registeringForOther && !relationshipToPatient) {
      setError('Select your relationship to the patient.');
      setIsLoading(false);
      return;
    }

    if (role === 'patient' && Number(age) < 18 && (!parentGuardianName.trim() || !parentGuardianPhone.trim())) {
      setError('A parent or guardian name and phone number are required for patients under 18.');
      setIsLoading(false);
      return;
    }

    if (role === 'patient' && registeringForOther && relationshipToPatient === 'friend' && (!friendParentName.trim() || !friendParentPhone.trim())) {
      setError("A friend's parent name and phone number are required when registering for a friend.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        name: role === 'patient' ? `${firstName.trim()} ${lastName.trim()}` : name,
        first_name: role === 'patient' ? firstName.trim() : undefined,
        last_name: role === 'patient' ? lastName.trim() : undefined,
        email,
        phone,
        secondary_phone: role === 'patient' ? secondaryPhone : undefined,
        age: role === 'patient' ? Number(age) : undefined,
        registering_for_other: role === 'patient' ? registeringForOther : undefined,
        relationship_to_patient: role === 'patient' && registeringForOther ? relationshipToPatient : undefined,
        parent_guardian_name: role === 'patient' && Number(age) < 18 ? parentGuardianName.trim() : undefined,
        parent_guardian_phone: role === 'patient' && Number(age) < 18 ? parentGuardianPhone.trim() : undefined,
        friend_parent_name: role === 'patient' && registeringForOther && relationshipToPatient === 'friend' ? friendParentName.trim() : undefined,
        friend_parent_phone: role === 'patient' && registeringForOther && relationshipToPatient === 'friend' ? friendParentPhone.trim() : undefined,
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
        {role === 'patient' ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">First Name *</span>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required maxLength={50} autoComplete="given-name" className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Last Name *</span>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required maxLength={50} autoComplete="family-name" className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100" />
              </label>
            </div>
          </>
        ) : (
          <label className="block">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Full Name</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder={role === 'reception' ? 'e.g. MedAlign Health Centre' : 'e.g. Dr. Sarah Ahmed'} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100" />
          </label>
        )}

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
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Primary Phone Number{role === 'patient' ? ' *' : ''}</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required={role === 'patient'}
            placeholder="+1 (555) 010-0000"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
          />
        </label>

        {role === 'patient' && (
          <>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Secondary Phone Number</span>
              <input type="tel" value={secondaryPhone} onChange={(e) => setSecondaryPhone(e.target.value)} maxLength={20} autoComplete="tel-national" placeholder="Optional" className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100" />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Age *</span>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} required min="0" max="120" step="1" inputMode="numeric" className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100" />
              {age !== '' && <span className="mt-1 block text-xs text-slate-500">{getAgeBand(Number(age))}</span>}
            </label>

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-wider text-slate-700">Who are you registering?</legend>
              <div className="grid grid-cols-2 gap-2">
                <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${!registeringForOther ? 'border-sky-500 bg-sky-50 text-sky-900' : 'border-slate-200 text-slate-700'}`}>
                  <input type="radio" name="registering_for_other" checked={!registeringForOther} onChange={() => setRegisteringForOther(false)} />
                  Myself
                </label>
                <label className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${registeringForOther ? 'border-sky-500 bg-sky-50 text-sky-900' : 'border-slate-200 text-slate-700'}`}>
                  <input type="radio" name="registering_for_other" checked={registeringForOther} onChange={() => setRegisteringForOther(true)} />
                  Someone else
                </label>
              </div>
            </fieldset>

            {registeringForOther && (
              <label className="block">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Your Relationship to the Patient *</span>
                <select value={relationshipToPatient} onChange={(e) => setRelationshipToPatient(e.target.value)} required className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100">
                  <option value="">Choose relationship</option>
                  <option value="mother">Mother</option>
                  <option value="father">Father</option>
                  <option value="guardian">Legal guardian</option>
                  <option value="spouse">Spouse</option>
                  <option value="child">Child</option>
                  <option value="sibling">Sibling</option>
                  <option value="friend">Friend</option>
                </select>
              </label>
            )}

            {registeringForOther && relationshipToPatient === 'friend' && (
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
                <p className="col-span-2 text-xs font-semibold text-sky-900">Provide the friend’s parent or guardian contact for verification.</p>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Friend’s Parent / Guardian Name *</span>
                  <input type="text" value={friendParentName} onChange={(e) => setFriendParentName(e.target.value)} required maxLength={100} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Friend’s Parent / Guardian Phone *</span>
                  <input type="tel" value={friendParentPhone} onChange={(e) => setFriendParentPhone(e.target.value)} required maxLength={20} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                </label>
              </div>
            )}

            {age !== '' && Number(age) < 18 && (
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="col-span-2 text-xs font-semibold text-amber-900">Patients under 18 need a parent or guardian contact.</p>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Parent / Guardian Name *</span>
                  <input type="text" value={parentGuardianName} onChange={(e) => setParentGuardianName(e.target.value)} required maxLength={100} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">Parent / Guardian Phone *</span>
                  <input type="tel" value={parentGuardianPhone} onChange={(e) => setParentGuardianPhone(e.target.value)} required maxLength={20} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
                </label>
              </div>
            )}
          </>
        )}

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

function getAgeBand(age) {
  if (age <= 1) return '0–1 year · Infant / Baby';
  if (age <= 4) return '2–4 years · Toddler / Early childhood';
  if (age <= 9) return '5–9 years · Child';
  if (age <= 12) return '10–12 years · Pre-teen / Early adolescent';
  if (age <= 17) return '13–17 years · Teenager / Adolescent';
  if (age <= 19) return '18–19 years · Young adult / Adolescent';
  if (age <= 24) return '20–24 years · Young adult';
  if (age <= 59) return '25–59 years · Adult';
  return '60+ years · Older adult / Elderly';
}

export default Register;

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import api from "../api";
import Navbar from "../components/Navbar";

const emptyProfile = (user) => ({
  first_name: user?.first_name || "",
  last_name: user?.last_name || "",
  email: user?.email || "",
  phone: user?.phone || "",
  secondary_phone: user?.secondary_phone || "",
  age: user?.age ?? "",
  registering_for_other: Boolean(user?.registering_for_other),
  relationship_to_patient: user?.relationship_to_patient || "",
  parent_guardian_name: user?.parent_guardian_name || "",
  parent_guardian_phone: user?.parent_guardian_phone || "",
  friend_parent_name: user?.friend_parent_name || "",
  friend_parent_phone: user?.friend_parent_phone || "",
  dob: "",
  gender: "",
  marital_status: "",
  address: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  blood_group: "",
  allergies: "",
});

export default function PatientProfilePage({ user, onLogout, onUserUpdated }) {
  const [form, setForm] = useState(() => emptyProfile(user));
  const [emailVerified, setEmailVerified] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const photoUrlRef = useRef("");
  const photoInputRef = useRef(null);

  const setPrivatePhotoUrl = (url) => {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    photoUrlRef.current = url;
    setPhotoUrl(url);
  };

  useEffect(() => () => {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
  }, []);

  const applyProfile = (data) => {
    const account = data?.account || {};
    const patient = data?.patient || {};
    const nameParts = (account.name || patient.name || "").trim().split(/\s+/).filter(Boolean);
    setForm({
      first_name: account.first_name || patient.first_name || nameParts[0] || "",
      last_name: account.last_name || patient.last_name || nameParts.slice(1).join(" "),
      email: account.email || user?.email || "",
      phone: patient.phone || account.phone || "",
      secondary_phone: patient.secondary_phone || account.secondary_phone || "",
      age: patient.age ?? account.age ?? "",
      registering_for_other: Boolean(patient.registering_for_other ?? account.registering_for_other),
      relationship_to_patient: patient.relationship_to_patient || account.relationship_to_patient || "",
      parent_guardian_name: patient.parent_guardian_name || account.parent_guardian_name || "",
      parent_guardian_phone: patient.parent_guardian_phone || account.parent_guardian_phone || "",
      friend_parent_name: patient.friend_parent_name || account.friend_parent_name || "",
      friend_parent_phone: patient.friend_parent_phone || account.friend_parent_phone || "",
      dob: patient.dob || "",
      gender: patient.gender || "",
      marital_status: patient.marital_status || "",
      address: patient.address || "",
      emergency_contact_name: patient.emergency_contact_name || "",
      emergency_contact_phone: patient.emergency_contact_phone || "",
      blood_group: patient.blood_group || "",
      allergies: patient.allergies || "",
    });
    setEmailVerified(Boolean(account.email_verified_at));
    setHasPhoto(Boolean(patient.has_photo));
    if (onUserUpdated && account.email) onUserUpdated({ ...user, ...account });
    return Boolean(patient.has_photo);
  };

  const loadProfile = async () => {
    setError("");
    try {
      const response = await api.get("/patient/profile");
      const shouldLoadPhoto = applyProfile(response.data?.data);
      if (shouldLoadPhoto) {
        const photoResponse = await api.get("/patient/profile/photo", { responseType: "blob" });
        setPrivatePhotoUrl(URL.createObjectURL(photoResponse.data));
      } else {
        setPrivatePhotoUrl("");
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to load your profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Choose an image smaller than 2 MB.");
      event.target.value = "";
      return;
    }
    setError("");
    setPhotoFile(file);
    setPrivatePhotoUrl(URL.createObjectURL(file));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);
    try {
      const response = await api.put("/patient/profile", {
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        secondary_phone: form.secondary_phone || null,
        age: Number(form.age),
        registering_for_other: form.registering_for_other,
        relationship_to_patient: form.registering_for_other ? form.relationship_to_patient : null,
        parent_guardian_name: Number(form.age) < 18 ? form.parent_guardian_name : null,
        parent_guardian_phone: Number(form.age) < 18 ? form.parent_guardian_phone : null,
        friend_parent_name: form.registering_for_other && form.relationship_to_patient === "friend" ? form.friend_parent_name : null,
        friend_parent_phone: form.registering_for_other && form.relationship_to_patient === "friend" ? form.friend_parent_phone : null,
        dob: form.dob || null,
        gender: form.gender || null,
        marital_status: form.marital_status || null,
        address: form.address || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        blood_group: form.blood_group || null,
        allergies: form.allergies || null,
      });

      if (photoFile) {
        const photoData = new FormData();
        photoData.append("photo", photoFile);
        await api.post("/patient/profile/photo", photoData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setPhotoFile(null);
        if (photoInputRef.current) photoInputRef.current.value = "";
      }

      const data = response.data?.data;
      applyProfile(data);
      if (photoFile) {
        const photoResponse = await api.get("/patient/profile/photo", { responseType: "blob" });
        setPrivatePhotoUrl(URL.createObjectURL(photoResponse.data));
        setHasPhoto(true);
      }
      setSuccess("Profile saved.");
    } catch (requestError) {
      const validationMessage = Object.values(requestError?.response?.data?.errors || {}).flat().join(" ");
      setError(validationMessage || requestError?.response?.data?.message || "Unable to save your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    setError("");
    try {
      await api.delete("/patient/profile/photo");
      setPrivatePhotoUrl("");
      setPhotoFile(null);
      setHasPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
      setSuccess("Profile photo removed.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to remove the profile photo.");
    }
  };

  const requiredComplete = Boolean(form.first_name.trim() && form.last_name.trim() && form.phone.trim() && form.age !== "" && emailVerified);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar authenticated user={user} onLogout={onLogout} />
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-28 sm:px-6 lg:px-8">
        <div className="mb-7 border-b border-slate-200 pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-sky-700">Patient account</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">Personal profile</h1>
              <p className="mt-1 text-sm text-slate-600">Keep your contact and care details up to date.</p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${requiredComplete ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              {requiredComplete ? <CheckCircle2 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              {requiredComplete ? "Required details complete" : "Complete required details"}
            </div>
          </div>
        </div>

        {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
        {success && <div role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">
            <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Loading your profile
          </div>
        ) : (
          <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <section className="flex flex-col gap-5 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-7">
              <div className="relative h-20 w-20 shrink-0">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-500">
                  {photoUrl ? <img src={photoUrl} alt="Patient profile" className="h-full w-full object-cover" /> : <UserRound className="h-9 w-9" />}
                </div>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  aria-label="Choose profile photo"
                  title="Choose profile photo"
                  className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-sky-700 text-white hover:bg-sky-800"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoSelect} className="hidden" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-slate-900">Profile photo</h2>
                <p className="mt-1 text-sm text-slate-500">Optional. JPG, PNG, or WebP, up to 2 MB.</p>
              </div>
              {hasPhoto && (
                <button type="button" onClick={handleRemovePhoto} className="inline-flex items-center gap-2 self-start rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:self-center">
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              )}
            </section>

            <section className="border-b border-slate-100 p-5 sm:p-7">
              <div className="mb-5">
                <h2 className="text-base font-bold text-slate-900">Account and contact</h2>
                <p className="mt-1 text-sm text-slate-500">Your name and phone are used to identify and contact you for care.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="First name" required>
                  <input name="first_name" value={form.first_name} onChange={handleChange} required maxLength={50} autoComplete="given-name" className={inputClass} />
                </Field>
                <Field label="Email address" required>
                  <div className="relative">
                    <input value={form.email} readOnly className={`${inputClass} pr-32 bg-slate-50`} />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-xs font-semibold ${emailVerified ? "text-emerald-700" : "text-amber-700"}`}>
                      {emailVerified ? <Check className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                      {emailVerified ? "Verified" : "Not verified"}
                    </span>
                  </div>
                  <span className="mt-1 block text-xs text-slate-500">Email is verified during registration and cannot be changed here.</span>
                </Field>
                <Field label="Primary phone number" required>
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange} required maxLength={20} autoComplete="tel" className={inputClass} />
                </Field>
                <Field label="Last name" required>
                  <input name="last_name" value={form.last_name} onChange={handleChange} required maxLength={50} autoComplete="family-name" className={inputClass} />
                </Field>
                <Field label="Secondary phone number">
                  <input name="secondary_phone" type="tel" value={form.secondary_phone} onChange={handleChange} maxLength={20} autoComplete="tel-national" className={inputClass} />
                </Field>
              </div>
            </section>

            <section className="border-b border-slate-100 p-5 sm:p-7">
              <div className="mb-5">
                <h2 className="text-base font-bold text-slate-900">Age and registration details</h2>
                <p className="mt-1 text-sm text-slate-500">This helps us record who the patient is and who to contact for minors.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Age" required>
                  <input name="age" type="number" value={form.age} onChange={handleChange} required min="0" max="120" step="1" inputMode="numeric" className={inputClass} />
                  {form.age !== "" && <span className="mt-1 block text-xs text-slate-500">{getAgeBand(Number(form.age))}</span>}
                </Field>
                <fieldset>
                  <legend className="text-sm font-medium text-slate-700">Who is this profile for?</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${!form.registering_for_other ? "border-sky-500 bg-sky-50 text-sky-900" : "border-slate-200 text-slate-700"}`}>
                      <input type="radio" name="profile_for" checked={!form.registering_for_other} onChange={() => setForm((current) => ({ ...current, registering_for_other: false }))} /> Myself
                    </label>
                    <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${form.registering_for_other ? "border-sky-500 bg-sky-50 text-sky-900" : "border-slate-200 text-slate-700"}`}>
                      <input type="radio" name="profile_for" checked={form.registering_for_other} onChange={() => setForm((current) => ({ ...current, registering_for_other: true }))} /> Someone else
                    </label>
                  </div>
                </fieldset>
                {form.registering_for_other && (
                  <Field label="Your relationship to the patient" required>
                    <select name="relationship_to_patient" value={form.relationship_to_patient} onChange={handleChange} required className={inputClass}>
                      <option value="">Choose relationship</option>
                      <option value="mother">Mother</option>
                      <option value="father">Father</option>
                      <option value="guardian">Legal guardian</option>
                      <option value="spouse">Spouse</option>
                      <option value="child">Child</option>
                      <option value="sibling">Sibling</option>
                      <option value="friend">Friend</option>
                    </select>
                  </Field>
                )}
                {form.registering_for_other && form.relationship_to_patient === "friend" && (
                  <>
                    <p className="text-xs text-sky-800 sm:col-span-2">A friend’s parent or guardian contact is required for verification.</p>
                    <Field label="Friend’s parent / guardian name" required>
                      <input name="friend_parent_name" value={form.friend_parent_name} onChange={handleChange} required maxLength={100} className={inputClass} />
                    </Field>
                    <Field label="Friend’s parent / guardian phone" required>
                      <input name="friend_parent_phone" type="tel" value={form.friend_parent_phone} onChange={handleChange} required maxLength={20} className={inputClass} />
                    </Field>
                  </>
                )}
                {form.age !== "" && Number(form.age) < 18 && (
                  <>
                    <Field label="Parent / guardian name" required>
                      <input name="parent_guardian_name" value={form.parent_guardian_name} onChange={handleChange} required maxLength={100} className={inputClass} />
                    </Field>
                    <Field label="Parent / guardian phone" required>
                      <input name="parent_guardian_phone" type="tel" value={form.parent_guardian_phone} onChange={handleChange} required maxLength={20} className={inputClass} />
                    </Field>
                  </>
                )}
              </div>
            </section>

            <section className="border-b border-slate-100 p-5 sm:p-7">
              <div className="mb-5">
                <h2 className="text-base font-bold text-slate-900">Additional personal details</h2>
                <p className="mt-1 text-sm text-slate-500">Optional information for your care record.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Date of birth">
                  <input name="dob" type="date" value={form.dob} onChange={handleChange} max={new Date().toISOString().slice(0, 10)} className={inputClass} />
                </Field>
                <Field label="Gender">
                  <select name="gender" value={form.gender} onChange={handleChange} className={inputClass}>
                    <option value="">Prefer not to say</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
                <Field label="Marital status">
                  <select name="marital_status" value={form.marital_status} onChange={handleChange} className={inputClass}>
                    <option value="">Select if you wish</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </Field>
              </div>
            </section>

            <section className="border-b border-slate-100 p-5 sm:p-7">
              <div className="mb-5">
                <h2 className="text-base font-bold text-slate-900">Address and emergency contact</h2>
                <p className="mt-1 text-sm text-slate-500">Optional details that can help the clinic coordinate your care.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Home address" className="sm:col-span-2">
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <textarea name="address" value={form.address} onChange={handleChange} maxLength={255} rows={2} autoComplete="street-address" className={`${inputClass} pl-10`} />
                  </div>
                </Field>
                <Field label="Emergency contact name">
                  <input name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} maxLength={100} autoComplete="off" className={inputClass} />
                </Field>
                <Field label="Emergency contact phone">
                  <input name="emergency_contact_phone" type="tel" value={form.emergency_contact_phone} onChange={handleChange} maxLength={20} autoComplete="off" className={inputClass} />
                </Field>
                <p className="text-xs text-slate-500 sm:col-span-2">Provide both emergency contact fields together, or leave both blank.</p>
              </div>
            </section>

            <section className="p-5 sm:p-7">
              <div className="mb-5">
                <h2 className="text-base font-bold text-slate-900">Health details</h2>
                <p className="mt-1 text-sm text-slate-500">Optional information to help clinicians prepare for your visit.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Blood group">
                  <select name="blood_group" value={form.blood_group} onChange={handleChange} className={inputClass}>
                    <option value="">Not provided</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => <option key={group} value={group}>{group}</option>)}
                  </select>
                </Field>
                <Field label="Known allergies" className="sm:col-span-2">
                  <textarea name="allergies" value={form.allergies} onChange={handleChange} maxLength={2000} rows={3} placeholder="List known allergies, or leave blank if none are known." className={inputClass} />
                </Field>
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="text-xs text-slate-500">Only your verified patient account can view or change this information.</p>
              <button type="submit" disabled={isSaving || isLoading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60">
                {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? "Saving…" : "Save profile"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50";

function Field({ label, required = false, className = "", children }) {
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`}>
      <span>{label}{required && <span className="ml-1 text-red-600">*</span>}</span>
      {children}
    </label>
  );
}

function getAgeBand(age) {
  if (age <= 1) return "0–1 year · Infant / Baby";
  if (age <= 4) return "2–4 years · Toddler / Early childhood";
  if (age <= 9) return "5–9 years · Child";
  if (age <= 12) return "10–12 years · Pre-teen / Early adolescent";
  if (age <= 17) return "13–17 years · Teenager / Adolescent";
  if (age <= 19) return "18–19 years · Young adult / Adolescent";
  if (age <= 24) return "20–24 years · Young adult";
  if (age <= 59) return "25–59 years · Adult";
  return "60+ years · Older adult / Elderly";
}
import { useState, useEffect } from 'react';
import { ArrowRight, Award, Building2, Clock3, Stethoscope, UserRound, RefreshCw } from 'lucide-react';
import MedAlignBrand from '../components/MedAlignBrand';
import api from '../api';

const FALLBACK_DOCTORS = [
  { name: 'Dr. Sarah Ahmed', specialty: 'Cardiology', clinic: 'MedAlign Health Centre', experience: '15 years experience', detail: 'Cardiac diagnostics, preventive cardiology, and rapid outpatient consultations.', availability: 'Available today' },
  { name: 'Dr. James Okafor', specialty: 'Orthopedics', clinic: 'MedAlign Health Centre', experience: '12 years experience', detail: 'Bone health, joint care, and musculoskeletal diagnostics.', availability: 'Available today' },
  { name: 'Dr. Priya Sharma', specialty: 'Neurology', clinic: 'MedAlign Health Centre', experience: '10 years experience', detail: 'Neurological evaluation, migraine management, and rehabilitation care.', availability: 'Available today' },
  { name: 'Dr. Hina Malik', specialty: 'Pediatrics', clinic: 'MedAlign Health Centre', experience: '8 years experience', detail: 'Friendly, comprehensive child healthcare and developmental wellness.', availability: 'Available today' },
];

function DoctorsPage({ onBack, onDoctorSignIn }) {
  const [doctorsList, setDoctorsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/doctors');
      if (response.data && response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
        setDoctorsList(response.data.data);
      } else {
        setDoctorsList(FALLBACK_DOCTORS);
      }
    } catch {
      setDoctorsList(FALLBACK_DOCTORS);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-white text-slate-900">
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <MedAlignBrand onClick={onBack} label="Return to previous page" />
          <button
            onClick={onDoctorSignIn}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition cursor-pointer"
          >
            Doctor Sign In <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">Meet your care team</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Find the right specialist for your next visit.</h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">Explore verified clinic practitioners, department availability, and consultation specialties synced with the MedAlign MySQL engine.</p>
        </div>

        {isLoading ? (
          <div className="mt-12 flex items-center justify-center gap-3 text-slate-500 py-12 font-medium">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
            <span>Loading clinician roster from database...</span>
          </div>
        ) : (
          <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {doctorsList.map((doctor) => (
              <article key={doctor.id || doctor.name} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <UserRound className="h-7 w-7" />
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                    {doctor.availability || 'Available today'}
                  </span>
                </div>
                <h2 className="mt-6 text-xl font-bold text-slate-950">{doctor.name}</h2>
                <p className="mt-1 font-semibold text-emerald-700 text-sm">{doctor.specialty || doctor.specialization}</p>
                <div className="mt-5 space-y-2 text-xs text-slate-600 font-medium">
                  <p className="flex items-center gap-2.5"><Building2 className="h-4 w-4 text-slate-400" /> {doctor.clinic}</p>
                  <p className="flex items-center gap-2.5"><Award className="h-4 w-4 text-slate-400" /> {doctor.experience || 'Verified Specialist'}</p>
                  <p className="flex items-center gap-2.5"><Clock3 className="h-4 w-4 text-slate-400" /> Walk-in &amp; Digital Token Compatible</p>
                </div>
                <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">{doctor.detail}</p>
              </article>
            ))}
          </section>
        )}

        <div className="mt-12 rounded-3xl bg-slate-950 p-8 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 shadow-2xl">
          <div>
            <div className="flex items-center gap-3">
              <Stethoscope className="h-5 w-5 text-emerald-300" />
              <p className="font-bold text-base">Are you a MedAlign doctor?</p>
            </div>
            <p className="mt-1 text-xs text-slate-400">Sign in to manage your real-time queue, patient consultations, and prescriptions.</p>
          </div>
          <button
            onClick={onDoctorSignIn}
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 rounded-full bg-emerald-400 hover:bg-emerald-300 px-5 py-3 text-xs font-bold text-slate-950 transition cursor-pointer"
          >
            Doctor Workspace <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </main>
    </div>
  );
}

export default DoctorsPage;

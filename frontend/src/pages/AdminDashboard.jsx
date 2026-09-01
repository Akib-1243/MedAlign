import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Stethoscope,
  Users,
  TrendingUp,
  LogOut,
  Plus,
  X,
  Trash2,
  Edit3,
  ShieldCheck,
  ListChecks,
  Eye,
  EyeOff,
  Save,
  AlertCircle
} from "lucide-react";
import api from "../api";
import MedAlignBrand from "../components/MedAlignBrand";

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmt = (v) => (v ? new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(v)) : "-");
const fmtDate = (v) => (v ? new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(v)) : "-");

const STATUS_COLORS = {
  waiting: "bg-amber-100 text-amber-800 border-amber-200",
  called: "bg-sky-100 text-sky-800 border-sky-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  skipped: "bg-slate-100 text-slate-600 border-slate-200",
};

const TABS = [
  { id: "stats", label: "Overview", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "doctors", label: "Doctor Management", icon: <Stethoscope className="h-4 w-4" /> },
  { id: "patients", label: "Patient Registry", icon: <Users className="h-4 w-4" /> },
  { id: "queue", label: "Live Queue", icon: <ListChecks className="h-4 w-4" /> },
];

const SPECIALIZATIONS = [
  "General Medicine",
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
  "Gynecology",
  "Ophthalmology",
  "ENT",
  "Urology",
  "Oncology",
];

// ─── Main Component ─────────────────────────────────────────────────────────
function AdminDashboard({ onBack, onLogout, user }) {
  const [activeTab, setActiveTab] = useState("stats");

  // Stats state
  const [dashboard, setDashboard] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Doctors state
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [editDoctor, setEditDoctor] = useState(null);
  const [docForm, setDocForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    specialization: "General Medicine",
    avg_consult_min: 15,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [savingDoctor, setSavingDoctor] = useState(false);
  const [docError, setDocError] = useState("");
  const [docSuccess, setDocSuccess] = useState("");

  // Patients state
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");

  // Queue state
  const [queue, setQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // ── Data Fetchers ──────────────────────────────────────────────────────
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get("/admin/dashboard-stats");
      setDashboard(res.data);
    } catch {
      setDashboard({
        queue_snapshot: { waiting: 0, called: 0, completed: 0, total: 0 },
        doctor_activity: { total_doctors: 0, available: 0, unavailable: 0 },
        subscription_status: { active_clinics: 1, inactive_clinics: 0 },
        analytics: { total_patients: 0, average_wait_time: 0, average_walkout_rate: 0, analytics_days: 0 },
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    setDocError("");
    try {
      const res = await api.get("/admin/doctors");
      setDoctors(res.data.data || []);
    } catch (e) {
      setDocError(e?.response?.data?.message || "Failed to load doctors.");
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const res = await api.get("/admin/patients");
      setPatients(res.data.data || []);
    } catch {
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchQueue = async () => {
    setLoadingQueue(true);
    try {
      const res = await api.get("/admin/queue");
      setQueue(res.data.data || []);
    } catch {
      setQueue([]);
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "stats") fetchStats();
    if (activeTab === "doctors") fetchDoctors();
    if (activeTab === "patients") fetchPatients();
    if (activeTab === "queue") fetchQueue();
  }, [activeTab]);

  // ── Doctor Form Handlers ───────────────────────────────────────────────
  const openAddDoctor = () => {
    setDocForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      specialization: "General Medicine",
      avg_consult_min: 15,
    });
    setDocError("");
    setDocSuccess("");
    setEditDoctor(null);
    setShowAddDoctor(true);
  };

  const openEditDoctor = (doc) => {
    setDocForm({
      name: doc.name,
      email: doc.email,
      phone: doc.phone || "",
      password: "",
      specialization: doc.specialization,
      avg_consult_min: doc.avg_consult_min || 15,
    });
    setDocError("");
    setDocSuccess("");
    setEditDoctor(doc);
    setShowAddDoctor(true);
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    setSavingDoctor(true);
    setDocError("");
    setDocSuccess("");
    try {
      if (editDoctor) {
        await api.patch(`/admin/doctors/${editDoctor.doctor_id}`, {
          name: docForm.name,
          phone: docForm.phone,
          specialization: docForm.specialization,
          avg_consult_min: docForm.avg_consult_min,
        });
        setDocSuccess("Doctor updated successfully.");
      } else {
        await api.post("/admin/doctors", docForm);
        setDocSuccess(`Doctor account created. ${docForm.name} can now log in.`);
      }
      fetchDoctors();
      fetchStats();
      setTimeout(() => {
        setShowAddDoctor(false);
        setDocSuccess("");
      }, 1800);
    } catch (err) {
      setDocError(err?.response?.data?.message || (err?.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(" ") : "Failed to save doctor."));
    } finally {
      setSavingDoctor(false);
    }
  };

  const handleDeleteDoctor = async (doctorId, name) => {
    if (!window.confirm(`Remove Dr. ${name} from the system?`)) return;
    try {
      await api.delete(`/admin/doctors/${doctorId}`);
      setDoctors((prev) => prev.filter((d) => d.doctor_id !== doctorId));
      fetchStats();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to delete doctor.");
    }
  };

  const toggleAvailability = async (doc) => {
    const newStatus = doc.availability_status === "available" ? "unavailable" : "available";
    try {
      await api.patch(`/admin/doctors/${doc.doctor_id}`, { availability_status: newStatus });
      setDoctors((prev) => prev.map((d) => (d.doctor_id === doc.doctor_id ? { ...d, availability_status: newStatus } : d)));
      fetchStats();
    } catch {
      alert("Failed to update availability.");
    }
  };

  const qs = dashboard?.queue_snapshot ?? {};
  const da = dashboard?.doctor_activity ?? {};
  const an = dashboard?.analytics ?? {};
  const sub = dashboard?.subscription_status ?? {};
  const doctorPct = da.total_doctors > 0 ? Math.round((da.available / da.total_doctors) * 100) : 0;

  const filteredPatients = patients.filter((p) => {
    const q = patientSearch.toLowerCase();
    return !q || (p.name || "").toLowerCase().includes(q) || (p.phone || "").toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-white text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-4">
            <MedAlignBrand onClick={onBack} label="Back" />
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200/60">
                <ShieldCheck className="h-3 w-3" /> System Administration
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                Operations Console
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchStats();
                if (activeTab === "doctors") fetchDoctors();
                if (activeTab === "patients") fetchPatients();
                if (activeTab === "queue") fetchQueue();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <nav className="flex gap-1 pb-0 -mb-px overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${activeTab === tab.id
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                  }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-10 space-y-8">
        {/* ══ OVERVIEW TAB ══ */}
        {activeTab === "stats" && (
          <>
            {/* KPIs */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPICard icon={<Clock3 />} tone="amber" label="Live Waiting Queue" value={qs.waiting ?? 0} sub={`${qs.total ?? 0} total tokens registered`} />
              <KPICard icon={<Stethoscope />} tone="green" label="Active Clinicians" value={da.available ?? 0} sub={`${da.total_doctors ?? 0} doctors rostered`} />
              <KPICard icon={<TrendingUp />} tone="sky" label="Avg Wait Time" value={`${an.average_wait_time ?? 0}m`} sub="Average wait duration" />
              <KPICard icon={<Activity />} tone="purple" label="Walkout Rate" value={`${an.average_walkout_rate ?? 0}%`} sub="Real-time target metric" />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              {/* Queue Snapshot */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Queue Snapshot (Database Live)</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Real-time status across all counters</p>
                  </div>
                  <LiveDot />
                </div>
                <div className="mt-6 space-y-3">
                  <QueueRow color="bg-amber-500" label="Waiting in Lobby" sub="Awaiting consultation" value={qs.waiting ?? 0} bg="border-amber-100 bg-amber-50/40" valueColor="text-amber-700" />
                  <QueueRow color="bg-sky-500" label="In Consultation" sub="Currently called with doctor" value={qs.called ?? 0} bg="border-sky-100 bg-sky-50/40" valueColor="text-sky-700" />
                  <QueueRow color="bg-emerald-500" label="Completed Encounters" sub="Consultation finished" value={qs.completed ?? 0} bg="border-emerald-100 bg-emerald-50/40" valueColor="text-emerald-700" />
                </div>
              </div>

              {/* Doctor Roster */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Clinician Roster</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Availability from database</p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="mt-6 space-y-3">
                  <RosterRow
                    icon={<span className="text-emerald-700 font-bold text-sm">{da.available ?? 0}</span>}
                    label="Available Doctors"
                    sub="Ready for consultation"
                    badge={<span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">Active</span>}
                  />
                  <RosterRow
                    icon={<span className="text-blue-700 font-bold text-sm">{da.total_doctors ?? 0}</span>}
                    label="Total Registered Doctors"
                    sub="Department roster"
                    badge={<span className="text-sm font-bold text-slate-700">{doctorPct}% Online</span>}
                  />
                  <RosterRow
                    icon={<span className="text-slate-600 font-bold text-sm">{da.unavailable ?? 0}</span>}
                    label="Off-duty / On Break"
                    sub="Currently unavailable"
                    badge={<span className="text-xs text-slate-400">Standby</span>}
                  />
                </div>
              </div>
            </section>

            {/* Analytics */}
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="rounded-2xl bg-emerald-50 p-2.5 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Subscription & Facility</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Account tier and branch licenses</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/60 p-4 text-center">
                    <p className="text-2xl font-extrabold text-emerald-700">{sub.active_clinics ?? 1}</p>
                    <p className="mt-1 text-xs text-slate-600 font-medium">Active Clinics</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50/70 border border-amber-200/60 p-4 text-center">
                    <p className="text-2xl font-extrabold text-amber-700">{sub.inactive_clinics ?? 0}</p>
                    <p className="mt-1 text-xs text-slate-600 font-medium">Inactive</p>
                  </div>
                  <div className="rounded-2xl bg-sky-50/70 border border-sky-200/60 p-4 text-center">
                    <p className="text-2xl font-extrabold text-sky-700">Pro</p>
                    <p className="mt-1 text-xs text-slate-600 font-medium">Facility Tier</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Performance Benchmarks</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{an.analytics_days ?? 0}-day operational aggregate</p>
                  </div>
                  <Activity className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="mt-6 space-y-4">
                  <ProgressBar
                    label="Service Efficiency Rating"
                    value={Math.max(0, 100 - (an.average_walkout_rate ?? 0))}
                    color="from-sky-500 to-indigo-600"
                    textColor="text-sky-700"
                  />
                  <ProgressBar
                    label="Wait Threshold (Max 30m)"
                    value={Math.min(100, ((an.average_wait_time ?? 0) / 30) * 100)}
                    color="from-emerald-400 to-emerald-600"
                    textColor="text-emerald-700"
                    suffix={`${an.average_wait_time ?? 0} min`}
                  />
                  <div className="pt-2 flex justify-between text-xs text-slate-500 border-t border-slate-100">
                    <span>
                      Total patients evaluated: <strong className="text-slate-800">{an.total_patients ?? 0}</strong>
                    </span>
                    <span>
                      Days monitored: <strong className="text-slate-800">{an.analytics_days ?? 0}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ══ DOCTOR MANAGEMENT TAB ══ */}
        {activeTab === "doctors" && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Doctor Management</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Only Admins can register and manage doctor credentials. Doctors can log in with their assigned accounts.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={fetchDoctors}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingDoctors ? "animate-spin" : ""}`} /> Refresh
                </button>
                <button
                  onClick={openAddDoctor}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-700 to-sky-600 hover:from-indigo-600 hover:to-sky-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add New Doctor
                </button>
              </div>
            </div>

            {docError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> {docError}
              </div>
            )}

            {loadingDoctors ? (
              <div className="text-center py-12 text-slate-400 text-sm">Loading doctors from database...</div>
            ) : doctors.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 rounded-3xl bg-white border border-slate-200 shadow-sm gap-4">
                <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-500">
                  <Stethoscope className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-slate-900">No doctors registered in database yet</h3>
                  <p className="text-xs text-slate-500 mt-1">Click "Add New Doctor" to create doctor credentials and profiles.</p>
                </div>
                <button
                  onClick={openAddDoctor}
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Doctor
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {doctors.map((doc) => (
                  <div key={doc.doctor_id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-lg shrink-0">
                          {doc.name?.charAt(0) || "D"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{doc.name}</p>
                          <p className="text-xs text-slate-500 truncate">{doc.email}</p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border ${doc.availability_status === "available"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                      >
                        {doc.availability_status === "available" ? "● Available" : "○ Off-duty"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                        <p className="text-slate-400 font-semibold">Specialization</p>
                        <p className="font-bold text-slate-800 mt-0.5 truncate">{doc.specialization}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                        <p className="text-slate-400 font-semibold">Avg Slot</p>
                        <p className="font-bold text-slate-800 mt-0.5">{doc.avg_consult_min || 15} min</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => openEditDoctor(doc)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => toggleAvailability(doc)}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${doc.availability_status === "available"
                            ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                            : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                      >
                        {doc.availability_status === "available" ? "Set Off-duty" : "Set Active"}
                      </button>
                      <button
                        onClick={() => handleDeleteDoctor(doc.doctor_id, doc.name)}
                        className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Remove doctor"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ══ PATIENTS TAB ══ */}
        {activeTab === "patients" && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Patient Registry</h2>
                <p className="text-xs text-slate-500 mt-0.5">{patients.length} total registered patients in database</p>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-800 outline-none focus:border-indigo-400 w-64"
                />
                <button
                  onClick={fetchPatients}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingPatients ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {loadingPatients ? (
              <div className="text-center py-12 text-slate-400 text-sm">Loading patients from database...</div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="px-5 py-3.5">ID</th>
                        <th className="px-5 py-3.5">Name</th>
                        <th className="px-5 py-3.5">Phone</th>
                        <th className="px-5 py-3.5">Gender</th>
                        <th className="px-5 py-3.5">Date of Birth</th>
                        <th className="px-5 py-3.5">Blood Type</th>
                        <th className="px-5 py-3.5">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPatients.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-slate-400">
                            No patients found.
                          </td>
                        </tr>
                      ) : (
                        filteredPatients.map((p) => (
                          <tr key={p.patient_id} className="hover:bg-slate-50 transition">
                            <td className="px-5 py-3.5 font-mono text-slate-500">#{p.patient_id}</td>
                            <td className="px-5 py-3.5 font-bold text-slate-900">{p.name}</td>
                            <td className="px-5 py-3.5 text-slate-600">{p.phone || "-"}</td>
                            <td className="px-5 py-3.5 text-slate-600">{p.gender || "-"}</td>
                            <td className="px-5 py-3.5 text-slate-600">{fmtDate(p.date_of_birth || p.dob)}</td>
                            <td className="px-5 py-3.5">
                              {p.blood_type ? (
                                <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold">
                                  {p.blood_type}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-slate-500">{fmtDate(p.created_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ══ LIVE QUEUE TAB ══ */}
        {activeTab === "queue" && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Live Queue Monitor</h2>
                <p className="text-xs text-slate-500 mt-0.5">All active tokens across all doctors in the database</p>
              </div>
              <button
                onClick={fetchQueue}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingQueue ? "animate-spin" : ""}`} /> Refresh Queue
              </button>
            </div>

            {loadingQueue ? (
              <div className="text-center py-12 text-slate-400 text-sm">Loading live queue...</div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="px-5 py-3.5">Token</th>
                        <th className="px-5 py-3.5">Patient</th>
                        <th className="px-5 py-3.5">Doctor</th>
                        <th className="px-5 py-3.5">Specialization</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Check-in</th>
                        <th className="px-5 py-3.5">Called</th>
                        <th className="px-5 py-3.5">Completed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {queue.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-10 text-slate-400">
                            No tokens in queue.
                          </td>
                        </tr>
                      ) : (
                        queue.map((t) => (
                          <tr key={t.token_id} className="hover:bg-slate-50 transition">
                            <td className="px-5 py-3.5 font-extrabold text-indigo-700">#{t.token_number}</td>
                            <td className="px-5 py-3.5 font-semibold text-slate-900">{t.patient_name || "Walk-in"}</td>
                            <td className="px-5 py-3.5 text-slate-700">{t.doctor_name || "-"}</td>
                            <td className="px-5 py-3.5 text-slate-500">{t.specialization || "-"}</td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${STATUS_COLORS[t.status] || "bg-slate-100 text-slate-600"
                                  }`}
                              >
                                {t.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-500">{fmt(t.check_in_time)}</td>
                            <td className="px-5 py-3.5 text-slate-500">{fmt(t.called_time)}</td>
                            <td className="px-5 py-3.5 text-slate-500">{fmt(t.completed_time)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* ══ ADD / EDIT DOCTOR MODAL ══ */}
      {showAddDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-700">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{editDoctor ? "Edit Doctor" : "Add New Doctor"}</h3>
                  <p className="text-xs text-slate-500">{editDoctor ? `Editing ${editDoctor.name}` : "Create a new doctor credential and profile"}</p>
                </div>
              </div>
              <button onClick={() => setShowAddDoctor(false)} className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {docError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> {docError}
              </div>
            )}
            {docSuccess && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> {docSuccess}
              </div>
            )}

            <form onSubmit={handleSaveDoctor} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <label className="block col-span-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider">Full Name *</span>
                  <input
                    type="text"
                    value={docForm.name}
                    required
                    onChange={(e) => setDocForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Dr. Sarah Ahmed"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-indigo-500 focus:bg-white text-sm"
                  />
                </label>

                {!editDoctor && (
                  <label className="block col-span-2">
                    <span className="font-bold text-slate-700 uppercase tracking-wider">Email Address *</span>
                    <input
                      type="email"
                      value={docForm.email}
                      required
                      onChange={(e) => setDocForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="doctor@hospital.com"
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-indigo-500 focus:bg-white text-sm"
                    />
                  </label>
                )}

                <label className="block">
                  <span className="font-bold text-slate-700 uppercase tracking-wider">Phone</span>
                  <input
                    type="tel"
                    value={docForm.phone}
                    onChange={(e) => setDocForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+1 555 010 0000"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-indigo-500 focus:bg-white text-sm"
                  />
                </label>

                <label className="block">
                  <span className="font-bold text-slate-700 uppercase tracking-wider">Avg Consult (min)</span>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={docForm.avg_consult_min}
                    onChange={(e) => setDocForm((f) => ({ ...f, avg_consult_min: +e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-indigo-500 focus:bg-white text-sm"
                  />
                </label>

                <label className="block col-span-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider">Specialization *</span>
                  <select
                    value={docForm.specialization}
                    required
                    onChange={(e) => setDocForm((f) => ({ ...f, specialization: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-indigo-500 focus:bg-white text-sm"
                  >
                    {SPECIALIZATIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                {!editDoctor && (
                  <label className="block col-span-2 relative">
                    <span className="font-bold text-slate-700 uppercase tracking-wider">Password *</span>
                    <div className="relative mt-1">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={docForm.password}
                        required
                        minLength={6}
                        onChange={(e) => setDocForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder="Min 6 characters"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 pr-10 outline-none focus:border-indigo-500 focus:bg-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </label>
                )}
              </div>

              {!editDoctor && (
                <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-3 text-[11px] text-indigo-800">
                  <strong>Admin Provisioned:</strong> Doctor accounts created by Admin are pre-verified. The doctor can log in directly without OTP.
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDoctor(false)}
                  className="px-4 py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDoctor}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-700 to-sky-600 hover:from-indigo-600 hover:to-sky-500 text-xs font-bold text-white shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" /> {savingDoctor ? "Saving..." : editDoctor ? "Update Doctor" : "Create Doctor Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────
function KPICard({ icon, tone, label, value, sub }) {
  const tones = {
    amber: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600",
    sky: "bg-sky-50 text-sky-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
        <div className={`rounded-2xl p-2.5 ${tones[tone]}`}>{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-extrabold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500 font-medium">{sub}</p>
    </div>
  );
}

function QueueRow({ color, label, sub, value, bg, valueColor }) {
  return (
    <div className={`flex items-center justify-between rounded-2xl border p-4 ${bg}`}>
      <div className="flex items-center gap-3">
        <div className={`h-3 w-3 rounded-full ${color}`} />
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{sub}</p>
        </div>
      </div>
      <span className={`text-xl font-bold ${valueColor}`}>{value}</span>
    </div>
  );
}

function RosterRow({ icon, label, sub, badge }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">{icon}</div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{sub}</p>
        </div>
      </div>
      {badge}
    </div>
  );
}

function ProgressBar({ label, value, color, textColor, suffix }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs font-semibold">
        <span className="text-slate-700">{label}</span>
        <span className={`font-bold ${textColor}`}>{suffix || `${Math.round(value)}%`}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-2 rounded-full bg-gradient-to-r ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function LiveDot() {
  return (
    <span className="flex h-3 w-3 relative">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
    </span>
  );
}

export default AdminDashboard;
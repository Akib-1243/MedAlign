import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Phone,
  RefreshCw,
  SkipForward,
  Stethoscope,
  UserRound,
  Users,
  LogOut,
  X,
  Plus,
  History,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BrainCircuit,
  Pill,
  Lightbulb,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import api from "../api";
import MedAlignBrand from "../components/MedAlignBrand";

const formatTime = (v) => (v ? new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(v)) : "-");
const formatDate = (v) => (v ? new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(v)) : "-");

const EMPTY_MED = { medicine_name: "", dosage: "", frequency: "", duration: "", instructions: "Take after meals" };

function DoctorDashboard({ user, onLogout, onBack }) {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [isOffline, setIsOffline] = useState(false);

  // Digital Prescription Modal
  const [showRxModal, setShowRxModal] = useState(false);
  const [rxNotes, setRxNotes] = useState("");
  const [rxMedicines, setRxMedicines] = useState([{ ...EMPTY_MED }]);
  const [rxSuccessToast, setRxSuccessToast] = useState(false);

  // Patient History
  const [patientHistory, setPatientHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedRx, setExpandedRx] = useState(null);

  // AI Patient Clinical Summary Copilot
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState("");

  const loadDashboard = async () => {
    setError("");
    try {
      const res = await api.get("/doctor/queue-snapshot");
      setDashboard(res.data);
      setIsOffline(false);
    } catch {
      setDashboard((cur) => cur || {
        doctor: { name: user?.name || "Dr. Consultation Desk", specialization: "General Medicine", avg_consult_min: 15 },
        current: null,
        queue: [],
        stats: { waiting: 0, completed_today: 0, average_wait: 0, consulted_today: 0 },
        recent_prescriptions: [],
      });
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatientHistoryAndAi = async (patientId) => {
    if (!patientId) return;
    setLoadingHistory(true);
    setLoadingAiSummary(true);
    setAiSummaryError("");

    // 1. Load History
    try {
      const res = await api.get(`/doctor/patient/${patientId}/history`);
      if (res.data?.success) setPatientHistory(res.data.data || []);
    } catch {
      setPatientHistory([]);
    } finally {
      setLoadingHistory(false);
    }

    // 2. Load AI Clinical Summary
    try {
      const aiRes = await api.get(`/ai/patient-summary/${patientId}`);
      if (aiRes.data?.success) {
        setAiSummary(aiRes.data.data);
      } else {
        setAiSummary(null);
      }
    } catch {
      setAiSummaryError("AI Synthesis service is currently synchronizing records.");
      setAiSummary(null);
    } finally {
      setLoadingAiSummary(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = window.setInterval(loadDashboard, 15000);
    return () => window.clearInterval(interval);
  }, []);

  // Fetch patient history and AI synthesis whenever the active patient changes
  useEffect(() => {
    const pid = dashboard?.current?.patient?.id;
    if (pid) {
      loadPatientHistoryAndAi(pid);
    } else {
      setPatientHistory([]);
      setAiSummary(null);
    }
  }, [dashboard?.current?.patient?.id]);

  const updateQueue = async (path, body) => {
    setIsUpdating(true);
    setError("");
    try {
      if (body) await api.patch(path, body);
      else await api.post(path);
      await loadDashboard();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update queue. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddMed = () => setRxMedicines((p) => [...p, { ...EMPTY_MED }]);
  const handleRemoveMed = (i) => setRxMedicines((p) => p.filter((_, idx) => idx !== i));
  const handleMedChange = (i, field, val) =>
    setRxMedicines((p) => p.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)));

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    if (!current) return;
    setIsUpdating(true);
    try {
      await api.post("/doctor/prescription", {
        queue_token_id: current.id,
        patient_id: current.patient?.id,
        notes: rxNotes,
        items: rxMedicines.filter((m) => m.medicine_name.trim()),
      });
      setShowRxModal(false);
      setRxNotes("");
      setRxMedicines([{ ...EMPTY_MED }]);
      setRxSuccessToast(true);
      setTimeout(() => setRxSuccessToast(false), 4000);
      await loadDashboard();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save prescription.");
    } finally {
      setIsUpdating(false);
    }
  };

  const current = dashboard?.current;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-white text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-4">
            <MedAlignBrand onClick={onBack} label="Back" />
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                Clinician Workspace
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                {user?.name || dashboard?.doctor?.name || "Dr. Consultation Desk"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboard}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-sky-600" : ""}`} /> Refresh Queue
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-10 space-y-8">
        {/* Alerts & Toasts */}
        {isOffline && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 flex items-center justify-between">
            <span>Backend offline — MySQL engine active in background.</span>
            <button onClick={loadDashboard} className="font-bold underline cursor-pointer">
              Retry
            </button>
          </div>
        )}
        {rxSuccessToast && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-xs text-emerald-900 flex items-center gap-3 shadow-md">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="font-bold">Digital Prescription signed and saved! Patient can view it in their Medical Vault.</span>
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="font-bold cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Shift Metric Counters */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={<CalendarClock className="h-5 w-5" />} label="Waiting in Queue" value={dashboard?.stats?.waiting ?? 0} detail="Assigned specifically to you" tone="blue" />
          <Metric icon={<CheckCircle2 className="h-5 w-5" />} label="Completed Today" value={dashboard?.stats?.completed_today ?? 0} detail="Consultations finished" tone="green" />
          <Metric icon={<Clock3 className="h-5 w-5" />} label="Avg Consultation" value={`${dashboard?.doctor?.avg_consult_min ?? 15}m`} detail="Allocated time slot" tone="indigo" />
          <Metric icon={<Activity className="h-5 w-5" />} label="Total Consulted" value={dashboard?.stats?.consulted_today ?? 0} detail="Called or finished today" tone="amber" />
        </section>

        {/* Live Consultation Chamber + Waiting Queue */}
        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          {/* Active Chamber Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-sky-600">Active Consultation Desk</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">Current Patient</h2>
                <p className="text-xs text-slate-500">Live token assigned to your chamber</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${current ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                {current ? "In Consultation" : "Chamber Ready"}
              </span>
            </div>

            {current ? (
              <div className="mt-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-white sm:p-8 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Token</span>
                    <p className="mt-1 text-6xl font-extrabold tracking-tight">#{current.number}</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-300">
                    <UserRound className="h-7 w-7" />
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xl font-bold">{current.patient?.name}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      In at {formatTime(current.check_in_time)} · Phone: {current.patient?.phone || "Registered Patient"}
                    </p>
                  </div>
                  <p className="text-xs text-sky-300 font-medium">Called at {formatTime(current.called_time)}</p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    disabled={isUpdating}
                    onClick={() => setShowRxModal(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-sky-500 hover:bg-sky-400 px-5 py-2.5 text-xs font-bold text-slate-950 cursor-pointer disabled:opacity-50 transition"
                  >
                    <FileText className="h-4 w-4" /> Issue Digital Prescription
                  </button>
                  <button
                    disabled={isUpdating}
                    onClick={() => updateQueue(`/doctor/queue/${current.id}/status`, { status: "completed" })}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold text-slate-950 cursor-pointer disabled:opacity-50 transition"
                  >
                    <Check className="h-4 w-4" /> Complete Consultation
                  </button>
                  <button
                    disabled={isUpdating}
                    onClick={() => updateQueue(`/doctor/queue/${current.id}/status`, { status: "skipped" })}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 hover:bg-white/10 px-5 py-2.5 text-xs font-bold text-white cursor-pointer disabled:opacity-50 transition"
                  >
                    <SkipForward className="h-4 w-4" /> Skip / No Show
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <Stethoscope className="h-7 w-7" />
                </div>
                <p className="mt-4 text-base font-bold text-slate-900">Chamber is available</p>
                <p className="mt-1 max-w-xs text-xs text-slate-500">Call the next patient in line when you are ready to begin consultation.</p>
              </div>
            )}

            <button
              disabled={isUpdating || Boolean(current) || !dashboard?.queue?.length}
              onClick={() => updateQueue("/doctor/queue/call-next", null)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-700 to-indigo-600 hover:from-sky-600 hover:to-indigo-500 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-sky-500/20 disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 cursor-pointer transition"
            >
              <Phone className="h-4 w-4" /> Call Next Patient <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Waiting Queue List */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-sky-600">Waiting Lobby</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">Next in Queue</h2>
                <p className="text-xs text-slate-500">Patients rostered for your chamber</p>
              </div>
              <Users className="h-6 w-6 text-sky-600" />
            </div>
            <div className="mt-6 space-y-3">
              {dashboard?.queue?.length ? (
                dashboard.queue.map((token, i) => (
                  <div key={token.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 hover:bg-slate-50 transition">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sm font-extrabold text-sky-700 border border-sky-100">
                      #{token.number}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{token.patient?.name}</p>
                      <p className="text-xs text-slate-500">~{token.est_wait_time || (i + 1) * 15} min est. wait</p>
                    </div>
                    <span className="text-xs text-slate-400">{formatTime(token.check_in_time)}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200/60 p-5 text-center text-xs font-medium text-emerald-800">
                  Waiting queue is clear.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ══ AI CLINICAL PATIENT SUMMARY & COPILOT ══ */}
        {current && (
          <section className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/40 p-6 sm:p-8 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
                  <BrainCircuit className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-950">AI Clinical Summary &amp; Copilot</h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2.5 py-0.5 border border-purple-200">
                      <Sparkles className="h-3 w-3" /> MedAlign AI Engine
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Automated clinical synthesis of previous prescriptions, medications, and health trajectory for <strong>{current.patient?.name}</strong>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => loadPatientHistoryAndAi(current.patient?.id)}
                disabled={loadingAiSummary}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-purple-200 bg-white text-xs font-bold text-purple-700 hover:bg-purple-50 cursor-pointer transition disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${loadingAiSummary ? "animate-spin" : ""}`} /> Refresh AI Insights
              </button>
            </div>

            {loadingAiSummary ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-3">
                <BrainCircuit className="h-8 w-8 text-purple-600 animate-pulse" />
                <p className="text-xs font-medium">Synthesizing clinical notes and prescription timeline with AI...</p>
              </div>
            ) : aiSummary ? (
              <div className="mt-6 space-y-6">
                {/* Executive Summary Card */}
                <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="h-4 w-4 text-purple-600" /> Executive Clinical Synopsis
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed font-medium">
                    {aiSummary.executive_summary}
                  </p>
                </div>

                {/* Grid: Trends & Action Insights */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Clinical Trends */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                      <ShieldAlert className="h-4 w-4 text-indigo-600" /> Key Clinical Trajectory &amp; History
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {aiSummary.clinical_trends?.length ? (
                        aiSummary.clinical_trends.map((trend, idx) => (
                          <li key={idx} className="flex items-start gap-2 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                            <span>{trend}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-400 italic">No prior clinical flags recorded.</li>
                      )}
                    </ul>
                  </div>

                  {/* Doctor Action Insights */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                      <Lightbulb className="h-4 w-4 text-amber-600" /> Attending Clinician Checkpoints
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {aiSummary.doctor_action_insights?.length ? (
                        aiSummary.doctor_action_insights.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-2 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                            <span>{action}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-400 italic">Standard initial consultation routine.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Medication Timeline Profile */}
                {aiSummary.medication_history?.length > 0 && (
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                        <Pill className="h-4 w-4 text-emerald-600" /> Previous Prescriptions &amp; Dosages ({aiSummary.medication_history.length})
                      </div>
                      <span className="text-[11px] text-slate-400">Aggregated from patient records</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {aiSummary.medication_history.map((med, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                          <p className="font-bold text-slate-900">{med.name}</p>
                          <p className="text-slate-600 text-[11px] mt-0.5">{med.dosage} · {med.frequency}</p>
                          <p className="text-slate-400 text-[10px] mt-1">Prescribed on {med.date} by {med.prescribed_by}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 italic">
                {aiSummaryError || "No prior prescription records available for this patient to generate AI summary."}
              </div>
            )}
          </section>
        )}

        {/* Patient Medical History Accordion — All visits & detailed table */}
        {current && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-600">
                <History className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-950">Patient Medical Records Archive</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed prescription records for <strong>{current.patient?.name}</strong>
                </p>
              </div>
              {loadingHistory && <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />}
            </div>
            <div className="mt-5 space-y-3">
              {loadingHistory ? (
                <p className="text-center py-6 text-xs text-slate-400">Loading history records...</p>
              ) : patientHistory.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 text-center text-xs text-slate-500">
                  No previous digital prescriptions found. This may be their first visit.
                </div>
              ) : (
                patientHistory.map((rx) => (
                  <div key={rx.id} className="rounded-2xl border border-slate-100 overflow-hidden">
                    <button
                      onClick={() => setExpandedRx(expandedRx === rx.id ? null : rx.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="shrink-0 text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {rx.rx_code}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {rx.items?.map((i) => i.medicine_name).join(", ") || "Routine prescription"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(rx.issued_at)} · Prescribed by {rx.doctor_name}
                          </p>
                        </div>
                      </div>
                      {expandedRx === rx.id ? (
                        <ChevronUp className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                      )}
                    </button>
                    {expandedRx === rx.id && (
                      <div className="px-4 pb-4 pt-3 space-y-3 border-t border-slate-100 bg-slate-50/60">
                        {rx.notes && <p className="text-xs text-slate-600 italic">📋 Clinical Notes: {rx.notes}</p>}
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-600 font-semibold">
                              <tr>
                                <th className="p-2.5">Medicine</th>
                                <th className="p-2.5">Dosage</th>
                                <th className="p-2.5">Frequency</th>
                                <th className="p-2.5">Duration</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {rx.items?.map((item, idx) => (
                                <tr key={idx}>
                                  <td className="p-2.5 font-semibold text-slate-900">{item.medicine_name}</td>
                                  <td className="p-2.5 text-slate-600">{item.dosage}</td>
                                  <td className="p-2.5 text-slate-600">{item.frequency}</td>
                                  <td className="p-2.5 text-slate-600">{item.duration}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Bottom Section: Recent Rx + Shift Stats */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-950">Recent Digital Prescriptions</h2>
                <p className="text-xs text-slate-500 mt-0.5">Rx records issued this shift</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {dashboard?.recent_prescriptions?.length ? (
                dashboard.recent_prescriptions.map((rx) => (
                  <div key={rx.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{rx.patient}</p>
                      <p className="text-xs text-slate-500">Issued {formatTime(rx.issued_at)}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                      <Check className="h-3 w-3" /> Signed &amp; Vaulted
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No prescriptions issued yet this shift.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="rounded-2xl bg-emerald-50 p-2.5 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Shift Performance</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Today's clinical summary</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-sky-50/70 border border-sky-100 p-4">
                  <p className="text-xs font-semibold text-slate-600">Avg Consult</p>
                  <p className="mt-2 text-2xl font-extrabold text-sky-800">
                    {dashboard?.doctor?.avg_consult_min ?? 15} <span className="text-sm font-normal">min</span>
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50/70 border border-emerald-100 p-4">
                  <p className="text-xs font-semibold text-slate-600">Closed Today</p>
                  <p className="mt-2 text-2xl font-extrabold text-emerald-800">{dashboard?.stats?.completed_today ?? 0}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Dept: <strong>{dashboard?.doctor?.specialization || "General Medicine"}</strong>
              </span>
              <span className="text-emerald-700 font-bold">● Active</span>
            </div>
          </div>
        </section>

        {/* Digital Prescription Modal */}
        {showRxModal && current && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-700">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Issue Digital Prescription</h3>
                    <p className="text-xs text-slate-500">
                      Patient: <strong>{current.patient?.name}</strong> · Token #{current.number}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowRxModal(false)} className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePrescription} className="mt-6 space-y-5 text-xs">
                {/* Notes */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Clinical Notes &amp; Advice</label>
                  <textarea
                    rows={3}
                    value={rxNotes}
                    onChange={(e) => setRxNotes(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-sky-500 focus:bg-white text-sm"
                    placeholder="Diagnosis, dietary advice, follow-up instructions..."
                  />
                </div>

                {/* Medicines */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 uppercase tracking-wider">Prescribed Medications</span>
                    <button
                      type="button"
                      onClick={handleAddMed}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-bold hover:bg-sky-100 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> Add Medicine
                    </button>
                  </div>

                  {rxMedicines.map((med, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
                      {rxMedicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMed(i)}
                          className="absolute top-3 right-3 p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-600 mb-1">Medicine Name *</label>
                          <input
                            type="text"
                            value={med.medicine_name}
                            required
                            onChange={(e) => handleMedChange(i, "medicine_name", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold outline-none focus:border-sky-500"
                            placeholder="e.g. Amoxicillin 500mg"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-600 mb-1">Dosage</label>
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) => handleMedChange(i, "dosage", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-sky-500"
                            placeholder="e.g. 1 Capsule"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-600 mb-1">Frequency</label>
                          <input
                            type="text"
                            value={med.frequency}
                            onChange={(e) => handleMedChange(i, "frequency", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-sky-500"
                            placeholder="e.g. 3x daily"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-600 mb-1">Duration</label>
                          <input
                            type="text"
                            value={med.duration}
                            onChange={(e) => handleMedChange(i, "duration", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-sky-500"
                            placeholder="e.g. 7 Days"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> Saved to patient Medical Vault instantly
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRxModal(false)}
                      className="px-4 py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-700 to-indigo-600 hover:from-sky-600 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-sky-500/20 cursor-pointer disabled:opacity-50"
                    >
                      Sign and Save to Vault →
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Metric({ icon, label, value, detail, tone }) {
  const colors = {
    blue: "bg-sky-50 text-sky-700",
    green: "bg-emerald-50 text-emerald-700",
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${colors[tone]}`}>{icon}</div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

export default DoctorDashboard;

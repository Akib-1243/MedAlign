import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  AlertCircle,
  Bell,
  CheckCircle,
  FileText,
  Search,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Printer,
  Download,
  X,
  Stethoscope,
  Building2,
  RefreshCw,
  ArrowRight,
  Sparkles,
  BrainCircuit,
  Lightbulb,
  ShieldAlert,
  HelpCircle,
  Send,
  UserCheck,
  MapPin
} from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../api";

const QUICK_SYMPTOMS = [
  { label: "🫀 Chest Pain / Palpitations", query: "Crushing chest discomfort, irregular heart palpitation, and high blood pressure" },
  { label: "🦴 Joint, Knee & Bone Pain", query: "Severe sharp pain in knee joint, swelling, and difficulty walking" },
  { label: "🧠 Migraine, Dizziness & Nerves", query: "Chronic migraine headache, visual sensitivity to light, and dizziness" },
  { label: "👶 Child Fever & Wellness", query: "Toddler with persistent fever, loss of appetite, and irritability" },
  { label: "🔬 Skin Rash, Itch & Acne", query: "Spreading red itchy rash on skin with dry flaky patches" },
  { label: "🌡️ Flu, Cough & Sore Throat", query: "Viral flu, productive cough, throat pain, and mild fever" },
  { label: "👂 Earache & Sinus Trouble", query: "Ear pain, muffled hearing, and blocked sinus pressure" },
];

export default function PatientPage({ authenticated, user, onLogout, onLoginClick }) {
  const [activeTab, setActiveTab] = useState("tracker"); // tracker | ai-triage | alerts | vault

  // Patient workspace data
  const [patient, setPatient] = useState({
    patient_id: 1,
    name: user?.name || "Amina Yusuf",
    phone: "+1 555 0101",
    gender: "Female",
    dob: "1988-04-12",
  });

  // Current Live Queue Token
  const [currentToken, setCurrentToken] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [doctorsList, setDoctorsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Alert Settings
  const [smsAlert, setSmsAlert] = useState(true);
  const [whatsappAlert, setWhatsappAlert] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(3);
  const [alertSavedToast, setAlertSavedToast] = useState(false);

  // Medical Vault & Prescriptions
  const [dbPrescriptions, setDbPrescriptions] = useState([]);
  const [selectedRx, setSelectedRx] = useState(null);
  const [rxSearch, setRxSearch] = useState("");

  // ══ AI Care Navigator & Symptom Matcher ══
  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    fetchWorkspace();
    fetchDoctors();
    const interval = setInterval(fetchWorkspace, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchWorkspace = async () => {
    const savedTokenId = localStorage.getItem("medalign_patient_token_id");
    if (savedTokenId) {
      try {
        const tokenRes = await api.get(`/patient/token/${savedTokenId}`);
        if (tokenRes.data && tokenRes.data.success && tokenRes.data.data?.token) {
          const t = tokenRes.data.data.token;
          setCurrentToken({
            token_id: t.token_id,
            token_number: t.token_number,
            clinic_name: t.doctor?.clinic?.name || "MedAlign Health Centre",
            clinic_address: t.doctor?.clinic?.address || "24 Crescent Road",
            doctor_name: t.doctor?.user?.name || "Dr. " + (t.doctor?.specialization || "Specialist"),
            specialization: t.doctor?.specialization || "General Medicine",
            counter_name: t.counter?.counter_name || "Room 101",
            status: t.status,
            check_in_time: t.check_in_time ? new Date(t.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "10:15 AM",
            patients_ahead: tokenRes.data.data.patients_ahead ?? 0,
            currently_serving: tokenRes.data.data.currently_serving ?? 101,
            est_wait_time: tokenRes.data.data.est_wait_time ?? 0,
          });
          if (t.patient) {
            setPatient(t.patient);
            if (t.patient.patient_id) fetchVault(t.patient.patient_id);
          }
          return;
        }
      } catch (e) {
        console.warn("Saved token not found or expired", e);
      }
    }

    try {
      const res = await api.get(`/patient/search?query=${user?.name || "Amina"}`);
      if (res.data && res.data.success) {
        if (res.data.patient) setPatient(res.data.patient);
        if (res.data.latest_token) {
          const t = res.data.latest_token;
          setCurrentToken({
            token_id: t.token_id,
            token_number: t.token_number,
            clinic_name: t.doctor?.clinic?.name || "MedAlign Health Centre",
            clinic_address: t.doctor?.clinic?.address || "24 Crescent Road",
            doctor_name: t.doctor?.user?.name || "Dr. Sarah Ahmed",
            specialization: t.doctor?.specialization || "Cardiology",
            counter_name: t.counter?.counter_name || "Room 101",
            status: t.status,
            check_in_time: t.check_in_time ? new Date(t.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "10:15 AM",
            patients_ahead: res.data.patients_ahead ?? 2,
            currently_serving: res.data.currently_serving ?? 101,
            est_wait_time: (res.data.patients_ahead ?? 2) * (t.doctor?.avg_consult_min || 15),
          });
          if (t.token_id) {
            localStorage.setItem("medalign_patient_token_id", String(t.token_id));
          }
        }
        if (res.data.alert_preferences) {
          setSmsAlert(Boolean(res.data.alert_preferences.sms_enabled));
          setWhatsappAlert(Boolean(res.data.alert_preferences.whatsapp_enabled));
          setAlertThreshold(res.data.alert_preferences.near_turn_threshold || 3);
        }
        if (res.data.patient?.patient_id) {
          fetchVault(res.data.patient.patient_id);
        }
      }
    } catch (e) {
      console.warn("Failed to load patient workspace", e);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get("/doctors");
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setDoctorsList(res.data.data);
      }
    } catch {
      setDoctorsList([]);
    }
  };

  const fetchVault = async (patientId) => {
    try {
      const res = await api.get(`/patient/${patientId}/vault`);
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        const formatted = res.data.data.map((rx) => ({
          prescription_id: rx.prescription_id,
          rx_code: "RX-2026-" + (1000 + rx.prescription_id),
          issued_at: rx.issued_at ? new Date(rx.issued_at).toISOString().split("T")[0] : "2026-08-20",
          doctor_name: rx.doctor?.user?.name || "Dr. Medical Practitioner",
          doctor_title: (rx.doctor?.specialization || "General Medicine") + " Specialist",
          clinic_name: "MedAlign Health Centre",
          clinic_phone: "+1 (555) 0100",
          clinic_address: "24 Crescent Road, Health District",
          notes: rx.notes || "Follow prescribed dosage instructions and stay hydrated.",
          qr_code_hash: rx.qr_code_path || `QR-MED-${rx.prescription_id}9821`,
          pdf_path: "#",
          items: Array.isArray(rx.items)
            ? rx.items.map((it) => ({
                item_id: it.item_id,
                medicine_name: it.medicine_name,
                dosage: it.dosage,
                frequency: it.frequency,
                duration: it.duration || "7 Days",
                instructions: it.instructions || "Take after meals with water.",
              }))
            : [],
        }));
        setDbPrescriptions(formatted);
      }
    } catch (e) {
      console.warn("Vault fetch error:", e);
    }
  };

  const handleBookToken = async (doctorId) => {
    setIsBooking(true);
    try {
      const res = await api.post("/patient/issue-token", {
        doctor_id: doctorId,
        patient_id: patient?.patient_id,
        name: patient?.name,
        phone: patient?.phone,
      });
      if (res.data && res.data.success && res.data.token) {
        setCurrentToken(res.data.token);
        if (res.data.token.token_id) {
          localStorage.setItem("medalign_patient_token_id", String(res.data.token.token_id));
        }
        if (patient?.patient_id) fetchVault(patient.patient_id);
        setActiveTab("tracker");
      }
    } catch (e) {
      console.warn("Failed to issue token", e);
    } finally {
      setIsBooking(false);
    }
  };

  const handleSaveAlerts = async () => {
    try {
      await api.post(`/patient/${patient.patient_id}/alerts`, {
        sms_enabled: smsAlert,
        whatsapp_enabled: whatsappAlert,
        near_turn_threshold: alertThreshold,
      });
    } catch (e) {
      console.warn("Failed to save alerts online", e);
    }
    setAlertSavedToast(true);
    setTimeout(() => setAlertSavedToast(false), 3500);
  };

  // ══ AI Doctor Symptom Analysis ══
  const handleAnalyzeSymptoms = async (queryText) => {
    const textToAnalyze = (queryText !== undefined ? queryText : aiQuery).trim();
    if (!textToAnalyze) return;
    setIsAnalyzingAi(true);
    setAiError("");
    try {
      const res = await api.post("/ai/suggest-doctor", { symptoms: textToAnalyze });
      if (res.data && res.data.success) {
        setAiResult(res.data.data);
      } else {
        setAiError(res.data?.message || "Unable to determine specialist. Please try again.");
      }
    } catch (err) {
      setAiError(err?.response?.data?.message || "AI suggestion service is momentarily busy. Please select from specialist list.");
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const filteredPrescriptions = dbPrescriptions.filter((rx) => {
    const q = rxSearch.toLowerCase();
    return (
      (rx.rx_code || "").toLowerCase().includes(q) ||
      (rx.doctor_name || "").toLowerCase().includes(q) ||
      rx.items.some((i) => i.medicine_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-white text-slate-800">
      <Navbar authenticated={authenticated} user={user} onLogout={onLogout} onLoginClick={onLoginClick} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Patient Profile Header */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-700 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-sky-500/20">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{patient.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Verified Patient
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Patient ID: <strong className="text-slate-800">#{patient.patient_id}</strong> • Phone:{" "}
                <strong className="text-slate-800">{patient.phone}</strong> • DOB: {patient.dob} ({patient.gender})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setActiveTab("ai-triage")}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-200" /> AI Doctor Matcher
            </button>
            <button
              onClick={fetchWorkspace}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sync
            </button>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2.5 p-1.5 bg-slate-200/60 rounded-3xl w-fit">
          <button
            onClick={() => setActiveTab("tracker")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "tracker"
                ? "bg-gradient-to-r from-sky-700 to-indigo-600 text-white shadow-lg shadow-sky-500/20"
                : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-sm"
            }`}
          >
            <Clock className="w-4 h-4" /> Live Queue Token
          </button>

          <button
            onClick={() => setActiveTab("ai-triage")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "ai-triage"
                ? "bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-lg shadow-purple-500/20"
                : "bg-white text-purple-700 hover:bg-purple-50 border border-purple-200 shadow-sm"
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-500" /> AI Symptom Matcher
          </button>

          <button
            onClick={() => setActiveTab("alerts")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "alerts"
                ? "bg-gradient-to-r from-sky-700 to-indigo-600 text-white shadow-lg shadow-sky-500/20"
                : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-sm"
            }`}
          >
            <Bell className="w-4 h-4" /> Alert Preferences
          </button>

          <button
            onClick={() => setActiveTab("vault")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "vault"
                ? "bg-gradient-to-r from-sky-700 to-indigo-600 text-white shadow-lg shadow-sky-500/20"
                : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-sm"
            }`}
          >
            <FileText className="w-4 h-4" /> Medical Vault &amp; Rx
          </button>
        </div>

        {/* ══ TAB 1: LIVE QUEUE TRACKER ══ */}
        {activeTab === "tracker" && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
            {!currentToken ? (
              <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-xl text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-2xl font-bold text-slate-900">No Active Queue Token</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    You currently do not have an active consultation ticket. Select a specialist doctor below or use the AI Doctor Matcher to find the right clinician.
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setActiveTab("ai-triage")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" /> Match Doctor by Symptoms (AI)
                  </button>
                </div>

                {/* Specialist Doctor Roster Selection Grid */}
                <div className="pt-6 border-t border-slate-100 text-left">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Select a Specialist Doctor</h4>
                      <p className="text-xs text-slate-500">Live clinician roster from MySQL engine</p>
                    </div>
                    <span className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full">
                      {doctorsList.length} Specialists Available
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {doctorsList.map((doc) => (
                      <div
                        key={doc.id || doc.name}
                        className="p-5 rounded-2xl border border-slate-200 hover:border-sky-500 bg-slate-50/50 hover:bg-white transition flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              {doc.availability || "Available today"}
                            </span>
                            <Stethoscope className="w-4 h-4 text-sky-600" />
                          </div>
                          <h5 className="text-base font-bold text-slate-900 mt-3">{doc.name}</h5>
                          <p className="text-xs font-semibold text-sky-700">{doc.specialty || doc.specialization}</p>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" /> {doc.clinic || "MedAlign Health Centre"}
                          </p>
                        </div>

                        <button
                          disabled={isBooking}
                          onClick={() => handleBookToken(doc.id)}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-700 to-indigo-600 hover:from-sky-600 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isBooking ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Issuing Token...
                            </>
                          ) : (
                            <>
                              Get Live Token <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Near Turn Alert Banner */}
                {currentToken.patients_ahead <= 2 && currentToken.status === "waiting" && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-200/70 flex items-center justify-center font-bold text-amber-900 shrink-0">
                        !
                      </div>
                      <div>
                        <p className="font-bold text-sm">Your turn is arriving soon!</p>
                        <p className="text-xs text-amber-700">Only {currentToken.patients_ahead} patient(s) ahead. Please proceed to {currentToken.counter_name}.</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-amber-200 px-3 py-1 rounded-full shrink-0">Near-Turn Active</span>
                  </div>
                )}

                {/* Token Main Board */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Big Live Token Display */}
                  <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-sky-700">OPD Consultation Ticket</span>
                        <h2 className="text-2xl font-extrabold text-slate-950 mt-1">{currentToken.clinic_name}</h2>
                        <p className="text-xs text-slate-500">{currentToken.clinic_address}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        currentToken.status === "called" ? "bg-emerald-100 text-emerald-800 animate-pulse" : "bg-blue-100 text-blue-800"
                      }`}>
                        {currentToken.status === "called" ? "● Called into Chamber" : "Waiting in Lobby"}
                      </span>
                    </div>

                    <div className="my-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Your Live Token</span>
                        <div className="text-6xl font-black text-sky-900 tracking-tight mt-1">#{currentToken.token_number}</div>
                        <p className="text-xs text-slate-500 mt-2 font-medium">Assigned to: <strong>{currentToken.doctor_name}</strong> ({currentToken.specialization})</p>
                      </div>
                      <div className="text-center sm:text-right space-y-2">
                        <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Designated Counter</span>
                        <div className="text-xl font-bold text-slate-900">{currentToken.counter_name}</div>
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold">
                          Check-in: {currentToken.check_in_time}
                        </span>
                      </div>
                    </div>

                    {/* Progress Estimation */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-center">
                      <div>
                        <span className="text-xs text-slate-400 font-semibold uppercase">Currently Serving</span>
                        <p className="text-2xl font-bold text-slate-800 mt-1">#{currentToken.currently_serving || 101}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-semibold uppercase">Patients Ahead</span>
                        <p className="text-2xl font-bold text-amber-600 mt-1">{currentToken.patients_ahead}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-semibold uppercase">Est. Wait</span>
                        <p className="text-2xl font-bold text-sky-700 mt-1">~{currentToken.est_wait_time} min</p>
                      </div>
                    </div>
                  </div>

                  {/* Consultation Pass Card */}
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Consultation Pass</span>
                        <UserCheck className="w-5 h-5 text-sky-400" />
                      </div>
                      <p className="text-base font-bold">{currentToken.doctor_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{currentToken.specialization} · {currentToken.counter_name}</p>
                    </div>

                    <div className="my-6 p-5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Pass Reference:</span>
                        <span className="font-mono font-bold text-sky-300">MED-OPD-#{currentToken.token_number}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Chamber Room:</span>
                        <span className="font-bold text-white">{currentToken.counter_name}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Arrival Status:</span>
                        <span className="font-bold text-emerald-400">Admitted / Waiting</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-center">
                      <p className="text-[11px] text-slate-400">
                        Please take a seat in the waiting lobby. Your token number will be announced when called into the chamber.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ══ TAB 2: AI DOCTOR MATCHER & CARE NAVIGATOR ══ */}
        {activeTab === "ai-triage" && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/50 border border-purple-200/90 shadow-xl space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-950">AI Symptom-to-Doctor Navigator</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Describe your symptoms in natural language. Our clinical AI analyzer will match you with the appropriate specialist doctor and prepare you for your visit.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 hidden sm:inline-flex">
                  Clinical NLP Powered
                </span>
              </div>

              {/* Input Box */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Describe What You Are Experiencing</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyzeSymptoms()}
                    placeholder="e.g. sharp knee pain and swelling after injury, or chest tightness with high BP..."
                    className="flex-1 px-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 shadow-sm"
                  />
                  <button
                    disabled={isAnalyzingAi || !aiQuery.trim()}
                    onClick={() => handleAnalyzeSymptoms()}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition"
                  >
                    {isAnalyzingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{isAnalyzingAi ? "Analyzing..." : "Find Specialist"}</span>
                  </button>
                </div>

                {/* Quick Symptom Chips */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Quick Symptom Prompts:</span>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_SYMPTOMS.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setAiQuery(chip.query);
                          handleAnalyzeSymptoms(chip.query);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-purple-400 hover:bg-purple-50/60 text-xs font-medium transition cursor-pointer shadow-2xs"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {aiError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* AI Analysis Output */}
              {aiResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-4 border-t border-purple-100">
                  {/* Urgency Red Flag Banner if applicable */}
                  {aiResult.urgency_flag && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 shadow-sm">
                      <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-xs uppercase tracking-wider text-red-700">Critical Red Flag Warning</p>
                        <p className="text-xs text-red-900 mt-1 font-medium">{aiResult.urgency_message}</p>
                      </div>
                    </div>
                  )}

                  {/* Top Analysis Grid */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-sm space-y-2">
                      <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wider">
                        <BrainCircuit className="w-4 h-4 text-purple-600" /> Recommended Medical Domain
                      </div>
                      <p className="text-xl font-extrabold text-slate-900">{aiResult.recommended_specialty}</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{aiResult.clinical_rationale}</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-sm space-y-2">
                      <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                        <Lightbulb className="w-4 h-4 text-indigo-600" /> Visit Preparation Advice
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium mt-1">{aiResult.preparation_advice}</p>
                    </div>
                  </div>

                  {/* Matched Doctors List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recommended Clinicians for You</h4>
                        <p className="text-xs text-slate-500">Ranked by specialty alignment &amp; live chamber availability</p>
                      </div>
                      <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                        {aiResult.matched_doctors?.length || 0} Doctors Available
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiResult.matched_doctors?.map((doc) => (
                        <div
                          key={doc.doctor_id}
                          className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-purple-400 transition flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                                  {doc.match_confidence}
                                </span>
                                <h5 className="text-lg font-bold text-slate-950 mt-2">{doc.name}</h5>
                                <p className="text-xs font-bold text-sky-700">{doc.specialization}</p>
                              </div>
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                doc.availability_status === "available" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                              }`}>
                                {doc.availability_status === "available" ? "● Available" : "Off-duty"}
                              </span>
                            </div>

                            <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                              <p className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-slate-400" /> {doc.clinic_name}</p>
                              <p className="flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5 text-slate-400" /> {doc.experience}</p>
                              <p className="text-slate-600 font-medium">Live Queue: <strong>{doc.waiting_patients} waiting</strong> (~{doc.est_wait_minutes} min est.)</p>
                            </div>
                          </div>

                          <button
                            disabled={isBooking}
                            onClick={() => handleBookToken(doc.doctor_id)}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isBooking ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Issuing Token...
                              </>
                            ) : (
                              <>
                                Book Token With {doc.name.split(" ")[1] || doc.name} <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══ TAB 3: ALERT PREFERENCES ══ */}
        {activeTab === "alerts" && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Queue Alert Settings</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Choose how MedAlign notifies you when your consultation turn is approaching.
                </p>
              </div>

              {alertSavedToast && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Alert preferences saved successfully.
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">SMS</div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">SMS Notifications</p>
                      <p className="text-xs text-slate-500">Receive dispatch alerts on {patient.phone}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsAlert}
                    onChange={(e) => setSmsAlert(e.target.checked)}
                    className="w-5 h-5 accent-sky-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold"><MessageSquare className="w-5 h-5" /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">WhatsApp Dispatch</p>
                      <p className="text-xs text-slate-500">Receive real-time arrival reminders on WhatsApp</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={whatsappAlert}
                    onChange={(e) => setWhatsappAlert(e.target.checked)}
                    className="w-5 h-5 accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900">Near-Turn Dispatch Threshold</span>
                    <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">{alertThreshold} patients ahead</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={6}
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(+e.target.value)}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500">You will receive an urgent reminder once your queue position reaches {alertThreshold} or less.</p>
                </div>
              </div>

              <button
                onClick={handleSaveAlerts}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-700 to-indigo-600 text-white text-xs font-bold shadow-md cursor-pointer hover:from-sky-600 hover:to-indigo-500"
              >
                Save Preferences
              </button>
            </div>
          </motion.div>
        )}

        {/* ══ TAB 4: MEDICAL VAULT & PRESCRIPTIONS ══ */}
        {activeTab === "vault" && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
            {/* Search */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Rx code, medicine, or doctor..."
                  value={rxSearch}
                  onChange={(e) => setRxSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-500 placeholder-slate-400 font-medium"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end text-xs text-slate-600 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Encrypted &amp; Verified Digital Health Records</span>
              </div>
            </div>

            {/* Prescriptions List */}
            {filteredPrescriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 rounded-3xl bg-white border border-slate-200/90 shadow-xl text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">No Prescriptions Yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Your Medical Vault is empty. After a doctor issues you a digital prescription it will appear here automatically.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("tracker")}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-700 to-indigo-600 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Book a Consultation
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPrescriptions.map((rx) => (
                  <div
                    key={rx.prescription_id}
                    className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xl hover:shadow-2xl transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            {rx.rx_code}
                          </span>
                          <h4 className="text-lg font-bold text-slate-900 mt-1">{rx.doctor_name}</h4>
                          <p className="text-xs text-slate-500">{rx.doctor_title}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium">
                          {rx.issued_at}
                        </span>
                      </div>

                      <div className="my-4 space-y-2">
                        <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Prescribed Medicines</span>
                        <div className="flex flex-wrap gap-2">
                          {rx.items.map((item) => (
                            <span key={item.item_id} className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
                              {item.medicine_name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        "{rx.notes}"
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Digital Verified Rx
                      </span>
                      <button
                        onClick={() => setSelectedRx(rx)}
                        className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        View Digital Rx <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Prescription Detail Modal / Sheet */}
        <AnimatePresence>
          {selectedRx && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[90vh] overflow-y-auto my-8 border border-slate-200"
              >
                <div className="flex items-start justify-between pb-6 border-b border-slate-200">
                  <div>
                    <h2 className="text-2xl font-bold text-blue-900">{selectedRx.clinic_name}</h2>
                    <p className="text-xs text-slate-500 mt-1">{selectedRx.clinic_address} • {selectedRx.clinic_phone}</p>
                  </div>
                  <button onClick={() => setSelectedRx(null)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Prescribing Doctor</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedRx.doctor_name}</p>
                    <p className="text-slate-500">{selectedRx.doctor_title}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Patient Information</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{patient.name}</p>
                    <p className="text-slate-500">{patient.gender} • DOB: {patient.dob}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 text-xs text-slate-600 bg-slate-50 px-4 rounded-xl my-4 border border-slate-100 font-medium">
                  <span>Rx Reference: <strong className="text-slate-900">{selectedRx.rx_code}</strong></span>
                  <span>Issued Date: <strong className="text-slate-900">{selectedRx.issued_at}</strong></span>
                </div>

                <div className="my-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Prescribed Medication &amp; Dosage</h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Medicine</th>
                          <th className="p-3">Dosage</th>
                          <th className="p-3">Frequency</th>
                          <th className="p-3">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedRx.items.map((med) => (
                          <tr key={med.item_id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-900">{med.medicine_name}</td>
                            <td className="p-3 text-slate-600">{med.dosage}</td>
                            <td className="p-3 text-slate-600">{med.frequency}</td>
                            <td className="p-3 text-slate-600">{med.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedRx.notes && (
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs text-slate-700 space-y-1">
                    <span className="font-bold text-blue-900 uppercase text-[10px]">Doctor Clinical Notes &amp; Advice:</span>
                    <p className="italic">"{selectedRx.notes}"</p>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Electronic Health Record
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                    <button
                      onClick={() => setSelectedRx(null)}
                      className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

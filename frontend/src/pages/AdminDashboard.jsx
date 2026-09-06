import { useEffect, useState } from "react";

import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Stethoscope,
  TrendingUp,
  LogOut,
  Plus,
  X,
  Trash2,
  Edit3,
  ShieldCheck,
  Save,
  AlertCircle,
  Building2,
  CreditCard,
} from "lucide-react";

import api from "../api";
import MedAlignBrand from "../components/MedAlignBrand";

// ─── Helpers ───────────────────────────────────────────────────────────────

const fmt = (v) =>
  v
    ? new Intl.DateTimeFormat("en", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(v))
    : "-";

const fmtDate = (v) =>
  v
    ? new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(v))
    : "-";


const TABS = [
  {
    id: "stats",
    label: "Overview",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    id: "clinics",
    label: "Hospitals / Clinics",
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    id: "subscriptions",
    label: "Subscriptions & Billing",
    icon: <CreditCard className="h-4 w-4" />,
  },
];


// ─── Main Component ─────────────────────────────────────────────────────────

function AdminDashboard({ onBack, onLogout }) {
  const [activeTab, setActiveTab] = useState("stats");

  // ── Stats state ────────────────────────────────────────────────────────

  const [dashboard, setDashboard] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // ── Clinics state ──────────────────────────────────────────────────────

  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [clinicError, setClinicError] = useState("");

  // ── Subscription state ─────────────────────────────────────────────────

  const [plans, setPlans] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [savingSubscription, setSavingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState("");
  const [subscriptionSuccess, setSubscriptionSuccess] = useState("");

  // ── Subscription plan management state ────────────────────────────────
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: "",
    price: "",
    billing_cycle: "monthly",
    max_doctors: 5,
    features: "",
  });

  // ── Data Fetchers ──────────────────────────────────────────────────────

  const fetchStats = async () => {
    setLoadingStats(true);

    try {
      const res = await api.get("/admin/dashboard-stats");

      setDashboard(res.data);
    } catch {
      setDashboard({
        queue_snapshot: {
          waiting: 0,
          called: 0,
          completed: 0,
          total: 0,
        },

        doctor_activity: {
          total_doctors: 0,
          available: 0,
          unavailable: 0,
        },

        subscription_status: {
          active_clinics: 0,
          inactive_clinics: 0,
        },

        analytics: {
          total_patients: 0,
          average_wait_time: 0,
          average_walkout_rate: 0,
          analytics_days: 0,
        },
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchClinics = async () => {
    setLoadingClinics(true);
    setClinicError("");

    try {
      const res = await api.get("/admin/clinics");

      setClinics(res.data.data || []);
    } catch (e) {
      setClinicError(
        e?.response?.data?.message ||
          "Failed to load hospitals/clinics."
      );
    } finally {
      setLoadingClinics(false);
    }
  };

  const fetchPlans = async () => {
    setSubscriptionError("");

    try {
      const res = await api.get("/admin/subscription-plans");

      setPlans(res.data.plans || []);
    } catch (e) {
      setSubscriptionError(
        e?.response?.data?.message ||
          "Failed to load subscription plans."
      );
    }
  };

  const openAddPlan = () => {
    setEditPlan(null);
    setPlanForm({
      name: "",
      price: "",
      billing_cycle: "monthly",
      max_doctors: 5,
      features: "",
    });
    setSubscriptionError("");
    setSubscriptionSuccess("");
    setShowPlanModal(true);
  };

  const openEditPlan = (plan) => {
    setEditPlan(plan);
    setPlanForm({
      name: plan.name || "",
      price: plan.price ?? "",
      billing_cycle: plan.billing_cycle || "monthly",
      max_doctors: plan.max_doctors ?? 5,
      features: plan.features || "",
    });
    setSubscriptionError("");
    setSubscriptionSuccess("");
    setShowPlanModal(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();

    setSavingPlan(true);
    setSubscriptionError("");
    setSubscriptionSuccess("");

    const payload = {
      name: planForm.name.trim(),
      price: Number(planForm.price),
      billing_cycle: planForm.billing_cycle,
      max_doctors: Number(planForm.max_doctors),
      features: planForm.features.trim() || null,
    };

    try {
      const res = editPlan
        ? await api.patch(
            `/admin/subscription-plans/${editPlan.plan_id}`,
            payload
          )
        : await api.post("/admin/subscription-plans", payload);

      setSubscriptionSuccess(
        res.data.message ||
          (editPlan
            ? "Subscription plan updated successfully."
            : "Subscription plan created successfully.")
      );

      await fetchPlans();
      await fetchClinics();
      await fetchStats();

      setTimeout(() => {
        setShowPlanModal(false);
        setSubscriptionSuccess("");
      }, 1200);
    } catch (e) {
      setSubscriptionError(
        e?.response?.data?.message ||
          (e?.response?.data?.errors
            ? Object.values(e.response.data.errors).flat().join(" ")
            : "Failed to save subscription plan.")
      );
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async (plan) => {
    const confirmed = window.confirm(
      `Delete the "${plan.name}" subscription plan?`
    );

    if (!confirmed) return;

    setSubscriptionError("");
    setSubscriptionSuccess("");

    try {
      const res = await api.delete(
        `/admin/subscription-plans/${plan.plan_id}`
      );

      setSubscriptionSuccess(
        res.data.message || "Subscription plan deleted successfully."
      );

      await fetchPlans();
      await fetchClinics();
      await fetchStats();
    } catch (e) {
      setSubscriptionError(
        e?.response?.data?.message ||
          "Failed to delete subscription plan."
      );
    }
  };

  const fetchClinicSubscription = async (clinicId) => {
    setLoadingSubscriptions(true);
    setSubscriptionError("");
    setSubscriptionSuccess("");

    try {
      const res = await api.get(
        `/admin/clinics/${clinicId}/subscription`
      );

      setSubscriptionDetails(res.data.data || null);
    } catch (e) {
      setSubscriptionError(
        e?.response?.data?.message ||
          "Failed to load subscription information."
      );

      setSubscriptionDetails(null);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const changeClinicPlan = async (clinicId, planId) => {
    setSavingSubscription(true);
    setSubscriptionError("");
    setSubscriptionSuccess("");

    try {
      const res = await api.patch(
        `/admin/clinics/${clinicId}/plan`,
        {
          plan_id: Number(planId),
        }
      );

      setSubscriptionSuccess(
        res.data.message ||
          "Subscription plan updated successfully."
      );

      await fetchClinicSubscription(clinicId);
      await fetchClinics();
      await fetchStats();
    } catch (e) {
      setSubscriptionError(
        e?.response?.data?.message ||
          (e?.response?.data?.errors
            ? Object.values(e.response.data.errors)
                .flat()
                .join(" ")
            : "Failed to update subscription plan.")
      );
    } finally {
      setSavingSubscription(false);
    }
  };

  const toggleClinicStatus = async (clinic) => {
    const isActive = clinic.status === "active";

    const confirmed = window.confirm(
      `${isActive ? "Deactivate" : "Activate"} ${
        clinic.name
      }?`
    );

    if (!confirmed) return;

    try {
      await api.patch(
        `/admin/clinics/${clinic.clinic_id}/${
          isActive ? "deactivate" : "activate"
        }`
      );

      await fetchClinics();
      await fetchStats();
    } catch (e) {
      alert(
        e?.response?.data?.message ||
          "Failed to update clinic status."
      );
    }
  };

  // ── Initial data ────────────────────────────────────────────────────────

  useEffect(() => {
    fetchStats();
  }, []);

  // ── Tab data ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab === "stats") {
      fetchStats();
    }

    if (activeTab === "clinics") {
      fetchClinics();
    }

    if (activeTab === "subscriptions") {
      fetchClinics();
      fetchPlans();
    }

  }, [activeTab]);

  // ── Derived values ─────────────────────────────────────────────────────

  const qs = dashboard?.queue_snapshot ?? {};
  const da = dashboard?.doctor_activity ?? {};
  const an = dashboard?.analytics ?? {};
  const sub = dashboard?.subscription_status ?? {};

  const doctorPct =
    da.total_doctors > 0
      ? Math.round(
          (da.available / da.total_doctors) * 100
        )
      : 0;


  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-white text-slate-900">

      {/* Header */}

      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">

          <div className="flex items-center gap-4">

            <MedAlignBrand
              onClick={onBack}
              label="Back"
            />

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200/60">
                <ShieldCheck className="h-3 w-3" />
                System Administration
              </span>

              <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                System Administration
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">

            <button
              onClick={() => {
                fetchStats();

                if (activeTab === "clinics") {
                  fetchClinics();
                }

                if (activeTab === "subscriptions") {
                  fetchClinics();
                  fetchPlans();

                  if (selectedClinic) {
                    fetchClinicSubscription(
                      selectedClinic.clinic_id
                    );
                  }
                }

              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loadingStats ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
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
                className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}

          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-10 space-y-8">

        {/* ══════════════════════════════════════════════════════════════
            OVERVIEW TAB
        ══════════════════════════════════════════════════════════════ */}

        {activeTab === "stats" && (
          <>
            {/* KPIs */}

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <KPICard
                icon={<Clock3 />}
                tone="amber"
                label="Live Waiting Queue"
                value={qs.waiting ?? 0}
                sub={`${qs.total ?? 0} total tokens registered`}
              />

              <KPICard
                icon={<Stethoscope />}
                tone="green"
                label="Active Clinicians"
                value={da.available ?? 0}
                sub={`${da.total_doctors ?? 0} doctors rostered`}
              />

              <KPICard
                icon={<TrendingUp />}
                tone="sky"
                label="Avg Wait Time"
                value={`${an.average_wait_time ?? 0}m`}
                sub="Average wait duration"
              />

              <KPICard
                icon={<Activity />}
                tone="purple"
                label="Walkout Rate"
                value={`${an.average_walkout_rate ?? 0}%`}
                sub="Real-time target metric"
              />

            </section>

            <section className="grid gap-6 lg:grid-cols-2">

              {/* Queue Snapshot */}

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">

                  <div>
                    <h2 className="text-lg font-bold text-slate-950">
                      Queue Snapshot (Database Live)
                    </h2>

                    <p className="text-xs text-slate-500 mt-0.5">
                      Real-time status across all counters
                    </p>
                  </div>

                  <LiveDot />

                </div>

                <div className="mt-6 space-y-3">

                  <QueueRow
                    color="bg-amber-500"
                    label="Waiting in Lobby"
                    sub="Awaiting consultation"
                    value={qs.waiting ?? 0}
                    bg="border-amber-100 bg-amber-50/40"
                    valueColor="text-amber-700"
                  />

                  <QueueRow
                    color="bg-sky-500"
                    label="In Consultation"
                    sub="Currently called with doctor"
                    value={qs.called ?? 0}
                    bg="border-sky-100 bg-sky-50/40"
                    valueColor="text-sky-700"
                  />

                  <QueueRow
                    color="bg-emerald-500"
                    label="Completed Encounters"
                    sub="Consultation finished"
                    value={qs.completed ?? 0}
                    bg="border-emerald-100 bg-emerald-50/40"
                    valueColor="text-emerald-700"
                  />

                </div>
              </div>

              {/* Doctor Roster */}

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">

                  <div>
                    <h2 className="text-lg font-bold text-slate-950">
                      Clinician Roster
                    </h2>

                    <p className="text-xs text-slate-500 mt-0.5">
                      Availability from database
                    </p>
                  </div>

                  <BarChart3 className="h-5 w-5 text-indigo-600" />

                </div>

                <div className="mt-6 space-y-3">

                  <RosterRow
                    icon={
                      <span className="text-emerald-700 font-bold text-sm">
                        {da.available ?? 0}
                      </span>
                    }
                    label="Available Doctors"
                    sub="Ready for consultation"
                    badge={
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        Active
                      </span>
                    }
                  />

                  <RosterRow
                    icon={
                      <span className="text-blue-700 font-bold text-sm">
                        {da.total_doctors ?? 0}
                      </span>
                    }
                    label="Total Registered Doctors"
                    sub="Department roster"
                    badge={
                      <span className="text-sm font-bold text-slate-700">
                        {doctorPct}% Online
                      </span>
                    }
                  />

                  <RosterRow
                    icon={
                      <span className="text-slate-600 font-bold text-sm">
                        {da.unavailable ?? 0}
                      </span>
                    }
                    label="Off-duty / On Break"
                    sub="Currently unavailable"
                    badge={
                      <span className="text-xs text-slate-400">
                        Standby
                      </span>
                    }
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
                    <h2 className="text-lg font-bold text-slate-950">
                      Subscription & Facility
                    </h2>

                    <p className="text-xs text-slate-500 mt-0.5">
                      Account tier and branch licenses
                    </p>
                  </div>

                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">

                  <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/60 p-4 text-center">
                    <p className="text-2xl font-extrabold text-emerald-700">
                      {sub.active_clinics ?? 0}
                    </p>

                    <p className="mt-1 text-xs text-slate-600 font-medium">
                      Active Clinics
                    </p>
                  </div>

                  <div className="rounded-2xl bg-amber-50/70 border border-amber-200/60 p-4 text-center">
                    <p className="text-2xl font-extrabold text-amber-700">
                      {sub.inactive_clinics ?? 0}
                    </p>

                    <p className="mt-1 text-xs text-slate-600 font-medium">
                      Inactive
                    </p>
                  </div>

                  <div className="rounded-2xl bg-sky-50/70 border border-sky-200/60 p-4 text-center">
                    <p className="text-2xl font-extrabold text-sky-700">
                      {sub.active_clinics !== undefined
                        ? "Multi"
                        : "—"}
                    </p>

                    <p className="mt-1 text-xs text-slate-600 font-medium">
                      Facility Network
                    </p>
                  </div>

                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">

                  <div>
                    <h2 className="text-lg font-bold text-slate-950">
                      Performance Benchmarks
                    </h2>

                    <p className="text-xs text-slate-500 mt-0.5">
                      {an.analytics_days ?? 0}-day operational aggregate
                    </p>
                  </div>

                  <Activity className="h-5 w-5 text-indigo-600" />

                </div>

                <div className="mt-6 space-y-4">

                  <ProgressBar
                    label="Service Efficiency Rating"
                    value={Math.max(
                      0,
                      100 -
                        (an.average_walkout_rate ?? 0)
                    )}
                    color="from-sky-500 to-indigo-600"
                    textColor="text-sky-700"
                  />

                  <ProgressBar
                    label="Wait Threshold (Max 30m)"
                    value={Math.min(
                      100,
                      ((an.average_wait_time ?? 0) /
                        30) *
                        100
                    )}
                    color="from-emerald-400 to-emerald-600"
                    textColor="text-emerald-700"
                    suffix={`${an.average_wait_time ?? 0} min`}
                  />

                  <div className="pt-2 flex justify-between text-xs text-slate-500 border-t border-slate-100">

                    <span>
                      Total patients evaluated:{" "}
                      <strong className="text-slate-800">
                        {an.total_patients ?? 0}
                      </strong>
                    </span>

                    <span>
                      Days monitored:{" "}
                      <strong className="text-slate-800">
                        {an.analytics_days ?? 0}
                      </strong>
                    </span>

                  </div>

                </div>
              </div>

            </section>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            CLINICS TAB
        ══════════════════════════════════════════════════════════════ */}

        {activeTab === "clinics" && (
          <section className="space-y-6">

            <div className="flex flex-wrap items-center justify-between gap-4">

              <div>
                <h2 className="text-2xl font-bold text-slate-950">
                  Hospitals / Clinics
                </h2>

                <p className="text-xs text-slate-500 mt-0.5">
                  Manage hospitals registered with the MedAlign platform.
                </p>
              </div>

              <button
                onClick={fetchClinics}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    loadingClinics
                      ? "animate-spin"
                      : ""
                  }`}
                />
                Refresh
              </button>

            </div>

            {clinicError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {clinicError}
              </div>
            )}

            {loadingClinics ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Loading hospitals from database...
              </div>
            ) : clinics.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm text-center">
                <Building2 className="h-10 w-10 mx-auto text-slate-300" />

                <h3 className="mt-4 font-bold text-slate-900">
                  No hospitals found
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  There are currently no hospitals in the database.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">

                {clinics.map((clinic) => (
                  <div
                    key={clinic.clinic_id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex items-center gap-3">

                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                          <Building2 className="h-6 w-6" />
                        </div>

                        <div>
                          <h3 className="font-bold text-slate-900">
                            {clinic.name}
                          </h3>

                          <p className="text-xs text-slate-500">
                            Clinic ID #{clinic.clinic_id}
                          </p>
                        </div>

                      </div>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          clinic.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {clinic.status === "active"
                          ? "● Active"
                          : "○ Inactive"}
                      </span>

                    </div>

                    <div className="mt-5 space-y-2 text-xs">

                      <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                        <span className="text-slate-500">
                          Address
                        </span>

                        <span className="font-semibold text-slate-800 text-right">
                          {clinic.address || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                        <span className="text-slate-500">
                          Phone
                        </span>

                        <span className="font-semibold text-slate-800">
                          {clinic.phone || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                        <span className="text-slate-500">
                          Email
                        </span>

                        <span className="font-semibold text-slate-800">
                          {clinic.email || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">
                          Subscription
                        </span>

                        <span className="font-bold text-indigo-700">
                          {clinic.plan_name || "No plan"}
                        </span>
                      </div>

                    </div>

                    <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">

                      <button
                        onClick={() => {
                          setSelectedClinic(clinic);
                          setActiveTab("subscriptions");
                          fetchClinicSubscription(
                            clinic.clinic_id
                          );
                        }}
                        className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
                      >
                        Manage Subscription
                      </button>

                      <button
                        onClick={() =>
                          toggleClinicStatus(clinic)
                        }
                        className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                          clinic.status === "active"
                            ? "border border-red-200 text-red-600 hover:bg-red-50"
                            : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {clinic.status === "active"
                          ? "Deactivate"
                          : "Activate"}
                      </button>

                    </div>

                  </div>
                ))}

              </div>
            )}

          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SUBSCRIPTIONS TAB
        ══════════════════════════════════════════════════════════════ */}

        {activeTab === "subscriptions" && (
          <section className="space-y-6">

            <div>
              <h2 className="text-2xl font-bold text-slate-950">
                Subscriptions & Billing
              </h2>

              <p className="text-xs text-slate-500 mt-0.5">
                Manage hospital subscription plans and billing information.
              </p>
            </div>

            {subscriptionError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {subscriptionError}
              </div>
            )}

            {subscriptionSuccess && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {subscriptionSuccess}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">

              {/* Available Plans */}

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">
                      Available Plans
                    </h3>

                    <p className="text-xs text-slate-500 mt-0.5">
                      Create and manage subscription plans offered by MedAlign
                    </p>
                  </div>

                  <button
                    onClick={openAddPlan}
                    className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add New Plan
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {plans.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-400">
                      No subscription plans found.
                    </p>
                  ) : (
                    plans.map((plan) => (
                      <div
                        key={plan.plan_id}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900">
                              {plan.name}
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                              Up to {plan.max_doctors} doctors
                            </p>

                            {plan.features && (
                              <p className="mt-2 text-xs text-slate-600">
                                {plan.features}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-xl font-extrabold text-indigo-700">
                              ৳{Number(plan.price).toLocaleString("en-BD")}
                            </p>

                            <p className="text-[11px] text-slate-500">
                              / {plan.billing_cycle}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                          <button
                            onClick={() => openEditPlan(plan)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </button>

                          <button
                            onClick={() => handleDeletePlan(plan)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Clinic Subscription */}

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="border-b border-slate-100 pb-4">

                  <h3 className="text-lg font-bold text-slate-950">
                    Clinic Subscription
                  </h3>

                  <p className="text-xs text-slate-500 mt-0.5">
                    Select a hospital to view and manage its subscription.
                  </p>

                </div>

                <div className="mt-5">

                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Hospital / Clinic
                  </label>

                  <select
                    value={
                      selectedClinic?.clinic_id || ""
                    }
                    onChange={(e) => {
                      const clinic = clinics.find(
                        (c) =>
                          c.clinic_id ===
                          Number(e.target.value)
                      );

                      setSelectedClinic(
                        clinic || null
                      );

                      setSubscriptionSuccess("");
                      setSubscriptionError("");

                      if (clinic) {
                        fetchClinicSubscription(
                          clinic.clinic_id
                        );
                      } else {
                        setSubscriptionDetails(null);
                      }
                    }}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-indigo-500"
                  >

                    <option value="">
                      Select a hospital
                    </option>

                    {clinics.map((clinic) => (
                      <option
                        key={clinic.clinic_id}
                        value={clinic.clinic_id}
                      >
                        {clinic.name}
                      </option>
                    ))}

                  </select>

                </div>

                {loadingSubscriptions ? (
                  <div className="py-10 text-center text-sm text-slate-400">
                    Loading subscription information...
                  </div>
                ) : subscriptionDetails?.clinic ? (

                  <div className="mt-6 space-y-5">

                    {/* Current Plan */}

                    <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4">

                      <p className="text-xs text-indigo-600 font-semibold">
                        Current Plan
                      </p>

                      <p className="mt-1 text-2xl font-extrabold text-indigo-800">
                        {
                          subscriptionDetails.clinic
                            .plan_name
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        ৳
                        {Number(
                          subscriptionDetails.clinic
                            .plan_price
                        ).toLocaleString("en-BD")}{" "}
                        /{" "}
                        {
                          subscriptionDetails.clinic
                            .billing_cycle
                        }
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        Maximum doctors:{" "}
                        <strong>
                          {
                            subscriptionDetails.clinic
                              .max_doctors
                          }
                        </strong>
                      </p>

                    </div>

                    {/* Change Plan */}

                    <div>

                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Change Plan
                      </label>

                      <select
                        value={
                          subscriptionDetails.clinic
                            .plan_id
                        }
                        disabled={savingSubscription}
                        onChange={(e) =>
                          changeClinicPlan(
                            subscriptionDetails.clinic
                              .clinic_id,
                            e.target.value
                          )
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-indigo-500 disabled:opacity-50"
                      >

                        {plans.map((plan) => (
                          <option
                            key={plan.plan_id}
                            value={plan.plan_id}
                          >
                            {plan.name} — ৳
                            {Number(plan.price).toLocaleString(
                              "en-BD"
                            )}{" "}
                            / {plan.billing_cycle}
                          </option>
                        ))}

                      </select>

                      {savingSubscription && (
                        <p className="mt-2 text-xs text-indigo-600">
                          Updating subscription plan...
                        </p>
                      )}

                    </div>

                    {/* Features */}

                    <div>

                      <h4 className="text-sm font-bold text-slate-900">
                        Plan Features
                      </h4>

                      <div className="mt-2 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                        <p className="text-xs text-slate-600">
                          {
                            subscriptionDetails.clinic
                              .features
                          }
                        </p>
                      </div>

                    </div>

                    {/* Invoices */}

                    <div>

                      <h4 className="text-sm font-bold text-slate-900">
                        Recent Invoices
                      </h4>

                      <div className="mt-3 space-y-2">

                        {subscriptionDetails.invoices
                          ?.length ? (
                          subscriptionDetails.invoices.map(
                            (invoice) => (
                              <div
                                key={invoice.invoice_id}
                                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3"
                              >

                                <div>
                                  <p className="text-xs font-bold text-slate-800">
                                    Invoice #
                                    {
                                      invoice.invoice_id
                                    }
                                  </p>

                                  <p className="text-[11px] text-slate-500">
                                    Issued{" "}
                                    {fmtDate(
                                      invoice.issued_date
                                    )}
                                  </p>

                                  <p className="text-[11px] text-slate-500">
                                    Due{" "}
                                    {fmtDate(
                                      invoice.due_date
                                    )}
                                  </p>
                                </div>

                                <div className="text-right">

                                  <p className="text-sm font-bold text-slate-900">
                                    ৳
                                    {Number(
                                      invoice.amount
                                    ).toLocaleString("en-BD", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </p>

                                  <span
                                    className={`text-[10px] font-bold ${
                                      invoice.status ===
                                      "paid"
                                        ? "text-emerald-700"
                                        : invoice.status ===
                                          "pending"
                                        ? "text-amber-700"
                                        : "text-red-700"
                                    }`}
                                  >
                                    {(
                                      invoice.status || ""
                                    ).toUpperCase()}
                                  </span>

                                </div>

                              </div>
                            )
                          )
                        ) : (
                          <p className="text-xs text-slate-400 py-4">
                            No invoices found.
                          </p>
                        )}

                      </div>

                    </div>

                  </div>

                ) : (
                  <div className="py-10 text-center text-sm text-slate-400">
                    Select a hospital to manage its subscription.
                  </div>
                )}

              </div>

            </div>

          </section>
                )}

      </main>

      {/* ══════════════════════════════════════════════════════════════
          ADD / EDIT SUBSCRIPTION PLAN MODAL
      ══════════════════════════════════════════════════════════════ */}

      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-700">
                  <CreditCard className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editPlan ? "Edit Subscription Plan" : "Add New Plan"}
                  </h3>

                  <p className="text-xs text-slate-500">
                    {editPlan
                      ? `Editing ${editPlan.name}`
                      : "Create a new plan for MedAlign clinics"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPlanModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {subscriptionError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {subscriptionError}
              </div>
            )}

            <form onSubmit={handleSavePlan} className="mt-5 space-y-4 text-xs">
              <label className="block">
                <span className="font-bold text-slate-700 uppercase tracking-wider">
                  Plan Name *
                </span>

                <input
                  type="text"
                  value={planForm.name}
                  required
                  maxLength={100}
                  onChange={(e) =>
                    setPlanForm((f) => ({
                      ...f,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g. Clinic Pro"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-indigo-500 focus:bg-white text-sm"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-bold text-slate-700 uppercase tracking-wider">
                    Price (৳) *
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={planForm.price}
                    required
                    onChange={(e) =>
                      setPlanForm((f) => ({
                        ...f,
                        price: e.target.value,
                      }))
                    }
                    placeholder="5000"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-indigo-500 focus:bg-white text-sm"
                  />
                </label>

                <label className="block">
                  <span className="font-bold text-slate-700 uppercase tracking-wider">
                    Billing Cycle *
                  </span>

                  <select
                    value={planForm.billing_cycle}
                    required
                    onChange={(e) =>
                      setPlanForm((f) => ({
                        ...f,
                        billing_cycle: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-indigo-500 focus:bg-white text-sm"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="font-bold text-slate-700 uppercase tracking-wider">
                  Maximum Doctors *
                </span>

                <input
                  type="number"
                  min="1"
                  value={planForm.max_doctors}
                  required
                  onChange={(e) =>
                    setPlanForm((f) => ({
                      ...f,
                      max_doctors: e.target.value,
                    }))
                  }
                  placeholder="5"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-indigo-500 focus:bg-white text-sm"
                />
              </label>

              <label className="block">
                <span className="font-bold text-slate-700 uppercase tracking-wider">
                  Features
                </span>

                <textarea
                  rows={4}
                  value={planForm.features}
                  onChange={(e) =>
                    setPlanForm((f) => ({
                      ...f,
                      features: e.target.value,
                    }))
                  }
                  placeholder="e.g. Queue management, analytics, prescriptions"
                  className="mt-1 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-indigo-500 focus:bg-white text-sm"
                />
              </label>

              <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-3 text-[11px] text-indigo-800">
                Prices are stored in Bangladeshi Taka (৳). The plan can be
                monthly or yearly and can support any number of doctors
                greater than zero.
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingPlan}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-700 to-sky-600 hover:from-indigo-600 hover:to-sky-500 text-xs font-bold text-white shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingPlan
                    ? "Saving..."
                    : editPlan
                    ? "Update Plan"
                    : "Create Plan"}
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

function KPICard({
  icon,
  tone,
  label,
  value,
  sub,
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600",
    sky: "bg-sky-50 text-sky-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition">

      <div className="flex items-center justify-between">

        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>

        <div
          className={`rounded-2xl p-2.5 ${tones[tone]}`}
        >
          {icon}
        </div>

      </div>

      <p className="mt-3 text-3xl font-extrabold text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500 font-medium">
        {sub}
      </p>

    </div>
  );
}

function QueueRow({
  color,
  label,
  sub,
  value,
  bg,
  valueColor,
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border p-4 ${bg}`}
    >

      <div className="flex items-center gap-3">

        <div
          className={`h-3 w-3 rounded-full ${color}`}
        />

        <div>

          <p className="text-sm font-semibold text-slate-900">
            {label}
          </p>

          <p className="text-xs text-slate-500">
            {sub}
          </p>

        </div>

      </div>

      <span
        className={`text-xl font-bold ${valueColor}`}
      >
        {value}
      </span>

    </div>
  );
}

function RosterRow({
  icon,
  label,
  sub,
  badge,
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">

      <div className="flex items-center gap-3">

        <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
          {icon}
        </div>

        <div>

          <p className="text-sm font-semibold text-slate-900">
            {label}
          </p>

          <p className="text-xs text-slate-500">
            {sub}
          </p>

        </div>

      </div>

      {badge}

    </div>
  );
}

function ProgressBar({
  label,
  value,
  color,
  textColor,
  suffix,
}) {
  return (
    <div>

      <div className="mb-1.5 flex justify-between text-xs font-semibold">

        <span className="text-slate-700">
          {label}
        </span>

        <span className={`font-bold ${textColor}`}>
          {suffix || `${Math.round(value)}%`}
        </span>

      </div>

      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">

        <div
          className={`h-2 rounded-full bg-gradient-to-r ${color}`}
          style={{
            width: `${Math.max(
              0,
              Math.min(100, value)
            )}%`,
          }}
        />

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